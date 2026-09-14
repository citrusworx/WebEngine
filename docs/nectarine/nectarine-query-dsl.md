# Query DSL

How query YAML is shaped in `libraries/nectarine/models/user/db/pg/user.yml`, and what `parser.genSQL` actually returns. This is the mental model for **intent as data** — not a SQL string, not Knex, and not a compiler output.

Related:

- [Tutorial](./nectarine-tutorial.md) — compile `select` / `from` / `where` in app code
- [Compiler](./nectarine-compiler.md) — `buildSQL` / `buildQuery` are empty
- [Schema Guide](./nectarine-schema-guide.md) — tables live in a different file
- [MySQL](./nectarine-mysql.md) — older `type` / `action` / `updates` shape

## What the DSL is

A query file is a nested map: **resource → CRUD verb → query name → intent object**.

`parser.genSQL(path, type, method, config)` returns `doc[type][method][config]`. That is a plain object. It is not SQL.

```ts
import { parser } from "@citrusworx/nectarine";

const spec = parser.genSQL(
  "libraries/nectarine/models/user/db/pg/user.yml",
  "user",
  "get",
  "UserById",
);
// { select: ["id"], from: "users", where: { column: "id", operator: "eq", value: "$1" } }
```

The Postgres-oriented keys (`select`, `from`, `where`, `insert`, `set`) are a **convention in fixtures**. The parser does not check them. A future `buildSQL` is supposed to. Today your app does.

## What a query object is not

- **Not a statement.** `typeof spec === "object"`.
- **Not validated.** Unknown operators, missing `from`, and `select: 12` all load.
- **Not compiled by `buildSQL()`.** That function’s body is comments.
- **Not shared with MySQL helpers.** `mapInsert` wants `updates.values`, not `insert.columns`.
- **Not Mongo.** There is no `genSQL` flavor for collections.

## A compact picture

```text
user.yml
  user
    get
      UserById { select, from, where }     ──► genSQL(..., "user", "get", "UserById")
      AllUsers { select, from }
    create
      NewUser  { insert: { into, columns, values } }
    update
      UserById { table, set, values, where }
    delete
      User     { from, where }

optokens type: eq gt lt lte gte neq        ──► documentation only
your builder:  eq → =                      ──► the current compiler
PgSql.query({ sql, params })               ──► the socket
```

## Design bets (still the right ones)

- Query YAML describes **intent**, not full SQL text
- Runtime values are placeholders (`$1`, `$2`) passed separately as params
- Operators are tokens (`eq`, `gt`) so a compiler can refuse unknown ones
- Shapes should be consistent enough that a real `buildSQL()` would not need per-query special cases

Those bets are why the [tutorial](./nectarine-tutorial.md) builder is small. They are not a claim that the package already compiles.

## Resource layout

Each resource currently uses three YAML files when you follow the user bundle:

- `userSchema.yml` — data model and table structure
- `user.yml` (under `db/pg` or `db/msql`) — SQL / query DSL definitions
- `userAPI.yml` — API endpoint definitions

`genSQL` only needs the query file. It does not join schema or API files.

## `get` queries

Read queries use `select`, `from`, and optional `where`.

```yaml
user:
  get:
    AllUsers:
      select: ['*']
      from: users

    UserByEmail:
      select: ['email']
      from: users
      where:
        column: email
        operator: eq
        value: $1
```

Current fields:

- `select`: array of column names, or `['*']` (fixtures also use a `'*'` string in blog files)
- `from`: table name
- `where`: optional single predicate object

Current `where` fields:

- `column`: column name
- `operator`: token from the table below
- `value`: placeholder or literal

Compilation target for `UserByEmail`:

```sql
SELECT email FROM users WHERE email = $1
```

Pass `["ops@citrusworx.com"]` as `params`. Do not splice the email into the YAML.

## `update` queries

```yaml
user:
  update:
    UserById:
      table: users
      set: ['name', 'age', 'updated_at']
      values: [$1, $2, NOW()]
      where:
        column: id
        operator: eq
        value: $3
```

Current fields:

- `table`: target table
- `set`: columns to update
- `values`: values corresponding to `set`
- `where`: predicate object

Compilation target:

```sql
UPDATE users
SET name = $1, age = $2, updated_at = NOW()
WHERE id = $3
```

The checked-in file uses `{ fn: now }` in some `values` lists. That is YAML. Your builder maps it to `NOW()` or rejects it.

## `create` queries

