# Nectarine

YAML-described data models and thin database adapters.

Nectarine is the CitrusWorx place to write *what the data looks like* and *which query you meant*, then run that against PostgreSQL, MySQL, or MongoDB. There is no virtual schema engine, no one-command backend generator, and no SQL compiler in the package yet. You write YAML, parse it into objects, compile a statement in your app, and hand that statement to an adapter.

The current model is:

- **YAML files** describe tables, query intent, and (as data) HTTP routes
- **`parser`** loads those files and picks a named query or route object
- **You** (or a future compiler) turn that object into SQL or a Mongo operation
- **Adapters** open a client and execute the statement you assembled
- **`CCompiler.buildQuery` and `parser.buildSQL`** are stubs — they do not emit SQL

Nectarine is strongest when you treat YAML as the source of query *shape*, and the adapter as the socket. It is weakest when older docs promised Express + Zod routes from those files. That pipeline is not in `libraries/nectarine/src`.

## Who it is for

- App authors who want models and query names in git-friendly YAML
- Teams that already have (or will write) an HTTP layer — Seltzer, Express, or otherwise
- Contributors extending the compiler so `genSQL` objects become real statements

It is not a hosted BaaS, not Prisma, not Drizzle, and not a GUI. It does not ship GraphQL, auth, migrations, or a client SDK for Sig.js.

## Why it exists

Backend CRUD is repetitive, but the expensive part is not typing `SELECT`. It is keeping the *contract* — columns, filters, route names — from drifting across SQL strings, handlers, and clients.

CitrusWorx wants that contract in config:

- Juice / Sig.js should not invent table shapes
- Seltzer should eventually validate against the same contract
- Operators should be able to read a resource as three files, not a scavenger hunt through repositories

Nectarine is that contract folder. The adapters exist so the same repo can talk to Postgres, MySQL, or Mongo without a second ORM. The compiler is the unfinished piece that would turn query YAML into SQL so app code stops concatenating strings.

The design bets:

- **Config first** — tables and named queries live in YAML, next to the app, in git
- **Adapters stay thin** — `PgSql`, `Mysql`, and `Mngz` are sockets, not query planners
- **Compile is a separate job** — `genSQL` returns intent; a compiler (yours, today) emits SQL
- **HTTP is a sibling** — `*API.yml` stores `{ method, endpoint }`; Seltzer registers handlers
- **Small API** — `parser`, `CCompiler`, three adapters, a handful of MySQL/Mongo helpers

That split is healthier than stuffing table shapes into handlers, or stuffing a full ORM into a package that is still finishing its compiler. Until that compiler lands, the honest workflow is: **parse YAML → walk the object → build a string in your app → run it on an adapter**.

If you have already built a listener with the [Seltzer getting started](../seltzer/seltzer-getting-started.md), Nectarine is the next layer: the same `method` + `path`, plus the catalog those handlers should actually query. The [tutorial](./nectarine-tutorial.md) builds that catalog end to end.

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

There is no `generateRoutes()`, no `Pgsql()` function, and no `nectarine.config.yaml` loader. `PgSql` is a **class**. `parser.genSQL` returns an **object**.

Peer-ish drivers the adapters import: `pg`, `mysql2`, `mongodb`, `js-yaml`. Install the one you call. `mysql2` is used from source but is not declared on the published package — add it in the app if you use MySQL.

## What it can do

The sections below are the capability showcase. Every snippet matches `libraries/nectarine/src`. If a pattern is not here, it is probably not in the library — check [Status](./nectarine-status.md) before assuming a Prisma-shaped API.

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

`parser.yaml` is a `js-yaml` + `readFileSync` wrapper. It logs the object to the console. It does not validate fields, emit DDL, or talk to a database. That is the whole trick: the contract is data, and anything that becomes `CREATE TABLE` is a loop you write.

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

`parser.genSQL` returns that object. `parser.buildSQL(spec)` is empty. The [tutorial](./nectarine-tutorial.md) compiles this shape into `SELECT … WHERE id = $1` in app code.

### 3. Compile a SELECT you can actually run

The package does not map `eq` → `=`. The exported `optokens` type documents the tokens; a function you own is the runtime.

