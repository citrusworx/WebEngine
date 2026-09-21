# Nectarine + Blackwater production

What is **production-ready today** for deploying Blackwater Sound’s backend with Nectarine and Seltzer.

npm `@citrusworx/nectarine@0.4.0` is published. This repo’s `libraries/nectarine/package.json` is **0.4.0**. Git may be ahead of that tarball: INSERT `onConflict` compiles here and is not in the 0.4.0 pack. Pending Changesets make the next publish **0.5.0**. Blackwater in this monorepo depends on the workspace package, so it sees `onConflict` before that publish. Maturity label: **hostable alpha**. See [status](./nectarine-status.md).

## Ready today

- **Config:** `loadNectarineConfig` reads `nectarine.config.yaml`. Env *key names* come from YAML; secrets come from the environment (`PG_USER`, `PG_PASS`, `PG_HOST`, `PG_PORT`, `PG_DB`).
- **Named DML:** product + waitlist live paths call compiler-owned queries (`allPayloads`, `payloadsByCatalog`, `countPayloads`, `emailExists`, `joinWaitlist`, …). App code does not embed SQL.
- **Schema-YAML DDL:** `migrate()` runs Nectarine `applyMigrations`: ledger table, `CREATE TABLE` from every Blackwater `*Schema.yml`, pending versioned migration YAML (rename / drop / type change, each in a Postgres transaction), additive `ADD COLUMN IF NOT EXISTS`, then `CREATE INDEX`.
- **HTTP:** Seltzer (workspace `@citrusworx/seltzer` 0.8.1) hosts object-based `Route` handlers. Handlers return `ResponseData` (`{ status?, headers?, body? }`). There is no writing `ctx.json`.
- **Postgres:** Blackwater uses Nectarine `createPgAdapter` (`pg.Pool`, idle-client error handler, `connect()` / `disconnect()`). Boot connects before migrate. Failed boot closes the pool. `SIGTERM` / `SIGINT` drain the HTTP server then the pool.

## Required env (production)

Set `NODE_ENV=production` (Docker image and Grapevine backend already do). Then **all** Postgres keys must be set:

| YAML key | Typical env |
|----------|-------------|
| `database.postgres.env.user` | `PG_USER` |
| `database.postgres.env.password` | `PG_PASS` |
| `database.postgres.env.host` | `PG_HOST` |
| `database.postgres.env.port` | `PG_PORT` |
| `database.postgres.env.database` | `PG_DB` |

Optional:

- `NECTARINE_CONFIG` — path to `nectarine.config.yaml`
- `REQUIRE_DATABASE=1` — require Postgres even when `NODE_ENV` is not `production`
- `ALLOW_SEED_FALLBACK=1` — permit seed fallback even in production (local/dev only)
- `PORT`, `CORS_ORIGIN`, KiwiPress `WP_*` (content seed if WP is unset)

**Partial `PG_*` is always a boot error** (some keys set, some missing). That is not treated as “no database.”

## Seed fallback (local only)

When **every** Postgres env var is unset, `fallback.seed: true` in `nectarine.config.yaml`, and the process is **not** production (or `ALLOW_SEED_FALLBACK=1`):

- Products: in-memory `SEED_PRODUCTS`
- Waitlist: JSON file under `RUNTIME_DATA_DIR` (default `src/data/runtime/waitlist.json`)

Boot logs a warning. `/api/health` reports `database.configured: false` and `database.seedFallback: true`.

`NODE_ENV=production` **does not** take this path. Incomplete Postgres env fails boot with a message that lists the missing keys.

## Schema evolution

`migrate()` is **not** Flyway and **not** a silent schema-diff. Current `*Schema.yml` is still the CREATE TABLE source of truth. Operators add **versioned migration YAML** (phonics tokens) when they need rename, drop column, or type change.

Boot order:

1. Create `nectarine_schema_migrations` (compiler-owned ledger)
2. `CREATE TABLE IF NOT EXISTS` from every `*Schema.yml` (greenfield and existing volumes)
3. Pending YAML migrations in version order, each in a Postgres transaction (`BEGIN` / ops / ledger insert / `COMMIT`; `ROLLBACK` on failure). MySQL DDL implicit-commits, so a later op cannot undo an earlier ALTER.
4. Postgres `ADD COLUMN IF NOT EXISTS` for genuinely new fields
5. `CREATE INDEX` from current schema **after** rename, so an existing volume does not `CREATE INDEX (new_name)` while the column is still called `old_name`. Postgres `RENAME COLUMN` updates indexes already on that column.

Rename/drop/type-change rules:

