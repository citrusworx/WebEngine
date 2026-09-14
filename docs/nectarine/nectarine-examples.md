# Nectarine Examples

Worked from files that exist under `libraries/nectarine/models/` and adapters in `src/`. These are not generated blogs or SaaS starters.

## Load the user schema

```ts
import { parser } from "@citrusworx/nectarine";

const schema = parser.yaml("libraries/nectarine/models/user/userSchema.yml");

console.log(schema.User.table); // "users"
console.log(schema.Post.table); // "posts"
console.log(schema.Comment.table);
```

`User`, `Post`, and `Comment` share one file. That is the “blog” model in this package — not a separate published schema.

## Fetch a user by id (Postgres)

```ts
import { parser, PgSql } from "@citrusworx/nectarine";

const OPS = { eq: "=", gt: ">", lt: "<", lte: "<=", gte: ">=", neq: "!=" } as const;

const spec = parser.genSQL(
  "libraries/nectarine/models/user/db/pg/user.yml",
  "user",
  "get",
  "UserById",
);

const sql = `SELECT ${spec.select.join?.(", ") ?? spec.select} FROM ${spec.from} WHERE ${spec.where.column} ${OPS[spec.where.operator as keyof typeof OPS]} ${spec.where.value}`;

const pg = new PgSql();
pg.addDb(process.env.PG_DB!);
const client = await pg.connect(process.env.PG_DB!);
if (!client) throw new Error("No client");

try {
  const result = await pg.query(client, { sql, params: [1] });
  console.log(result?.rows);
} finally {
  await pg.disconnect(client);
}
```

`UserById` in that YAML only `select`s `id`. Change the YAML if you want more columns — that is the point of the file.

## Insert a user (Postgres)

`NewUser` in the same file:

```yaml
create:
  NewUser:
    insert:
      into: users
      columns: ['email', 'password', 'name', 'created_at']
      values: [$1, $2, $3, { fn: now }]
```

```ts
const spec = parser.genSQL(
  "libraries/nectarine/models/user/db/pg/user.yml",
  "user",
  "create",
  "NewUser",
);

const columns = spec.insert.columns.join(", ");
const values = spec.insert.values
  .map((value: unknown) =>
    value && typeof value === "object" && "fn" in (value as object)
      ? "NOW()"
      : String(value),
  )
  .join(", ");

const sql = `INSERT INTO ${spec.insert.into} (${columns}) VALUES (${values})`;

await pg.query(client, {
  sql,
  params: ["dev@citrusworx.com", "not-a-real-hash", "Demo User"],
});
```

Passwords in examples are placeholders. Hash in your app.

## MySQL insert from the msql fixture

`libraries/nectarine/models/user/db/msql/user.yml` `user.create.new`:

```ts
import { parser, Mysql, closeSql, mapInsert } from "@citrusworx/nectarine";

const spec = parser.genSQL(
  "libraries/nectarine/models/user/db/msql/user.yml",
  "user",
  "create",
  "new",
);

const columns = spec.updates.column.join(", ");
const placeholders = mapInsert(spec); // "?, ?, ?, NOW()" with objects → ?

const sql = `${spec.type} ${spec.action} ${spec.table} (${columns}) ${spec.values} (${placeholders})`;
// INSERT INTO users (email, password, name, created_at) VALUES (?, ?, ?, NOW())

await Mysql(sql, ["dev@citrusworx.com", "hash", "Demo User"]);
await closeSql();
```

`mapInsert` only joins the value list. You still build `INSERT INTO …`.

## Mongo insert

```ts
import { insertOne, connectMngz, closeMngz } from "@citrusworx/nectarine";

const client = await connectMngz();
await insertOne(client, "users", {
  email: "dev@citrusworx.com",
  name: "Demo User",
});
// insertOne closes the shared client
```

There is no `genSQL` for Mongo. `models/user/db/mg/schema.yaml` is a field note only.

## Blog route objects (manual HTTP)

`libraries/nectarine/models/blog/user/api.yml` and `models/user/userAPI.yml` store method/endpoint pairs. Because `registerRoute` does not take a resource prefix, load the file and walk it:

```ts
import { parser } from "@citrusworx/nectarine";
import { Seltzer } from "@citrusworx/seltzer";

const api = parser.yaml("libraries/nectarine/models/user/userAPI.yml");
const getAll = api.user.get.allUsers.api;

const app = Seltzer.init();
app.route({
  method: getAll.method,
  path: getAll.endpoint,
  handler: (ctx) => ctx.json({ users: [] }),
});
app.listen(3000);
```

Handlers still run your adapter code. Nectarine does not attach them.

## What these examples are not

- Not an auto-CRUD app
- Not GraphQL
- Not “CMS / Store / Banking” packs — those names were aspirational
- Not copy-paste production auth
