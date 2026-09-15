# No hard-coded SQL

Nectarine’s hard rule for **final app backend code**:

> App code never embeds SQL. Named queries and named DDL live in YAML. The
> compiler assembles SQL phonics-style from those tokens. Adapters only
> execute `(sql, params)`.

**Phase 3** enforces that rule for Blackwater **DDL**:
`migrate()` calls `applyNamedMigrations` → `src/db/named-ddl.ts` → Nectarine
`applyMigrations` over **every** Blackwater `*Schema.yml` plus optional
versioned files in `src/db/migrations/`. Hand-written `phase3-ddl.ts` is
retired. DML stays on named compiled queries (`runNamed`).

Postgres **JSONB is first-class**. Live product **writes** insert or replace
`payload` only (`seedPayload`, `insertPayload`, `updatePayload`). Catalog
columns on `products` are a nullable projection and stay NULL. JSONB is not
being dropped.

**Identifiers:** mixed-case YAML names (`originalPrice`, `isNew`,
`isActive`) are emitted quoted (`"originalPrice"`) so Postgres does not
fold them to lowercase. Lowercase names stay unquoted.

## Assembly model

```
App                    Compiler                         Adapter
───                    ────────                         ───────
buildQuery(name)  →    query YAML → parameterized SQL  →  query(sql, params)
buildDdl(schema)  →    *Schema.yml → CREATE TABLE/INDEX →  query(sql)
applyMigrations   →    migration YAML → ALTER + ledger →  query(sql, params)
                       (never string-interpolate values)
```

| Layer | May contain SQL text? | Role |
|-------|------------------------|------|
| App routes / stores / `db/*.ts` | **No** | Call a named query or named DDL, pass bind values |
| Query YAML | Tokens only — not raw SQL scripts | `select` / `type: SELECT`, structured or grammar-checked `where` |
| Schema YAML | Tokens only — not raw SQL scripts | `table`, `fields`, constraints, optional `indexes` |
| Migration YAML | Tokens only — not raw SQL scripts | `renameColumn` / `dropColumn` / `changeType`; destructive ops gated |
| Compiler | Assembles DML, `CREATE TABLE` / `CREATE INDEX`, and versioned `ALTER` | Validates identifiers; quotes mixed-case names (`"originalPrice"`); DML emits `$N` (allowlisted `$N::jsonb`); DDL maps types (`jsonb` → `JSONB`). `relationships:` is not DDL. |
| Adapter | Executes `(sql, params)` only | Never builds or concatenates SQL |

See [Query DSL](./nectarine-query-dsl.md), [Schema Guide](./nectarine-schema-guide.md),
and [`libraries/nectarine/README.md`](../../libraries/nectarine/README.md).
Deploy-today env, migrate, and seed rules: [Production](./production.md).

`where: isActive = true` in YAML is **not** a raw SQL hole. It is parsed by a
closed fragment grammar (identifiers, operators, `$N`, YAML constants,
`AND` / `OR`, `IN`, `IS NULL`). Comments, semicolons, function calls, and
subqueries are rejected. Runtime values stay in adapter params.

Field specs such as `payload: jsonb NOT NULL` are **not** raw SQL either.
The DDL compiler parses type + constraint tokens and emits vendor SQL.

**JSONB is supported; we are not dropping it.** Postgres `json` / `jsonb`
columns are first-class in schema YAML and query phonics (bind params,
including `$N::jsonb`). Operators `@>`, `?`, and `->>` are compiler phonics
(`contains` / `has_key` / `path:` or fragment `payload->>'catalog'`).

## Status legend

| Status | Meaning |
|--------|---------|
| **migrated** | App calls a named compiled query or named compiled DDL. No SQL literal in `db/*.ts` / stores. |
| **ready-to-migrate** | Compiler can emit this query from YAML (unused live path). |
| **blocked-on-compiler** | Needs a compiler feature not added (joins, `GROUP BY`, `LIMIT`). `COUNT`, `EXISTS`, JSONB `@>` / `?` / `->>`, and INSERT `ON CONFLICT` compile from YAML. |
| **schema-owned** | Table shape comes from `*Schema.yml` via the DDL compiler. JSONB columns stay where the live store uses them. |

---

## Inventory: `apps/blackwatersound/back`

DML helpers live in `src/db/postgres.ts` and call `runNamed` →
`CCompiler.buildQuery` on the Nectarine `createPgAdapter` pool. DDL bootstrap
and versioned migrations call `applyNamedMigrations` → Nectarine `applyMigrations`.
Routes and `src/store/waitlist-store.ts` do not embed SQL. Other apps under `apps/`
do not depend on Nectarine and have no query SQL. `packages/kiwipress` depends
on `@citrusworx/nectarine` but contains no SQL strings.