```ts
const OPS: Record<string, string> = {
  eq: "=",
  gt: ">",
  lt: "<",
  lte: "<=",
  gte: ">=",
  neq: "!=",
};

function buildSelect(spec: {
  select?: string | string[];
  from?: string;
  where?: { column: string; operator: string; value: string };
}): string {
  const fields = Array.isArray(spec.select)
    ? spec.select.join(", ")
    : spec.select ?? "*";
  const table = spec.from;
  const where = spec.where
    ? ` WHERE ${spec.where.column} ${OPS[spec.where.operator]} ${spec.where.value}`
    : "";
  return `SELECT ${fields} FROM ${table}${where}`;
}

const sql = buildSelect(spec);
// SELECT id FROM users WHERE id = $1
```

Build statements from YAML **keys**. Keep request values in `params`. That split is the reason the DSL exists.

### 4. Run SQL on PostgreSQL

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

`PgSql` is a class. Credentials come from `PG_USER`, `PG_PASS`, `PG_HOST`, `PG_PORT`. `addDb(name)` registers the database name used in `connect(name)`. `query` swallows errors and returns `undefined` — check the return. There is no pool and no transactions API.

### 5. Emit CREATE TABLE from schema objects

There is no migrator. Walk `fields`. Object values need a real column builder; string values are fragments.

```ts
function columnSql(name: string, definition: unknown): string {
  if (typeof definition === "string") return `${name} ${definition}`;
  const field = definition as { type: string; size?: number; length?: number; primaryKey?: boolean };
  const width = field.length ?? field.size;
  const type = width ? `${field.type}(${width})` : field.type;
  return field.primaryKey ? `${name} ${type} PRIMARY KEY` : `${name} ${type}`;
}
```

Identity syntax is engine-specific. Postgres wants `GENERATED BY DEFAULT AS IDENTITY`; MySQL wants `AUTO_INCREMENT`. Nectarine will not pick it. Details in the [Schema Guide](./nectarine-schema-guide.md).

### 6. Run SQL on MySQL

MySQL is a **thin `mysql2` pool**, not a second compiler.

```ts
import { Mysql, closeSql } from "@citrusworx/nectarine";

const rows = await Mysql(
  "SELECT email FROM users WHERE email = ?",
  ["dev@citrusworx.com"],
);

await closeSql();
```

Env vars are `MS_HOST`, `MS_USER`, `MS_PASS`, `MS_DB`, `MS_PORT` — not `MYSQL_*`. The pool is created at import time. `closeSql()` ends it for the process — do not call it per request.

Query YAML under `models/user/db/msql/user.yml` uses `?` placeholders and a `type` / `action` / `updates` shape. `mapInsert` / `mapGetter` only join value lists; they do not build full statements.

### 7. Talk to MongoDB

```ts
import { Mngz, insertOne } from "@citrusworx/nectarine";

await Mngz(async (client) => {
  await insertOne(client, "users", {
    email: "dev@citrusworx.com",
    name: "Demo",
  });
});
```

URI is built from `MG_USER`, `MG_PASS`, `MG_HOST`, `MG_PORT`, `MG_DB`. Helpers: `connectMngz`, `closeMngz`, `createCollection`, `insertOne`, `insertMany`. There is no query DSL compiler for Mongo, and no `find` helper.

`insertOne` / `insertMany` / `createCollection` close the shared client when they finish — treat them as short scripts, not as a long-lived pool. For a server, connect once and call `collection.find` yourself.

### 8. Read an API YAML (as data)

```yaml
# flattened — matches registerRoute lookup
get:
  allUsers:
    api:
      method: GET
      endpoint: /users
```

```ts
const route = parser.registerRoute("./models/user/api.yml", "get", "allUsers");
// { api: { method: "GET", endpoint: "/users" } }
```

`registerRoute` requires the path to contain `api.yml` or end with `api.yaml`. It looks up `doc[method][route]`. It does **not** mount Express or Seltzer handlers, and it does not understand a `user.get.allUsers` resource prefix. The checked-in `userAPI.yml` is nested — walk it with `parser.yaml`.

### 9. Wire those objects to Seltzer by hand

```ts
import { parser } from "@citrusworx/nectarine";
import { Seltzer } from "@citrusworx/seltzer";

const api = parser.yaml("./models/user/api.yml");
const app = Seltzer.init();

app.route({
  method: api.get.allUsers.api.method,
  path: api.get.allUsers.api.endpoint,
  handler: (ctx) => ctx.json({ users: [] }),
});

app.listen(3000);
```

