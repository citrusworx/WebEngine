# Nectarine ↔ WebEngine kernel contract

Pin for the kernel design/writing track. Nectarine is a library (config, compiler, adapters). The kernel hosts it; it does not become a second backend. Blackwater (`apps/blackwatersound/back`) is the current working pattern.

## Config YAML + credentials

Load with `loadNectarineConfig` (`@citrusworx/nectarine` or `@citrusworx/nectarine/config`). Do not invent a second YAML bootstrap.

- `nectarine.config.yaml` names env **keys**. Secrets stay in the environment.
- Typical Postgres keys: `PG_USER`, `PG_PASS`, `PG_HOST`, `PG_PORT`, `PG_DB` (MySQL `MS_*`, Mongo `MG_*`).
- Apps resolve values via `NectarineConfig.resolveCredentials` / `requireCredentials` / `credentialStatus`.
- Adapters receive resolved `DatabaseCredentials`. They do **not** read `process.env` themselves.
- `createPgAdapterFromConfig` (and MySQL/Mongo equivalents) is the config-aware factory; it still goes through `resolveCredentials`.
- `transport.server: seltzer` is the WebEngine / Blackwater default.

Partial vendor env is a boot error, not “no database.” Fully unset env may take a host seed-fallback path when the host allows it.

## Named queries / named DDL + `applyMigrations`

App and kernel code never embed SQL.

```
YAML tokens → CCompiler / compileMigration → adapter.query(sql, params)
```

| Kind | Source | Compiler | Execute |
|------|--------|----------|---------|
| DML | `*Queries.yml` | `CCompiler.buildQuery` | `query(sql, params)` |
| CREATE TABLE / INDEX | `*Schema.yml` | `compileSchema` / `buildDdl` | `query(sql)` |
| Evolution | versioned migration YAML | `compileMigration` | `applyMigrations` → `query(sql, params)` |

Schema YAML is the current CREATE TABLE shape. Rename / drop / type change are **not** inferred from a live schema-diff. Operators add versioned files (`001_rename_foo.yml`) with phonics tokens only: `renameColumn`, `dropColumn`, `changeType`. `dropColumn` and `changeType` require `destructive: true` **and** `confirm: dropColumn` / `confirm: changeType`.

`applyMigrations` order (greenfield and existing volumes):

1. Ledger `nectarine_schema_migrations`
2. `CREATE TABLE IF NOT EXISTS` from current `*Schema.yml`
3. Pending versioned YAML in version order (Postgres: one transaction per migration via adapter `withTransaction`)
4. Additive `ADD COLUMN IF NOT EXISTS` (Postgres)
5. `CREATE INDEX` after rename

Already-applied versions are skipped; checksum drift of an edited applied migration fails boot. An empty migrations directory is a valid no-op (`loadMigrationDocuments`). There is no `migrateDown`.

Blackwater reference: `migrate()` → `applyNamedMigrations` in `src/db/named-ddl.ts` (thin wrapper: schemas + `loadMigrationDocuments` + `protectedColumns` for `products.payload`). Kernel should call Nectarine `applyMigrations` the same way — a thin host wrapper is fine; SQL in that wrapper is not.

## `listApiOperations` → Seltzer `generateRoutes`

Nectarine flattens `*API.yml` into `ApiOperation[]` (`listApiOperations` / `loadApiOperations`). YAML `endpoint` maps to `ApiOperation.path`.

**Seltzer** owns HTTP listen, routing, and the `validate` stage. `@citrusworx/webengine` `createNectarineReadRoutes` / `createNectarineWriteRoutes` / `createNectarineRoutes` map `listApiOperations` onto object-based `Route`s via Seltzer `generateRoutes` (`Route.contract` carries resource/name/body). Default `execute` compiles `operation.query` from `*Queries.yml` (CCompiler) and runs adapter `query(sql, params)`. Writes bind YAML columns from the request body and path (`order_id` ↔ `orderId`). Handlers return `ResponseData`. They do not write `ctx.json`.

Nectarine does **not** generate `Route`s, listen on a port, or export `generateRoutes`. There is no `nectarine serve`. Do not invent Express.

Hosts opt in after kernel bootstrap (the **data module does not listen**). Either keep the Blackwater pattern (`Seltzer.init()` → `app.route(...)` → `app.listen(port)`), or call the engine helper:

```ts
import {
  runKernelLifecycle,
  startSeltzerFromKernel,
} from "@citrusworx/webengine";

const result = await runKernelLifecycle(cwd);
const { app, server, port } = await startSeltzerFromKernel(result, {
  // options.port → kiwi webengine.port → web runtime network.port
  cors: { origin: "http://localhost:5173" },
  routes: [{ method: "GET", path: "/health", handler: () => ({ body: { ok: true } }) }],
});
```

`startSeltzerFromKernel` (`serveNectarineHttp`) requires a bootstrapped nectarine handle. It runs `Seltzer.init()`, registers `handle.createRoutes({ resources })` (resources from options, else unique `apps[].resources`, else every loaded resource), then `listen`. Extra hand routes (health) and CORS stay in options. Default kernel bootstrap still does **not** auto-listen.

Hosts can still wire Seltzer themselves:

```ts
import { Seltzer } from "@citrusworx/seltzer";
import {
  NECTARINE_MODULE_ID,
  type NectarineModuleHandle,
} from "@citrusworx/webengine";

const nectarine = ctx.getModuleHandle<NectarineModuleHandle>(NECTARINE_MODULE_ID);
const app = Seltzer.init();
for (const route of nectarine.createRoutes({
  resources: ["course", "order", "order_item"],
  exclude: [{ resource: "lesson", name: "byId" }],
})) {
  app.route(route);
}
await app.listen(port);
```

