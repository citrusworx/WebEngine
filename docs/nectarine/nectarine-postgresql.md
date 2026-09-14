# Nectarine + PostgreSQL

How `PgSql` actually works in `libraries/nectarine/src/adapters/pg/pgz.ts`. Postgres is the adapter with a real class and an in-repo query-builder *idea*. The database itself is ordinary PostgreSQL; Nectarine does not install or migrate it.

Related:

- [Tutorial](./nectarine-tutorial.md) — lifecycle + YAML → SQL → `query`
- [Query DSL](./nectarine-query-dsl.md) — `select` / `from` / `where`
- [Compiler](./nectarine-compiler.md) — do not use `buildQuery` here

## Why this adapter first

- Query YAML under `models/**/db/pg` uses `$1` placeholders, which `pg` understands
- `PgSql.query` forwards `{ sql, params }` to `client.query`
- The tutorial / getting-started builder concatenates the PG DSL into SQL you can run

It is still a thin wrapper: one `Client` per `connect`, no pool, no transactions API, errors logged and swallowed.

## Env

```bash
export PG_USER=postgres
export PG_HOST=localhost
export PG_PASS=secret
export PG_DB=myapp
export PG_PORT=5432
```

`PG_DB` is not read inside `PgSql` automatically. You `addDb(process.env.PG_DB!)` and `connect` with the same key. The map stores name → name.

Credentials are read in the constructor (`process.env.PG_*!`). Missing values become `undefined` on the `pg` Client and fail at `connect`.

## Install Postgres (host)

Use whatever you already run — Homebrew, apt, Docker. Nectarine only needs a reachable server and those variables.

```bash
# example — not required by the library
docker run --name nectarine-pg -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=myapp -p 5432:5432 -d postgres:16
```

Install `pg` in the consuming app:

```bash
yarn add pg
```

## Client lifecycle

```ts
import { PgSql } from "@citrusworx/nectarine";

const pg = new PgSql();
pg.addDb("myapp");

const client = await pg.connect("myapp");
if (!client) {
  throw new Error("connect() returned undefined — check PG_* and addDb");
}

try {
  const result = await pg.query(client, {
    sql: "SELECT now() AS ts",
  });
  console.log(result?.rows);
} finally {
  await pg.disconnect(client);
}
```

| Method | Role |
|---|---|
| `client(db)` | `new Client({ …creds, database: this.dbs.get(db) })` |
| `connect(db)` | `client` + `connect()` |
| `query(client, { sql, params? })` | `client.query`; logs errors, returns `undefined` on failure |
| `disconnect(client)` | `client.end()` |
| `addDb` / `addTable` | register names in maps |

`query` swallows errors (`console.error`) and returns `undefined`. Check the return value; do not assume `rows`.

The `if (!this.client)` guard inside `query` tests the **method**, which is always truthy. It does not detect a missing argument. Passing a bad client still falls into the `try/catch`.

`addTable` is stored and never read. Registering tables does not create them.

## From YAML to SQL

See [Getting Started](./nectarine-getting-started.md) and [Query DSL](./nectarine-query-dsl.md). Compile `select` / `from` / `where` in the app.

`libraries/nectarine/src/adapters/pg/pgz.example.ts` is the current **reference idea** (connect, CREATE, SELECT, INSERT, disconnect). It is **not** exported. Two honest limits:

1. Paths inside it point at `apps/citrode/.../schema.yml` and `libraries/nectarine/schemas/...` — those paths are stale. Real fixtures live under `libraries/nectarine/models/`.
2. `buildSelectSQL` / `buildInsertSQL` expect MySQL-shaped keys (`type`, `fields`, `table`, `updates`). They do **not** compile `db/pg/user.yml`. Use the tutorial builder for that file.

## Pooling and transactions

For pooling, use `pg.Pool` in your app. Nectarine does not export one.

There is no `begin` / `commit` helper. Use `client.query("BEGIN")` on a client you already connected, or skip Nectarine’s class and use `pg` directly for that unit of work.

Do not keep a global `Client` across serverless invocations without reconnect logic. `disconnect` ends the connection.

## Practices

- Parameterize (`$1`) — do not interpolate user input into `sql`
- Disconnect in `finally`
- Treat `undefined` from `query` as failure
- Call `addDb` with the same string you pass to `connect`
- For production traffic, prefer `pg.Pool` over per-request `PgSql` clients

## Limitations

- No `LISTEN` / notifications helper
- No JSONB query DSL
- No migration runner
- `creds.port` is a string from the env; `pg` accepts it
- No connection-string URL (`postgres://…`) — env fields only
