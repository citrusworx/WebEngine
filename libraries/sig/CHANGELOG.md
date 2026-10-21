# @citrusworx/sigjs

## 0.7.0

Unpublished. npm **0.6.0** (2026-10-21) is the latest registry cut. This workspace version is the next publish. Do not republish it, and do not run `yarn version-packages` before that publish.

### Patch Changes

- Sig's build binds `@citrusworx/sigjs` to this package's source. Juice's declaration files import that name, and a nested registry copy's `declare global` JSX block (`type Element`, string index signature) otherwise collides with `src/jsx.ts` during `prepack`. `skipLibCheck` does not suppress that clash, and those members do not merge with the published 0.6.0 types.
- Consumers that publish or install Sig declare `^0.7.0`. A `^0.4.0` pin matches neither `0.6.0` nor `0.7.0`, so Yarn nests a registry tarball beside the workspace package.

## 0.4.0

Published to npm **2026-10-16**. Workspace `package.json` matches this version. Do not republish.

### Minor Changes

- Add an optional `@citrusworx/sigjs/juice` adapter. `bind(host, runtime?)` returns a Sig signal kept in sync with a Juice runtime host, plus `dispose` to drop the listeners. The main Sig entry does not import Juice.

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
