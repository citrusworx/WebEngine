# No hard-coded SQL

Nectarine’s hard rule for **final app backend code**:

> App code never embeds SQL. Named queries and named DDL live in YAML. The
> compiler assembles SQL phonics-style from those tokens. Adapters only
> execute `(sql, params)`.

**Phase 3** (this PR) enforces that rule for Blackwater **DDL**:
`migrate()` calls `runNamedDdl("bootstrap")` → `src/db/named-ddl.ts` →
`CCompiler.buildDdls` over `*Schema.yml`. Hand-written `phase3-ddl.ts` is
retired. DML stays on named compiled queries (`runNamed`).

Postgres **JSONB is first-class**. The live `products` store keeps
`payload JSONB`; `productSchema.yml` owns that column. Relational catalog
fields are a nullable projection, not a replacement for JSONB.

## Assembly model

```
App                    Compiler                         Adapter
───                    ────────                         ───────
buildQuery(name)  →    query YAML → parameterized SQL  →  query(sql, params)
buildDdl(schema)  →    *Schema.yml → CREATE TABLE/INDEX →  query(sql)
                       (never string-interpolate values)
```

| Layer | May contain SQL text? | Role |
|-------|------------------------|------|
| App routes / stores / `db/*.ts` | **No** | Call a named query or named DDL, pass bind values |
| Query YAML | Tokens only — not raw SQL scripts | `select` / `type: SELECT`, structured or grammar-checked `where` |
| Schema YAML | Tokens only — not raw SQL scripts | `table`, `fields`, constraints, optional `indexes` |
| Compiler | Assembles DML and `CREATE TABLE` / `CREATE INDEX` | Validates identifiers; DML emits `$N` (allowlisted `$N::jsonb`); DDL maps types (`jsonb` → `JSONB`) |
| Adapter | Executes `(sql, params)` only | Never builds or concatenates SQL |

See [Query DSL](./nectarine-query-dsl.md), [Schema Guide](./nectarine-schema-guide.md),
and [`libraries/nectarine/README.md`](../../libraries/nectarine/README.md).

`where: isActive = true` in YAML is **not** a raw SQL hole. It is parsed by a
closed fragment grammar (identifiers, operators, `$N`, YAML constants,
`AND` / `OR`, `IN`, `IS NULL`). Comments, semicolons, function calls, and
subqueries are rejected. Runtime values stay in adapter params.

Field specs such as `payload: jsonb NOT NULL` are **not** raw SQL either.
The DDL compiler parses type + constraint tokens and emits vendor SQL.

**JSONB is supported; we are not dropping it.** Postgres `json` / `jsonb`
columns are first-class in schema YAML and query phonics (bind params,
including `$N::jsonb`). Operators such as `@>`, `?`, and `->>` can come
later.

## Status legend

| Status | Meaning |
|--------|---------|
| **migrated** | App calls a named compiled query or named compiled DDL. No SQL literal in `db/*.ts` / stores. |
| **ready-to-migrate** | Compiler can emit this query from YAML (unused live path). |
| **blocked-on-compiler** | Needs a compiler feature not added (`COUNT`, `EXISTS`, `ON CONFLICT`, aliases, aggregates). `$N::jsonb` bind casts are already allowed. |
| **schema-owned** | Table shape comes from `*Schema.yml` via the DDL compiler. JSONB columns stay where the live store uses them. |

---

## Inventory: `apps/blackwatersound/back`

DML helpers live in `src/db/postgres.ts` and call `runNamed` →
`CCompiler.buildQuery`. DDL bootstrap calls `runNamedDdl` →
`CCompiler.buildDdls`. Routes and `src/store/waitlist-store.ts` do not
embed SQL. Other apps under `apps/` do not depend on Nectarine and have
no query SQL. `packages/kiwipress` depends on `@citrusworx/nectarine`
but contains no SQL strings.

### `src/db/postgres.ts`

| Location | Purpose | Named query / DDL | Status |
|----------|---------|-------------------|--------|
| `migrate()` | Bootstrap all Blackwater tables + `waitlist_email_idx` | `runNamedDdl("bootstrap")` → `src/db/named-ddl.ts` | **migrated** — compiled from every `*Schema.yml`. Live `products` keeps `payload JSONB`. Waitlist includes `source_app` / `interest`. Foreign keys are created in dependency order. |
| `loadProductsFromDb()` | Load JSONB documents | `product.read.allPayloads` | **migrated** — `SELECT payload … ORDER BY created_at ASC` |
| `seedProductsIfEmpty()` | Skip seed when rows exist | `product.read.allPayloads` (row count in TS) | **migrated** — no `COUNT(*)` |
| `seedProductsIfEmpty()` | Insert JSONB payload | `product.read.payloadById` then `product.create.seedPayload` | **migrated** — existence check instead of `ON CONFLICT`; `$2::jsonb` phonics bind (`{ value: $2, cast: jsonb }` or `$2::jsonb`) + `bindJsonbDocument()` |
| `loadWaitlistFromDb()` | List signups oldest-first | `waitlist.read.allEntries` | **migrated** — `SELECT * … ORDER BY created_at ASC`; `created_at` → `createdAt` in TS |
| `insertWaitlistEntry()` | Insert waitlist row | `waitlist.create.joinWaitlist` | **migrated** — columns `(id, name, email, source_app, interest)`. `insertEntry` remains in YAML as an unused alternate. |
| `waitlistEmailExists()` | Duplicate email? | `waitlist.read.entryByEmail` | **migrated** — `rows.length > 0` instead of `EXISTS` |