### `src/db/postgres.ts`

| Location | Purpose | Named query / DDL | Status |
|----------|---------|-------------------|--------|
| `migrate()` | **Whole-domain** bootstrap: every `*Schema.yml` (not only product + waitlist); versioned YAML for rename/drop/type change; additive `ADD COLUMN IF NOT EXISTS` after migrations; indexes last | `applyNamedMigrations` → `src/db/named-ddl.ts` | **migrated** — ledger `nectarine_schema_migrations`; destructive ops require `destructive: true` + `confirm`. Live `products` keeps `payload JSONB` (protected). Waitlist includes `source_app` / `interest` on new and existing tables. |
| `loadProductsFromDb()` | Load JSONB documents | `product.read.allPayloads` | **migrated** — `SELECT payload … ORDER BY created_at ASC` |
| `loadProductsByCatalogFromDb()` | Filter catalog documents | `product.read.payloadsByCatalog` | **migrated** — `payload->>'catalog' = $1`; GET `/api/products/catalog/:catalog` |
| `loadProductBySlugFromDb()` | Lookup by payload slug | `product.read.payloadsBySlug` | **migrated** — `payload->>'slug' = $1 ORDER BY created_at ASC`; GET `/api/products/slug/:slug` falls back to `payloadById` |
| `loadProductsContainingFromDb()` | JSONB containment | `product.read.payloadsContaining` | **migrated** — `payload @> $1::jsonb`; GET `/api/products/containing?contains=` |
| `loadProductsWithKeyFromDb()` | JSONB key exists | `product.read.payloadsWithKey` | **migrated** — `payload ? $1`; GET `/api/products/key/:key` |
| `countPayloadsFromDb()` | Payload row total | `product.read.countPayloads` | **migrated** — `COUNT(*)`; seed skip + GET `/api/products/count` |
| `seedProductsIfEmpty()` | Skip seed when rows exist | `product.read.countPayloads` | **migrated** — `COUNT(*)`; does not load payloads to check emptiness |
| `seedProductsIfEmpty()` | Insert JSONB payload | `product.create.seedPayload` | **migrated** — `ON CONFLICT (id) DO NOTHING`; `$2::jsonb` phonics bind (`{ value: $2, cast: jsonb }` or `$2::jsonb`) + `bindJsonbDocument()` |
| `insertProductPayload()` | HTTP create catalog document | `product.create.insertPayload` | **migrated** — `INSERT (id, payload) … $2::jsonb RETURNING payload` |
| `updateProductPayload()` | HTTP replace catalog document | `product.update.updatePayload` | **migrated** — `SET payload = $1::jsonb, updated_at = NOW()`; host merges first (no JSONB `||`) |
| `deleteProductFromDb()` | HTTP delete catalog row | `product.delete.deleteProduct` | **migrated** — `DELETE … WHERE id = $1`; `payload` column stays protected |
| `loadWaitlistFromDb()` | List signups oldest-first | `waitlist.read.allEntries` | **migrated** — `SELECT * … ORDER BY created_at ASC`; `created_at` → `createdAt` in TS |
| `loadWaitlistByEmailFromDb()` | Lookup signup by email | `waitlist.read.entryByEmail` | **migrated** — maps the first row for GET `/api/waitlist/:email` |
| `countWaitlistFromDb()` | Waitlist row total | `waitlist.read.countEntries` | **migrated** — `COUNT(*)`; GET `/api/waitlist/count` |
| `insertWaitlistEntry()` | Insert waitlist row | `waitlist.create.joinWaitlist` | **migrated** — columns `(id, name, email, source_app, interest)`. `insertEntry` remains in YAML as an unused alternate. |
| `waitlistEmailExists()` | Duplicate email? | `waitlist.read.emailExists` | **migrated** — `EXISTS`; joinWaitlist duplicate UX does not load the row |

### `src/db/named-ddl.ts` / `docker/postgres/init.sql`

| Location | Purpose | YAML that owns it | Status |
|----------|---------|-------------------|---------|
| `namedDdl("bootstrap")` | All resource `CREATE TABLE` / indexes plus Postgres `ADD COLUMN IF NOT EXISTS`, FK-ordered | every `*Schema.yml` | **migrated** — combined SQL still compiled; boot uses `applyNamedMigrations` so versioned YAML can rename before additive ADD COLUMN and indexes |
| `applyNamedMigrations` | Ledger + CREATE TABLE + pending `src/db/migrations/*.yml` + additive ADD COLUMN + indexes | `*Schema.yml` + migration YAML | **migrated** — thin runner; no SQL text in the module |
| `namedDdl("liveBootstrap")` | Product + waitlist CREATE TABLE / INDEX only | `productSchema.yml`, `waitlistSchema.yml` | **migrated** — used to lock Docker init.sql in tests |
| `docker/postgres/init.sql` | Out-of-band Docker first-boot copy of live bootstrap | same two schema files | **schema-owned** — not app backend; compiled from the same YAML without additive ALTERs. App `migrate()` adds missing columns on existing volumes. |