```yaml
user:
  create:
    NewUser:
      insert:
        into: users
        columns: ['email', 'password', 'name', 'created_at']
        values: [$1, $2, $3, NOW()]
```

Current fields:

- `insert.into`: target table
- `insert.columns`: ordered column list
- `insert.values`: ordered value list

Compilation target:

```sql
INSERT INTO users (email, password, name, created_at)
VALUES ($1, $2, $3, NOW())
```

## `delete` queries

```yaml
user:
  delete:
    User:
      from: users
      where:
        column: id
        operator: eq
        value: $1
```

Compilation target:

```sql
DELETE FROM users
WHERE id = $1
```

A delete without `where` is not modeled here. Keep it that way until a compiler can refuse it.

## Operator tokens

| DSL token | SQL operator |
|---|---|
| `eq` | `=` |
| `neq` | `!=` |
| `gt` | `>` |
| `gte` | `>=` |
| `lt` | `<` |
| `lte` | `<=` |

These tokens should be translated by a compiler rather than written as raw SQL in YAML. The package exports `optokens` as a **TypeScript type** from the compiler module. Nothing in `src/` maps the tokens at runtime. Copy the table into an allow-list in your builder — see [Getting Started](./nectarine-getting-started.md) and the tutorial.

Unknown tokens should throw in *your* compiler. `genSQL` will still return them.

## Values and placeholders

Postgres-oriented files use positional placeholders:

- `$1`, `$2`, `$3`

These are intended to be passed separately to `PgSql.query` as `params`.

MySQL-oriented files use `?` instead. Do not feed `$1` to `Mysql()`.

## Allowed SQL-ish literals

Fixtures also use function literals such as `NOW()` and objects such as `{ fn: now }`.

Current expectation for a hand-built compiler:

- placeholders like `$1` stay in the string and match `params`
- literals like `NOW()` are compiler-approved fragments
- `{ fn: now }` is the same idea in object form — map it or reject it

A future version may formalize functions. Do not document other `{ fn: … }` values as shipped.

## Shapes `genSQL` cannot address

`libraries/nectarine/models/blog/post/sql.yml` uses a top-level `queries:` map:

```yaml
queries:
  getPublishedPosts:
    select: [id, title, slug, excerpt, created_at]
    where:
      column: status
      operator: eq
      value: 'published'
```

There is no `user.get.Name` nesting. `parser.genSQL(path, "queries", "getPublishedPosts", …)` will not find a CRUD layer that is not there. Load with `parser.yaml` and walk `doc.queries.getPublishedPosts`, or rewrite the file to the user-bundle layout.

Blog `user/sql.yml` is closer to the PG DSL but inconsistent (`insert` using `set`, `select: '*'` as a string). Treat fixtures as examples of *intent*, not as a schema pack.

## MySQL is a different DSL

`models/user/db/msql/user.yml`:

```yaml
user:
  create:
    new:
      type: INSERT
      action: INTO
      table: users
      values: VALUES
      updates:
        column: [email, password, name, created_at]
        values: ['?', '?', '?', NOW()]
```

`parser.genSQL(path, "user", "create", "new")` still works — it only indexes keys. `mapInsert(spec)` joins `updates.values`. You still write `INSERT INTO …`. Update and delete nodes in that fixture are empty. See [MySQL](./nectarine-mysql.md).

## `pgz.example.ts` does not compile this DSL

`buildSelectSQL` in `libraries/nectarine/src/adapters/pg/pgz.example.ts` expects `type`, `fields`, `table`, `action`, `conditions` — the MySQL-shaped keys. Calling it on a `UserById` node from `db/pg/user.yml` produces nonsense (`undefined * FROM undefined`).

The getting-started / tutorial `buildSelect` is the builder that matches `select` / `from` / `where`. Copy that, not `buildSelectSQL`, unless you rewrite the YAML to the example’s shape.

## Known constraints

This document describes the **current** DSL, not the final one.

- `where` models a single predicate object (no `AND` / `OR` trees)
- joins are not modeled
- grouping, ordering, limits, and pagination are not formalized (`orderBy` appears in the blog post file and is unread)
- SQL functions are still raw fragments or `{ fn: now }`
- there is no validation layer for identifiers
- `CCompiler.clean_parse` indexes `[method][type]`, the **opposite** of `genSQL` — see [Compiler](./nectarine-compiler.md)

## Next step for the code

Lock this DSL into TypeScript types and compile it through `buildSQL()` / `buildQuery` rather than treating it as loose YAML objects. Until that lands, the docs stay with a hand-built compiler and [Status](./nectarine-status.md).
