# Nectarine Best Practices

This guide focuses on how to compose Nectarine well in real app code. The goal is not to list every export, but to show the patterns that keep YAML as data, SQL parameterized, and adapters thin.

## Core principle

Use Nectarine to express:

- table shape in schema YAML
- named query intent in query YAML
- named HTTP method + path in API YAML
- a socket to Postgres, MySQL, or Mongo

Use app code for:

- compiling objects into statements
- identifier allow-lists
- hashing passwords, auth, transactions, migrations

Use Seltzer (or Express) for:

- listening
- reading URL and body
- writing JSON

Nectarine is strongest when it is the contract folder on top of a database you already run, not a backend generator you have to believe in.

## Treat YAML as data, not as a running backend

`parser.genSQL` and `parser.registerRoute` look up objects. If you skip a builder and skip an HTTP framework, nothing is listening and nothing hits a database.

Good:

```ts
const spec = parser.genSQL("./queries.yml", "user", "get", "UserById");
const sql = buildSelect(spec);
```

Less ideal:

```ts
await compiler.buildQuery(clean, "UserById");
```

Empty methods fail quietly. Shipping an app that calls them and expects a string will put `undefined` into `client.query`.

## Do not interpolate user input into SQL

Build statements from YAML **keys** (table, columns, operators from an allow-list). Keep values in `params` / `?` arrays.

Good:

```ts
await pg.query(client, { sql: "SELECT id FROM users WHERE id = $1", params: [id] });
```

Risky:

```ts
await pg.query(client, { sql: `SELECT id FROM users WHERE id = ${id}` });
```

The DSL’s `value: $1` is a placeholder token, not an invitation to splice `req.query`.

## One query shape per engine

Postgres files: `select` / `from` / `where` / `insert`.
MySQL files: `type` / `action` / `updates`.
Mongo: documents and the driver; no `genSQL` flavor.

Good: two files, two builders.

Less ideal: one YAML with both shapes and a compiler that “will figure it out.” It will not. `mapInsert` does not read `insert.columns`.

## Use the env names the adapters read

| Adapter | Prefix |
|---|---|
| Postgres | `PG_*` |
| MySQL | `MS_*` |
| Mongo | `MG_*` |

`MYSQL_HOST` and `MONGO_URI` will silently leave the client misconfigured. Set env **before** import for MySQL and Mongo (pool / client at module load).

## Know how errors surface

- `PgSql.query` — logs, returns `undefined`
- `Mysql` — throws
- `Mngz` — logs, does not rethrow
- `parser.genSQL` / `registerRoute` — throw if the node is missing (`registerRoute` returns a string if the filename is wrong)

Good:

```ts
const result = await pg.query(client, { sql, params });
if (!result) throw new Error("query failed");
```

Less ideal:

```ts
console.log(result.rows);
```

when `result` may be `undefined`.

## Close what you open — but only once

- Postgres: `disconnect` in `finally` per request or per unit of work
- MySQL: close the **pool** on process shutdown, not per query
- Mongo helpers: assume they shut the shared client; avoid them in servers

Good: `withPg` from [Patterns](./nectarine-patterns.md).

Risky: `closeSql()` inside a Seltzer handler.

## `registerRoute` is picky and shallow

The filepath must look like `api.yml`. The lookup is `doc[method][route]`, not `doc.user.get.allUsers`. Walk nested fixtures with `parser.yaml`.

## Prefer one field style per schema file

Object fields and SQL-fragment strings both appear in fixtures. A builder that stringifies objects emits `[object Object]`.

Good: the tutorial schema (objects only) plus `columnSql`.

Less ideal: copying `timestamp DEAFULT NOW()` from `userSchema.yml` into production.

## Keep compile in one module

The honest compiler is yours until `buildSQL` exists. Put `buildSelect` / `buildInsert` / `columnSql` in one file. Do not scatter `` `SELECT ${spec.select}` `` across handlers.

## Keep fixtures honest

`models/` has typos (`DEAFULT`) and incomplete MySQL `delete` nodes. Copy into your app and fix; do not assume fixtures are production schemas. Do not import `models` / `extendModels` from the package — they are not in `dist/`.

## Integration

Wire Seltzer (or Express) yourself. See [Tutorial](./nectarine-tutorial.md) and [Seltzer + WebEngine](./nectarine-integration.md). Do not document `webengine.toml` as if Nectarine reads it. Seltzer paths are exact; do not ship `/users/:id` and expect `/users/1` to match.

## A good mental model

- Schema YAML — what a row looks like
- Query YAML — which SELECT / INSERT you meant
- API YAML — which method + path a human should call
- App builder — YAML object → string
- Adapter — string → driver
- Seltzer — driver rows → JSON

Once that picture is solid, [anti-patterns](./nectarine-anti-patterns.md) are just the ways to skip a layer, and [the compiler page](./nectarine-compiler.md) is the layer that is still a comment.
