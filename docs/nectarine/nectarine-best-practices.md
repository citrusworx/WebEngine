# Nectarine Best Practices

Pitfalls that match the current code, not a future compiler.

## Treat YAML as data, not as a running backend

`parser.genSQL` and `parser.registerRoute` look up objects. If you skip a builder and skip an HTTP framework, nothing is listening and nothing hits a database.

## Do not interpolate user input into SQL

Build statements from YAML **keys** (table, columns, operators from a allow-list). Keep values in `params` / `?` arrays.

```ts
// Yes
await pg.query(client, { sql: "SELECT id FROM users WHERE id = $1", params: [id] });

// No
await pg.query(client, { sql: `SELECT id FROM users WHERE id = ${id}` });
```

The DSL’s `value: $1` is a placeholder token, not an invitation to splice `req.query`.

## Use the env names the adapters read

| Adapter | Prefix |
|---|---|
| Postgres | `PG_*` |
| MySQL | `MS_*` |
| Mongo | `MG_*` |

`MYSQL_HOST` and `MONGO_URI` will silently leave the client misconfigured.

## Know how errors surface

- `PgSql.query` — logs, returns `undefined`
- `Mysql` — throws
- `Mngz` — logs, does not rethrow
- `parser.genSQL` / `registerRoute` — throw if the node is missing

Check `rows` after Postgres; `try/catch` MySQL.

## One query shape per engine

Postgres files: `select` / `from` / `where` / `insert`.
MySQL files: `type` / `action` / `updates`.
Do not feed a PG object to `mapInsert`.

## Close what you open — but only once

- Postgres: `disconnect` in `finally` per request or per unit of work
- MySQL: close the **pool** on process shutdown, not per query
- Mongo helpers: assume they shut the shared client; avoid them in servers

## `registerRoute` is picky and shallow

The filepath must look like `api.yml`. The lookup is `doc[method][route]`, not `doc.user.get.allUsers`. Walk nested fixtures with `parser.yaml`.

## Do not wait on the compiler

`buildSQL` / `buildQuery` are empty. Shipping an app that calls them and expects a string will fail quietly (`undefined` into `client.query`).

## Keep fixtures honest

`models/` has typos (`DEAFULT`) and incomplete MySQL `delete` nodes. Copy into your app and fix; do not assume fixtures are production schemas.

## Integration

Wire Seltzer (or Express) yourself. See [Getting Started](./nectarine-getting-started.md) and [Seltzer integration](../seltzer/seltzer-integration.md). Do not document `webengine.toml` as if Nectarine reads it.
