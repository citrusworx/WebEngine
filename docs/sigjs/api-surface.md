# Sig.js API surface

Freeze inventory for `@citrusworx/sigjs` before v1. npm is **0.4.0** (2026-10-16). This page is the source on `master` after [#258](https://github.com/citrusworx/WebEngine/pull/258) (`bindList`, `untrack`). Behavior and examples stay in [API](./sig-api.md). Maturity labels stay in [Status](./sig-status.md).

Nothing here was removed or renamed. Tags and return types are the only code edits. Breaking cleanups are listed at the end for Drew.

## Classifications

- **stable** — freeze for v1. A later change is a breaking release.
- **experimental** — exported on purpose, and allowed to change. The declaration has a JSDoc `@experimental` tag.
- **internal** — should not be part of the public surface. The declaration has a JSDoc `@internal` tag. `stripInternal` is off, so the name is still in the `.d.ts` and the runtime bundle.

`@internal` / `@experimental` are documentation. They do not hide a runtime export.

## Counts

66 rows in the tables below (each export on each entry point).

| Classification | Rows | What they are |
|---|---|---|
| stable | 61 | Reactivity, JSX, router, Juice `bind`, and the global JSX namespace |
| experimental | 3 | `bindList`, `ListItem`, `ListItem.get` |
| internal | 2 | `captureCleanupScope` on `.`, and `jsxDEV` re-exported from `.` |

De-duplicated symbols: **40 stable**, **3 experimental**, **1 internal** (`captureCleanupScope`). `jsxDEV` is stable on `./jsx-dev-runtime` and internal as a root re-export, so it is both a stable symbol and one internal row.

Five entry points, from `libraries/sig/package.json` `exports`: `.`, `./jsx-runtime`, `./jsx-dev-runtime`, `./sig-router`, `./juice`. No others. `src/node-cleanup.ts` (`attachNodeCleanup`) is not one of them.

A Playwright test snapshots the syntax-level names (`libraries/sig/src/exports.test.ts`). Returned-object members such as `Signal.get` are in this document and not in that snapshot.

## `.`

| Export | Entry point | Kind | Classification | Reason | Notes |
|---|---|---|---|---|---|
| `Signal` | `.` | function | stable | Factory, not a class. This is the library's state primitive. | No exported `Signal<T>` type. Call `Signal(0)`, not `new Signal`. Return type is now explicit. |
| `Signal.get` | `.` | method | stable | A read inside an effect or memo subscribes. | Same name as `SigRouter.get` and `JuiceSignal.get`. Different job. |
| `Signal.set` | `.` | method | stable | Writes the value and notifies every subscriber. | Also notifies when the value is unchanged. Lock that, or change it before v1. |
| `effect` | `.` | function | stable | Runs immediately, re-tracks every run, and returns a disposer. | Also registers on the current cleanup scope. Return type is now explicit. |
| `batch` | `.` | function | stable | Depth counter. Subscribers flush when the outermost call finishes. | A throw still flushes successful sets. Return type is now explicit. |
| `memo` | `.` | function | stable | Lazy derived value with `get` only. | No `set` and no public dispose. Freeze that. |
| `memo.get` | `.` | method | stable | Returns the cached value after the first successful run. | Declared as `T`. Emit used to infer `T` or `undefined` from the empty cache. |
| `untrack` | `.` | function | stable | Reads inside `fn` do not subscribe the surrounding effect or memo. | Added in #258. This is the supported peek. Signature is already the whole contract. |
| `captureCleanupScope` | `.` | function | internal | Component and row cleanup helper. App code should not call it. | Tagged `@internal`. Still exported. Return mentions unexported alias `Cleanup`. |
| `bindList` | `.` | function | experimental | Keyed list from #258. Not in npm 0.4.0. The reconcile rules can still move. | Tagged `@experimental`. Array needs a key function. Map uses iteration order. Duplicate keys throw. |
| `ListItem` | `.` | type | experimental | Name of the per-row getter `bindList` passes to `render`. | Tagged `@experimental`. [API](./sig-api.md) shows the shape and never this name. |
| `ListItem.get` | `.` | method | experimental | `render` reads the current item through this. | A read in `render` is a snapshot. A read in an effect or function child stays live. |
| `jsx` | `.` | function | stable | Turns a tag into a DOM node, or calls a function component once. | `(type: any, props: any): any`. Docs describe a narrower signature. `: any` is now written down. |
| `jsxs` | `.` | const | stable | Alias of `jsx`. The automatic runtime imports this name. | Do not give it different child behavior. |
| `Fragment` | `.` | const | stable | Builds a `DocumentFragment` with the same child rules as a host element. | `props` is `any`. Docs say `{ children?: Child }`. Return type is now explicit. |
| `jsxDEV` | `.` | function | internal | The dev transform does not import this from the package root. | `export *` from `jsx-dev-runtime`. Same function as the dev entry. Do not import it from `.`. |
| `mount` | `.` | function | stable | Disposes the target's current children, then inserts the node. | Return type is now explicit. |
| `disposeTree` | `.` | function | stable | Walks a node and runs the cleanups attached to it. | Defined in `node-cleanup.ts` and re-exported. `attachNodeCleanup` is not public. |
| `Child` | `.` | type | stable | Nodes, text, null, arrays, and text-only functions. | The function arm is `() => any`. |
| `SigRouter` | `.` | class | stable | Exact paths, `:param` segments, and an optional `"*"` fallback. | No splat. [Status](./sig-status.md) still says Emerging. These methods are the freeze set. |
| `SigRouter.constructor` | `.` | method | stable | Mount selector. Default `#root`. | A string, not an element. |
| `SigRouter.set` | `.` | method | stable | Registers one route or a map, and returns `this`. | A map key without a leading `/` is also stored as a name. Implementation return type is now explicit. |
| `SigRouter.get` | `.` | method | stable | Returns a registered path or pattern. | Does not fill `:param` placeholders. Not `Signal.get`. |
| `SigRouter.start` | `.` | method | stable | Attaches click and `popstate` listeners, then renders the current path. | A second call renders again and does not stack listeners. Return type is now explicit. |
| `SigRouter.navigate` | `.` | method | stable | Normalizes a leading slash, then `pushState` and render. | No match and no `"*"` is a no-op. Return type is now explicit. |
| `SigRouter.goBack` | `.` | method | stable | Calls `history.back()`. | Return type is now explicit. |
| `SigRouter.stop` | `.` | method | stable | Removes the click and `popstate` listeners. | Does not clear the current view. Return type is now explicit. |
| `SigRouter.has` | `.` | method | stable | True only when that path string was registered. | `has("/user/42")` is false after `set("/user/:id")`. It is not a match test. |
| `RouteParams` | `.` | type | stable | `Record<string, string>` of matched `:param` values. | |
| `RouteFactory` | `.` | type | stable | `(params) => Node` or null. The router calls it on every visit. | A prebuilt `Node` is reused as-is. Factories are the blessed view. |
| `RouteView` | `.` | type | stable | `Node`, `RouteFactory`, or null. | |
| `RouteMap` | `.` | type | stable | Object argument to `SigRouter.set`. | The name says Map. The type is a record. [API](./sig-api.md) inlines the shape and skips this name. |
| `JSX.Element` | `.` | type | stable | Global JSX element type is `Node`. | Declared in `src/jsx.ts`. Loading `.` applies it. `./jsx-runtime` does not export a `JSX` namespace. |
| `JSX.IntrinsicElements` | `.` | interface | stable | Any tag name is legal. | Index signature is `any`, so props are unchecked. Unknown keys become attributes at runtime. |
| `JSX.ElementChildrenAttribute` | `.` | interface | stable | Children are taken from `props.children`. | The `children` field is typed as `{}`. |

## `./jsx-runtime`

| Export | Entry point | Kind | Classification | Reason | Notes |
|---|---|---|---|---|---|
| `jsx` | `./jsx-runtime` | function | stable | Production automatic-runtime factory. | Same function as `.`. `(type: any, props: any): any`. |
| `jsxs` | `./jsx-runtime` | const | stable | Alias of `jsx` required by the automatic runtime. | |
| `Fragment` | `./jsx-runtime` | const | stable | Fragment factory required by the automatic runtime. | `props` is `any`. |
| `mount` | `./jsx-runtime` | function | stable | Same `mount` as the package root. | Wider than a JSX transform entry. Already reachable, so v1 keeps it. |
| `disposeTree` | `./jsx-runtime` | function | stable | Same `disposeTree` as the package root. | Same note as `mount`. |
| `Child` | `./jsx-runtime` | type | stable | Public child-model type, defined next to the factory. | `() => any`. |

## `./jsx-dev-runtime`

| Export | Entry point | Kind | Classification | Reason | Notes |
|---|---|---|---|---|---|
| `jsxDEV` | `./jsx-dev-runtime` | function | stable | `jsx: react-jsxdev` imports this name and the extra arguments. | `key`, static children, source, and self are accepted and ignored. Keyed lists are `bindList`. Return type is explicit `any`. |
| `jsxs` | `./jsx-dev-runtime` | const | stable | Re-exported so the dev runtime module is a full JSX entry. | Same alias as `jsx`. |
| `Fragment` | `./jsx-dev-runtime` | const | stable | Re-exported so the dev runtime can create fragments. | |

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
| `bind` | `./juice` | function | stable | Optional host adapter. Returns `{ state, dispose }`. | Published in 0.4.0. Throws if the runtime cannot be inferred or `getState()` is null. |
| `JuiceBinding` | `./juice` | type | stable | Return type of `bind`. | |
| `JuiceBinding.state` | `./juice` | property | stable | Host state copied into a signal-shaped object. | A `JuiceSignal`, not the object `Signal()` returns. |
| `JuiceBinding.dispose` | `./juice` | method | stable | Drops the host listeners. A second call does nothing. | A `bind` during Sig render also disposes on unmount. |
| `JuiceSignal` | `./juice` | type | stable | `{ get, set }` used by the binding. | Close to `Signal`'s return shape. There is still no shared `Signal<T>` type. |
| `JuiceSignal.get` | `./juice` | method | stable | Reads the latest copied state. | |
| `JuiceSignal.set` | `./juice` | method | stable | Publishes a new state through the binding. | Write-back is switch, checkbox, disclosure, and modal. The other twenty-one runtimes ignore `set`. |
| `JuiceRuntimeName` | `./juice` | type | stable | The twenty-five runtime names `bind` accepts. | Adding a name is additive. Renaming one is breaking. |
| `JuiceRuntimeState` | `./juice` | type | stable | Maps each runtime name to the Juice state type. | Follows `@citrusworx/juiceui`. A breaking Juice state change breaks this type. |

## Smells

**Naming.** `Signal` is a PascalCase factory. `effect`, `batch`, `memo`, `untrack`, `bind`, and `bindList` are camelCase functions. `SigRouter` is a class. `RouteMap` is a record. `has` sounds like a match test and only checks registration. `get` on the router returns a pattern; `get` on a signal returns a value; `set` on a Juice binding sometimes writes the host and sometimes does not.

**Overlapping helpers.** Four public read shapes: `Signal()`'s `{ get, set }`, `memo`'s `{ get }`, `ListItem`'s `{ get }`, and `JuiceSignal`'s `{ get, set }`. `jsx`, `jsxs`, and `jsxDEV` are one factory under three names. `mount`, `disposeTree`, and the disposer from `bindList` all tear trees down. `replaceChildren` is the non-keyed list and is DOM, not an export.

**`any` on the public signature.** `jsx` and `jsxDEV` take and return `any`. `Fragment` takes `any`. `Child` includes `() => any`. `JSX.IntrinsicElements` is an `any` index. [API](./sig-api.md) already writes `jsx` as `(type: string or Function, props: any) => Node`. The types are wider than the prose.

**Leaky internal types.** `effect`'s parameter is the unexported alias `EffectCallback`. `captureCleanupScope`'s `dispose` is the unexported alias `Cleanup`. Both names show up in `signal.d.ts`. They are not importable. `attachNodeCleanup` is exported from `src/node-cleanup.ts`, and that file is in the published `dist/` tarball (`files` includes `dist`), but `exports` blocks the import. Keep it that way.

**Docs vs exports.**

- [API](./sig-api.md) now lists `untrack`, `bindList`, and `jsxDEV` in the root sentence and points here. It still does not give `jsxDEV` its own section.
- `ListItem`, `RouteMap`, `JuiceSignal`, `JuiceRuntimeName`, and `JuiceRuntimeState` are exported. The API page inlines some of those shapes and does not name them, except `ListItem` next to `bindList`.
- The package README subpath table now names `captureCleanupScope`, the root `jsxDEV` re-export, `disposeTree`, `Child`, and the dev-runtime `jsxs` / `Fragment`.
- `JSX.Element`, `JSX.IntrinsicElements`, and `JSX.ElementChildrenAttribute` are public only as a global augmentation on `.`.

**JSX namespace placement.** `declare global { namespace JSX }` lives in `src/jsx.ts`. The root entry pulls that module in. `./jsx-runtime` and `./jsx-dev-runtime` do not export a `JSX` namespace. TypeScript looks for a `JSX` export on the runtime module, then falls back to the global. A file that sets `jsxImportSource` and never imports the root fails with TS7026 (`JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists`). The counter example imports the root, so that program is covered. The namespace should live on the runtime entries before v1.

**`memo.get` inference.** The cache starts unset, so TypeScript inferred `T` or `undefined`. The function always computes before that read returns. The signature is now `{ get(): T }`, which is what the API page already said. No runtime change.

**Signal and effect docs.** Their JSDoc sat above private aliases, so it did not attach to the functions. It now sits on `Signal` and `effect`.

## Recommended changes before v1

Drew decides these. This patch does none of them.

1. **Hide `captureCleanupScope`.** Drop it from `.` in a breaking release, or stop exporting it once callers are gone. The `@internal` tag is a marker, not a removal.
2. **Stop exporting `jsxDEV` from `.`.** Keep it on `./jsx-dev-runtime` only. Importing it from the root is an `export *` accident.
3. **Lock `Signal.set`.** Either the v1 contract is "always notifies, even when the value is the same", or an opt-in compare ships before the freeze. Do not change notification in a patch.
4. **Keep `bindList` and `ListItem` experimental** until the array/Map overloads, the duplicate-key throw, and focus restore are accepted. Then remove `@experimental`. Do not mark them stable in the same breath as `Signal`.
5. **Replace public `any`.** Give `jsx` / `jsxDEV` / `Fragment` / `Child` / `JSX.IntrinsicElements` real types. That can break callers who used `any`. Do it as its own change, not inside a return-type pass.
6. **Export `namespace JSX` from `./jsx-runtime` and `./jsx-dev-runtime`.** `jsxImportSource` should not depend on a side-effect import of the root. This adds public types, so it is a decision.
7. **Inline `Cleanup` and `EffectCallback`** in the public signatures so `signal.d.ts` does not mention unexported names. The structural type stays the same.
8. **Do not add a `Signal<T>` type unless the overlapping shapes should collapse.** `JuiceSignal`, `ListItem`, and `memo`'s `{ get }` would then be described against one name. A new export waits.
9. **Name the missing types in [API](./sig-api.md)** (`ListItem`, `RouteMap`, `jsxDEV`, the Juice types) or keep this page as the only inventory. The API page's root sentence already points here.
10. **Do not add `./node-cleanup`.** `attachNodeCleanup` stays off the public map.
11. **Freeze router `get` and `has`.** `get` returns the pattern. `has` is registration only. A param URL helper is a new function, not a quiet change to `get`. A future splat must not redefine `"*"`.
12. **Freeze Juice write-back** at switch, checkbox, disclosure, and modal. `state.set` on the other twenty-one runtimes is a no-op. Teaching another runtime to write back is a behavior change.
13. **Keep the names.** Do not rename `Signal` to `signal`. Do not split `jsxs` from `jsx`. Do not add `memo` dispose.

## What this patch changed

- `@experimental` on `bindList` and `ListItem`.
- `@internal` on `captureCleanupScope`.
- Explicit return types on `Signal`, `batch`, `memo`, `effect`, `jsx`, `mount`, `Fragment`, `jsxDEV`, and `SigRouter.set` / `start` / `navigate` / `goBack` / `stop`.
- `memo().get()` declared as `T`.
- `libraries/sig/src/exports.test.ts` snapshots export names with no new dependency.

`libraries/sig/src/exports.test.ts` is the guard. Adding, removing, or moving an export fails that test until this document and the snapshot are updated together.
