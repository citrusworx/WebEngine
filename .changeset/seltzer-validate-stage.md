---
"@citrusworx/seltzer": minor
---

Default `validate` stage enforces `.required` body fields from `Route.contract` (copied by `generateRoutes` from `ApiOperation.body`). `Seltzer#replace(name, stage)` swaps a builtin so Nectarine can hang full contract checks. `before` is unchanged.
