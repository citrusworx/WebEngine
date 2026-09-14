# Nectarine Examples

Worked from files that exist under `libraries/nectarine/models/` and adapters in `src/`. These are not generated blogs or SaaS starters. For a single guided catalog, use the [tutorial](./nectarine-tutorial.md).

## Load the user schema

```ts
import { parser } from "@citrusworx/nectarine";

const schema = parser.yaml("libraries/nectarine/models/user/userSchema.yml");

console.log(schema.User.table); // "users"
console.log(schema.Post.table); // "posts"
console.log(schema.Comment.table);
```

`User`, `Post`, and `Comment` share one file. That is the “blog” model in this package — not a separate published schema. Field values mix objects and strings (`timestamp DEAFULT NOW()` is a fixture typo).

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
  if (!result) throw new Error("query failed");
  console.log(result.rows);
} finally {
  await pg.disconnect(client);
}
```

`UserById` in that YAML only `select`s `id`. Change the YAML if you want more columns — that is the point of the file.

Do not pass this node to `pgz.example.ts` `buildSelectSQL`. That helper wants `type` / `fields` / `table`.

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

Passwords in examples are placeholders. Hash in your app. `{ fn: now }` is YAML until your map says `NOW()`.

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

`mapInsert` only joins the value list. You still build `INSERT INTO …`. `update` / `delete` nodes in that fixture are empty — do not compile them.

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

There is no `genSQL` for Mongo. `models/user/db/mg/schema.yaml` is a field note only. For a server, use `Mngz` and `collection.find` — [MongoDB](./nectarine-mongodb.md).

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

Handlers still run your adapter code. Nectarine does not attach them. `getAll.endpoint` may be `/users` (good for Seltzer) or `/users/:id` (literal path — will 404 on `/users/1`). See [Integration](./nectarine-integration.md).

## Blog `queries:` file (manual walk)

`libraries/nectarine/models/blog/post/sql.yml` is **not** `user.get.Name`:

```ts
const doc = parser.yaml("libraries/nectarine/models/blog/post/sql.yml");
const spec = doc.queries.getPostBySlug;
// { select: "*", from: "posts", where: { column: "slug", operator: "eq", value: "$slug" } }
```

`$slug` is not a `pg` placeholder. Rewrite to `$1` or bind it yourself. `orderBy` on `getPublishedPosts` is unread by any compiler.

## What these examples are not

- Not an auto-CRUD app
- Not GraphQL
- Not “CMS / Store / Banking” packs — those names were aspirational
- Not copy-paste production auth
- Not proof that `buildSQL()` ran
