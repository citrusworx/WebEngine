# No hard-coded SQL

Nectarine’s hard rule for **final app backend code**:

> App code never embeds SQL. Named queries live in YAML. The compiler
> assembles SQL phonics-style from those tokens. Adapters only execute
> `(sql, params)`.

**Phase 2** (this PR) enforces that rule for Blackwater DML:
`apps/blackwatersound/back/src/db/postgres.ts` and stores call named
compiled queries only. Remaining `CREATE TABLE` text lives in a marked
phase-3 module.

Postgres **JSONB is first-class**. The live `products(id, payload JSONB)`
store stays; access is named YAML (`allPayloads`, `payloadById`,
`seedPayload`) rather than a relational rewrite.

## Assembly model

```
App                    Compiler                         Adapter
───                    ────────                         ───────
buildQuery(name)  →    YAML tokens → parameterized SQL  →  query(sql, params)
                       (never string-interpolate values)
```

| Layer | May contain SQL text? | Role |
|-------|------------------------|------|
| App routes / stores / `db/*.ts` | **No** (DML) | Call a named query, pass bind values |
| Query YAML | Tokens only — not raw SQL scripts | `select` / `type: SELECT`, structured or grammar-checked `where` |
| Compiler | Assembles `SELECT` / `INSERT` / `UPDATE` / `DELETE` | Validates identifiers; emits `$N` placeholders; allowlisted `$N::jsonb` or `{ value: $N, cast: jsonb }` |
| Adapter | Executes `(sql, params)` only | Never builds or concatenates SQL |

See [Query DSL](./nectarine-query-dsl.md) and [`libraries/nectarine/README.md`](../../libraries/nectarine/README.md).

`where: isActive = true` in YAML is **not** a raw SQL hole. It is parsed by a
closed fragment grammar (identifiers, operators, `$N`, YAML constants,
`AND` / `OR`, `IN`, `IS NULL`). Comments, semicolons, function calls, and
subqueries are rejected. Runtime values stay in adapter params.

**JSONB is supported; we are not dropping it.** Postgres `json` / `jsonb`
columns are first-class in schema YAML and query phonics (bind params,
including `$N::jsonb`). Operators such as `@>`, `?`, and `->>` can come
later. The Blackwater issue below is only the **document-store pattern**
(`products(id, payload JSONB)` vs relational columns in
`productQueries.yml`) — not JSONB as a type.

## Status legend

| Status | Meaning |
|--------|---------|
| **migrated** | App calls a named compiled query. No DML literal in `db/*.ts` / stores. |
| **ready-to-migrate** | Compiler can emit this query from YAML (unused live path). |
| **blocked-on-compiler** | Needs a compiler feature not added (`COUNT`, `EXISTS`, `ON CONFLICT`, aliases, aggregates). `$N::jsonb` bind casts are already allowed. |
| **needs-DDL** | Live table shape does not match `*Schema.yml` / `*Queries.yml`. Schema YAML should own `CREATE TABLE` once a DDL compiler exists. Resolution may be relational columns, JSONB columns for flexible fields, or hybrid — **not** “delete JSONB.” |

---

## Inventory: `apps/blackwatersound/back`

DML helpers live in `src/db/postgres.ts` and call `runNamed` →
`CCompiler.buildQuery`. Routes and `src/store/waitlist-store.ts` do not
embed SQL. Other apps under `apps/` do not depend on Nectarine and have
no query SQL. `packages/kiwipress` depends on `@citrusworx/nectarine`
but contains no SQL strings.

### `src/db/postgres.ts`

| Location | Purpose | Named query | Status |
|----------|---------|-------------|--------|
| `migrate()` | Bootstrap live tables + `waitlist_email_idx` | `runNamedDdl("bootstrapLiveTables")` → `src/db/phase3-ddl.ts` | **needs-DDL** — phase 3. Live `products` is the document-store shape (`id` + `payload JSONB`, kept). `productSchema.yml` already has `tags: json`. Aligning tables can keep JSONB columns. Waitlist YAML still has `source_app` / `interest` the live table lacks. |
| `loadProductsFromDb()` | Load JSONB documents | `product.read.allPayloads` | **migrated** — `SELECT payload … ORDER BY created_at ASC` |
| `seedProductsIfEmpty()` | Skip seed when rows exist | `product.read.allPayloads` (row count in TS) | **migrated** — no `COUNT(*)` |
| `seedProductsIfEmpty()` | Insert JSONB payload | `product.read.payloadById` then `product.create.seedPayload` | **migrated** — existence check instead of `ON CONFLICT`; `$2::jsonb` phonics bind (`{ value: $2, cast: jsonb }` or `$2::jsonb`) + `bindJsonbDocument()` |
| `loadWaitlistFromDb()` | List signups oldest-first | `waitlist.read.allEntries` | **migrated** — `SELECT * … ORDER BY created_at ASC`; `created_at` → `createdAt` in TS |
| `insertWaitlistEntry()` | Insert live waitlist row | `waitlist.create.insertEntry` | **migrated** — live columns `(id, name, email, created_at)`. `joinWaitlist` stays for phase 3 (`source_app` / `interest`). |
| `waitlistEmailExists()` | Duplicate email? | `waitlist.read.entryByEmail` | **migrated** — `rows.length > 0` instead of `EXISTS` |

