# Nectarine + MySQL

Early adapter. `libraries/nectarine/src/adapters/ms/msqlz.ts` is a module-level `mysql2` pool plus `Mysql()` / `closeSql()`. There is no class, no YAML compiler, and no getting-started stack beyond what this page shows.

## Status

**Early / partial.** The function works. Product claims of “Active MySQL support” overstated it. Use this page, not a feature matrix, as the source of truth.

## Env

The source reads **`MS_*`**, not `MYSQL_*`:

```bash
export MS_HOST=localhost
export MS_USER=root
export MS_PASS=secret
export MS_DB=myapp
export MS_PORT=3306
```

The pool is created at import time with those values.

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

`closeSql()` ends the pool. After that, further `Mysql` calls fail until process restart. In a long-running server, **do not** close the pool per request.

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

This is **not** the Postgres `select` / `from` / `where` DSL. Do not mix the two shapes in one file and expect one compiler.

## Practices

- Use `?` placeholders only
- Share `pool` for the process; close on shutdown
- Install `mysql2` in the consuming workspace
- Ignore the file comment in `msqlz.ts` that says “Postgres” — it is a copy-paste error in source, not a second PG adapter

## Not included

Transactions helpers, migrations, JSON operators, full-text, or a MySQL-specific compiler.
