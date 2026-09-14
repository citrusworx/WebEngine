# Nectarine Tutorial — Building a User Catalog

This tutorial walks through building a small data service with Nectarine the way the library works today.

The goal is to show how Nectarine should be composed in a real app:

- YAML owns table shape, named query intent, and HTTP *names*
- `parser` loads those files and returns **objects**, not SQL and not a server
- **you** compile a statement from the object (or write SQL that matches it)
- an adapter opens a client and runs that statement
- Seltzer (or any HTTP layer) owns the listener — you copy `method` + `path`

If you have already read [Getting Started](./nectarine-getting-started.md), this is the same workflow stretched into one catalog you can run.

## What we are building

A **user catalog**: a small Postgres-backed service with

1. a schema file for a `users` table
2. a query file in the Postgres DSL (`select` / `from` / `where` / `insert`)
3. parse + inspect — prove `genSQL` returns an object
4. a hand-built `CREATE TABLE` from the schema
5. a hand-built `INSERT` and `SELECT` from named query nodes
6. those statements run on `PgSql`
7. an API file walked by hand into Seltzer routes that actually query

By the end you will have used every public primitive that is worth teaching: `parser.yaml`, `parser.genSQL`, a small compile step you own, `PgSql`, and a Seltzer listener. You will **not** have called `parser.buildSQL` or `CCompiler.buildQuery` and gotten SQL — those methods are empty.

## Setup

```bash
yarn add @citrusworx/nectarine @citrusworx/seltzer pg
```

```bash
export PG_USER=postgres
export PG_HOST=localhost
export PG_PASS=secret
export PG_DB=catalog
export PG_PORT=5432
```

`PgSql` reads `PG_USER`, `PG_PASS`, `PG_HOST`, `PG_PORT`. The database name is **not** read from `PG_DB` inside the class — you pass it to `addDb` / `connect`. Using `PG_DB` in the environment is a convention so one value feeds both.

A reachable Postgres is required. Nectarine does not install or migrate it.

```bash
# example — not required by the library
docker run --name nectarine-catalog \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=catalog \
  -p 5432:5432 -d postgres:16
```

Put the YAML next to the app, not inside `node_modules`. Copying `libraries/nectarine/models/` is fine as a reference; this tutorial writes a smaller, consistent set so `parser.genSQL` can address every node.

## Step 1: Describe the table in YAML

Start with structure only. Nothing talks to the database yet.

```yaml
# models/user/schema.yml
User:
  table: users
  fields:
    id:
      type: int
      primaryKey: true
      autoIncrement: true
    email:
      type: VARCHAR
      size: 100
      unique: true
      null: false
    name:
      type: VARCHAR
      length: 80
      null: false
    created_at:
      type: timestamp
      null: false
```

```ts
import { parser } from "@citrusworx/nectarine";

const schema = parser.yaml("./models/user/schema.yml");
console.log(schema.User.table); // "users"
console.log(Object.keys(schema.User.fields)); // ["id", "email", "name", "created_at"]
```

Why this works:

- `parser.yaml` is `readFileSync` + `js-yaml.load`. It returns the object and `console.log`s it.
- Nectarine does not validate `type`, `primaryKey`, or `null`. Those keys are **your** CREATE TABLE input.
- There is no migrator and no `relationships:` consumer. Foreign keys, if you add them later, are field metadata you interpret.

Best-practice notes:

- Prefer **one field style per file**. Object fields (`type`, `size`, `null`) are easier to walk than mixed SQL fragments.
- The in-repo `userSchema.yml` mixes objects with strings such as `timestamp DEAFULT NOW()` (typo included). Do not copy that mix into a new app unless your builder handles both.
- `parser.yaml` always logs. That is noisy in a server; expect it until the parser grows a quiet mode.

This is the pattern to reach for whenever the thing you want in git is **the contract for a table**, not a running schema.

## Step 2: Name the queries you mean

Query YAML is intent, not a statement. Use the Postgres layout that `parser.genSQL` can address: `resource → crud → QueryName`.

```yaml
# models/user/queries.yml
user:
  get:
    AllUsers:
      select: ["id", "email", "name", "created_at"]
      from: users

    UserById:
      select: ["id", "email", "name", "created_at"]
      from: users
      where:
        column: id
        operator: eq
        value: $1

  create:
    NewUser:
      insert:
        into: users
        columns: ["email", "name"]
        values: [$1, $2]
```

