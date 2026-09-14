---
"@citrusworx/seltzer": minor
---

`generateRoutes` maps Nectarine `ApiOperation[]` (from `listApiOperations`) onto object-based `Route`s. Handlers call host `execute` and return `ResponseData` (404 when a read finds nothing). Explicit transport results use `response(...)`. Static-prefix paths win over `:id`. Compatible with the Seltzer 0.5 pipeline.
