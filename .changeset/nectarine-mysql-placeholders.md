---
"@citrusworx/nectarine": minor
---

Rewrite compiler `$1` / `$N::jsonb` binds to MySQL `?` in `createMysqlAdapter.query()`, so compiled SQL can run on MySQL without changing the Postgres compiler.
