---
"@citrusworx/nectarine": minor
---

Add a YAML-driven schema migrator: versioned `renameColumn` / `dropColumn` / `changeType` ops compiled to DDL, a `nectarine_schema_migrations` ledger, and `applyMigrations()` so apps can evolve beyond additive `ADD COLUMN`. Destructive ops require `destructive: true` and a matching `confirm` token; silent schema-diff DROPs are out of scope.
