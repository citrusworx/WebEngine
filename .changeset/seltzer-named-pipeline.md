---
"@citrusworx/seltzer": minor
---

Named HTTP request pipeline (`parse` → `context` → `route` → `validate` → `handle` → `response` → `send`) with `Seltzer#before(name, stage)` for inserting stages. `validate` is a no-op stub. Default listen/handle behavior is unchanged for `init().route().listen()`.