Seltzer matches exact paths. Put `PgSql.query` inside the handler when the catalog should return rows — the [tutorial](./nectarine-tutorial.md) does that for `/users` and `/user-by-id`.

## Mental model

```text
*.yml  --parser.yaml / genSQL / registerRoute-->  plain objects
                                                  |
                         you (or a future compiler) build a statement
                                                  |
                     PgSql.query | Mysql | Mngz / insertOne
```

| You want… | Use |
|---|---|
| The whole YAML tree | `parser.yaml(path)` |
| One named query object | `parser.genSQL(path, resource, crud, name)` |
| One named API object (flat file) | `parser.registerRoute(path, method, name)` |
| A SQL string from a PG `select` node | App builder (tutorial / getting started) |
| To run SQL on Postgres | `new PgSql()` → `addDb` → `connect` → `query` |
| To run SQL on MySQL | `Mysql(sql, values)` |
| To insert a Mongo document | `insertOne` (script) or `Mngz` + driver (server) |
| HTTP | Seltzer (or Express) — copy `method` / `endpoint` |
| Compiled SQL from the package | **Not shipped** — `buildSQL` / `buildQuery` are empty |

Three file roles, when you follow the in-repo layout:

| File | Role today |
|---|---|
| `*Schema.yml` | Table / field documentation and CREATE TABLE input for *your* builder |
| `db/pg/*.yml` or `db/msql/*.yml` | Named query objects (`genSQL`) |
| `*API.yml` | Named `{ method, endpoint }` objects |

The blog and user trees under `libraries/nectarine/models/` are fixtures, not a published schema pack.

## Suggested reading order

1. [Getting Started](./nectarine-getting-started.md) — env, parse, first adapter call
2. [Tutorial](./nectarine-tutorial.md) — guided catalog: schema → queries → hand-built SQL → PgSql → Seltzer
3. [Schema Guide](./nectarine-schema-guide.md) — model YAML mental model, field styles, what the library ignores
4. [Query DSL](./nectarine-query-dsl.md) — Postgres intent shape, operators, placeholders
5. [Compiler](./nectarine-compiler.md) — empty methods, nesting mismatch, `optokens`
6. Adapters: [PostgreSQL](./nectarine-postgresql.md) · [MySQL](./nectarine-mysql.md) · [MongoDB](./nectarine-mongodb.md)
7. [Patterns](./nectarine-patterns.md) — truthful cookbook for named queries, builders, HTTP
8. [Best Practices](./nectarine-best-practices.md) — how to compose Nectarine so YAML stays data
9. [Anti-Patterns](./nectarine-anti-patterns.md) — Prisma habits, env names, helper footguns
10. [Examples](./nectarine-examples.md) — user + blog files, wired by hand
11. [Seltzer + WebEngine](./nectarine-integration.md) — what you wire vs what does not load
12. [API Reference](./nectarine-api.md) — exports that exist
13. [Troubleshooting](./nectarine-troubleshooting.md) — undefined rows, bad env, `registerRoute`
14. [Status](./nectarine-status.md) — Early / Alpha maturity matrix
15. [Roadmap](./nectarine-roadmap.md) — what would move Nectarine upward, and what would not

## Status

**Early / Alpha** (`@citrusworx/nectarine` 0.1.0).

Shipped: YAML load, named query/route lookup, `PgSql`, `Mysql` + pool, Mongo helpers, example model trees.

Not shipped: SQL compiler, Express/Zod generation, `nectarine.config.yaml`, GraphQL, auth, GUI, connection-string helpers beyond env vars, published User/Blog/CMS packs.

MySQL and Mongo adapters **exist** and are usable as shown above. They are not a finished query compiler + guide-complete stack. Postgres is the furthest along because of the `select` / `from` / `where` DSL and the in-repo example builder idea — even though that example file targets a different node shape than the PG fixtures.

Alpha here means the contract folder and sockets are real and documented, not that the API is frozen, and **not** that YAML compiles to SQL. See [Status](./nectarine-status.md) for the area-by-area matrix and [Roadmap](./nectarine-roadmap.md) for what is worth building next.

## Sibling packages

- [Seltzer](../seltzer/README.md) — HTTP you can point at Nectarine objects (you wire it)
- [Sig.js](../sigjs/README.md) — UI state; no Nectarine client
- [Grapevine](../grapevine/README.md) — provision a VM; does not start Nectarine
- [Juice](../juice/README.md) — styling only