- Tokens only (`renameColumn`, `dropColumn`, `changeType`) — no raw SQL scripts in app code
- `dropColumn` and `changeType` require `destructive: true` **and** `confirm: dropColumn` / `confirm: changeType`
- Postgres `changeType` emits `USING CAST(column AS <compiled type>)` so spaced types such as `DOUBLE PRECISION` are valid (not `col::DOUBLE PRECISION`)
- Already-applied versions are skipped; checksum drift of an edited applied migration fails boot
- Greenfield skip: rename is a no-op when the new column already exists; drop is a no-op when the column is gone
- Blackwater protects `products.payload` JSONB — a migration that renames, drops, or retypes it is refused
- No down/rollback migrations in this slice

Additive `ADD COLUMN` still covers new nullable/defaulted columns without a versioned file. Docker `init.sql` remains first-boot `CREATE TABLE` for product + waitlist only.

Put versioned files in `apps/blackwatersound/back/src/db/migrations/` (`001_rename_foo.yml`). An empty directory is a valid no-op.

## JSONB seed caveat

Live catalog reads **`products.payload` JSONB**, not the nullable relational catalog columns (`name`, `"originalPrice"`, `"isActive"`, …). Those columns stay `NULL`. Seed and HTTP writes insert/replace `(id, payload)` only.

- Empty table → seed copies `SEED_PRODUCTS` into `payload`
- Rows already present → seed is skipped, even if catalog columns are null
- Rows whose `payload` is not a product object are ignored at read time; if that leaves the catalog empty, the API serves in-memory `SEED_PRODUCTS` and does **not** insert duplicates
- Seed inserts use named `seedPayload` (`ON CONFLICT (id) DO NOTHING`); HTTP create/update/delete use named JSONB queries (`insertPayload`, `updatePayload`, `deleteProduct`) plus a thin host `execute` that serializes the catalog document and merges on PUT (the compiler does not emit JSONB `||`)

JSONB is first-class. It is not being dropped.

## Seltzer host responsibility

Nectarine is a library. It does not listen on a port.

Blackwater (`apps/blackwatersound/back`) loads config, connects, migrates, seeds, then `Seltzer.init().listen()` (named pipeline + `ResponseData`). Resource **read and write** routes flatten `*API.yml` with Nectarine `listApiOperations` and map onto Seltzer `generateRoutes` via engine `createNectarineRoutes` (`@citrusworx/webengine`; `Route.contract` carries resource/name/body specs). Live product **reads** map API `query:` names onto JSONB named queries (`allPayloads`, `payloadById`, `payloadsByCatalog`, `payloadsBySlug`, `payloadsContaining`, `payloadsWithKey`, `countPayloads`). Catalog/slug filter in Postgres (`payload->>'catalog'` / `->>'slug'`); seed/memory still maps a missing catalog to `gear` and uses product `id` as a slug fallback. Product **writes** use JSONB named queries (`insertPayload`, `updatePayload`, `deleteProduct`) with host `execute` so the catalog document is stored in `payload` instead of flattened onto relational columns. Waitlist uses the same helper: GET `allEntries` / `countEntries` / `entryByEmail` plus POST `joinWaitlist` on `createNectarineRoutes` with a thin host `execute` (generated `id`, duplicate-email UX via `emailExists`, `source_app` allowlist, JSON file-store when Postgres is unset). Named YAML runs the INSERT/SELECT. Other resources compile `operation.query` from `*Queries.yml` through CCompiler when Postgres is connected, and return `[]` / 404 without a database. Lesson `byId` stays the hand KiwiPress `GET /api/lessons/:id`. Health and KiwiPress `GET /api/posts/:slug` stay hand-written. Seltzer `validate` enforces `.required` body fields when `contract.body` is set (joinWaitlist declares `email: string.required`; product create declares `id` / `name`); Nectarine can later `replace("validate", …)`. Leftover `ctx.json` / writing helpers crash or 500.

## Non-goals (not in this production cut)

- `nectarine serve`
- Mongo as the Blackwater production path
- Joins / `GROUP BY` / `LIMIT` / JSONB `||` / `jsonb_set`
- Full Flyway-style migrator with down migrations, raw SQL scripts, or silent schema-diff DROP

`COUNT`, `EXISTS`, JSONB `@>` / `?` / `->>`, and INSERT `ON CONFLICT`
(`DO NOTHING` / `DO UPDATE SET col = EXCLUDED.col`) compile from named YAML
(Postgres-first; MySQL rewrites JSONB operators at `query()` and rejects
`ON CONFLICT`). They are not host SQL. Joins, `GROUP BY`, and `LIMIT` remain
follow-ups.

npm **0.4.0** is already published. Do not publish it again. The next intentional publish is **0.5.0** after `yarn version-packages` consumes the pending Nectarine changesets (see [Release checklist](./release-checklist.md)). There is no npm-token CI job. Commit the version bump before publishing — the 0.4.0 publish skipped that commit.

See also: [Nectarine ↔ WebEngine kernel contract](../webengine/nectarine-kernel-contract.md).
