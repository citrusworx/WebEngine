# @citrusworx/sigjs

## 1.1.2

Published to npm **2026-11-03** (`gitHead` `e4c4a0fc`, the PR #324 merge, 16:11 UTC). npm `latest` is **1.1.2**. Workspace `package.json` is **1.1.2**.

**1.1.0** was never published. **1.1.1** published the 31-name adapter the same day and does not bind sheet. **1.1.2** is the first published cut that binds sheet. `JuiceRuntimeName` is thirty-two names, through `sheet`. The published `dist/` matches `libraries/sig/dist` on that merge. The optional `@citrusworx/juiceui` peer stays `>=0.9.1 <1`.

`@citrusworx/sigjs/juice` `bind` follows pressable, touchable-row, keyboard-avoider, and sheet. Pressable, touchable-row, and keyboard-avoider are the shapes published in **1.1.1** (PR #320). Sheet is PR #324.

- Sheet state is `{ open, detent, dragging, modal }`. `detent` is `"peek"`, `"half"`, or `"full"`. The host is `[sheet-overlay]`. `inferRuntime` matches `[sheet-overlay]` only. `juice:change` bubbles from that overlay, with detail `{ runtime: "sheet", state }`. The inner `[sheet]` is the dialog panel and does not dispatch the event. The first observation is silent. Later events fire when `open`, `detent`, `dragging`, or `modal` changes. `bind` is read-only and does not call `open` or `close`.
- `startSheetRuntime` is feature-detected off the Juice module namespace. Binding sheet when that start function is missing throws `needs a newer @citrusworx/juiceui`. Sheet shipped in juiceui **0.9.6**. On **0.9.5** sheet throws. On **0.9.6** all thirty-two names bind. npm `@citrusworx/juiceui` latest is **0.9.6**.

`yarn version-packages` was not used. No Sig changeset was added. A changeset would bump this manifest on the next version-packages run.

## 1.1.1

Published to npm **2026-11-03** (`gitHead` `850e91bb`, the PR #321 merge, 15:58 UTC). npm `latest` moved to **1.1.2** the same day. Do not republish. Use **1.1.2** for sheet.

That commit includes PR #320 and does not include PR #324. The workspace `package.json` at `850e91bb` still said **1.1.0**. **1.1.0** was never published. The tarball `version` is **1.1.1**. `JuiceRuntimeName` is thirty-one names, through `keyboard-avoider`. `sheet` is not a name. Published `dist/juice.d.ts` says `sheet` is not a name. There is no `startSheetRuntime`, and `inferRuntime` does not match `[sheet-overlay]`.

- Pressable state is `{ pressed, longPressed }`. The host is `[pressable]`. Opt-in `juice:longpress` is a separate bubbling cancelable event whose detail is `{ pressed: true, longPressed: true }`. `bind` does not listen for it. `juice:change` carries that gesture afterwards, and the signal follows `juice:change`.
- Touchable-row state is `{ selected, disabled }`. The host is `[touchable-row]`. Later changes dispatch `juice:change` from the host.
- Keyboard-avoider state is `{ open, inset }`. The host is `[keyboard-avoider]`. It does dispatch `juice:change` from each host when `open` flips, or when `inset` moves by at least the runtime threshold from the last published inset while open. It also writes `--juice-keyboard-inset` on `<html>` and `[keyboard-open]` on `<html>` and each host. Smaller inset steps update those and `getState()` without an event, so the signal stays on the last `juice:change`. `bind` does not read the custom property or the attribute.
- All three are read-only. `state.set` updates the signal and does not call a controller.
- `startPressableRuntime`, `startTouchableRowRuntime`, and `startKeyboardAvoiderRuntime` are feature-detected off the Juice module namespace, same as icon-button, avatar, and table. The optional peer stays `@citrusworx/juiceui` `>=0.9.1 <1`. Pressable and touchable-row shipped in juiceui **0.9.4**. Keyboard-avoider shipped in **0.9.5**.

## 1.1.0

Not published yet. Workspace `package.json` is **1.1.0**. npm `latest` stays **1.0.0**.

`@citrusworx/sigjs/juice` `bind` follows pressable, touchable-row, keyboard-avoider, and sheet. That is thirty-two Juice runtime names. Pressable, touchable-row, and keyboard-avoider match published `@citrusworx/juiceui@0.9.5`. Sheet matches **0.9.6**.

- Pressable state is `{ pressed, longPressed }`. The host is `[pressable]`. Opt-in `juice:longpress` is a separate bubbling cancelable event whose detail is `{ pressed: true, longPressed: true }`. `bind` does not listen for it. `juice:change` carries that gesture afterwards, and the signal follows `juice:change`.
- Touchable-row state is `{ selected, disabled }`. The host is `[touchable-row]`. Later changes dispatch `juice:change` from the host.
- Keyboard-avoider state is `{ open, inset }`. The host is `[keyboard-avoider]`. It does dispatch `juice:change` from each host when `open` flips, or when `inset` moves by at least the runtime threshold from the last published inset while open. It also writes `--juice-keyboard-inset` on `<html>` and `[keyboard-open]` on `<html>` and each host. Smaller inset steps update those and `getState()` without an event, so the signal stays on the last `juice:change`. `bind` does not read the custom property or the attribute.
- Sheet state is `{ open, detent, dragging, modal }`. `detent` is `"peek"`, `"half"`, or `"full"`. The host is `[sheet-overlay]`. `juice:change` bubbles from that overlay, with detail `{ runtime: "sheet", state }`. The inner `[sheet]` is the dialog panel and does not dispatch the event. The first observation is silent. Later events fire when `open`, `detent`, `dragging`, or `modal` changes. `bind` is read-only and does not call `open` or `close`.
- All four are read-only. `state.set` updates the signal and does not call a controller.
- `startPressableRuntime`, `startTouchableRowRuntime`, `startKeyboardAvoiderRuntime`, and `startSheetRuntime` are feature-detected off the Juice module namespace, same as icon-button, avatar, and table. Binding one when its start function is missing throws `needs a newer @citrusworx/juiceui`. The optional peer stays `@citrusworx/juiceui` `>=0.9.1 <1`. Icon-button, avatar, and table start functions shipped in juiceui **0.9.3**. Pressable and touchable-row shipped in **0.9.4**. Keyboard-avoider shipped in **0.9.5**. Sheet shipped in **0.9.6**. On **0.9.5** sheet throws.

`yarn version-packages` was not used. No Sig changeset was added. A changeset would bump this manifest on the next version-packages run.

## 1.0.0

Stable release of the API frozen in **0.7.2**. Workspace `package.json` is **1.0.0**. Published to npm **2026-10-29** (`gitHead` `4ef7b2e7`). npm `latest` is **1.0.0**.

No API change from **0.7.2**. The public entries stay `.`, `./jsx-runtime`, `./jsx-dev-runtime`, `./sig-router`, and `./juice`. `Signal.set` still always notifies, including when the value is unchanged. `bindList` and `ListItem` stay experimental. SSR, a virtual DOM, `<For>`, and `<Show>` stay non-goals.

From **1.0.0**, versions follow semver. A breaking change to a documented stable export is a major. A new public API is a minor. A fix that does not change that API is a patch. `^1.0.0` is `>=1.0.0 <2.0.0`. `^0.7.0` does not install **1.0.0**. The optional `@citrusworx/juiceui` peer stays `>=0.9.1 <1`. Widening that peer range is a minor. Narrowing it is a major.

`yarn version-packages` was not used. No Sig changeset was added. A changeset would bump this manifest off **1.0.0** the next time that command runs. The **0.7.2** registry cut was itself published by hand. A Changesets bump from **0.7.0** would have proposed **0.8.0**, which is not this release.

## 0.7.2

Published to npm **2026-10-27** (`gitHead` `c794c06f`, PR #295). npm `latest` moved to **1.0.0** on 2026-10-29. Do not republish.

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
