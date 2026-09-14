---
"@citrusworx/seltzer": minor
---

Flatten Nectarine `*API.yml` with `listApiOperations` and build object-based `Route`s via `generateRoutes`. Handlers call host `execute` and return `ResponseData` (404 when a read finds nothing). Static-prefix paths win over `:id` at generate-time and in `matchRoute`. Compatible with the Seltzer 0.5 pipeline.
