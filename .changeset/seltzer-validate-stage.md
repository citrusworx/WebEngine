---
"@citrusworx/seltzer": minor
---

`RequestContext.valid` is where a replacement `validate` stage puts parsed `{ body?, params?, query? }`. The default `.required` stage does not set it, and its 400 bodies are unchanged (`Missing required field` / `Request body must be an object`). `validationError(issues)` returns 400 `{ error: "Validation failed", issues: [{ path, message }] }` with `path` as `(string | number)[]`. Seltzer does not depend on Zod. Richer checks are `replace("validate", …)` in the host, which replaces the presence checks rather than running after them.
