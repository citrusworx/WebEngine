---
"@citrusworx/webengine": minor
---

Lift Blackwater `createNectarineReadRoutes` into the engine: `listApiOperations` → Seltzer `generateRoutes`, with a default execute that compiles `*Queries.yml` and runs adapter `query`. Hosts opt in via `handle.createReadRoutes` or the standalone helper.