```ts
import { parser } from "@citrusworx/nectarine";

const byId = parser.genSQL("./models/user/queries.yml", "user", "get", "UserById");
console.log(byId);
// {
//   select: ["id", "email", "name", "created_at"],
//   from: "users",
//   where: { column: "id", operator: "eq", value: "$1" }
// }
```

Why this works:

- `genSQL(path, type, method, config)` returns `doc[type][method][config]`.
- That is a **plain object**. It is not SQL. `parser.buildSQL(byId)` is an empty function and returns `undefined`.
- Placeholders stay in the YAML (`$1`). Runtime values stay in a `params` array you pass to `PgSql.query`.

Best-practice notes:

- `select` / `from` / `where` is the Postgres-oriented DSL. MySQL fixtures use `type` / `action` / `updates` instead — do not mix the two in one file.
- `operator: eq` is a token. Nothing in the package maps it to `=` yet. Your builder will.
- Blog fixture `models/blog/post/sql.yml` uses a top-level `queries:` map. `genSQL` cannot address that shape. Stay on `user.get.UserById`.

When you need a statement, compile the object. That is the next step.

## Step 3: Compile SELECT yourself

The honest compiler is a function in your app. Map identifiers from YAML; keep values in params.

```ts
import { parser } from "@citrusworx/nectarine";

const OPS: Record<string, string> = {
  eq: "=",
  neq: "!=",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
};

type Where = { column: string; operator: string; value: string };

type SelectSpec = {
  select?: string | string[];
  from?: string;
  where?: Where;
};

function quoteIdent(name: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Refusing to compile identifier: ${name}`);
  }
  return name;
}

function buildSelect(spec: SelectSpec): string {
  const fields = Array.isArray(spec.select)
    ? spec.select.map(quoteIdent).join(", ")
    : spec.select === "*"
      ? "*"
      : quoteIdent(spec.select ?? "*");
  const table = quoteIdent(spec.from ?? "");
  if (!table) throw new Error("select spec missing from");

  if (!spec.where) {
    return `SELECT ${fields} FROM ${table}`;
  }

  const op = OPS[spec.where.operator];
  if (!op) throw new Error(`Unknown operator: ${spec.where.operator}`);

  return `SELECT ${fields} FROM ${table} WHERE ${quoteIdent(spec.where.column)} ${op} ${spec.where.value}`;
}

const spec = parser.genSQL("./models/user/queries.yml", "user", "get", "UserById");
const sql = buildSelect(spec);
console.log(sql);
// SELECT id, email, name, created_at FROM users WHERE id = $1
```

Why this works:

- Table and column names come from YAML **keys you authored**. They are not request input.
- `spec.where.value` is the token `$1`, copied into the string. The number `1` never enters this function.
- The operator allow-list is the same set as the exported `optokens` **type**. The type is documentation; this function is the runtime.

This is the pattern to reach for whenever you want “generated SQL” today. Copy it. Do not wait on `CCompiler.buildQuery`.

## Step 4: Compile CREATE TABLE from the schema

There is no migrator. Walk `fields` and emit DDL your engine understands.

```ts
import { parser } from "@citrusworx/nectarine";

type Field = {
  type: string;
  length?: number;
  size?: number;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  unique?: boolean;
  null?: boolean;
};

function columnSql(name: string, definition: unknown): string {
  if (typeof definition === "string") {
    return `${name} ${definition}`;
  }
  const field = definition as Field;
  const width = field.length ?? field.size;
  const type = width ? `${field.type}(${width})` : field.type;
  const parts = [name, type];
  if (field.primaryKey) parts.push("PRIMARY KEY");
  if (field.autoIncrement) parts.push("GENERATED BY DEFAULT AS IDENTITY");
  if (field.unique) parts.push("UNIQUE");
  if (field.null === false) parts.push("NOT NULL");
  return parts.join(" ");
}

function buildCreateTable(modelName: string, filepath: string): string {
  const schema = parser.yaml(filepath);
  const model = schema[modelName];
  const columns = Object.entries(model.fields)
    .map(([column, definition]) => columnSql(column, definition))
    .join(", ");
  return `CREATE TABLE IF NOT EXISTS ${model.table} (${columns});`;
}

