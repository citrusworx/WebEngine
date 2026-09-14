# Nectarine Troubleshooting

The usual “why didn’t it query?” cases against `libraries/nectarine/src`. If the answer is not here, it is probably a missing compiler, not a hidden API — check [Status](./nectarine-status.md).

Related:

- [Getting Started](./nectarine-getting-started.md)
- [Anti-patterns](./nectarine-anti-patterns.md)
- [API Reference](./nectarine-api.md)

## `PgSql.query` returns `undefined`

`query` catches errors, `console.error`s them, and returns `undefined`. Look at stderr. Typical causes:

- relation does not exist (you never ran CREATE TABLE)
- syntax from a bad builder (`undefined * FROM undefined` — you used `pgz.example` `buildSelectSQL` on a PG DSL node)
- you interpolated `buildSQL()` / `buildQuery()` (`undefined`) into `sql`
- auth / database name wrong

Check `if (!result)` before reading `rows`.

## `connect()` returns `undefined`

`client()` catches constructor failures and returns nothing. `connect` then calls `undefined?.connect()`.

- `PG_USER` / `PG_PASS` / `PG_HOST` / `PG_PORT` unset (they become `undefined` on the Client)
- `addDb` never called, so `database` is `undefined`
- `connect("catalog")` but you `addDb("myapp")` — the map key must match

`PG_DB` is a convention you pass in. The class does not read it.

## `MYSQL_*` / `MONGO_URI` seem ignored

They are ignored. Postgres is `PG_*`. MySQL is `MS_*`. Mongo is `MG_*` fields that build a URI; there is no `MONGO_URI`.

## `registerRoute` returns a string

If the path does not contain `api.yml` and does not end with `api.yaml`, the function returns `"Config must end with 'api.yml' or be named 'api.yaml'."` It does not throw.

If the path is fine but the node is missing, it **throws**. Nested `user.get.allUsers` is missing at the top level — walk with `parser.yaml` or flatten the file.

## `genSQL` throws `SQL Configuration not found`

The lookup is `doc[type][method][config]`. For `user.yml`:

```ts
parser.genSQL(path, "user", "get", "UserById");
```

`parser.genSQL(path, "get", "user", "UserById")` is the `CCompiler.clean_parse` argument order and will throw on the PG fixture.

Blog `post/sql.yml` uses `queries:` at the top. `genSQL` cannot address that without a different key scheme — use `parser.yaml`.

## `[object Object]` in CREATE TABLE

A field value is an object (`{ type: "int", … }`) and the builder stringified it. Handle object vs string — [Schema Guide](./nectarine-schema-guide.md).

## MySQL works once, then `Pool is closed`

`closeSql()` calls `pool.end()`. Do not call it per request. Close on process shutdown.

## Mongo insert works, the next call fails

`insertOne` / `insertMany` / `createCollection` close the shared `mngzClient`. Use `Mngz` and the driver for a long-running process.

## `parser.yaml` floods the logs

It always `console.log`s the loaded object. There is no quiet flag. Expect it, or wrap calls in scripts rather than per-request in production until the parser grows a silent mode.

## `CCompiler.buildQuery` “does nothing”

Correct. Empty method. Use a hand-built compiler — [Tutorial](./nectarine-tutorial.md) step 3.

## Seltzer 404 on `/users/1`

Seltzer is exact-path. `/users/:id` in YAML is the literal path `/users/:id`. Use `/user-by-id?id=1` or parse the pathname yourself. [Integration](./nectarine-integration.md).