### `src/db/named-ddl.ts` / `docker/postgres/init.sql`

| Location | Purpose | YAML that owns it | Status |
|----------|---------|-------------------|---------|
| `namedDdl("bootstrap")` | All resource `CREATE TABLE` / indexes, FK-ordered | every `*Schema.yml` | **migrated** — thin runner; no SQL text in the module |
| `namedDdl("liveBootstrap")` | Product + waitlist only (same compiler) | `productSchema.yml`, `waitlistSchema.yml` | **migrated** — used to lock Docker init.sql in tests |
| `docker/postgres/init.sql` | Out-of-band Docker first-boot copy of live bootstrap | same two schema files | **schema-owned** — not app backend; compiled from the same YAML. Recreate the volume to pick up changes (`IF NOT EXISTS` does not ALTER). |

### Query YAML already present (compiler-owned)

These files own CRUD SQL. Phase 2/3 call the live-path names below.
Relational product names (`allProducts`, `newProduct`, …) still compile;
the live table keeps `payload JSONB` and nullable catalog columns.

| File | Resource(s) | Live named queries | Notes |
|------|-------------|--------------------|-------|
| `schemas/product/productQueries.yml` | `product` | `allPayloads`, `payloadById`, `seedPayload` | Hybrid: JSONB document queries plus relational CRUD |
| `schemas/waitlist/waitlistQueries.yml` | `waitlist` | `allEntries`, `entryByEmail`, `joinWaitlist` | `insertEntry` compiles; unused live path |
| `schemas/course/courseQueries.yml` | `course` | — | tables created by `migrate()`; quoted `'published'` constants |
| `schemas/booking/bookingQueries.yml` | `booking` | — | `IN ('requested', 'confirmed')` |
| `schemas/order/orderQueries.yml` | `order`, `order_item` | — | |
| `schemas/coach/coachQueries.yml` | `coach` | — | `is_active = true` |
| `schemas/lesson/lessonQueries.yml` | `lesson` | — | AND + two placeholders (`$1`, `$2`) |
| `schemas/session/sessionQueries.yml` | `session` | — | |
| `schemas/mix_review/mixReviewQueries.yml` | `mix_review` | — | |
| `schemas/enrollment/enrollmentQueries.yml` | `enrollment` | — | |
| `schemas/client/clientQueries.yml` | `client` | — | |

`migrate()` creates tables for course / booking / order / coach / lesson /
session / mix_review / enrollment / client from their `*Schema.yml` files.
Those named queries can run against Postgres once a later phase writes data.

---

## Out of inventory (not app backend)

| Location | Why it is not a violation |
|----------|---------------------------|
| `libraries/nectarine/src/compiler/**` | Compiler **output** |
| `libraries/nectarine/src/adapters/**/*.test.ts` | Adapter tests pass `(sql, params)` through |
| `libraries/nectarine/examples/showcase.ts` `SELECT 1` | Optional live ping, not an app resource |
| `apps/blackwatersound/docker/postgres/init.sql` | Docker first-boot only; compiled from schema YAML; documented as out-of-band |

---

## Phase plan (Nectarine SQL enforcement)

1. **Phase 1** — Inventory, phonics rule, compiler (+ tests) for
   Blackwater `type: SELECT` YAML.
2. **Phase 2** — Blackwater data access calls named compiled
   queries only. DML literals removed from `db/postgres.ts`. JSONB
   document store kept and wired through YAML. `COUNT` / `EXISTS` /
   `ON CONFLICT` avoided. `$N::jsonb` (and `{ value: $N, cast: jsonb }`)
   bind `seedPayload`.
3. **Phase 3 (this PR)** — DDL from `*Schema.yml`. Live tables match the
   query contracts. **JSONB is supported; we are not dropping it.**
   `products` keeps `payload JSONB` plus a nullable catalog projection.
   Waitlist columns include `source_app` / `interest`; `joinWaitlist`
   replaced `insertEntry` on the live path. Docker `init.sql` is the
   same compiler output for product + waitlist (out-of-band bootstrap).
   `phase3-ddl.ts` retired.
4. **Later** — Remaining compiler features only if a later phase needs
   them (`COUNT`, `EXISTS`, `ON CONFLICT`, JSONB operators `@>` / `?` / `->>`).
   Seltzer route generation is a separate track. Do **not** invent
   `nectarine serve`.