const ddl = buildCreateTable("User", "./models/user/schema.yml");
console.log(ddl);
```

Why this works:

- Object fields become `email VARCHAR(100) UNIQUE NOT NULL`.
- `GENERATED BY DEFAULT AS IDENTITY` is **Postgres**. MySQL would want `AUTO_INCREMENT`. Nectarine will not pick it for you.
- A builder that does `` `${column} ${definition}` `` stringifies objects to `[object Object]`. Handle both kinds, or do not mix them.

`pgz.example.ts` has a `buildCreateTableSQL` that joins `definition` as a string. That is the reference idea, not a package export, and it only works for string-valued fields.

## Step 5: Compile INSERT from the create node

`NewUser` in the query file uses `insert.into` / `columns` / `values` — not the MySQL `type` / `action` / `updates` shape.

```ts
function buildInsert(spec: {
  insert: { into: string; columns: string[]; values: unknown[] };
}): string {
  const columns = spec.insert.columns.map(quoteIdent).join(", ");
  const values = spec.insert.values
    .map((value) => {
      if (value && typeof value === "object" && "fn" in (value as object)) {
        const fn = String((value as { fn: string }).fn).toLowerCase();
        if (fn === "now") return "NOW()";
        throw new Error(`Unknown fn: ${fn}`);
      }
      return String(value);
    })
    .join(", ");
  return `INSERT INTO ${quoteIdent(spec.insert.into)} (${columns}) VALUES (${values}) RETURNING id, email, name, created_at`;
}

const newUser = parser.genSQL("./models/user/queries.yml", "user", "create", "NewUser");
console.log(buildInsert(newUser));
// INSERT INTO users (email, name) VALUES ($1, $2) RETURNING id, email, name, created_at
```

In-repo Postgres fixtures sometimes write `{ fn: now }` instead of `NOW()`. Until a compiler exists, both are YAML. Your builder decides what `{ fn: now }` becomes.

Do not pass passwords as example values in a real app. Hash in the handler; the YAML only names the column.

## Step 6: Run the statements on PgSql

Adapters execute strings. They do not read YAML.

```ts
import { parser, PgSql } from "@citrusworx/nectarine";

async function withPg<T>(fn: (pg: PgSql, client: import("pg").Client) => Promise<T>): Promise<T> {
  const db = process.env.PG_DB;
  if (!db) throw new Error("Set PG_DB");

  const pg = new PgSql();
  pg.addDb(db);
  const client = await pg.connect(db);
  if (!client) {
    throw new Error("connect() returned undefined — check PG_* and addDb");
  }

  try {
    return await fn(pg, client);
  } finally {
    await pg.disconnect(client);
  }
}

async function setupCatalog() {
  const ddl = buildCreateTable("User", "./models/user/schema.yml");
  const insertSpec = parser.genSQL("./models/user/queries.yml", "user", "create", "NewUser");
  const insertSql = buildInsert(insertSpec);

  await withPg(async (pg, client) => {
    const created = await pg.query(client, { sql: ddl });
    if (!created) throw new Error("CREATE TABLE failed — see stderr");

    const inserted = await pg.query(client, {
      sql: insertSql,
      params: ["ops@citrusworx.com", "Operator"],
    });
    if (!inserted) throw new Error("INSERT failed — see stderr");
    console.log(inserted.rows);
  });
}

void setupCatalog();
```

Why this works:

- `addDb("catalog")` stores `catalog → catalog`. `connect("catalog")` uses that as `database` on `pg.Client`.
- Credentials come from `PG_USER` / `PG_PASS` / `PG_HOST` / `PG_PORT` captured when the class is constructed.
- `query` **logs errors and returns `undefined`**. Check the return. Do not assume `rows`.
- `disconnect` in `finally` matches a single `Client` per unit of work. There is no pool in this adapter.

`addTable("users")` is stored and never read. Registering a table does not create it. The DDL in this step does.

## Step 7: Name HTTP routes in YAML (as data)

API files are more named objects. They do not mount anything.

```yaml
# models/user/api.yml
get:
  allUsers:
    api:
      method: GET
      endpoint: /users
  userById:
    api:
      method: GET
      endpoint: /user-by-id
create:
  newUser:
    api:
      method: POST
      endpoint: /users
```

This file is **flattened** on purpose. `parser.registerRoute(path, method, route)` looks up `doc[method][route]` — not `doc.user.get.allUsers`.

```ts
import { parser } from "@citrusworx/nectarine";

