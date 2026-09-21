# Nectarine + MySQL

**This page describes a removed adapter shape** (import-time `mysql2` pool, `Mysql()` / `closeSql()`, no class). The current adapter is `createMysqlAdapter` in `libraries/nectarine/src/adapters/ms/msqlz.ts`: credentials from `loadNectarineConfig`, a pool opened in `connect()`, `$N` and JSONB operators rewritten in `query()`, and `ON CONFLICT` rejected. It is a peer adapter on a Postgres-first compiler, not a second compiler and not “early alpha.” See [status](./nectarine-status.md). Do not follow the steps below as the current API.

How an older `Mysql` helper worked in `libraries/nectarine/src/adapters/ms/msqlz.ts`. That shape was a module-level `mysql2` pool plus `Mysql()` / `closeSql()`.

Related:

- [Query DSL](./nectarine-query-dsl.md) — Postgres shape is different; do not mix
- [Patterns](./nectarine-patterns.md) — `mapInsert` fragment
- [Anti-patterns](./nectarine-anti-patterns.md) — `MYSQL_*`, closing the pool per request

## Status

**Historical.** The paragraphs under this heading describe the removed helper. Current maturity is a peer adapter (see the banner). Product claims of “Active MySQL support” still overstate parity with Postgres. Use [nectarine-status.md](./nectarine-status.md), not this page, as the source of truth.

There are **no** `MS_*` helper functions. `MS_*` is the **environment prefix**. Query fragments are `mapInsert`, `mapGetter`, and `getValues`.

## Env

The source reads **`MS_*`**, not `MYSQL_*`:

```bash
export MS_HOST=localhost
export MS_USER=root
export MS_PASS=secret
export MS_DB=myapp
export MS_PORT=3306
```

The pool is created at **import time** with those values. Set env before the process loads the module.

`mysql2` is `require`d from source and is **not** listed in the package’s `dependencies`. Install it in the app:

```bash
yarn add mysql2
```

The file also `require`s `dotenv` and `path` and never calls `dotenv.config()`. Unused. The JSDoc says “Postgres” — copy-paste in source, not a second PG adapter.

## Minimal query

```ts
import { Mysql, closeSql } from "@citrusworx/nectarine";

try {
  const rows = await Mysql(
    "SELECT id, email FROM users WHERE email = ?",
    ["dev@citrusworx.com"],
  );
  console.log(rows);
} finally {
  await closeSql();
}
```

`Mysql` is `pool.execute` and **throws** on error (unlike `PgSql.query`, which logs and returns `undefined`).

`closeSql()` ends the pool. After that, further `Mysql` calls fail until process restart. In a long-running server, **do not** close the pool per request. Close on shutdown.

`pool` is exported if you need the raw `mysql2` pool.

Placeholders are `?`, not `$1`.

## YAML fixture

`libraries/nectarine/models/user/db/msql/user.yml` uses an older shape:

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
  get:
    user:
      type: SELECT
      action: FROM
      table: users
      clause: WHERE
      statement:
        column: [email]
        operator: '='
        values: ['?']
```

Load with `parser.genSQL(path, "user", "create", "new")`. `mapInsert` joins `updates.values` (objects become `?`). You still write `INSERT INTO table (cols) VALUES (…)`.

```ts
import { parser, Mysql, mapInsert, getValues } from "@citrusworx/nectarine";

const spec = parser.genSQL("./db/msql/user.yml", "user", "create", "new");
const columns = spec.updates.column.join(", ");
const placeholders = mapInsert(spec);
const sql = `${spec.type} ${spec.action} ${spec.table} (${columns}) ${spec.values} (${placeholders})`;
// INSERT INTO users (email, password, name, created_at) VALUES (?, ?, ?, NOW())
```

`update` in that fixture is empty. `delete.user` has empty `type` / `action` / `table`. Do not call `mapInsert` on them.

This is **not** the Postgres `select` / `from` / `where` DSL. Do not mix the two shapes in one file and expect one compiler.

## `mapInsert` / `mapGetter` / `getValues`

| Function | Reads | Returns |
|---|---|---|
| `mapInsert(action)` | `action.updates.values` | joined list; objects → `?` |
| `mapGetter(action)` | `action.statement.values` | joined list; also `console.log`s |
| `getValues(action)` | `action.statement.column` | joined column names |

Interfaces for those objects are **module-private**. They are not exported. The functions do not emit `INSERT …` or `SELECT …`.

## Practices

- Use `?` placeholders only
- Share `pool` for the process; close on shutdown
- Install `mysql2` in the consuming workspace
- `try/catch` — this adapter throws
- Ignore the file comment that says “Postgres”

## Not included

Transactions helpers, migrations, JSON operators, full-text, a MySQL-specific compiler, or `MS_*` query functions.
