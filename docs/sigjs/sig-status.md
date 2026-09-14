# Sig.js Status

Honest snapshot of `@citrusworx/sigjs` **0.2.0** against `libraries/sig/src`.

## Maturity

**Alpha.** The reactivity core, JSX factory, and exact-path router are implemented and covered by Playwright tests. The API is small enough to describe, but this is pre-1.0: names and behavior can still move.

Workspace index calls this **Active alpha**. That matches the code better than “beta” or “production ready.”

## What is shipped

| Area | In source | Notes |
|---|---|---|
| `Signal(value)` factory | `signal.ts` | `get` / `set` only |
| `effect` + cleanup + dispose | `signal.ts` | Returns disposer |
| `batch` | `signal.ts` | Boolean flag, not nested-safe |
| `memo` | `signal.ts` | `{ get }` cache |
| `captureCleanupScope` | `signal.ts` | Used by JSX components |
| JSX → real DOM | `jsx-runtime.ts` | No VDOM |
| Function-child **text** | `jsx-runtime.ts` | `String(child())` |
| `ref`, `on*` events | `jsx-runtime.ts` | |
| `mount` / `disposeTree` | `jsx-runtime.ts` | |
| `Fragment` | `jsx-runtime.ts` | `DocumentFragment` |
| `SigRouter` exact paths | `sig-router.ts` | Named routes, click + popstate |
| View dispose on navigate | `sig-router.ts` | `disposeTree` |
| Package exports | `package.json` | root, jsx-runtime, jsx-dev-runtime, sig-router |

## What is not shipped

| Claim you may have seen | Reality |
|---|---|
| `new Signal(0)` | Not a constructor |
| `useEffect` / hooks | Not present |
| Reactive `className={() =>}` / `value={() =>}` | Assigned once, not subscribed |
| Function children that return elements or mapped lists | Become `String(…)` text |
| `/user/:id` route params | Literal path only |
| SSR / hydration | Client DOM only |
| Error boundaries | Uncaught |
| DevTools | None |
| Built-in fetch / forms / persistence | Use the platform |

`memo` **is** implemented. Older roadmap text that listed “derived signals” as v0.4 was stale.

## What “surgical updates” actually means

Sig.js does not re-render a component function when a signal changes.

- A function child updates **one text node**.
- An `effect` runs your callback; you decide which properties to write.
- A list example that calls `replaceChildren` rebuilds those children. That is your code, not a reconciler.

If you put `{count.get()}` in JSX without a function wrapper, you get a static text node from the first render.

## Tests

- `libraries/sig/src/signal.test.ts` — init, set, effect run/re-run, cleanup, dispose
- `libraries/sig/src/router.test.ts` — navigation and registration

```bash
yarn workspace @citrusworx/sigjs test
```

## Integration (what is real)

**Juice.** Complementary: Juice attributes are HTML attributes; Sig writes them at create time. Import `@citrusworx/juiceui/styles` plus a theme. There is no `Button` export from Juice for Sig to mount.

**Nectarine / Grapevine / Seltzer.** No typed client bindings. Fetch Nectarine-backed HTTP yourself; do not expect `BlogSchema` or `GrapevineClient` exports.

## Roadmap (direction, not dates)

Useful next increments, if they are built:

- Parametric routes
- Reactive attribute helpers (or documented `ref`+`effect` only)
- Nested-safe `batch`
- Equality check on `set` (skip notify when unchanged)

Until those exist, the docs stay with the table above.

## Suggested reading

- [README](./README.md) — model and showcase
- [Getting Started](./sig-getting-started.md)
- [API](./sig-api.md)
- [Troubleshooting](./sig-troubleshooting.md)
