# No hard-coded SQL

Nectarine’s hard rule for **final app backend code**:

> App code never embeds SQL. Named queries live in YAML. The compiler
> assembles SQL phonics-style from those tokens. Adapters only execute
> `(sql, params)`.

This is **phase 1** of that enforcement: inventory today’s violations and
teach the compiler Blackwater’s current query YAML. Phase 2+ removes the
strings from `apps/blackwatersound/back`. Do not rewrite those files in
this phase.

## Assembly model

```
App                    Compiler                         Adapter
───                    ────────                         ───────
buildQuery(name)  →    YAML tokens → parameterized SQL  →  query(sql, params)
                       (never string-interpolate values)
```

| Layer | May contain SQL text? | Role |
|-------|------------------------|------|
| App routes / stores / `db/*.ts` | **No** (final state) | Call a named query, pass bind values |
| Query YAML | Tokens only — not raw SQL scripts | `select` / `type: SELECT`, structured or grammar-checked `where` |
| Compiler | Assembles `SELECT` / `INSERT` / `UPDATE` / `DELETE` | Validates identifiers; emits `$N` placeholders |
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
| **ready-to-migrate** | Compiler can emit this query from YAML today. Phase 2 can replace the string with a named call (after YAML/table alignment if noted). |
| **blocked-on-compiler** | Needs a compiler feature this phase does not add (`COUNT`, `EXISTS`, `ON CONFLICT`, aliases, aggregates). `$N::jsonb` bind casts are already allowed. |
| **needs-DDL** | Live table shape does not match `*Schema.yml` / `*Queries.yml`. Schema YAML should own `CREATE TABLE` once a DDL compiler exists. Resolution may be relational columns, JSONB columns for flexible fields, or hybrid — **not** “delete JSONB.” |

---

## Inventory: `apps/blackwatersound/back`

The only TypeScript file with hard-coded SQL is `src/db/postgres.ts`.
Routes (`src/routes/*.ts`) and the waitlist store call helpers; they do
not embed SQL. Other apps under `apps/` do not depend on Nectarine and
have no query SQL. `packages/kiwipress` depends on `@citrusworx/nectarine`
but contains no SQL strings.

### `src/db/postgres.ts`

| Location | Purpose | YAML that should own it | Status |
|----------|---------|-------------------------|--------|
| `migrate()` ~L40–56 | `CREATE TABLE` products (**document-store**: `id` + `payload JSONB`) + waitlist + `waitlist_email_idx` | `schemas/product/productSchema.yml`, `schemas/waitlist/waitlistSchema.yml` (DDL from schema, not query YAML) | **needs-DDL** — live `products` is one JSONB blob; query YAML lists relational columns (`catalog`, `name`, `slug`, …). `productSchema.yml` already has `tags: json`. Aligning tables can keep JSONB columns. Waitlist YAML also has `source_app` / `interest` the live table lacks. |
| `loadProductsFromDb()` ~L66 | `SELECT payload FROM products ORDER BY created_at ASC` | Not in `productQueries.yml` (that file selects relational `*` / `isActive`). Add a temporary named query **or** migrate after DDL. | **needs-DDL** (document-store vs query YAML). `ORDER BY` itself is **ready-to-migrate** once a matching named query exists. |
| `seedProductsIfEmpty()` ~L78 | `SELECT COUNT(*)::text AS count FROM products` | No query YAML; would be e.g. `product.read.productCount` | **blocked-on-compiler** — aggregates, `::text` cast, `AS` alias |
| `seedProductsIfEmpty()` ~L85 | `INSERT INTO products (id, payload) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING` | Not `product.create.newProduct` (relational columns, no upsert). `$2::jsonb` is a valid phonics bind cast. | **blocked-on-compiler** (`ON CONFLICT` only) and **needs-DDL** (document-store vs query YAML). JSONB binds stay. |
| `loadWaitlistFromDb()` ~L98 | `SELECT id, name, email, created_at AS "createdAt" … ORDER BY created_at ASC` | Close to `waitlist.read.allEntries` (`SELECT * … ORDER BY created_at DESC`) | **blocked-on-compiler** for `AS "createdAt"`; column list + `ORDER BY` are **ready-to-migrate** if the app maps `created_at` in TS and YAML `orderBy` is aligned (`ASC` vs `DESC`) |
| `insertWaitlistEntry()` ~L111 | `INSERT INTO waitlist (id, name, email, created_at)` | `waitlist.create.joinWaitlist` is `(id, name, email, source_app, interest) RETURNING …` | **needs-DDL** / YAML alignment — field lists differ. Compiler **can** compile `joinWaitlist` today. |
| `waitlistEmailExists()` ~L123 | `SELECT EXISTS(SELECT 1 FROM waitlist WHERE email = $1)` | Prefer `waitlist.read.entryByEmail` (already compilable) instead of `EXISTS` | **blocked-on-compiler** for `EXISTS`; **ready-to-migrate** if phase 2 uses `entryByEmail` and checks `rows.length` |

