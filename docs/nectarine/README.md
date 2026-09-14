# Nectarine

YAML-described data models and thin database adapters.

Nectarine is the CitrusWorx place to write *what the data looks like* and *which query you meant*, then run that against PostgreSQL, MySQL, or MongoDB. It is not, today, a one-command backend generator.

The current model is:

- **YAML files** describe tables, query intent, and (as data) HTTP routes
- **`parser`** loads those files and picks a named query or route object
- **Adapters** open a client and execute SQL or Mongo operations you still assemble
- **`CCompiler.buildQuery` and `parser.buildSQL`** are stubs — they do not emit SQL yet

Nectarine is strongest when you treat YAML as the source of query *shape*, and the adapter as the socket. It is weakest when docs (including older ones) promised Express + Zod routes from those files. That pipeline is not in `libraries/nectarine/src`.

## Who it is for

- App authors who want models and query names in git-friendly YAML
- Teams that already have (or will write) an HTTP layer — Seltzer, Express, or otherwise
- Contributors extending the compiler so `genSQL` objects become real statements

It is not a hosted BaaS, not Prisma, and not a GUI.

## Why it exists

Backend CRUD is repetitive, but the expensive part is not typing `SELECT`. It is keeping the *contract* — columns, filters, route names — from drifting across SQL strings, handlers, and clients.

CitrusWorx wants that contract in config:

- Juice / Sig.js should not invent table shapes
- Seltzer should eventually validate against the same contract
- Operators should be able to read a resource as three files, not a scavenger hunt through repositories

Nectarine is that contract folder. The adapters exist so the same repo can talk to Postgres, MySQL, or Mongo without a second ORM. The compiler is the unfinished piece that would turn query YAML into SQL so app code stops concatenating strings.

Until that compiler lands, the honest workflow is: **parse YAML → walk the object → build a string in your app (or copy the example helpers) → run it on an adapter**.

## Current setup shape

```ts
import { parser, PgSql } from "@citrusworx/nectarine";
```

```bash
export PG_USER=postgres
export PG_HOST=localhost
export PG_PASS=secret
export PG_DB=myapp
export PG_PORT=5432
```

There is no `generateRoutes()`, no `Pgsql()` function, and no `nectarine.config.yaml` loader.

## What it can do

### 1. Load a model file

Checked-in example: `libraries/nectarine/models/user/userSchema.yml`.

```yaml
User:
  table: users
  fields:
    id:
      type: int
      primaryKey: true
      autoIncrement: true
    username:
      type: VARCHAR
      length: 55
      unique: true
      null: false
    email:
      type: VARCHAR
      size: 100
      unique: true
      null: false
```

```ts
import { parser } from "@citrusworx/nectarine";

const schema = parser.yaml("./models/user/userSchema.yml");
const table = schema.User.table; // "users"
```

`parser.yaml` is a `js-yaml` + `readFileSync` wrapper. It logs the object to the console.

### 2. Pick a named query object

PostgreSQL-oriented DSL lives under `models/user/db/pg/user.yml`:

```yaml
user:
  get:
    UserById:
      select: ['id']
      from: users
      where:
        column: id
        operator: eq
        value: $1
```

```ts
const spec = parser.genSQL("./models/user/db/pg/user.yml", "user", "get", "UserById");
// spec.select, spec.from, spec.where — not a SQL string
```

`parser.genSQL` returns that object. `parser.buildSQL(spec)` is empty.

The in-repo Postgres example (`libraries/nectarine/src/adapters/pg/pgz.example.ts`) walks a similar object and concatenates SQL. That helper is **not** exported from the package; it is the current reference implementation.

### 3. Run SQL on PostgreSQL

```ts
import { PgSql } from "@citrusworx/nectarine";

const pg = new PgSql();
pg.addDb(process.env.PG_DB!);
const client = await pg.connect(process.env.PG_DB!);

if (!client) {
  throw new Error("Postgres client missing — check PG_* env vars");
}

try {
  const result = await pg.query(client, {
    sql: "SELECT id FROM users WHERE id = $1",
    params: [1],
  });
  console.log(result?.rows);
} finally {
  await pg.disconnect(client);
}
```

`PgSql` is a class. Credentials come from `PG_USER`, `PG_PASS`, `PG_HOST`, `PG_PORT`. `addDb(name)` registers the database name used in `connect(name)`.

