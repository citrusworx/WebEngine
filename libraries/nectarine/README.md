# @citrusworx/nectarine

Compiler and adapter utilities for CitrusWorx data and query tooling.

## Published surface

Install from npm. The packed tarball is `dist/` (plus npm’s default `LICENSE` / `README.md`). `prepack` runs `yarn build`.

Stable entrypoints:

- `@citrusworx/nectarine` — config loader, compiler, YAML helpers (`loadNectarineConfig`, `CCompiler`, `listApiOperations`, `applyMigrations`, …)
- `@citrusworx/nectarine/config` and `@citrusworx/nectarine/api`
- `@citrusworx/nectarine/compiler`
- `@citrusworx/nectarine/migrate` — versioned YAML migrator (`applyMigrations`, `compileMigration`, ledger)
- `@citrusworx/nectarine/adapters/pg` — requires peer `pg`
- `@citrusworx/nectarine/adapters/ms` — requires peer `mysql2`
- `@citrusworx/nectarine/adapters/mg` — requires peer `mongodb`
- `@citrusworx/nectarine/util`

Adapters are **not** re-exported from the package root. Import them from the adapter subpaths so a config/compiler-only install does not load `pg`, `mysql2`, or `mongodb`.

Full guides live in the [WebEngine `docs/nectarine/` directory](https://github.com/citrusworx/WebEngine/tree/master/docs/nectarine). Relative doc links below resolve on GitHub, not on npmjs.com.

## Hard rule: no hard-coded SQL

Final app backend code **must not** embed SQL strings. Nectarine is phonics:

1. **App code** calls a named query (`resource.method.QueryName`) or named DDL / `applyMigrations` and passes bind values.
2. **Compiler** assembles `SELECT` / `INSERT` / `UPDATE` / `DELETE` from query YAML, `CREATE TABLE` / `CREATE INDEX` from `*Schema.yml`, and gated `ALTER` from versioned migration YAML (canonical CRUD or Blackwater `type: SELECT`, normalized onto the same DML model).
3. **Adapters** only execute `(sql, params)` produced by the compiler. They never build SQL.

Postgres **JSONB is first-class**. Document-store columns stay JSONB; named YAML selects `payload` and binds `{ value: $N, cast: jsonb }` (allow-listed). Schema fields may be `json` / `jsonb`. Do not drop JSONB to satisfy the no-SQL rule.

`where: isActive = true` in YAML is a closed fragment grammar, not raw SQL.
Mixed-case identifiers are quoted in emitted SQL (`"isActive"`) so Postgres
does not fold them to lowercase. Runtime values are `$N` placeholders
(`$1::jsonb` is an allowlisted bind cast) — never string-interpolated.

**JSONB is supported; we are not dropping it.** Schema fields may be
`json` / `jsonb`. The Blackwater `products` table keeps `payload JSONB`
as a document-store column, with a nullable catalog projection from the
same `productSchema.yml`.

See [`docs/nectarine/no-hardcoded-sql.md`](../../docs/nectarine/no-hardcoded-sql.md), [`docs/nectarine/nectarine-query-dsl.md`](../../docs/nectarine/nectarine-query-dsl.md), and [`docs/nectarine/production.md`](../../docs/nectarine/production.md).

## Install

Pick a client, then install **one** database driver for the adapter you use. Drivers are optional peer dependencies.

```bash
# npm
npm install @citrusworx/nectarine
npm install pg          # PostgreSQL (typical WebEngine / Blackwater path)
# npm install mysql2    # MySQL
# npm install mongodb   # MongoDB (driver 7 wants Node 20.19+)

# yarn
yarn add @citrusworx/nectarine
yarn add pg

# pnpm
pnpm add @citrusworx/nectarine
pnpm add pg
```

Inside this monorepo, the workspace package is already linked; you do not `yarn add` it again. Contributors still run `yarn workspace @citrusworx/nectarine build` so `dist/` matches `src/`.

Requires Node 18+. MongoDB adapter consumers should use Node 20.19+ (mongodb@7).

## Usage

```ts
import { loadNectarineConfig } from "@citrusworx/nectarine";

const config = loadNectarineConfig("./nectarine.config.yaml");

// Vendor env key names come from YAML; values come from process.env
const creds = config.resolveCredentials(); // null if PG_*/MS_*/MG_* incomplete
const product = config.getResource("product"); // schema + queries + api objects
const coursesApp = config.getAppBySubdomain("courses");
```

Subpath exports are also available:

- `@citrusworx/nectarine/config`
- `@citrusworx/nectarine/api`
- `@citrusworx/nectarine/compiler`
- `@citrusworx/nectarine/migrate`
- `@citrusworx/nectarine/adapters/mg`
- `@citrusworx/nectarine/adapters/ms`
- `@citrusworx/nectarine/adapters/pg`
- `@citrusworx/nectarine/util`

## Transport

Nectarine is **library-first**. It does not spin up an HTTP server and does not export `generateRoutes`.

WebEngine / Blackwater hosts with **[Seltzer](../../docs/seltzer/README.md)**. Set `transport.server: seltzer` in `nectarine.config.yaml` (see `apps/blackwatersound/back/nectarine.config.yaml`). Register object-based Seltzer `Route` definitions on the host.

Seltzer hosts / auto-wiring consumers can flatten `*API.yml` without touching the compiler:

```ts
import { listApiOperations } from "@citrusworx/nectarine/config";
// or: import { listApiOperations } from "@citrusworx/nectarine/api";

const product = config.getResource("product");
const ops = listApiOperations("product", product.api);
// ops[].method + ops[].path (from YAML `endpoint`) are ready for Seltzer Route wiring
```

`loadApiOperations(resource, apiPath)` loads YAML from disk first. Nectarine does not generate Seltzer Routes — Seltzer's `generateRoutes` maps `ApiOperation[]` onto `Route[]` (reads, YAML writes, and optional `api.status`). WebEngine compiled execute binds jsonb-cast document writes; waitlist POST `joinWaitlist` still uses a host `execute`.

Express is not the default transport. Seltzer's default `validate` stage enforces `.required` body fields from `Route.contract` (copied by `generateRoutes` from `ApiOperation.body`). Zod is the planned richer layer via `Seltzer#replace("validate", …)`. An HTTP client such as Axios is optional and not part of the default stack.

## Postgres adapter

`@citrusworx/nectarine/adapters/pg` takes **resolved credentials**, not hardcoded `process.env.PG_*` names. YAML declares the env key names; `NectarineConfig.resolveCredentials()` reads the values. Install `pg` alongside this package (peer dependency).

```ts
import { loadNectarineConfig } from "@citrusworx/nectarine";
import { createPgAdapter, createPgAdapterFromConfig } from "@citrusworx/nectarine/adapters/pg";
import { CCompiler } from "@citrusworx/nectarine/compiler";

const config = loadNectarineConfig("./nectarine.config.yaml");

// Thin helper: null when vendor is not postgres or env values are missing
const fromConfig = createPgAdapterFromConfig(config);

const creds = config.resolveCredentials("postgres");
if (!creds) {
    throw new Error("Postgres env is incomplete");
}

const pg = fromConfig ?? createPgAdapter(creds);
const compiler = new CCompiler();
const parsed = compiler.parse_config("./models/user/db/pg/user.yml");
const gets = compiler.clean_parse(parsed, "user", "get");
const sql = compiler.buildQuery(gets, "UserById");
// SELECT id FROM users WHERE id = $1

await pg.connect();
const result = await pg.query(sql, [1]);
await pg.disconnect();
```

`query(sql, params?)` uses `$1`-style placeholders to match compiler output. `connect()` creates a `pg.Pool` (not a single `Client`) and checks out one connection so failures surface before the first query. Idle-client `error` events are logged; they do not crash the process. Call `disconnect()` / `end()` on shutdown.

Schema YAML compiles the same way:

```ts
const ddl = compiler.buildDdl(compiler.parse_config("./schemas/product/productSchema.yml"));
await pg.query(ddl);
```

Versioned schema evolution uses `applyMigrations` (ledger + YAML ops). Additive `ADD COLUMN IF NOT EXISTS` still runs for new fields after pending renames/drops:

```ts
import { applyMigrations, loadMigrationDocuments } from "@citrusworx/nectarine/migrate";

await applyMigrations({
    execute: pg,
    vendor: "postgres",
    schemas: [compiler.parse_config("./schemas/product/productSchema.yml")],
    migrations: loadMigrationDocuments("./db/migrations"),
    protectedColumns: [{ table: "products", column: "payload" }],
});
```

## MySQL adapter

`@citrusworx/nectarine/adapters/ms` follows the same config-driven pattern as Postgres. YAML declares the env key names; `NectarineConfig.resolveCredentials("mysql")` reads the values. The adapter does not read `process.env` itself. Install `mysql2` alongside this package (peer dependency).

The compiler is still Postgres-first and emits `$1` / `$N::jsonb`. `query()` rewrites those binds at the adapter boundary to MySQL `?` (and `CAST(? AS JSON)` for `json` / `jsonb`; `::text` is stripped). JSONB `@>` / `?` / `->>` become `JSON_CONTAINS` / `JSON_CONTAINS_PATH` / `JSON_EXTRACT`; bound `has_key` names go through `JSON_QUOTE` so `$."a.b"` stays one key. Parameter order is preserved, including reused or out-of-order `$N`. SQL that already uses `?` is left as-is. Postgres still runs `$1` unchanged.

```ts
import { loadNectarineConfig } from "@citrusworx/nectarine";
import { createMysqlAdapter, createMysqlAdapterFromConfig } from "@citrusworx/nectarine/adapters/ms";

const config = loadNectarineConfig("./nectarine.config.yaml");

// Thin helper: null when vendor is not mysql or env values are missing
const fromConfig = createMysqlAdapterFromConfig(config);

const creds = config.resolveCredentials("mysql");
if (!creds) {
    throw new Error("MySQL env is incomplete");
}

const mysql = fromConfig ?? createMysqlAdapter(creds);

await mysql.connect();
const result = await mysql.query("SELECT id FROM users WHERE id = $1", [1]);
await mysql.disconnect();
```

`query(sql, params?)` accepts compiler `$1` SQL or MySQL `?` SQL. `connect()` creates a `mysql2` pool and checks out one connection so failures surface before the first query.

## MongoDB adapter

`@citrusworx/nectarine/adapters/mg` follows the same config-driven pattern as Postgres and MySQL. YAML declares the env key names; `NectarineConfig.resolveCredentials("mongodb")` reads the values. The adapter does not read `process.env` itself. Install `mongodb` alongside this package (peer dependency).

Connect once, run collection helpers on the connected client, then disconnect. Helpers do **not** close the client after a single insert.

```ts
import { loadNectarineConfig } from "@citrusworx/nectarine";
import { createMongoAdapter, createMongoAdapterFromConfig } from "@citrusworx/nectarine/adapters/mg";

const config = loadNectarineConfig("./nectarine.config.yaml");

// Thin helper: null when vendor is not mongodb or env values are missing
const fromConfig = createMongoAdapterFromConfig(config);

const creds = config.resolveCredentials("mongodb");
if (!creds) {
    throw new Error("MongoDB env is incomplete");
}

const mg = fromConfig ?? createMongoAdapter(creds);

await mg.connect();
await mg.createCollection("users");
await mg.insertOne("users", { email: "a@example.com" });
await mg.insertMany("users", [{ email: "b@example.com" }, { email: "c@example.com" }]);
const users = mg.collection("users");
await mg.disconnect();
```

`connect()` constructs a `MongoClient` from the resolved credentials and opens it so failures surface before the first write. Use `mg.db()` / `mg.collection(name)` for driver operations beyond the built-in helpers.

## Query compiler

`CCompiler` turns YAML query tokens into parameterized SQL. There is one
phonics model. Two surfaces compile to it:

**Canonical** (`models/user/db/pg/user.yml`):

```yaml
user:                 # type / resource
  get:                # method (`read` is an alias)
    UserById:         # query name
      select: ['id']
      from: users
      where:
        column: id
        operator: eq   # eq | neq | gt | lt | gte | lte | in | not_in | is_null | is_not_null
        value: $1
```

**Blackwater** (`apps/blackwatersound/back/src/schemas/**/*Queries.yml`) is
normalized first (`type: SELECT`, `table`, `fields`, fragment `where` /
`orderBy`, implicit INSERT/UPDATE `$N` values, optional `returning` /
`onConflict`):

```yaml
product:
  read:
    allProducts:
      type: SELECT
      table: products
      fields: '*'
      where: isActive = true
      orderBy: catalog, category, name
```

| Method | YAML keys | Example SQL |
|--------|-----------|-------------|
| `get` / `read` | `select`+`from` **or** `type: SELECT`+`table`+`fields`; optional `where`, `orderBy`; `count: true` / `exists: true` | `SELECT * FROM products WHERE isActive = TRUE ORDER BY catalog, category, name` |
| `create` | `insert.into/columns/values` **or** `type: INSERT`+`table`+`fields`; optional `returning`, optional `onConflict` | `INSERT INTO waitlist (...) VALUES ($1, …) RETURNING id, email, created_at` |
| `update` | `table`+`set`+`values`+`where` **or** `type: UPDATE`+`fields` (values default to `$1…$N`, WHERE `$1` remaps after SET) | `UPDATE products SET name = $1, … WHERE id = $14` |
| `delete` | `from`+`where` **or** `type: DELETE`+`table`+`where` | `DELETE FROM products WHERE id = $1` |

- `$1`, `$2`, … are bind placeholders. Raw numbers/booleans in canonical `value` are rejected; YAML constants use `{ const: true }` or the fragment grammar.
- `{ fn: now }` (and the fragment `NOW()`) compile to vendor-neutral `NOW()`. `{ fn: count }` / Blackwater `count: true` emit `COUNT(*)`. `exists: true` emits `SELECT EXISTS(SELECT 1 FROM …)`.
- INSERT `onConflict` emits Postgres `ON CONFLICT (cols) DO NOTHING` or `DO UPDATE SET col = EXCLUDED.col`. MySQL rejects that SQL at `query()`.
- JSONB `contains` (`@>`), `has_key` (`?`), and `path` (`->>`) filter document columns without flattening them.
- Blackwater `where` / `orderBy` strings are a **closed grammar** (not raw SQL). Injection-shaped fragments fail compilation.
- `clean_parse(parsed, type, method)` follows the YAML path and `parser.genSQL` — `read` and `get` resolve to the same method map. The returned `{ type, method, queries }` bundle is what `buildQuery` uses so GET vs DELETE is not inferred from a bare `from`.
- `parser.buildSQL(queryObject, method?)` is a thin wrapper around the same compiler.

**Not compiled:** the blog `queries:` map (`models/blog/post/sql.yml`), joins, `GROUP BY`, `LIMIT`, JSONB `||` / `jsonb_set`, arbitrary casts (only `$N::jsonb` / `{ cast: jsonb|json|text }`), MySQL `ON DUPLICATE KEY UPDATE` (`ON CONFLICT` is Postgres-only). Schema YAML `relationships:` is documentation only (not foreign-key DDL). `*Schema.yml` fields **are** compiled to `CREATE TABLE` / `CREATE INDEX`. Versioned migration YAML compiles to gated `ALTER` (`renameColumn`, `dropColumn`, `changeType`).

```ts
import { CCompiler } from "@citrusworx/nectarine/compiler";

const compiler = new CCompiler();
const parsed = compiler.parse_config("./models/user/db/pg/user.yml");
const gets = compiler.clean_parse(parsed, "user", "get");
const sql = compiler.buildQuery(gets, "UserById");
// SELECT id FROM users WHERE id = $1
```

## Try the example

A runnable showcase loads the fixture `nectarine.config.yaml`, compiles canonical user CRUD YAML, and demonstrates the Postgres adapter in dry-run (no live database required):

```bash
yarn workspace @citrusworx/nectarine example
```

Set the YAML-declared `PG_*` env vars and `NECTARINE_EXAMPLE_LIVE=1` to optionally execute one query. See `examples/showcase.ts`.

## Development

```bash
yarn workspace @citrusworx/nectarine build
yarn workspace @citrusworx/nectarine test
yarn workspace @citrusworx/nectarine typecheck
yarn verify:nectarine
```

`prepack` rebuilds `dist/` before `npm pack` / `yarn npm publish`. Release steps for npm: [docs/nectarine/release-checklist.md](../../docs/nectarine/release-checklist.md).
