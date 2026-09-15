# Sig.js Status

Honest snapshot of `@citrusworx/sigjs` **0.2.0** against `libraries/sig/src`.

The goal is the same as Juice’s maturity writing: make it easy to answer what is ready today, what is usable but still evolving, and what is still early.

**Alpha.** The reactivity core, JSX factory, and client router are implemented and covered by Playwright tests. The API is small enough to describe, but this is pre-1.0: names and behavior can still move.

Workspace index calls this **Active alpha**. That matches the code better than “beta” or “production ready.”

Related: [Roadmap](./sig-roadmap.md) for direction. [API](./sig-api.md) for the surface as it exists.

## Maturity levels

### `Stable-ish`

The feature is usable today, central to the Sig.js experience, and unlikely to change dramatically in basic concept. Alpha still means the package version can move; the *idea* is settled.

### `Emerging`

The feature is useful and present, but the API, conventions, or implementation details are still likely to evolve.

### `Early`

The feature exists, but it is still exploratory, incomplete, or not yet something Sig.js should strongly promise as a finished public surface.

### `Draft`

The feature is more of a direction than a hardened part of the runtime.

## Matrix

| Area | Maturity | Notes |
|---|---|---|
| `Signal(value)` factory | Stable-ish | `get` / `set` only. No equality check, no `peek`. This is the core identity of the library. |
| `effect` + cleanup + dispose | Stable-ish | Runs immediately, re-tracks every run, returns a disposer. Tested. |
| Cleanup scopes on function components | Stable-ish | `captureCleanupScope` + `disposeTree`. This is how the router stops timers. |
| Function-child **text** | Stable-ish | `String(child())` on a text node. Easy to misuse; behavior is consistent. |
| JSX → real DOM | Stable-ish | `createElement`, `on*`, `ref`, known properties vs attributes. No VDOM. |
| Function-valued host props | Emerging | Getters via `effect` (not `ref` / `on*`). `className` / `value` / booleans / attributes. |
| `mount` / `disposeTree` | Stable-ish | Replace a target’s children; walk cleanups. |
| `Fragment` | Stable-ish | `DocumentFragment`. Same child model as host elements. |
| `batch` | Stable-ish | Depth counter, `try` / `finally`. Nested calls and throws are covered by tests. |
| `memo` | Emerging | Lazy `{ get }` cache. No public dispose. Useful, still a small surface. |
| `SigRouter` exact + param paths | Emerging | Named routes, `:id` params, click + popstate, view dispose, `navigate` normalizes. Optional `"*"` fallback. |
| Docs and onboarding | Emerging to Stable-ish | Tutorial, topic pages, patterns, anti-patterns now exist next to the API. |
| Juice composition | Emerging | Attributes work because `setProp` uses `setAttribute` for unknown keys. Not a typed Juice plugin. |
| List / conditional helpers | Draft | `replaceChildren` is the current instruction, not a `<For>` / `<Show>` primitive. |
| SSR / hydration | Draft | Client DOM only. |
| Error boundaries | Draft | Uncaught. |
| DevTools | Draft | None. |

## What is shipped

| Area | In source | Notes |
|---|---|---|
| `Signal(value)` factory | `signal.ts` | `get` / `set` only |
| `effect` + cleanup + dispose | `signal.ts` | Returns disposer |
| `batch` | `signal.ts` | Nested-safe depth counter |
| `memo` | `signal.ts` | `{ get }` cache |
| `captureCleanupScope` | `signal.ts` | Used by JSX components |
| JSX → real DOM | `jsx-runtime.ts` | No VDOM |
| Function-child **text** | `jsx-runtime.ts` | `String(child())` |
| Function-valued host props | `jsx-runtime.ts` | `effect` + `disposeTree` cleanup |
| `ref`, `on*` events | `jsx-runtime.ts` | Assign-once callbacks / listeners |
| `mount` / `disposeTree` | `jsx-runtime.ts` | |
| `Fragment` | `jsx-runtime.ts` | `DocumentFragment` |
| `SigRouter` paths | `sig-router.ts` | Exact, `:param` segments, named routes, click + popstate, normalized `navigate` |
| `"*"` unknown-route fallback | `sig-router.ts` | Optional; without it `navigate` no-ops and `popstate` empties |
| View dispose on navigate | `sig-router.ts` | `disposeTree` |
| Package exports | `package.json` | root, jsx-runtime, jsx-dev-runtime, sig-router |

## What is not shipped