Pass `execute` when a resource needs host logic (Blackwater product JSONB catalog / waitlist `joinWaitlist`). Both use the same helper:

```ts
createNectarineRoutes(nectarine, {
  resources: ["waitlist"], // or ["product"]
  execute: executeWaitlist, // host: generated id, duplicate UX, allowlist, file-store
  notFound: () => ({ status: 404, body: { error: "Waitlist entry not found" } }),
});
```

SQL stays in `*Queries.yml`. Host execute stays thin. Health, KiwiPress, and other host-owned paths stay hand-registered (`startSeltzerFromKernel({ routes })` or `app.route`). Blackwater `createRoutes` calls the engine helper for generic resource reads **and** YAML writes (`POST`/`PUT`/`PATCH`/`DELETE`); product writes use the same helper with a host `execute` so JSONB `payload` is not flattened onto relational columns. Blackwater still calls `Seltzer.init()` / `listen` itself; it can migrate to `startSeltzerFromKernel` later.

## Adapter surface

SQL adapters expose `query(sql, params)` plus `connect` / `disconnect` (pool as needed).

- **Postgres** (`@citrusworx/nectarine/adapters/pg`): first-class JSONB (`jsonb` columns, `$N::jsonb` binds). `withTransaction` pins one pool client so `applyMigrations` is atomic. JSONB is not being dropped.
- **MySQL** (`adapters/ms`): compiler stays Postgres-first (`$1`). The adapter rewrites `$1` / `$N::jsonb` to `?` / `CAST(? AS JSON)` at `query()` time. MySQL DDL implicit-commits; a later op cannot undo an earlier ALTER.
- **Mongo** (`adapters/mg`): separate surface (collection helpers). Not SQL `query()`, not ALTER TABLE.

Adapters execute compiler SQL. They never build or concatenate it.

## Hard rules

- No hard-coded SQL in final app or kernel backend code. Named queries and named DDL live in YAML.
- Seltzer owns HTTP. Nectarine is library-first.
- Postgres JSONB is first-class. Do not drop it or flatten live document stores into relational columns as a “cleanup.”
- Do not read vendor secrets in adapters; YAML names keys, `resolveCredentials` reads env.

## Out of scope for this contract

- Joins / `GROUP BY` / `LIMIT` / JSONB `||` / `jsonb_set`
- Flyway-style down migrations, raw SQL migration scripts, silent schema-diff DROP
- Inventing Express route generation or `nectarine serve`

`COUNT`, `EXISTS`, JSONB `@>` / `?` / `->>`, and INSERT `ON CONFLICT` are
**compiler phonics** in `@citrusworx/nectarine` (YAML tokens → SQL). They are
not host-invented SQL. Joins, `GROUP BY`, and `LIMIT` remain later compiler
work. Blackwater host execute runs the named queries (`payloadsByCatalog`,
`payloadsBySlug`, `payloadsContaining`, `payloadsWithKey`, `countPayloads`,
`emailExists`, `countEntries`, `seedPayload`) through `createNectarineRoutes`
+ thin `execute`.

Those remaining items are not kernel invent-as-you-go.

## Version note

npm `@citrusworx/nectarine@0.4.0` is the published package (migrator since 0.3.0; COUNT / EXISTS / JSONB operators in 0.4.0). The workspace manifest is **0.4.0**. INSERT `onConflict` is in this git tree and not in the 0.4.0 tarball; the next publish is **0.5.0**. `@citrusworx/webengine` depends on `@citrusworx/nectarine` `^0.4.0` (that caret is `>=0.4.0 <0.5.0`, so Yarn keeps the workspace link) and `@citrusworx/seltzer` `^0.8.1`. The builtin `nectarine` kernel module calls the migrator APIs; `createNectarineReadRoutes` / `createNectarineWriteRoutes` / `createNectarineRoutes` call Seltzer `generateRoutes`. Opt-in HTTP is `startSeltzerFromKernel` / `serveNectarineHttp` — not `nectarine serve`, and not during module bootstrap.

## Kernel checklist

When the kernel writes or hosts a Nectarine backend:

- [x] Load `nectarine.config.yaml` with `loadNectarineConfig` (`nectarine` kernel module)
- [x] Resolve credentials through `NectarineConfig`; pass them into adapters
- [x] Boot: connect → `applyMigrations` (empty migrations dir OK) → then listen *(listen stays Seltzer; data module stops after migrate; hosts call `startSeltzerFromKernel` or `app.listen`)*
- [x] DML/DDL only via named YAML + compiler; adapter `query(sql, params)` only
- [x] Flatten `*API.yml` with `listApiOperations`; hand off to Seltzer `generateRoutes` *(engine `createNectarineReadRoutes` / `createNectarineWriteRoutes` / `createNectarineRoutes` and handle `createReadRoutes` / `createWriteRoutes` / `createRoutes`; hosts opt in — bootstrap does not listen)*
- [x] Seltzer `init` / `listen` / `validate`; no Express, no `nectarine serve` *(opt-in `startSeltzerFromKernel` / `serveNectarineHttp`; HTTP remains Seltzer’s; data module still does not listen)*
- [x] Keep JSONB columns that the live store uses; protect them if the host needs to *(pass `protectedColumns` into `createNectarineModule`)*
- [x] Import adapters from `@citrusworx/nectarine/adapters/pg` (or `/ms`, `/mg`), not the package root

Deeper rules: [No hard-coded SQL](../nectarine/no-hardcoded-sql.md), [Production](../nectarine/production.md), [API](../nectarine/nectarine-api.md).
