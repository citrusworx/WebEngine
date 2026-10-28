# @citrusworx/sigjs

## 0.7.2

Published to npm **2026-10-27** (`gitHead` `c794c06f`, PR #295). This is npm `latest`. Workspace `package.json` matches this version. Do not republish.

The registry cut is the **0.7.0** tree plus Juice adapter `bind` for icon-button, avatar, and table (PR #295, commit `0c626a9e`). It was published by hand as **0.7.2**. `yarn version-packages` was not used. The changeset for this work was minor; a Changesets bump from **0.7.0** would have proposed **0.8.0**.

- `@citrusworx/sigjs/juice` `bind` follows icon-button, avatar, and table, catching the adapter up with the twenty-eight Juice runtimes. Icon-button `state.set` calls `toggle` only when the host has `[toggle]` and `pressed` changes, then republishes `getState()`. A disabled host or a host without `[toggle]` refuses the write and the signal snaps back to the host. Avatar and table are read-only. Table has no Juice API to set sort.
- `startIconButtonRuntime`, `startAvatarRuntime`, and `startTableRuntime` are feature-detected off the Juice module namespace. Binding one of those three when its start function is missing throws `Sig juice bind: "<runtime>" needs a newer @citrusworx/juiceui that exports <start function>.` The module still loads, and the other runtimes still bind. The optional peer stays `@citrusworx/juiceui` `>=0.9.1 <1`. Published `@citrusworx/juiceui` **0.9.1** and **0.9.2** do not export those three start functions.

## 0.7.1

Published to npm **2026-10-27** (`gitHead` `b2f2b287`). The tarball matches **0.7.0** except the `version` field. Published `dist/` is the same, and `dist/juice.d.ts` does not name icon-button, avatar, or table, so this cut does not include PR #295. Use **0.7.2**.

## 0.7.0

Published to npm **2026-10-21** (`gitHead` `747f2f71`, PR #270). Do not republish.

### Minor Changes

- Add `bindList` for keyed array and Map lists. A key that stays keeps its DOM node and row effects; `render` reads the current item from a per-row getter. Duplicate array keys throw. `replaceChildren` remains the non-keyed rewrite.
- Remove `captureCleanupScope` from the package root and stop re-exporting `jsxDEV` from `.` (`jsxDEV` stays on `@citrusworx/sigjs/jsx-dev-runtime`). Replace public `any` on `jsx`, `jsxDEV`, `Fragment`, `Child`, and `JSX.IntrinsicElements`. Export the `JSX` namespace from the JSX runtime entries so `jsxImportSource` does not depend on a root import. `Signal.set` remains always-notify, including when the value is unchanged, and that behavior is frozen for v1.

### Patch Changes

- Tag `bindList` and `ListItem` as experimental and `captureCleanupScope` as internal. Add explicit return types on the public functions that were missing them. `memo().get()` is now declared as `T`, matching the API page; declaration emit previously inferred `T | undefined` from the uninitialized cache. No export was added, removed, or renamed.
- Sig's build binds `@citrusworx/sigjs` to this package's source. Juice's declaration files import that name, and a nested registry copy's `declare global` JSX block (`type Element`, string index signature) otherwise collides with `src/jsx.ts` during `prepack`. `skipLibCheck` does not suppress that clash, and those members do not merge with the published 0.6.0 types.

## 0.6.0

Published to npm **2026-10-21** from an unversioned local build (`gitHead` `3055fe2e`; that commit is not in this repository). `libraries/sig/package.json` never recorded `0.6.0`. The tarball includes `bindList` and `ListItem` (already tagged `@experimental` in `dist/list.d.ts`) and still exports `captureCleanupScope` from the package root (`dist/index.js` re-exports `dist/signal.js`, where it is marked `@internal`). It also re-exports `jsxDEV` from `.`. `jsx`, `jsxDEV`, `Fragment`, and `Child` are still typed with `any`, and the `JSX` namespace is only a global augmentation, not an export of the JSX runtime entries. `memo().get()` is already declared as `T`. **0.7.0** is that API cleanup.

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
