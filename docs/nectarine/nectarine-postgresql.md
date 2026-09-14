# Nectarine + PostgreSQL

Postgres is the adapter with a real class and an in-repo query-builder example. The database itself is ordinary PostgreSQL; Nectarine does not install or migrate it.

## Why this adapter first

- Query YAML under `models/**/db/pg` uses `$1` placeholders, which `pg` understands
- `PgSql.query` forwards `{ sql, params }` to `client.query`
- `pgz.example.ts` shows CREATE / SELECT / INSERT from YAML

It is still a thin wrapper: one `Client` per `connect`, no pool, no transactions API.

## Env

```bash
export PG_USER=postgres
export PG_HOST=localhost
export PG_PASS=secret
export PG_DB=myapp
export PG_PORT=5432
```

`PG_DB` is not read inside `PgSql` automatically. You `addDb(process.env.PG_DB!)` and `connect` with the same key. The map stores name → name.

## Install Postgres (host)

Use whatever you already run — Homebrew, apt, Docker. Nectarine only needs a reachable server and those variables.

```bash
# example — not required by the library
docker run --name nectarine-pg -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=myapp -p 5432:5432 -d postgres:16
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

`query` swallows errors (`console.error`) and returns `undefined`. Check the return value; do not assume `rows`.

## From YAML to SQL

See [Getting Started](./nectarine-getting-started.md) and [Query DSL](./nectarine-query-dsl.md). The reference concatenation lives in `libraries/nectarine/src/adapters/pg/pgz.example.ts` (`buildSelectSQL`, `buildInsertSQL`, `buildCreateTableSQL`). Copy those functions into your app; they are not package exports.

## Practices

- Parameterize (`$1`) — do not interpolate user input into `sql`
- Disconnect in `finally`
- Do not keep a global `Client` across serverless invocations without reconnect logic
- `addTable` is unused by `query`; registering tables does not create them
- For pooling, use `pg.Pool` in your app; Nectarine does not export one

## Limitations

- No `LISTEN` / notifications helper
- No JSONB query DSL
- No migration runner
- `creds.port` is a string from the env; `pg` accepts it
