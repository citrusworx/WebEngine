---
"@citrusworx/seltzer": minor
---

`generateRoutes` binds each operation with `handlers[name]` or the catch-all `execute`. An operation with neither throws `UnboundOperationsError` at generation time and lists every unbound `name method path`. Pass `unbound: "notImplemented"` to register those routes as 501 `{ error: "Not Implemented" }` instead. Callers that already pass `execute` stay fully bound. `filter` still drops operations before that check.
