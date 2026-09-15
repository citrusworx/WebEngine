---
"@citrusworx/webengine": minor
---

Add a builtin `nectarine` kernel module that hosts `@citrusworx/nectarine` ≥0.3.0 as a library: load `nectarine.config.yaml`, resolve credentials through `NectarineConfig`, connect via config-aware adapter factories, and run `applyMigrations` (empty migrations dir is a no-op).
