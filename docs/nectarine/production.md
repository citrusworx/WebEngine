# Nectarine + Blackwater production

What is **production-ready today** for deploying Blackwater Sound’s backend with Nectarine and Seltzer.

## Ready today

- **Config:** `loadNectarineConfig` reads `nectarine.config.yaml`. Env *key names* come from YAML; secrets come from the environment (`PG_USER`, `PG_PASS`, `PG_HOST`, `PG_PORT`, `PG_DB`).
- **Named DML:** product + waitlist live paths call compiler-owned queries (`allPayloads`, `seedPayload`, `joinWaitlist`, …). App code does not embed SQL.
- **Schema-YAML DDL:** `migrate()` runs named DDL `bootstrap` → `CREATE TABLE` / `CREATE INDEX` plus additive `ADD COLUMN IF NOT EXISTS` from every Blackwater `*Schema.yml`.
- **HTTP:** Seltzer 0.4 hosts object-based `Route` handlers. Handlers return `ResponseData` (`{ status?, headers?, body? }`). There is no writing `ctx.json`.
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

## Migrate is additive only

`migrate()` is **not** Flyway. `{ additive: true }` emits `ADD COLUMN IF NOT EXISTS` only:

- No `DROP COLUMN`, rename, or type change
- Destructive schema changes need a **new volume** (or a one-off `DROP TABLE`) plus a fresh `CREATE TABLE`
- Docker `init.sql` is first-boot `CREATE TABLE` for product + waitlist only; app `migrate()` then adds missing columns on existing volumes

## JSONB seed caveat

Live catalog reads **`products.payload` JSONB**, not the nullable relational catalog columns (`name`, `"originalPrice"`, `"isActive"`, …). Those columns stay `NULL` until a later write path. Seed inserts `(id, payload)` only.

- Empty table → seed copies `SEED_PRODUCTS` into `payload`
- Rows already present → seed is skipped, even if catalog columns are null
- Rows whose `payload` is not a product object are ignored at read time; if that leaves the catalog empty, the API serves in-memory `SEED_PRODUCTS` and does **not** insert duplicates

JSONB is first-class. It is not being dropped.

## Seltzer host responsibility

Nectarine is a library. It does not listen on a port.

Blackwater (`apps/blackwatersound/back`) loads config, connects, migrates, seeds, then `Seltzer.init().listen()` (named pipeline + `ResponseData`). Product and waitlist **read** routes flatten `*API.yml` with Nectarine `listApiOperations` and map onto Seltzer `generateRoutes` (`Route.contract` carries resource/name/body specs). Live product reads map API `query:` names (`allProducts`, `productById`) onto JSONB named queries (`allPayloads`, `payloadById`); catalog/slug filter those payloads. Waitlist reads use `allEntries` / `entryByEmail`. Health, waitlist POST (`joinWaitlist`), and KiwiPress content stay hand-written. Seltzer `validate` enforces `.required` body fields when `contract.body` is set (joinWaitlist declares `email: string.required`); Nectarine can later `replace("validate", …)`. Leftover `ctx.json` / writing helpers crash or 500.

## Non-goals (not in this production cut)

- Create/update/delete auto-wiring from `*API.yml` (reads for product + waitlist in this slice; waitlist POST stays hand-wired)
- `nectarine serve`
- Mongo as the Blackwater production path
- Joins / `COUNT` / `EXISTS` / `ON CONFLICT` / JSONB operators (`@>`, `?`, `->>`)
- Full Flyway-style migrator

Those remain follow-ups.

`@citrusworx/nectarine` is publish-ready via the existing Changesets scripts (`yarn version-packages` then `yarn workspace @citrusworx/nectarine npm publish`). There is no npm-token CI job; see [Release checklist](./release-checklist.md).
