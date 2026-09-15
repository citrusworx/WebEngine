# @citrusworx/nectarine

## 0.3.0

### Minor Changes

- aec9ec7: Add a YAML-driven schema migrator: versioned `renameColumn` / `dropColumn` / `changeType` ops compiled to DDL, a `nectarine_schema_migrations` ledger, and `applyMigrations()` so apps can evolve beyond additive `ADD COLUMN`. Destructive ops require `destructive: true` and a matching `confirm` token; silent schema-diff DROPs are out of scope.

## 0.2.0

### Minor Changes

- a85ffb4: Export `listApiOperations` / `loadApiOperations` so Seltzer hosts can flatten Blackwater-style `*API.yml` without rewriting the compiler.
- ebe30a7: Compile Blackwater `type: SELECT` query YAML (and `read` as `get`) onto the phonics compiler. Closed where/orderBy fragment grammar; no hard-coded SQL in app code.
- 39b06f0: Allow a validated `jsonb` / `json` bind cast on compiled query values, and document Postgres JSONB as first-class for named document-store queries.
- da4d534: Rewrite compiler `$1` / `$N::jsonb` binds to MySQL `?` in `createMysqlAdapter.query()`, so compiled SQL can run on MySQL without changing the Postgres compiler.
- ff777bb: Prepare an honest public 0.2.0: MIT license and package metadata, `js-yaml` as a runtime dependency, optional `pg` / `mysql2` / `mongodb` peers, and stop re-exporting adapters from the package root so installing `@citrusworx/nectarine` does not require a database driver. Import adapters from `@citrusworx/nectarine/adapters/pg`, `/ms`, or `/mg`.
- 39c325b: Compile CREATE TABLE / indexes from `*Schema.yml` (Postgres JSONB first-class). Blackwater migrate() runs named compiled DDL; hand-written phase3-ddl is retired.

### Patch Changes

- d6c213e: Quote mixed-case SQL identifiers so Postgres does not fold `originalPrice` / `isNew` / `isActive` to lowercase.

## 0.1.0

### Minor Changes

- Added READMEs to each

## 0.0.2

### Patch Changes

- e7a1584: Release preparation
- e7a1584: Standardize library package manifests for independent publishing, align build outputs with published entrypoints, and add Changesets-based release automation for the monorepo.
