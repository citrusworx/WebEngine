# Getting Started With Nectarine

Use Nectarine the way the library works today: load YAML, take a named object, run a statement on an adapter.

## Install

```bash
yarn add @citrusworx/nectarine
```

Peer-ish runtime libraries the adapters import: `pg`, `mysql2`, `mongodb`, `js-yaml`. They are listed in the package’s own `devDependencies` today — if you consume Nectarine from an app, install the driver you actually call.

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

Mongo URI is `mongodb://$MG_USER:$MG_PASS@$MG_HOST:$MG_PORT/$MG_DB?authSource=admin`.

## Mental model

You are not calling `generateRoutes(schema, queries, api)`. That function does not exist.

```text
parser.yaml(path)                     → whole file
parser.genSQL(path, type, method, id) → one query object
parser.registerRoute(path, method, id)→ one API object
PgSql | Mysql | Mngz                  → execute something you built
```

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

`parser.genSQL` only retrieves that object. A minimal builder — the same idea as `pgz.example.ts` — looks like this:

```ts
import { parser, PgSql } from "@citrusworx/nectarine";

type QuerySpec = {
  type?: string;
  select?: string | string[];
  fields?: string | string[];
  from?: string;
  table?: string;
  action?: string;
  where?: { column: string; operator: string; value: string };
  conditions?: { condition: string; column: string; operator: string; value: string };
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
    : spec.select ?? spec.fields ?? "*";
  const table = spec.from ?? spec.table;
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
    console.log(result?.rows);
  } finally {
    await pg.disconnect(client);
  }
}

void main();
```

That is the current “generated query” story: **YAML names the parts; you compile**.

## First MySQL query

```ts
import { Mysql, closeSql } from "@citrusworx/nectarine";

const rows = await Mysql< { email: string } >(
  "SELECT email FROM users WHERE id = ?",
  [1],
);

console.log(rows);
await closeSql();
```

See [MySQL](./nectarine-mysql.md) for the `?` YAML flavor and `mapInsert`.

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

```ts
import { parser } from "@citrusworx/nectarine";

const allUsers = parser.registerRoute(
  "./models/user/userAPI.yml",
  "get",
  "allUsers",
);

console.log(allUsers.api.method, allUsers.api.endpoint);
```

Wire that to Seltzer yourself:

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

Nectarine does not do this automatically.

## Creating a table from schema YAML

There is no migrator. `pgz.example.ts` joins `fields` into `CREATE TABLE`:

```ts
function buildCreateTableSQL(modelName: string, filepath: string): string {
  const schema = parser.yaml(filepath);
  const model = schema[modelName];
  const columns = Object.entries(model.fields)
    .map(([column, definition]) =>
      typeof definition === "string"
        ? `${column} ${definition}`
        : `${column} ${definition.type}`,
    )
    .join(", ");
  return `CREATE TABLE IF NOT EXISTS ${model.table} (${columns});`;
}
```

Field values in the real `userSchema.yml` are a mix of strings and objects. Your builder must handle both. See [Schema Guide](./nectarine-schema-guide.md).

## What not to start with

- `nectarine.config.yaml` — design only
- `CCompiler.buildQuery` — empty method
- Express + Zod “for free” — not in this package
- GraphQL, auth, GUI

## Where to go next

- [Query DSL](./nectarine-query-dsl.md)
- [PostgreSQL](./nectarine-postgresql.md) / [MySQL](./nectarine-mysql.md) / [MongoDB](./nectarine-mongodb.md)
- [Examples](./nectarine-examples.md)
- [Status](./nectarine-status.md)
