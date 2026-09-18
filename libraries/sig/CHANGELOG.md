# @citrusworx/sigjs

## 0.2.0

npm `0.2.0` was published 2026-07-01. That tarball is **not** current `libraries/sig` on master: it has exact-path routing only, no function-valued reactive props, and it still ships test files under `dist/`. The unpublished master work is queued as **0.3.0** via Changesets.

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