const allUsers = parser.registerRoute("./models/user/api.yml", "get", "allUsers");
console.log(allUsers.api.method, allUsers.api.endpoint);
// GET /users
```

The checked-in `libraries/nectarine/models/user/userAPI.yml` nests under `user:` and `post:`. For that file, `registerRoute(..., "get", "allUsers")` throws. Walk it with `parser.yaml` instead — see [Patterns](./nectarine-patterns.md) and [Anti-patterns](./nectarine-anti-patterns.md).

Seltzer matches **exact paths**. A Nectarine fixture that says `/users/:id` will not match `/users/1` on Seltzer today. This tutorial uses `/user-by-id?id=1` so the HTTP layer is as honest as the SQL layer.

## Step 8: Wire Seltzer handlers that query

Nectarine objects describe `method` + `endpoint`. Seltzer registers `method` + `path` + `handler`. You copy the fields and put adapter code in the handler.

```ts
import { parser, PgSql } from "@citrusworx/nectarine";
import { Seltzer } from "@citrusworx/seltzer";

const api = parser.yaml("./models/user/api.yml");

const app = Seltzer.init();

app.route({
  method: api.get.allUsers.api.method,
  path: api.get.allUsers.api.endpoint,
  handler: async (ctx) => {
    const spec = parser.genSQL("./models/user/queries.yml", "user", "get", "AllUsers");
    const sql = buildSelect(spec);
    await withPg(async (pg, client) => {
      const result = await pg.query(client, { sql });
      if (!result) {
        ctx.json({ error: "query failed" }, 500);
        return;
      }
      ctx.json({ users: result.rows });
    });
  },
});

app.route({
  method: api.get.userById.api.method,
  path: api.get.userById.api.endpoint,
  handler: async (ctx) => {
    const url = new URL(ctx.req.url || "/", `http://${ctx.req.headers.host}`);
    const id = Number(url.searchParams.get("id"));
    if (!Number.isFinite(id)) {
      ctx.json({ error: "id required" }, 400);
      return;
    }

    const spec = parser.genSQL("./models/user/queries.yml", "user", "get", "UserById");
    const sql = buildSelect(spec);
    await withPg(async (pg, client) => {
      const result = await pg.query(client, { sql, params: [id] });
      if (!result) {
        ctx.json({ error: "query failed" }, 500);
        return;
      }
      ctx.json({ user: result.rows[0] ?? null });
    });
  },
});

app.listen(3000);
```

Why this works:

- The path strings come from YAML. The SQL strings come from the query compiler you wrote in steps 3–5. The listener is Seltzer.
- Seltzer has no `ctx.params` and no `/users/:id` matcher. Query strings are read from `ctx.req.url`.
- Opening a `PgSql` client per request is the honest lifecycle for this adapter. It is not a pool. For production traffic you would use `pg.Pool` in the app — that is not a Nectarine export.

`curl http://127.0.0.1:3000/users` and `curl 'http://127.0.0.1:3000/user-by-id?id=1'` are the catalog.

## Full example

One file, assuming the three YAML files from the steps exist. Helpers from steps 3–6 sit above `main`.

```ts
import { parser, PgSql } from "@citrusworx/nectarine";
import { Seltzer } from "@citrusworx/seltzer";
import type { Client } from "pg";

const SCHEMA = "./models/user/schema.yml";
const QUERIES = "./models/user/queries.yml";
const API = "./models/user/api.yml";

const OPS: Record<string, string> = {
  eq: "=",
  neq: "!=",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
};

function quoteIdent(name: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Refusing to compile identifier: ${name}`);
  }
  return name;
}

function buildSelect(spec: {
  select?: string | string[];
  from?: string;
  where?: { column: string; operator: string; value: string };
}): string {
  const raw = spec.select ?? "*";
  const fields = Array.isArray(raw)
    ? raw.map(quoteIdent).join(", ")
    : raw === "*"
      ? "*"
      : quoteIdent(raw);
  const table = quoteIdent(spec.from ?? "");
  if (!spec.where) return `SELECT ${fields} FROM ${table}`;
  const op = OPS[spec.where.operator];
  if (!op) throw new Error(`Unknown operator: ${spec.where.operator}`);
  return `SELECT ${fields} FROM ${table} WHERE ${quoteIdent(spec.where.column)} ${op} ${spec.where.value}`;
}

function columnSql(name: string, definition: unknown): string {
  if (typeof definition === "string") return `${name} ${definition}`;
  const field = definition as {
    type: string;
    length?: number;
    size?: number;
    primaryKey?: boolean;
    autoIncrement?: boolean;
    unique?: boolean;
    null?: boolean;
  };
  const width = field.length ?? field.size;
  const type = width ? `${field.type}(${width})` : field.type;
  const parts = [name, type];
  if (field.primaryKey) parts.push("PRIMARY KEY");
  if (field.autoIncrement) parts.push("GENERATED BY DEFAULT AS IDENTITY");
  if (field.unique) parts.push("UNIQUE");
  if (field.null === false) parts.push("NOT NULL");
  return parts.join(" ");
}

