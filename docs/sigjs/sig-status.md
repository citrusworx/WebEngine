# Sig.js Project Status

## Current version

**0.2.0** — published as `@citrusworx/sigjs`. Pre-1.0: the core API is in use, but the package is still alpha.

Sig.js is a **standalone** library. It does not import WebEngine, Nectarine, Seltzer, or Juice. Those products may depend on it; it does not depend on them.

## What 0.2.0 includes

Verified against `libraries/sig/src/signal.ts`, `jsx-runtime.ts`, and `sig-router.ts`:

| Area | Status |
|------|--------|
| `Signal` / `effect` / `batch` / `memo` | Available. `batch` is nested-safe and exception-safe. |
| Effect cleanup + dispose | Available |
| JSX → real DOM | Available (`jsx`, `jsxs`, `jsxDEV`, `Fragment`) |
| Function children (reactive text) | Available |
| Function host props (reactive, except `ref` / `on*`) | Available |
| `mount` / `disposeTree` | Available |
| `SigRouter` exact paths | Available |
| `SigRouter` `:param` factories | Available |
| `SigRouter` `*` fallback | Available |
| Named routes, link intercept, `stop()` | Available |
| Subpath exports + types | `.`, `./jsx-runtime`, `./jsx-dev-runtime`, `./sig-router` |
| Runtime npm dependencies | None |
| Tests in published `dist` | Excluded |

## Known limitations

1. **Client-only.** No SSR or hydration.
2. **Function children are text.** `{() => <span/>}` stringifies; it does not mount an element. Rebuild lists with `effect` + `ref` if you need live child *nodes*.
3. **No keyed reconciliation.** The router replaces the whole view on navigate.
4. **No DevTools extension.**
5. **No built-in fetch, forms, or persistence.** Use `fetch`, `localStorage`, and the examples.

## Architecture

```
@citrusworx/sigjs
├── signal.ts        Signal, effect, batch, memo, captureCleanupScope
├── jsx-runtime.ts   jsx / jsxs / Fragment / mount / disposeTree
├── jsx-dev-runtime.ts
├── jsx.ts           JSX namespace types
└── sig-router.ts    exact → :param → *
```

## Roadmap

- **0.2.x** — docs, examples, packaging polish (this work)
- **Later** — optional list helper for node children, error boundaries, SSR if there is a real consumer
- **1.0** — stable API guarantee

## Also used by

Inside this monorepo, Juice and a few apps import `@citrusworx/sigjs` as a normal dependency. That is optional for you. See [Sig.js + Juice](./sig-juice-integration.md) only if you are already on Juice.

## Tests

```bash
yarn workspace @citrusworx/sigjs test
```

- `signal.test.ts` — signals, nested `batch`, `memo`, dispose
- `jsx.test.ts` — function children and function props
- `router.test.ts` — exact, `:param`, `*`, navigate normalization

## Comparison (rough)

| | Sig.js | React | Solid |
|--|--------|-------|-------|
| Size | small (no VDOM) | larger | small |
| Updates | per subscribed node | subtree | per subscribed node |
| JSX | yes, to DOM | yes, to VDOM | yes, to DOM |
| Maturity | alpha (0.2) | mature | mature |
