# Nectarine API Reference

Exports from `@citrusworx/nectarine` (`libraries/nectarine/src/index.ts`).

Subpaths: `./compiler`, `./adapters/pg`, `./adapters/ms`, `./adapters/mg`, `./util`.

## parser

```ts
import { parser, type YAMLdata } from "@citrusworx/nectarine";
```

### `parser.yaml(filepath)`

Reads a file, `js-yaml.load`, `console.log`s the result, returns the object.

```ts
const schema = parser.yaml("./userSchema.yml");
```

### `parser.genSQL(yaml, type, method, config)`

```ts
parser.genSQL("./user.yml", "user", "get", "UserById");
```

Returns `sql_obj[type][method][config]`. Throws if missing.

This is **not** SQL. It is the YAML node.

### `parser.registerRoute(yaml, method, route)`

```ts
parser.registerRoute("./userAPI.yml", "get", "allUsers");
```

The path must include `api.yml` or end with `api.yaml`, or the function returns the string `"Config must end with 'api.yml' or be named 'api.yaml'."` (it does not throw on that check).

Looks up `api_obj[method][route]`. Throws if that node is missing.

Note: `userAPI.yml` is nested as `user.get.allUsers`, but `registerRoute` indexes **top-level** `method` then `route`. For the checked-in file you would need either a flattened YAML or to call `parser.yaml` and walk `user.get.allUsers` yourself. The helper does not understand a resource prefix.

### `parser.buildSQL(genSQL)`

Declared. Body is empty. Returns `undefined`.

## CCompiler

```ts
import { CCompiler, type optokens } from "@citrusworx/nectarine";

const compiler = new CCompiler();
compiler.parse_config("./file.yml");           // parser.yaml
compiler.clean_parse(parsed, "get", "user");  // parsed[method][type]
compiler.buildQuery(cleaned, "UserById");     // no-op
```

`parse_config` takes a **filepath** (despite the parameter name `config`), because it delegates to `parser.yaml`.

## PgSql

```ts
import { PgSql } from "@citrusworx/nectarine";

const pg = new PgSql();
pg.addDb("myapp");
pg.addTable("users"); // stored; not used by query()
const client = await pg.connect("myapp");
await pg.query(client, { sql: "SELECT 1", params: [] });
await pg.disconnect(client);
```

| Method | Role |
|---|---|
| `client(db)` | `new Client({ …creds, database: this.dbs.get(db) })` |
| `connect(db)` | `client` + `connect()` |
| `query(client, { sql, params? })` | `client.query`; logs errors, returns `undefined` on failure |
| `disconnect(client)` | `client.end()` |
| `addDb` / `addTable` | register names in maps |

Creds: `PG_USER`, `PG_PASS`, `PG_HOST`, `PG_PORT`. Missing env values become `undefined` on the `pg` Client.

## Mysql

```ts
import { Mysql, closeSql, pool } from "@citrusworx/nectarine";

const rows = await Mysql("SELECT 1 AS n", []);
await closeSql();
```

| Export | Role |
|---|---|
| `pool` | module-level `mysql2/promise` pool |
| `Mysql(query, values?)` | `pool.execute`; throws on error |
| `closeSql()` | `pool.end()` |

Env: `MS_HOST`, `MS_USER`, `MS_PASS`, `MS_DB`, `MS_PORT`. Placeholders are `?`.

## MySQL utils

```ts
import { mapInsert, mapGetter, getValues } from "@citrusworx/nectarine";
```

- `mapInsert(action)` — joins `action.updates.values`, replacing objects with `?`
- `mapGetter(action)` — same for `action.statement.values` (also `console.log`s)
- `getValues(action)` — `action.statement.column.join(', ')`

These do not validate or emit `INSERT …`.

## MongoDB

```ts
import {
  mngzClient,
  connectMngz,
  closeMngz,
  Mngz,
  createCollection,
  insertOne,
  insertMany,
} from "@citrusworx/nectarine";
```

| Export | Role |
|---|---|
| `mngzClient` | `new MongoClient(uri)` at import time |
| `connectMngz()` | `connect()`, logs, returns client |
| `closeMngz(client)` | closes **`mngzClient`**, not necessarily the argument |
| `Mngz(callback)` | connect, `callback(client)`, log errors |
| `createCollection(client, name)` | `createCollection` on `MG_DB`, then `closeMngz` |
| `insertOne` / `insertMany` | write, log, `closeMngz` |

URI uses `MG_USER`, `MG_PASS`, `MG_HOST`, `MG_PORT`, `MG_DB`. The client is constructed when the module loads — if env is unset, the URI is still interpolated.

## loadMongoConfig

```ts
import { loadMongoConfig } from "@citrusworx/nectarine";
```

Calls `parser.yaml('sql.yml')` with no return. Treat as unfinished.

## Types

`YAMLdata` is `{ [key: string]: any }`. `optokens` is the operator token map type. Adapter types are implicit.

There is no exported Zod schema for models, no `generateRoutes`, no `Nectarine` class.
