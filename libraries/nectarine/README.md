# @citrusworx/nectarine

Compiler and adapter utilities for CitrusWorx data and query tooling.

## Install

```bash
npm install @citrusworx/nectarine
```

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
- `@citrusworx/nectarine/compiler`
- `@citrusworx/nectarine/adapters/mg`
- `@citrusworx/nectarine/adapters/ms`
- `@citrusworx/nectarine/adapters/pg`
- `@citrusworx/nectarine/util`

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

`query(sql, params?)` uses `$1`-style placeholders to match compiler output.

## MySQL adapter

`@citrusworx/nectarine/adapters/ms` follows the same config-driven pattern as Postgres. YAML declares the env key names; `NectarineConfig.resolveCredentials("mysql")` reads the values. The adapter does not read `process.env` itself. Install `mysql2` alongside this package (peer dependency).

MySQL uses `?` placeholders, not `$1`. The compiler is still Postgres-first and emits `$1`; this adapter runs the SQL and params it is given and does not rewrite placeholders.

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
const result = await mysql.query("SELECT id FROM users WHERE id = ?", [1]);
await mysql.disconnect();
```

`query(sql, params?)` uses `?` placeholders. `connect()` creates a `mysql2` pool and checks out one connection so failures surface before the first query.

## Query compiler

`CCompiler` turns the **canonical CRUD YAML** shape into parameterized SQL.
The source of truth is `models/user/db/pg/user.yml`:

```yaml
user:                 # type / resource
  get:                # method
    UserById:         # query name
      select: ['id']
      from: users
      where:
        column: id
        operator: eq   # eq | neq | gt | lt | gte | lte
        value: $1
```

| Method | YAML keys | Example SQL |
|--------|-----------|-------------|
| `get` | `select`, `from`, optional `where` | `SELECT id FROM users WHERE id = $1` |
| `create` | `insert.into`, `insert.columns`, `insert.values` | `INSERT INTO users (email, password, name, created_at) VALUES ($1, $2, $3, NOW())` |
| `update` | `table`, `set`, `values`, `where` | `UPDATE users SET name = $1, age = $2, updated_at = NOW() WHERE id = $3` |
| `delete` | `from`, `where` | `DELETE FROM users WHERE id = $1` |

- `$1`, `$2`, … are kept as bind placeholders — numbers, booleans, and other literals are rejected.
- `{ fn: now }` (and the fragment `NOW()`) compile to vendor-neutral `NOW()`.
- `clean_parse(parsed, type, method)` follows the YAML path and `parser.genSQL(path, type, method, config)` — e.g. `clean_parse(parsed, "user", "get")`. The returned `{ type, method, queries }` bundle is what `buildQuery` uses so GET vs DELETE is not inferred from a bare `from`.
- `parser.buildSQL(queryObject, method?)` is a thin wrapper around the same compiler. `method` is required for DELETE.

**Not compiled in this MVP:** the blog `queries:` map (`models/blog/post/sql.yml`) and the product fixture `type: SELECT` shape.

```ts
import { CCompiler } from "@citrusworx/nectarine/compiler";

const compiler = new CCompiler();
const parsed = compiler.parse_config("./models/user/db/pg/user.yml");
const gets = compiler.clean_parse(parsed, "user", "get");
const sql = compiler.buildQuery(gets, "UserById");
// SELECT id FROM users WHERE id = $1
```

## Development

```bash
yarn workspace @citrusworx/nectarine build
yarn workspace @citrusworx/nectarine test
yarn workspace @citrusworx/nectarine typecheck
```
