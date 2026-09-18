# @citrusworx/sigjs

## 0.3.0

Published to npm **2026-09-18**. Workspace `package.json` matches this version. Do not republish.

### Minor Changes

- Function-valued reactive JSX props and `/user/:id` parametric `SigRouter` routes.

### Patch Changes

- Nested-safe / exception-safe `batch()`, `navigate` path normalize, optional `*` fallback, tests excluded from published `dist/`.
- Standalone library packaging and docs (not WebEngine-only).

## 0.2.0

npm `0.2.0` was published 2026-07-01. That tarball is **not** current `libraries/sig` on master: it has exact-path routing only, no function-valued reactive props, and it still ships test files under `dist/`. **0.3.0** superseded it.

### Minor Changes

- Signal / `effect` / `batch` / `memo` runtime, JSX function children as reactive text, `mount` / `disposeTree`, and exact-path `SigRouter`.
- Published subpath exports: `.`, `./jsx-runtime`, `./jsx-dev-runtime`, `./sig-router`.

## 0.1.0

### Minor Changes

- Added READMEs to each

## 0.0.2

### Patch Changes

- e7a1584: Release preparation
- e7a1584: Standardize library package manifests for independent publishing, align build outputs with published entrypoints, and add Changesets-based release automation for the monorepo.