### Query YAML already present (compiler-owned)

These files own CRUD SQL. Phase 2/3 call the live-path names below.
Relational product names (`allProducts`, `newProduct`, …) still compile;
the live table keeps `payload JSONB` and nullable catalog columns.

| File | Resource(s) | Live named queries | Notes |
|------|-------------|--------------------|-------|
| `schemas/product/productQueries.yml` | `product` | `allPayloads`, `payloadById`, `payloadsByCatalog`, `payloadsBySlug`, `payloadsContaining`, `payloadsWithKey`, `countPayloads`, `seedPayload`, `insertPayload`, `updatePayload`, `deleteProduct` | Hybrid: live DML is JSONB `payload` only. Relational CRUD compiles (`originalPrice` / `isNew` / `isActive` quoted) but catalog columns stay NULL. HTTP reads/writes use host `execute` + these JSONB names. |
| `schemas/waitlist/waitlistQueries.yml` | `waitlist` | `allEntries`, `entryByEmail`, `emailExists`, `countEntries`, `joinWaitlist` | `insertEntry` compiles; unused live path. Duplicate email uses `emailExists`. |
| `schemas/course/courseQueries.yml` | `course` | — | tables created by `migrate()`; quoted `'published'` constants |
| `schemas/booking/bookingQueries.yml` | `booking` | — | `IN ('requested', 'confirmed')` |
| `schemas/order/orderQueries.yml` | `order`, `order_item` | — | |
| `schemas/coach/coachQueries.yml` | `coach` | — | `is_active = true` |
| `schemas/lesson/lessonQueries.yml` | `lesson` | — | AND + two placeholders (`$1`, `$2`) |
| `schemas/session/sessionQueries.yml` | `session` | — | |
| `schemas/mix_review/mixReviewQueries.yml` | `mix_review` | — | |
| `schemas/enrollment/enrollmentQueries.yml` | `enrollment` | — | |
| `schemas/client/clientQueries.yml` | `client` | — | |

`migrate()` creates tables for **all** resources (course / booking / order /
coach / lesson / session / mix_review / enrollment / client) from their
`*Schema.yml` files. That whole-domain bootstrap is intentional Phase 3
scope. Those named queries can run against Postgres once a later phase
writes data. Live product HTTP writes still write JSONB `payload` only.

`relationships:` blocks in schema YAML are documentation. DDL foreign keys
come only from inline `FOREIGN KEY REFERENCES` on fields.

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
   `ON CONFLICT` avoided at the time. `$N::jsonb` (and `{ value: $N, cast: jsonb }`)
   bind `seedPayload`.
3. **Phase 3** — DDL from `*Schema.yml`. Live tables match the
   query contracts. **JSONB is supported; we are not dropping it.**
   `products` keeps `payload JSONB` plus a nullable catalog projection
   (seed still writes payload only). Waitlist columns include
   `source_app` / `interest`; `joinWaitlist` replaced `insertEntry` on
   the live path. `migrate()` bootstraps **every** resource schema
   (intentional) and applies versioned rename/drop/type-change YAML plus
   additive `ADD COLUMN IF NOT EXISTS`. Mixed-case identifiers are quoted.
   Docker `init.sql` is first-boot CREATE TABLE from product + waitlist
   YAML (no ALTER). `phase3-ddl.ts` retired.
4. **Phase 4a** — Product HTTP create/update/delete via JSONB named queries
   (`insertPayload`, `updatePayload`, `deleteProduct`) and a thin host
   `execute`. Catalog documents stay in `products.payload`; relational
   `newProduct` / `updateProduct` YAML still compile but are unused live.
4b. **Phase 4b** — Waitlist POST `joinWaitlist` uses the same host-execute
   contract: `createNectarineRoutes({ resources: ["waitlist"], execute })`.
   Named YAML runs INSERT/SELECT; host keeps generated `id`, duplicate-email
   UX, `source_app` allowlist, and JSON file-store fallback.
5. **Later** — Remaining compiler features only if a later phase needs
   them (joins, `GROUP BY`, `LIMIT`, JSONB `||` / `jsonb_set`).
   `COUNT`, `EXISTS`, JSONB `@>` / `?` / `->>`, and INSERT `ON CONFLICT`
   (`DO NOTHING` / `DO UPDATE SET col = EXCLUDED.col`) ship as compiler
   phonics. Down migrations / silent schema-diff are not part of the migrator.
   Seltzer route generation is a separate track. Do **not** invent
   `nectarine serve`.
