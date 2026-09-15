---
"@citrusworx/webengine": patch
---

Bind Nectarine adapter `query` / `withTransaction` to the instance before `applyMigrations`, and shut down already-bootstrapped kernel modules if a later module fails.
