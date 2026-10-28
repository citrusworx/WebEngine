# Sig.js API surface

Freeze inventory for `@citrusworx/sigjs` before v1. This page describes the workspace tree (`libraries/sig/package.json` **0.7.2**). That matches npm latest (2026-10-27, PR #295). **0.6.0** (2026-10-21) still exports `captureCleanupScope` and `jsxDEV` from the package root. **0.7.0** removed those two from `.`. Behavior and examples stay in [API](./sig-api.md). Maturity labels stay in [Status](./sig-status.md).

Two root names came off the public entry: `captureCleanupScope` (internal module only) and `jsxDEV` (still on `./jsx-dev-runtime`). `Signal.set` always notifies, including when the value is unchanged, and that is frozen for v1. `bindList` and `ListItem` stay experimental.

## Classifications

- **stable** — freeze for v1. A later change is a breaking release.
- **experimental** — exported on purpose, and allowed to change. The declaration has a JSDoc `@experimental` tag.
- **internal** — not a package entry. `captureCleanupScope` lives in `src/cleanup-scope.ts`. The file is emitted into `dist/` because the runtime imports it, and `package.json` `exports` does not expose it. Same rule as `attachNodeCleanup`.

## Counts

76 rows in the tables below (each export on each entry point).

| Classification | Rows | What they are |
|---|---|---|
| stable | 73 | Reactivity, JSX, router, Juice `bind`, and the `JSX` namespace |
| experimental | 3 | `bindList`, `ListItem`, `ListItem.get` |
| internal | 0 | `captureCleanupScope` is no longer an entry-point row |

De-duplicated symbols: **42 stable**, **3 experimental**, **0 internal**. `JSX` and `JSX.IntrinsicAttributes` are the two stable symbols added with the namespace export. `jsxDEV` is stable on `./jsx-dev-runtime` only.

Five entry points, from `libraries/sig/package.json` `exports`: `.`, `./jsx-runtime`, `./jsx-dev-runtime`, `./sig-router`, `./juice`. No others. `src/cleanup-scope.ts` (`captureCleanupScope`) and `src/node-cleanup.ts` (`attachNodeCleanup`) are not among them.

A Playwright test snapshots the syntax-level names (`libraries/sig/src/exports.test.ts`). Returned-object members such as `Signal.get` are in this document and not in that snapshot. `libraries/sig/src/jsx-namespace.test.ts` typechecks a file that sets `jsxImportSource` and does not import the package root.

## `.`

| Export | Entry point | Kind | Classification | Reason | Notes |
|---|---|---|---|---|---|
| `Signal` | `.` | function | stable | Factory, not a class. This is the library's state primitive. | No exported `Signal<T>` type. Call `Signal(0)`, not `new Signal`. Return type is explicit. |
| `Signal.get` | `.` | method | stable | A read inside an effect or memo subscribes. | Same name as `SigRouter.get` and `JuiceSignal.get`. Different job. |
| `Signal.set` | `.` | method | stable | Writes the value and notifies every subscriber. | Frozen for v1: always notifies, even when the value is unchanged. No equality check. |
| `effect` | `.` | function | stable | Runs immediately, re-tracks every run, and returns a disposer. | Also registers on the current cleanup scope. Return type is explicit. |
| `batch` | `.` | function | stable | Depth counter. Subscribers flush when the outermost call finishes. | A throw still flushes successful sets. Return type is explicit. |
| `memo` | `.` | function | stable | Lazy derived value with `get` only. | No `set` and no public dispose. Freeze that. |
| `memo.get` | `.` | method | stable | Returns the cached value after the first successful run. | Declared as `T`. |
| `untrack` | `.` | function | stable | Reads inside `fn` do not subscribe the surrounding effect or memo. | This is the supported peek. Signature is the whole contract. |
| `bindList` | `.` | function | experimental | Keyed list. The reconcile rules can still move. | Tagged `@experimental`. Array needs a key function. Map uses iteration order. Duplicate keys throw. |
| `ListItem` | `.` | type | experimental | Name of the per-row getter `bindList` passes to `render`. | Tagged `@experimental`. [API](./sig-api.md) shows the shape and never this name. |
| `ListItem.get` | `.` | method | experimental | `render` reads the current item through this. | A read in `render` is a snapshot. A read in an effect or function child stays live. |
| `jsx` | `.` | function | stable | Turns a tag into a DOM node, or calls a function component once. | `(type: string, props?) => Node` and `<P>(type: (props: P) => Node, props?) => Node`. Host props are `JSX.IntrinsicElements[string]`. |
| `jsxs` | `.` | const | stable | Alias of `jsx`. The automatic runtime imports this name. | Do not give it different child behavior. |
| `Fragment` | `.` | const | stable | Builds a `DocumentFragment` with the same child rules as a host element. | `props` is `{ children?: Child } \| null`. Return type is `DocumentFragment`. |
| `mount` | `.` | function | stable | Disposes the target's current children, then inserts the node. | Return type is explicit. |
| `disposeTree` | `.` | function | stable | Walks a node and runs the cleanups attached to it. | Defined in `node-cleanup.ts` and re-exported. `attachNodeCleanup` is not public. |
| `Child` | `.` | type | stable | Nodes, text, null, arrays, and text-only functions. | The function arm is `() => string \| number \| boolean \| null \| undefined`. The runtime does `String(child())`. |
| `JSX` | `.` | namespace | stable | Element type, intrinsic props, and the `key` attribute. | Also declared globally when `.` is loaded. Same namespace as the runtime entries. |
| `SigRouter` | `.` | class | stable | Exact paths, `:param` segments, and an optional `"*"` fallback. | No splat. [Status](./sig-status.md) still says Emerging. These methods are the freeze set. |
| `SigRouter.constructor` | `.` | method | stable | Mount selector. Default `#root`. | A string, not an element. |
| `SigRouter.set` | `.` | method | stable | Registers one route or a map, and returns `this`. | A map key without a leading `/` is also stored as a name. Implementation return type is explicit. |
| `SigRouter.get` | `.` | method | stable | Returns a registered path or pattern. | Does not fill `:param` placeholders. Not `Signal.get`. |
| `SigRouter.start` | `.` | method | stable | Attaches click and `popstate` listeners, then renders the current path. | A second call renders again and does not stack listeners. Return type is explicit. |
| `SigRouter.navigate` | `.` | method | stable | Normalizes a leading slash, then `pushState` and render. | No match and no `"*"` is a no-op. Return type is explicit. |
| `SigRouter.goBack` | `.` | method | stable | Calls `history.back()`. | Return type is explicit. |
| `SigRouter.stop` | `.` | method | stable | Removes the click and `popstate` listeners. | Does not clear the current view. Return type is explicit. |
| `SigRouter.has` | `.` | method | stable | True only when that path string was registered. | `has("/user/42")` is false after `set("/user/:id")`. It is not a match test. |
| `RouteParams` | `.` | type | stable | `Record<string, string>` of matched `:param` values. | |
| `RouteFactory` | `.` | type | stable | `(params) => Node` or null. The router calls it on every visit. | A prebuilt `Node` is reused as-is. Factories are the blessed view. |
| `RouteView` | `.` | type | stable | `Node`, `RouteFactory`, or null. | |
| `RouteMap` | `.` | type | stable | Object argument to `SigRouter.set`. | The name says Map. The type is a record. [API](./sig-api.md) inlines the shape and skips this name. |
| `JSX.Element` | `.` | type | stable | JSX element type is `Node`. | Declared in `src/jsx.ts` and exported from the runtime entries. |
| `JSX.IntrinsicElements` | `.` | interface | stable | Any tag name is legal. | Props are text, boolean, null, a reactive getter, an event listener, a ref, a style object, or `Child`. Unknown keys become attributes at runtime. Not `any`. |
| `JSX.ElementChildrenAttribute` | `.` | interface | stable | Children are taken from `props.children`. | The `children` field is typed as `{}`. |
| `JSX.IntrinsicAttributes` | `.` | interface | stable | `key` is optional `string \| number`. | The runtime ignores `key`. Keyed lists are `bindList`. |

## `./jsx-runtime`

| Export | Entry point | Kind | Classification | Reason | Notes |
|---|---|---|---|---|---|
| `jsx` | `./jsx-runtime` | function | stable | Production automatic-runtime factory. | Same function as `.`. |
| `jsxs` | `./jsx-runtime` | const | stable | Alias of `jsx` required by the automatic runtime. | |
| `Fragment` | `./jsx-runtime` | const | stable | Fragment factory required by the automatic runtime. | `{ children?: Child } \| null`. |
| `mount` | `./jsx-runtime` | function | stable | Same `mount` as the package root. | Wider than a JSX transform entry. Already reachable, so v1 keeps it. |
| `disposeTree` | `./jsx-runtime` | function | stable | Same `disposeTree` as the package root. | Same note as `mount`. |
| `Child` | `./jsx-runtime` | type | stable | Public child-model type, defined next to the factory. | Text-only function arm. |
| `JSX` | `./jsx-runtime` | namespace | stable | What `jsxImportSource` resolves. | A file that never imports `.` still sees `JSX.IntrinsicElements`. |
| `JSX.Element` | `./jsx-runtime` | type | stable | Same as `.`. | |
| `JSX.IntrinsicElements` | `./jsx-runtime` | interface | stable | Same as `.`. | |
| `JSX.ElementChildrenAttribute` | `./jsx-runtime` | interface | stable | Same as `.`. | |
| `JSX.IntrinsicAttributes` | `./jsx-runtime` | interface | stable | Same as `.`. | |

## `./jsx-dev-runtime`

| Export | Entry point | Kind | Classification | Reason | Notes |
|---|---|---|---|---|---|
| `jsxDEV` | `./jsx-dev-runtime` | function | stable | `jsx: react-jsxdev` imports this name and the extra arguments. | `key`, static children, source, and self are `unknown` and ignored. Keyed lists are `bindList`. Return type is `Node`. |
| `jsxs` | `./jsx-dev-runtime` | const | stable | Re-exported so the dev runtime module is a full JSX entry. | Same alias as `jsx`. |
| `Fragment` | `./jsx-dev-runtime` | const | stable | Re-exported so the dev runtime can create fragments. | |
| `JSX` | `./jsx-dev-runtime` | namespace | stable | Same namespace as `./jsx-runtime`. | Dev `jsxImportSource` resolves it here. |
| `JSX.Element` | `./jsx-dev-runtime` | type | stable | Same as `.`. | |
| `JSX.IntrinsicElements` | `./jsx-dev-runtime` | interface | stable | Same as `.`. | |
| `JSX.ElementChildrenAttribute` | `./jsx-dev-runtime` | interface | stable | Same as `.`. | |
| `JSX.IntrinsicAttributes` | `./jsx-dev-runtime` | interface | stable | Same as `.`. | |

## `./sig-router`

| Export | Entry point | Kind | Classification | Reason | Notes |
|---|---|---|---|---|---|
| `SigRouter` | `./sig-router` | class | stable | Same class as the package root, without pulling in JSX. | |
| `SigRouter.constructor` | `./sig-router` | method | stable | Same as `.`. | |
| `SigRouter.set` | `./sig-router` | method | stable | Same as `.`. | |
| `SigRouter.get` | `./sig-router` | method | stable | Same as `.`. | Returns the pattern, not a filled URL. |
| `SigRouter.start` | `./sig-router` | method | stable | Same as `.`. | |
| `SigRouter.navigate` | `./sig-router` | method | stable | Same as `.`. | |
| `SigRouter.goBack` | `./sig-router` | method | stable | Same as `.`. | |
| `SigRouter.stop` | `./sig-router` | method | stable | Same as `.`. | |
| `SigRouter.has` | `./sig-router` | method | stable | Same as `.`. | Registration check, not a match test. |
| `RouteParams` | `./sig-router` | type | stable | Same as `.`. | |
| `RouteFactory` | `./sig-router` | type | stable | Same as `.`. | |
| `RouteView` | `./sig-router` | type | stable | Same as `.`. | |
| `RouteMap` | `./sig-router` | type | stable | Same as `.`. | Record, not a `Map`. |

## `./juice`

Not re-exported from `.`. The main entry does not import Juice.

| Export | Entry point | Kind | Classification | Reason | Notes |
|---|---|---|---|---|---|
| `bind` | `./juice` | function | stable | Optional host adapter. Returns `{ state, dispose }`. | Published in 0.4.0. Twenty-eight names, including icon-button, avatar, and table, are in npm 0.7.2. Throws if the runtime cannot be inferred or `getState()` is null. Binding icon-button, avatar, or table when that start function is missing throws `needs a newer @citrusworx/juiceui`. |
| `JuiceBinding` | `./juice` | type | stable | Return type of `bind`. | |
| `JuiceBinding.state` | `./juice` | property | stable | Host state copied into a signal-shaped object. | A `JuiceSignal`, not the object `Signal()` returns. |
| `JuiceBinding.dispose` | `./juice` | method | stable | Drops the host listeners. A second call does nothing. | A `bind` during Sig render also disposes on unmount, through `effect` and the internal cleanup scope. |
| `JuiceSignal` | `./juice` | type | stable | `{ get, set }` used by the binding. | Close to `Signal`'s return shape. There is still no shared `Signal<T>` type. |
| `JuiceSignal.get` | `./juice` | method | stable | Reads the latest copied state. | |
| `JuiceSignal.set` | `./juice` | method | stable | Publishes a new state through the binding. | Write-back is switch, checkbox, disclosure, modal, and icon-button (`pressed`, `[toggle]` hosts only; a refused write snaps the signal back). Avatar, table, and the other read-only names do not call a controller. |
| `JuiceRuntimeName` | `./juice` | type | stable | The twenty-eight runtime names `bind` accepts, including `icon-button`, `avatar`, and `table`. | Adding a name is additive. Renaming one is breaking. Binding one of those three when Juice does not export its start function throws `needs a newer @citrusworx/juiceui`. |
| `JuiceRuntimeState` | `./juice` | type | stable | Maps each runtime name to the Juice state type. | Follows `@citrusworx/juiceui`. A breaking Juice state change breaks this type. |

## Smells

**Naming.** `Signal` is a PascalCase factory. `effect`, `batch`, `memo`, `untrack`, `bind`, and `bindList` are camelCase functions. `SigRouter` is a class. `RouteMap` is a record. `has` sounds like a match test and only checks registration. `get` on the router returns a pattern; `get` on a signal returns a value; `set` on a Juice binding sometimes writes the host and sometimes does not.

**Overlapping helpers.** Four public read shapes: `Signal()`'s `{ get, set }`, `memo`'s `{ get }`, `ListItem`'s `{ get }`, and `JuiceSignal`'s `{ get, set }`. `jsx`, `jsxs`, and `jsxDEV` are one factory under three names. `mount`, `disposeTree`, and the disposer from `bindList` all tear trees down. `replaceChildren` is the non-keyed list and is DOM, not an export.

**Host props stay open.** `JSX.IntrinsicElements` is an index of attribute values, not a closed HTML map. Juice attributes (`stack`, `gap`, `accordion`) are legal keys. A function value is a reactive getter, except `ref` and `on*`. Function children return text. That is the typed contract. It is not `any`.

**Leaky internal types.** `effect`'s parameter is the unexported alias `EffectCallback`. That name can show up in `signal.d.ts`. It is not importable. `captureCleanupScope` is no longer on that path. `attachNodeCleanup` is exported from `src/node-cleanup.ts`, and that file is in the published `dist/` tarball (`files` includes `dist`), but `exports` blocks the import. `src/cleanup-scope.ts` is the same kind of file. Keep both that way.

**Docs vs exports.**

- [API](./sig-api.md) lists the root exports and points here. `jsxDEV` is documented on `./jsx-dev-runtime`, not on `.`.
- `ListItem`, `RouteMap`, `JuiceSignal`, `JuiceRuntimeName`, and `JuiceRuntimeState` are exported. The API page inlines some of those shapes and does not name them, except `ListItem` next to `bindList`.
- `JSX.Element`, `JSX.IntrinsicElements`, `JSX.ElementChildrenAttribute`, and `JSX.IntrinsicAttributes` are exported from `.`, `./jsx-runtime`, and `./jsx-dev-runtime`. Loading `.` also applies the global namespace.

**JSX namespace placement.** `export namespace JSX` lives in `src/jsx.ts`. `./jsx-runtime` and `./jsx-dev-runtime` re-export it. TypeScript looks for that export when `jsxImportSource` is set, then falls back to the global. A file that never imports the root typechecks. `libraries/sig/src/jsx-namespace.test.ts` is the guard.

**`memo.get` inference.** The signature is `{ get(): T }`. No runtime change.

**Signal.set.** Notification does not compare the previous value. `count.set(1)` while the signal already holds `1` runs subscribers again. Frozen for v1. An equality check would be a breaking behavior change.

## Still open before a 1.0 publish

These are decisions, not this cleanup. `bindList` stays experimental until they are accepted.

1. **Keep `bindList` and `ListItem` experimental** until the array/Map overloads, the duplicate-key throw, and focus restore are accepted. Then remove `@experimental`. Do not mark them stable in the same breath as `Signal`.
2. **Inline `EffectCallback`** in `effect`'s public signature so `signal.d.ts` does not mention the unexported name. The structural type stays the same.
3. **Do not add a `Signal<T>` type unless the overlapping shapes should collapse.** `JuiceSignal`, `ListItem`, and `memo`'s `{ get }` would then be described against one name. A new export waits.
4. **Name the missing types in [API](./sig-api.md)** (`ListItem`, `RouteMap`, the Juice types) or keep this page as the only inventory. The API page's root sentence already points here.
5. **Do not add `./node-cleanup` or `./cleanup-scope`.** `attachNodeCleanup` and `captureCleanupScope` stay off the public map.
6. **Freeze router `get` and `has`.** `get` returns the pattern. `has` is registration only. A param URL helper is a new function, not a quiet change to `get`. A future splat must not redefine `"*"`.
7. **Freeze Juice write-back** at switch, checkbox, disclosure, modal, and icon-button (`pressed`, `[toggle]` hosts only). Avatar and table stay read-only. `state.set` on the other read-only runtimes does not call a controller. Teaching another runtime to write back is a behavior change.
8. **Keep the names.** Do not rename `Signal` to `signal`. Do not split `jsxs` from `jsx`. Do not add `memo` dispose.

## What this cleanup changed

- Removed `captureCleanupScope` from `.`. It lives in `src/cleanup-scope.ts`. JSX components, `bindList` rows, and `@citrusworx/sigjs/juice` `bind` still use that scope.
- Stopped re-exporting `jsxDEV` from `.`. It stays on `./jsx-dev-runtime`.
- Replaced public `any` on `jsx`, `jsxDEV`, `Fragment`, `Child`, and `JSX.IntrinsicElements`.
- Exported `namespace JSX` from `./jsx-runtime` and `./jsx-dev-runtime`, including `JSX.IntrinsicAttributes`.
- Documented `Signal.set` as always-notify, frozen for v1. The same-value notify test is `libraries/sig/src/signal.test.ts`.

`libraries/sig/src/exports.test.ts` is the guard. Adding, removing, or moving an export fails that test until this document and the snapshot are updated together.
