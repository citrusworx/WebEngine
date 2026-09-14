# Nectarine Anti-Patterns

## Purpose

This document collects the most common ways to fight Nectarine instead of working with it.

These are useful because most “it didn’t generate my backend” and “query returned undefined” failures come from a few repeated mistakes — usually Prisma, Express generators, or older docs that promised a compiler the source does not contain.

## 1. Treating Nectarine like Prisma

Bad:

```ts
import { generateRoutes } from "@citrusworx/nectarine";

const app = generateRoutes(schema, queries, api);
app.listen(3000);
```

Why it is bad:

- `generateRoutes` does not exist
- YAML is data, not a running server
- there is no client `db.user.findMany()`

Better:

```ts
import { parser, PgSql } from "@citrusworx/nectarine";

const spec = parser.genSQL("./queries.yml", "user", "get", "AllUsers");
const sql = buildSelect(spec); // your function
// PgSql.query + Seltzer.route — see the tutorial
```

Nectarine is a contract folder plus sockets. The HTTP layer is Seltzer (or Express) you wire.

## 2. Calling `buildSQL` / `buildQuery` and expecting a string

Bad:

```ts
const spec = parser.genSQL("./user.yml", "user", "get", "UserById");
const sql = parser.buildSQL(spec);
await pg.query(client, { sql, params: [1] });
```

Why it is bad:

- `buildSQL` and `CCompiler.buildQuery` have empty bodies
- `sql` is `undefined`
- `PgSql.query` logs the driver error and returns `undefined`

Better:

Compile with the [tutorial](./nectarine-tutorial.md) `buildSelect`. Keep that function in one module so it can die when the package compiler lands.

## 3. Interpolating user input into SQL

Bad:

```ts
await pg.query(client, {
  sql: `SELECT id FROM users WHERE email = '${reqEmail}'`,
});
```

Why it is bad:

- YAML placeholders exist so values stay in `params`
- you bypass the only safety the DSL currently offers

Better:

```ts
await pg.query(client, {
  sql: "SELECT id FROM users WHERE email = $1",
  params: [reqEmail],
});
```

Build identifiers from YAML keys (and an allow-list). Keep request data in the params array. The DSL’s `value: $1` is a token, not an invitation to splice `req.query`.

## 4. Feeding a Postgres node to MySQL helpers

Bad:

```ts
const spec = parser.genSQL("./db/pg/user.yml", "user", "create", "NewUser");
mapInsert(spec);
```

Why it is bad:

- `NewUser` has `insert.columns` / `insert.values`
- `mapInsert` reads `action.updates.values`
- two DSLs, one lookup function

Better:

Use `buildInsert` on PG nodes. Use `mapInsert` only on `db/msql` nodes that have `updates`. One query shape per engine file.

## 5. Using `registerRoute` on nested `userAPI.yml`

Bad:

```ts
parser.registerRoute("./models/user/userAPI.yml", "get", "allUsers");
```

Why it is bad:

- lookup is `doc[method][route]`, not `doc.user.get.allUsers`
- the call throws `Route configuration not found`
- if the filename did not look like `api.yml`, you would get a **string** instead of a throw

Better:

```ts
const api = parser.yaml("./models/user/userAPI.yml");
const route = api.user.get.allUsers.api;
```

Or flatten the YAML so `get.allUsers` is at the top level.

## 6. Wrong environment names

Bad:

```bash
export MYSQL_HOST=localhost
export MONGO_URI=mongodb://localhost/myapp
```

Why it is bad:

- MySQL reads `MS_HOST`, `MS_USER`, `MS_PASS`, `MS_DB`, `MS_PORT`
- Mongo builds a URI from `MG_*` at import time
- nothing reads `MYSQL_*` or `MONGO_URI`
- the process looks “configured” and the client is not

Better:

Use the table in [Getting Started](./nectarine-getting-started.md). Set vars before the process starts — MySQL and Mongo construct clients at import.

## 7. Closing the MySQL pool per request

Bad:

```ts
app.route({
  method: "GET",
  path: "/users",
  handler: async (ctx) => {
    const rows = await Mysql("SELECT id FROM users", []);
    await closeSql();
    ctx.json({ rows });
  },
});
```

Why it is bad:

- `closeSql` is `pool.end()`
- the next request fails until process restart

Better:

Share `pool` for the process. Close on shutdown. Postgres is the opposite: `disconnect` per unit of work because there is no pool.

## 8. Mongo `insertOne` on a hot path

Bad:

```ts
app.route({
  method: "POST",
  path: "/users",
  handler: async (ctx) => {
    const client = await connectMngz();
    await insertOne(client, "users", { email: "a@b.c" });
  },
});
```

Why it is bad:

- `insertOne` closes the **module** client when it finishes
- the next handler reconnects from scratch or fails
- `Mngz` would be the callback wrapper, still not a pool API

Better:

Connect once (or use `Mngz` for a script). Call `client.db(MG_DB).collection("users").insertOne` yourself. Save the helpers for one-shot jobs.

## 9. Trusting `pgz.example.ts` against PG fixtures

Bad:

```ts
const spec = parser.genSQL("./db/pg/user.yml", "user", "get", "UserById");
const sql = buildSelectSQL(spec); // from pgz.example.ts
```

Why it is bad:

- `buildSelectSQL` wants `type`, `fields`, `table`, `conditions`
- `UserById` has `select`, `from`, `where`
- you get `undefined * FROM undefined`

Better:

Use the getting-started / tutorial `buildSelect`. Treat `pgz.example.ts` as lifecycle illustration, not as the compiler for `user.yml`. Paths in that file are stale besides.

## 10. Using `CCompiler.clean_parse` as `genSQL`

Bad:

```ts
const compiler = new CCompiler();
const parsed = compiler.parse_config("./db/pg/user.yml");
const clean = compiler.clean_parse(parsed, "get", "user");
```

Why it is bad:

- `clean_parse` indexes `[method][type]` → `parsed.get.user`
- the file is `user.get.*`
- `genSQL` indexes `[type][method][name]`

Better:

```ts
parser.genSQL("./db/pg/user.yml", "user", "get", "UserById");
```

Leave `CCompiler` until `buildQuery` exists. Details in [Compiler](./nectarine-compiler.md).

## 11. Treating fixtures as a published schema pack

Bad:

```ts
import { models, extendModels } from "@citrusworx/nectarine";
```

Why it is bad:

- `libraries/nectarine/index.ts` is **outside** the `src` build
- `models` / `extendModels` are not in `dist/`
- `userSchema.yml` has `DEAFULT`, mixed field styles, incomplete MySQL delete nodes

Better:

Copy YAML into the app. Fix it. Version it. The trees under `libraries/nectarine/models/` are fixtures.

## 12. Expecting WebEngine or `webengine.toml` to start Nectarine

Bad:

```toml
modules = ["nectarine"]
```

as if that imported `@citrusworx/nectarine`.

Why it is bad:

- WebEngine source does not import this package
- Grapevine does not run `app.listen`
- KiwiPress lists a dependency and does not import it

Better:

A Node process that imports the parser and an adapter. [Integration](./nectarine-integration.md).

## Summary

Most of the time, the fix is to simplify: a YAML object, a small builder, a parameterized query, a listener you wired. **Trust the split.**

If a pattern is not in `libraries/nectarine/src`, it is not in the library — check [Status](./nectarine-status.md) before assuming an ORM-shaped API.