async function withPg<T>(fn: (pg: PgSql, client: Client) => Promise<T>): Promise<T> {
  const db = process.env.PG_DB!;
  const pg = new PgSql();
  pg.addDb(db);
  const client = await pg.connect(db);
  if (!client) throw new Error("No Postgres client");
  try {
    return await fn(pg, client);
  } finally {
    await pg.disconnect(client);
  }
}

async function main() {
  const schema = parser.yaml(SCHEMA);
  const columns = Object.entries(schema.User.fields)
    .map(([column, definition]) => columnSql(column, definition))
    .join(", ");
  const ddl = `CREATE TABLE IF NOT EXISTS ${schema.User.table} (${columns});`;

  await withPg(async (pg, client) => {
    const created = await pg.query(client, { sql: ddl });
    if (!created) throw new Error("CREATE TABLE failed");
  });

  const api = parser.yaml(API);
  const app = Seltzer.init();

  app.route({
    method: api.get.allUsers.api.method,
    path: api.get.allUsers.api.endpoint,
    handler: async (ctx) => {
      const spec = parser.genSQL(QUERIES, "user", "get", "AllUsers");
      const sql = buildSelect(spec);
      await withPg(async (pg, client) => {
        const result = await pg.query(client, { sql });
        if (!result) return ctx.json({ error: "query failed" }, 500);
        ctx.json({ users: result.rows });
      });
    },
  });

  app.route({
    method: api.get.userById.api.method,
    path: api.get.userById.api.endpoint,
    handler: async (ctx) => {
      const url = new URL(ctx.req.url || "/", `http://${ctx.req.headers.host}`);
      const id = Number(url.searchParams.get("id"));
      if (!Number.isFinite(id)) return ctx.json({ error: "id required" }, 400);
      const spec = parser.genSQL(QUERIES, "user", "get", "UserById");
      const sql = buildSelect(spec);
      await withPg(async (pg, client) => {
        const result = await pg.query(client, { sql, params: [id] });
        if (!result) return ctx.json({ error: "query failed" }, 500);
        ctx.json({ user: result.rows[0] ?? null });
      });
    },
  });

  app.listen(3000);
}

void main();
```

## What to notice

- The schema file never becomes a table until **your** DDL runs.
- `genSQL` never becomes a statement until **your** builder runs.
- `PgSql.query` never throws to you; it returns `undefined` on failure.
- Seltzer never sees Nectarine. It sees strings you copied.
- Function names in this tutorial (`buildSelect`, `withPg`) are **app code**. They are not package exports.

## What this tutorial does not pretend

- **`parser.buildSQL` and `CCompiler.buildQuery` emit SQL.** They do not. Calling them and passing the result to `client.query` fails quietly.
- **`generateRoutes(schema, queries, api)`.** That function does not exist.
- **Express + Zod from YAML.** Not in `libraries/nectarine/src`.
- **`nectarine.config.yaml`.** Design only.
- **Parametric HTTP (`/users/:id`) via Seltzer.** Exact path only; read query strings yourself.
- **MySQL and Mongo in the same compile pipeline.** Those adapters are usable; they do not share this DSL. See [MySQL](./nectarine-mysql.md) and [MongoDB](./nectarine-mongodb.md) after this catalog works.
- **`pgz.example.ts` as a drop-in compiler for this YAML.** Its `buildSelectSQL` expects `type` / `fields` / `table` / `conditions` (MySQL-shaped). The Postgres `user.yml` nodes use `select` / `from` / `where`. The getting-started / tutorial builder is the one that matches.
- **Published User / Blog / CMS packs.** `libraries/nectarine/models/` are fixtures.
- **WebEngine loading Nectarine because `modules` lists it.** Orchestration vocabulary, not an import.

## Next steps

- [Schema Guide](./nectarine-schema-guide.md) — field styles, blog layouts, what the library ignores
- [Query DSL](./nectarine-query-dsl.md) — full Postgres intent shape, operators, `{ fn: now }`
- [Compiler](./nectarine-compiler.md) — empty methods, nesting mismatch, `optokens`
- [PostgreSQL](./nectarine-postgresql.md) — client lifecycle, swallowed errors, pooling
- [Patterns](./nectarine-patterns.md) — copyable compositions from this tutorial
- [Seltzer + WebEngine](./nectarine-integration.md) — what you wire vs what does not exist
- [Anti-patterns](./nectarine-anti-patterns.md) — Prisma habits, env names, helper footguns