### `src/db/phase3-ddl.ts` / `docker/postgres/init.sql`

| Location | Purpose | YAML that should own it | Status |
|----------|---------|-------------------------|--------|
| `phase3Ddl.bootstrapLiveTables` | Same `CREATE TABLE` / index as Docker init | `productSchema.yml`, `waitlistSchema.yml` | **needs-DDL** — only remaining SQL text in app data access; explicitly temporary. JSONB columns remain a supported shape. |
| `docker/postgres/init.sql` | Bootstrap copy of the document-store tables | same | **needs-DDL** — not app backend; keep in lockstep with `phase3-ddl.ts` |

### Query YAML already present (compiler-owned)

These files own CRUD SQL. Phase 2 calls the live-path names below.
Relational names (`allProducts`, `newProduct`, `joinWaitlist`, …) still
compile and wait for phase 3 tables.

| File | Resource(s) | Live named queries (phase 2) | Notes |
|------|-------------|------------------------------|-------|
| `schemas/product/productQueries.yml` | `product` | `allPayloads`, `payloadById`, `seedPayload` | Hybrid: JSONB document queries plus existing relational CRUD |
| `schemas/waitlist/waitlistQueries.yml` | `waitlist` | `allEntries`, `entryByEmail`, `insertEntry` | `joinWaitlist` compiles; live table cannot run it yet |
| `schemas/course/courseQueries.yml` | `course` | — | quoted `'published'` constants |
| `schemas/booking/bookingQueries.yml` | `booking` | — | `IN ('requested', 'confirmed')` |
| `schemas/order/orderQueries.yml` | `order`, `order_item` | — | |
| `schemas/coach/coachQueries.yml` | `coach` | — | `is_active = true` |
| `schemas/lesson/lessonQueries.yml` | `lesson` | — | AND + two placeholders (`$1`, `$2`) |
| `schemas/session/sessionQueries.yml` | `session` | — | |
| `schemas/mix_review/mixReviewQueries.yml` | `mix_review` | — | |
| `schemas/enrollment/enrollmentQueries.yml` | `enrollment` | — | |
| `schemas/client/clientQueries.yml` | `client` | — | |

Tables for course / booking / order / coach / lesson / session /
mix_review / enrollment / client are **not** created by `migrate()` —
**needs-DDL** before those named queries can run against Postgres.

---

## Out of inventory (not app backend)

| Location | Why it is not a violation |
|----------|---------------------------|
| `libraries/nectarine/src/compiler/**` | Compiler **output** |
| `libraries/nectarine/src/adapters/**/*.test.ts` | Adapter tests pass `(sql, params)` through |
| `libraries/nectarine/examples/showcase.ts` `SELECT 1` | Optional live ping, not an app resource |
| `src/db/phase3-ddl.ts` | Temporary DDL only; phase 3 |

---

## Phase plan (Nectarine SQL enforcement)

1. **Phase 1** — Inventory, phonics rule, compiler (+ tests) for
   Blackwater `type: SELECT` YAML.
2. **Phase 2 (this PR)** — Blackwater data access calls named compiled
   queries only. DML literals removed from `db/postgres.ts`. JSONB
   document store kept and wired through YAML. `COUNT` / `EXISTS` /
   `ON CONFLICT` avoided. `$N::jsonb` (and `{ value: $N, cast: jsonb }`)
   bind `seedPayload`.
3. **Phase 3** — DDL from `*Schema.yml` so live tables match the query
   contracts. **JSONB is supported; we are not dropping it.** The
   document-store pattern (`products(id, payload JSONB)` vs relational
   columns in `productQueries.yml`) can resolve as relational columns,
   JSONB columns for flexible fields, or a hybrid — not “delete JSONB.”
   Align waitlist columns (`source_app` / `interest`) so `joinWaitlist`
   can replace `insertEntry`. Docker `init.sql` comes from the same
   source. Retire `phase3-ddl.ts`.
4. **Later** — Remaining compiler features only if a later phase needs
   them (`COUNT`, `EXISTS`, `ON CONFLICT`, JSONB operators `@>` / `?` / `->>`).
   Seltzer route generation is a separate track. Do **not** invent
   `nectarine serve`.
