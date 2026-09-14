# Getting Started With Nectarine

Use Nectarine the way the library works today: load YAML, take a named object, compile a statement in your app, run it on an adapter.

The [tutorial](./nectarine-tutorial.md) stretches this into a user catalog with Seltzer. This page is the shortest path to a first query.

## Install

```bash
yarn add @citrusworx/nectarine
```

Peer-ish runtime libraries the adapters import: `pg`, `mysql2`, `mongodb`, `js-yaml`. They are listed in the package’s own `devDependencies` today (`mysql2` is used from source but not declared — install it if you call `Mysql`). If you consume Nectarine from an app, install the driver you actually call.

```bash
yarn add pg        # PostgreSQL
# or
yarn add mysql2    # MySQL
# or
yarn add mongodb   # MongoDB
```

## Pick one database and set env vars

Names are what the source reads. Older docs used `MYSQL_*` / `MONGO_URI`; those are ignored.

**PostgreSQL** (`libraries/nectarine/src/adapters/pg/pgz.ts`):

```bash
export PG_USER=postgres
export PG_HOST=localhost
export PG_PASS=secret
export PG_DB=myapp
export PG_PORT=5432
```

**MySQL** (`adapters/ms/msqlz.ts`):

```bash
export MS_USER=root
export MS_HOST=localhost
export MS_PASS=secret
export MS_DB=myapp
export MS_PORT=3306
```

**MongoDB** (`adapters/mg/mgz.ts`):

```bash
export MG_USER=root
export MG_HOST=localhost
export MG_PASS=secret
export MG_DB=myapp
export MG_PORT=27017
```

Mongo URI is `mongodb://$MG_USER:$MG_PASS@$MG_HOST:$MG_PORT/$MG_DB?authSource=admin`. Set env **before** the process imports MySQL or Mongo — those clients are created at module load.

## Mental model

You are not calling `generateRoutes(schema, queries, api)`. That function does not exist.

```text
parser.yaml(path)                     → whole file
parser.genSQL(path, type, method, id) → one query object
parser.registerRoute(path, method, id)→ one API object
your builder                          → SQL string
PgSql | Mysql | Mngz                  → execute that string / document
```

| You want… | Use |
|---|---|
| First Postgres SELECT from YAML | This page, then the [tutorial](./nectarine-tutorial.md) |
| CREATE TABLE from schema objects | [Schema Guide](./nectarine-schema-guide.md) |
| Why `buildSQL` is not in this list | [Compiler](./nectarine-compiler.md) |

## First Postgres query from YAML

Use the checked-in user query file as a template (copy it into your app):

```yaml
# queries/user.yml
user:
  get:
    UserById:
      select: ['id', 'email']
      from: users
      where:
        column: id
        operator: eq
        value: $1
```

`parser.genSQL` only retrieves that object. A minimal builder — the same idea as the tutorial, **not** `pgz.example.ts` `buildSelectSQL` — looks like this:

```ts
import { parser, PgSql } from "@citrusworx/nectarine";

type QuerySpec = {
  select?: string | string[];
  from?: string;
  where?: { column: string; operator: string; value: string };
};

const OPS: Record<string, string> = {
  eq: "=",
  gt: ">",
  lt: "<",
  lte: "<=",
  gte: ">=",
  neq: "!=",
};

function buildSelect(spec: QuerySpec): string {
  const fields = Array.isArray(spec.select)
    ? spec.select.join(", ")
    : spec.select ?? "*";
  const table = spec.from;
  const where = spec.where;
  const op = where ? OPS[where.operator] ?? where.operator : "";
  const clause = where
    ? ` WHERE ${where.column} ${op} ${where.value}`
    : "";
  return `SELECT ${fields} FROM ${table}${clause}`;
}

async function main() {
  const spec = parser.genSQL("./queries/user.yml", "user", "get", "UserById");
  const sql = buildSelect(spec);

  const pg = new PgSql();
  pg.addDb(process.env.PG_DB!);
  const client = await pg.connect(process.env.PG_DB!);
  if (!client) throw new Error("No Postgres client");

  try {
    const result = await pg.query(client, { sql, params: [1] });
    if (!result) throw new Error("query failed — see stderr");
    console.log(result.rows);
  } finally {
    await pg.disconnect(client);
  }
}

void main();
```

