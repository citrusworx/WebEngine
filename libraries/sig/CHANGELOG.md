# @citrusworx/sigjs

## 0.2.0

### Minor Changes

- Nested-safe, exception-safe `batch()`: inner `batch()` calls do not flush; subscribers run when the outermost batch ends. A throw still decrements depth, resets batching, and flushes sets that already happened.
- `memo()` derived values: lazy, cached, and subscribed through the same effect graph as `Signal`.
- `effect` cleanup and dispose: return a function from the callback to run before the next execution and on dispose; `effect()` returns a disposer. Disposed effects ignore later `set`s.
- JSX function children subscribe as reactive text nodes (`{() => count.get()}`).
- JSX function-valued host props subscribe via `effect` (except `ref` and `on*`). `className`, `class`, `value`, `checked`, `hidden`, `disabled`, and other attributes/properties update in place.
- `SigRouter` matching: exact path first, then `:param` segments (decoded into the view factory's `params` argument), then an optional `*` fallback. Exact routes win over a colliding param pattern.
- `SigRouter.navigate` normalizes paths the same way as `set` / `has` (`"about"` → `"/about"`). Unknown paths are a no-op unless `*` is registered.
- Route factories receive a fresh tree on each visit; the previous view is disposed with `disposeTree` on navigate. `stop()` removes click and `popstate` listeners.
- Published subpath exports: `.`, `./jsx-runtime`, `./jsx-dev-runtime`, `./sig-router`, each with types. Tests are excluded from `dist`. Zero runtime dependencies.

## 0.1.0

### Minor Changes

- Added READMEs to each

## 0.0.2

### Patch Changes

- e7a1584: Release preparation
- e7a1584: Standardize library package manifests for independent publishing, align build outputs with published entrypoints, and add Changesets-based release automation for the monorepo.
