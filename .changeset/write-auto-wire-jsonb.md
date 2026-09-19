---
"@citrusworx/seltzer": minor
"@citrusworx/nectarine": minor
"@citrusworx/webengine": minor
---

Auto-wire more YAML writes: `generateRoutes` covers POST/PUT/PATCH/DELETE and optional `ApiOperation.status`; `listApiOperations` copies `api.status`; compiled execute binds jsonb-cast document bodies and skips `{ fn: now }`.