That is the current “generated query” story: **YAML names the parts; you compile**. Prefer throwing on unknown `OPS[operator]` (the tutorial does) once you are past the first paste.

`pgz.example.ts` walks a **different** object shape (`type` / `fields` / `table`). Copying those helpers onto `db/pg/user.yml` produces `undefined * FROM undefined`. Details in [PostgreSQL](./nectarine-postgresql.md).

## First MySQL query

```ts
import { Mysql, closeSql } from "@citrusworx/nectarine";

const rows = await Mysql<{ email: string }>(
  "SELECT email FROM users WHERE id = ?",
  [1],
);

console.log(rows);
await closeSql();
```

See [MySQL](./nectarine-mysql.md) for the `?` YAML flavor and `mapInsert`. Do not close the pool per request in a server.

## First Mongo insert

```ts
import { Mngz, insertOne } from "@citrusworx/nectarine";

await Mngz(async (client) => {
  // insertOne closes the shared client when it returns
  await insertOne(client, "users", { email: "dev@citrusworx.com" });
});
```

See [MongoDB](./nectarine-mongodb.md) before using this in a long-running process — the helpers disconnect aggressively.

## Reading an API file (optional)

Flattened file (`doc.get.allUsers`):

```ts
import { parser } from "@citrusworx/nectarine";

const allUsers = parser.registerRoute(
  "./models/user/api.yml",
  "get",
  "allUsers",
);

console.log(allUsers.api.method, allUsers.api.endpoint);
```

Nested fixture (`libraries/nectarine/models/user/userAPI.yml`) needs a walk:

```ts
const api = parser.yaml("./models/user/userAPI.yml");
const allUsers = api.user.get.allUsers;
```

Wire that to Seltzer yourself. Seltzer matches **exact** paths — `/users/:id` will not match `/users/1`.

```ts
import { Seltzer } from "@citrusworx/seltzer";

const app = Seltzer.init();
app.route({
  method: allUsers.api.method,
  path: allUsers.api.endpoint,
  handler: (ctx) => ctx.json({ users: [] }),
});
app.listen(3000);
```

Nectarine does not do this automatically. The [tutorial](./nectarine-tutorial.md) puts a real `PgSql` query in the handler.

## Creating a table from schema YAML

There is no migrator. Walk `fields` and handle object vs string:

```ts
function buildCreateTableSQL(modelName: string, filepath: string): string {
  const schema = parser.yaml(filepath);
  const model = schema[modelName];
  const columns = Object.entries(model.fields)
    .map(([column, definition]) =>
      typeof definition === "string"
        ? `${column} ${definition}`
        : `${column} ${(definition as { type: string }).type}`,
    )
    .join(", ");
  return `CREATE TABLE IF NOT EXISTS ${model.table} (${columns});`;
}
```

Field values in the real `userSchema.yml` are a mix of strings and objects. A builder that always stringifies objects emits `[object Object]`. See [Schema Guide](./nectarine-schema-guide.md).

## What not to start with

- `nectarine.config.yaml` — design only
- `CCompiler.buildQuery` — empty method
- Express + Zod “for free” — not in this package
- GraphQL, auth, GUI
- `pgz.example.ts` as the compiler for `db/pg/user.yml`

## Where to go next

1. [Tutorial](./nectarine-tutorial.md) — schema → queries → hand-built SQL → PgSql → Seltzer
2. [Schema Guide](./nectarine-schema-guide.md)
3. [Query DSL](./nectarine-query-dsl.md)
4. [PostgreSQL](./nectarine-postgresql.md) / [MySQL](./nectarine-mysql.md) / [MongoDB](./nectarine-mongodb.md)
5. [Patterns](./nectarine-patterns.md) · [Anti-patterns](./nectarine-anti-patterns.md)
6. [Status](./nectarine-status.md)