### 4. Run SQL on MySQL

MySQL is a **thin `mysql2` pool**, not a second compiler.

```ts
import { Mysql, closeSql } from "@citrusworx/nectarine";

const rows = await Mysql(
  "SELECT email FROM users WHERE email = ?",
  ["dev@citrusworx.com"],
);

await closeSql();
```

Env vars are `MS_HOST`, `MS_USER`, `MS_PASS`, `MS_DB`, `MS_PORT` — not `MYSQL_*`.

Query YAML under `models/user/db/msql/user.yml` uses `?` placeholders and a `type` / `action` / `updates` shape. `mapInsert` / `mapGetter` in `msqlUtil` only join value lists; they do not build full statements.

### 5. Talk to MongoDB

```ts
import { Mngz, insertOne } from "@citrusworx/nectarine";

await Mngz(async (client) => {
  await insertOne(client, "users", {
    email: "dev@citrusworx.com",
    name: "Demo",
  });
});
```

URI is built from `MG_USER`, `MG_PASS`, `MG_HOST`, `MG_PORT`, `MG_DB`. Helpers: `connectMngz`, `closeMngz`, `createCollection`, `insertOne`, `insertMany`. There is no query DSL compiler for Mongo.

`insertOne` / `insertMany` / `createCollection` close the shared client when they finish — treat them as short scripts, not as a long-lived pool.

### 6. Read an API YAML (as data)

```yaml
# models/user/userAPI.yml
user:
  get:
    allUsers:
      api:
        method: GET
        endpoint: /users
```

```ts
const route = parser.registerRoute("./models/user/userAPI.yml", "get", "allUsers");
// { api: { method: "GET", endpoint: "/users" } }
```

`registerRoute` requires the path to contain `api.yml` or end with `api.yaml`. It does **not** mount Express (or Seltzer) handlers.

## Mental model

```text
*.yml  --parser.yaml / genSQL / registerRoute-->  plain objects
                                                  |
                         you (or a future compiler) build a statement
                                                  |
                     PgSql.query | Mysql | Mngz / insertOne
```

Three file roles, when you follow the in-repo layout:

| File | Role today |
|---|---|
| `*Schema.yml` | Table / field documentation and CREATE TABLE input for *your* builder |
| `db/pg/*.yml` or `db/msql/*.yml` | Named query objects (`genSQL`) |
| `*API.yml` | Named `{ method, endpoint }` objects |

The blog and user trees under `libraries/nectarine/models/` are fixtures, not a published schema pack.

## Suggested reading order

1. [Getting Started](./nectarine-getting-started.md) — env, parse, first adapter call
2. [Schema Guide](./nectarine-schema-guide.md) — how model YAML is actually written
3. [Query DSL](./nectarine-query-dsl.md) — Postgres-oriented intent shape
4. [API Reference](./nectarine-api.md) — exports that exist
5. [Examples](./nectarine-examples.md) — user + blog files, wired by hand
6. Adapters: [PostgreSQL](./nectarine-postgresql.md) · [MySQL](./nectarine-mysql.md) · [MongoDB](./nectarine-mongodb.md)
7. [Best practices](./nectarine-best-practices.md) — pitfalls that match this maturity
8. [Status](./nectarine-status.md) — shipped vs aspirational

## Status

**Early / Alpha** (`@citrusworx/nectarine` 0.1.0).

Shipped: YAML load, named query/route lookup, `PgSql`, `Mysql` + pool, Mongo helpers, example model trees.

Not shipped: SQL compiler, Express/Zod generation, `nectarine.config.yaml`, GraphQL, auth, GUI, connection-string helpers beyond env vars.

MySQL and Mongo adapters **exist** and are usable as shown above. They are not “Active product databases” in the sense of a finished query compiler + guide-complete stack. Postgres is the furthest along because of `pgz.example.ts` and the `select` / `from` / `where` DSL.

## Sibling packages

- [Seltzer](../seltzer/README.md) — HTTP you can point at Nectarine objects (you wire it)
- [Sig.js](../sigjs/README.md) — UI state; no Nectarine client
- [Grapevine](../grapevine/README.md) — provision a VM; does not start Nectarine
- [Juice](../juice/README.md) — styling only