### `docker/postgres/init.sql`

| Location | Purpose | YAML that should own it | Status |
|----------|---------|-------------------------|--------|
| L1–15 | Same `CREATE TABLE` / index as `migrate()` | `productSchema.yml`, `waitlistSchema.yml` | **needs-DDL** — bootstrap copy of the document-store tables (JSONB columns remain a supported shape) |

Docker init is not app backend code, but it must stay in lockstep with
whatever schema YAML eventually emits.

### Query YAML already present (no SQL in app — compiler-owned)

These files are the intended owners of CRUD SQL. Phase 1 compiles this
`type: SELECT` shape. Phase 2 should call them by name instead of
hand-written strings.

| File | Resource(s) | Notes |
|------|-------------|--------|
| `schemas/product/productQueries.yml` | `product` | `read` / create / update / delete; `where` fragments + `orderBy` |
| `schemas/waitlist/waitlistQueries.yml` | `waitlist` | `read` + `create` with `returning` |
| `schemas/course/courseQueries.yml` | `course` | quoted `'published'` constants |
| `schemas/booking/bookingQueries.yml` | `booking` | `IN ('requested', 'confirmed')` |
| `schemas/order/orderQueries.yml` | `order`, `order_item` | |
| `schemas/coach/coachQueries.yml` | `coach` | `is_active = true` |
| `schemas/lesson/lessonQueries.yml` | `lesson` | AND + two placeholders (`$1`, `$2`) |
| `schemas/session/sessionQueries.yml` | `session` | |
| `schemas/mix_review/mixReviewQueries.yml` | `mix_review` | |
| `schemas/enrollment/enrollmentQueries.yml` | `enrollment` | |
| `schemas/client/clientQueries.yml` | `client` | |

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

---

## Phase plan (Nectarine SQL enforcement)

1. **Phase 1 (this PR)** — Inventory, phonics rule, compiler (+ tests) for
   Blackwater `type: SELECT` YAML. No rewrite of `postgres.ts` or routes.
2. **Phase 2** — Blackwater data access calls named compiled queries only.
   Delete SQL string literals from `db/postgres.ts`. Prefer existing YAML
   (`entryByEmail`, `joinWaitlist`, …) over new compiler features when
   possible.
3. **Phase 3** — DDL from `*Schema.yml` so live tables match the query
   contracts. **JSONB is supported; we are not dropping it.** The
   document-store pattern (`products(id, payload JSONB)` vs relational
   columns in `productQueries.yml`) can resolve as relational columns,
   JSONB columns for flexible fields, or a hybrid — not “delete JSONB.”
   Align waitlist columns. Docker `init.sql` comes from the same source.
4. **Later** — Remaining compiler features only if phase 2 still needs
   them (`COUNT`, `ON CONFLICT`, JSONB operators `@>` / `?` / `->>`).
   Seltzer route generation is a separate track. Do **not** invent
   `nectarine serve`.