| Claim you may have seen | Reality |
|---|---|
| `new Signal(0)` | Not a constructor |
| `useEffect` / hooks | Not present |
| Function children that return elements or mapped lists | Become `String(…)` text |
| Live `style={{ color }}` object binder | Not implemented; write `el.style` from an effect |
| SSR / hydration | Client DOM only |
| Error boundaries | Uncaught |
| DevTools | None |
| Built-in fetch / forms / persistence | Use the platform |
| Keyed list reconciler | `replaceChildren` in your effect |

`memo` **is** implemented. Older roadmap text that listed “derived signals” as a future version was stale.

## Strongest areas

These are the parts of Sig.js that are already carrying real value:

- signals as `{ get, set }` boxes
- effects with cleanup
- function-child live text
- function-valued live attributes
- JSX that is actual DOM
- disposing a view when the router leaves it
- exact and parametric client routes

These form the strongest case for Sig.js as a small behavior layer on Juice pages.

## Most promising emerging areas

These are already useful, but still need refinement before they feel fully settled:

- `memo` (lifecycle)
- `SigRouter` (first-registered param matches; no splat segments)
- documentation as a product surface
- Juice composition conventions (static flags vs function-valued attributes)

These areas are what will most directly move Sig.js from strong alpha toward a calmer 1.0 story.

## Early or draft areas

These should be treated more carefully in positioning:

- list / conditional components
- live `style` object bindings
- splat routes (`/files/*`)
- SSR
- error boundaries
- DevTools

These can absolutely be valuable later. They should not yet be the center of the Sig.js promise.

## What “surgical updates” actually means

Sig.js does not re-render a component function when a signal changes.

- A function child updates **one text node**.
- A function-valued prop updates **one property or attribute**.
- An `effect` runs your callback; you decide which properties to write.
- A list example that calls `replaceChildren` rebuilds those children. That is your code, not a reconciler.

If you put `{count.get()}` in JSX without a function wrapper, you get a static text node from the first render.

## Tests

- `libraries/sig/src/signal.test.ts` — init, set, effect run/re-run, cleanup, dispose, `batch` (including throw + nest), `memo`
- `libraries/sig/src/jsx.test.ts` — function-child text, stringify-on-element, reactive `className` / `value` / booleans, `ref` + effect, `mount` / `disposeTree`
- `libraries/sig/src/router.test.ts` — registration, named routes, factory re-render, `navigate` normalize, `"*"` fallback, popstate, param match, exact-over-param

DOM tests install a jsdom document from `libraries/sig/jsdom-register.ts` (not published).

```bash
yarn workspace @citrusworx/sigjs test
```

Coverage is real and still narrow. Docs examples were checked against source, not executed as a separate browser suite from this package.

## Integration (what is real)

**Juice.** Complementary: Juice attributes are HTML attributes; Sig writes them at create time. Import `@citrusworx/juiceui/styles` plus a theme. There is no `Button` export from Juice for Sig to mount. Juice’s accordion is a working in-tree example of `Signal` + `effect` writing `hidden` / `aria-expanded`.

**Nectarine / Grapevine / Seltzer.** No typed client bindings. Fetch Nectarine-backed HTTP yourself; do not expect `BlogSchema` or `GrapevineClient` exports. The [Seltzer integration note](../seltzer/seltzer-integration.md) shows `Signal` + `client.get` as app code, not a Sig plugin.

## Recommended positioning right now

If Sig.js is being described externally or internally, the most honest current positioning is:

> Sig.js Alpha is a small signals runtime plus a JSX factory that creates real DOM nodes. It is built for static-first Juice (or HTML) pages that need surgical updates: live text, live attributes, effects, and a small client router (exact + `:param` paths). It is not a virtual-DOM framework, not React, and not a component library.

That framing matches the strongest current reality.

Less accurate positioning right now would be:

- fine-grained reactive JSX for **structure** (element children, lists)
- a production-hardened SPA framework
- a meta-framework with SSR
- a form / fetch / data library

## Practical interpretation

If you are building with Sig.js today:

- confidently use `Signal`, function-child text, function-valued props, `effect` + cleanup, `mount`
- use `batch` (including nested) and `memo`
- use `SigRouter` for exact pages and `/user/:id`-style params; register `"*"` if you want a missing-path view
- treat list components and live `style` objects as things you write yourself or live without

That is the cleanest adoption model for the current state of the system.

## Suggested reading

- [README](./README.md) — model and showcase
- [Page tutorial](./sig-page-tutorial.md) — guided build
- [Getting Started](./sig-getting-started.md)
- [Roadmap](./sig-roadmap.md)
- [Troubleshooting](./sig-troubleshooting.md)
