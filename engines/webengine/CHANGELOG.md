# @citrusworx/webengine

## 0.3.0

### Minor Changes

- changeset overdue
- 3027815: Add a builtin `nectarine` kernel module that hosts `@citrusworx/nectarine` ≥0.3.0 as a library: load `nectarine.config.yaml`, resolve credentials through `NectarineConfig`, connect via config-aware adapter factories, and run `applyMigrations` (empty migrations dir is a no-op).
- ee4ae1e: Lift Blackwater `createNectarineReadRoutes` into the engine: `listApiOperations` → Seltzer `generateRoutes`, with a default execute that compiles `*Queries.yml` and runs adapter `query`. Hosts opt in via `handle.createReadRoutes` or the standalone helper.
- 20db1fa: Generate Seltzer write routes from Nectarine `*API.yml` (POST/PUT/PATCH/DELETE) via `createNectarineWriteRoutes` / `createNectarineRoutes`, with compiled execute and an `execute` escape hatch for JSONB and waitlist join.
- 8bf1172: Add opt-in `startSeltzerFromKernel` / `serveNectarineHttp` after Nectarine bootstrap: `Seltzer.init()`, `handle.createRoutes`, `listen`. Kernel bootstrap still does not auto-listen.

### Patch Changes

- 382de05: Bind Nectarine adapter `query` / `withTransaction` to the instance before `applyMigrations`, and shut down already-bootstrapped kernel modules if a later module fails.
- 8fdb90e: `startSeltzerFromKernel` forwards an optional `host` to Seltzer `listen`. Omit it and the server binds `127.0.0.1`. Pass `host: "0.0.0.0"` when the process must accept connections from other machines.
- Updated dependencies
- Updated dependencies [ba0b206]
- Updated dependencies [f343927]
- Updated dependencies [93a3bbe]
- Updated dependencies [53f27b5]
- Updated dependencies [4a0b598]
- Updated dependencies [910b8f1]
- Updated dependencies [6fac3e4]
- Updated dependencies [3d9489f]
- Updated dependencies [dc82995]
  - @citrusworx/seltzer@0.11.0
  - @citrusworx/nectarine@0.6.0

## 0.2.1

### Patch Changes

- Replace monorepo-only internal dependency ranges with published semver ranges so consumers outside the workspace can install these packages correctly.

## 0.2.0

### Minor Changes

- Added READMEs to each

### Patch Changes

- Updated dependencies
  - @citrusworx/types@0.2.0

## 0.1.1

### Patch Changes

- e7a1584: Release preparation
- e7a1584: Standardize library package manifests for independent publishing, align build outputs with published entrypoints, and add Changesets-based release automation for the monorepo.
- Updated dependencies [e7a1584]
- Updated dependencies [e7a1584]
  - @citrusworx/types@0.1.1
