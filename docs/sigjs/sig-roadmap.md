# Sig.js Roadmap

## Current position

Sig.js is no longer just an idea for “signals on the DOM.”

It is a small, implemented runtime with five visible layers:

- `Signal` / `effect` / `batch` / `memo` in `signal.ts`
- a JSX factory that creates real DOM in `jsx-runtime.ts`
- cleanup scopes so views can die cleanly
- `mount` / `disposeTree`
- `bindList` for keyed array and `Map` lists
- `SigRouter` for exact-path and `:param` client navigation

The strongest part of Sig.js today is still the static-first model: build the tree once, subscribe at the leaves. The next strongest areas are effect cleanup, function-valued props, and Juice composition (attributes survive `setProp`).

The weakest areas are still:

- conditionals (`hidden` / `replaceChildren`; there is no `<Show>`)
- live `style` object bindings
- tests beyond the current signal, JSX, list, and router files

Alpha is the honest label. The core is real enough to teach in depth; it is not frozen.

---

## What is already true

### 1. Signals are a finished idea, not a sketch

`Signal(value)` returns `{ get, set }`. Tracking is `currentSubscriber`. Notification is a subscriber set. That loop is small, tested, and the identity of the library.

What that means for the roadmap: Sig.js does not need a new state primitive. It needs better *edges* (equality, peek if we ever want it) around this one.

### 2. Effects own side effects, including cleanup

Effects run immediately, re-track every run, and can return a disposer. Router navigation calls `disposeTree`, which runs those disposers.

That is enough to build timers, fetch-with-abort, and disclosures without a second lifecycle API. A future `useEffect` clone would be a step backward.

### 3. JSX is a factory, not a compiler

There is no reactive transform. Function children are text. Function-valued **props** (except `ref` and `on*`) are reactive getters. That split is the current feature: the runtime stays readable.

The roadmap should not “fix” this by pretending a VDOM exists. Function children that return elements still stringify. Keyed lists are `bindList`. A cheap rewrite is still `replaceChildren`.

### 4. The router is useful for a handful of pages

Exact paths, `:param` segments, named routes, click interception, `popstate`, `"*"`, and view dispose are implemented. That is a real SPA kernel for Juice shells.

It is not file-based routing and not a data loader. There are no splat segments (`/files/*`).

### 5. Juice composition is real

Unknown keys become attributes. `stack`, `card`, `gap`, `hero` work on Sig-created elements. Juice’s accordion already uses `Signal` and `effect` in-tree.

The split — Juice for structure, Sig for behavior — is the product story. The roadmap should deepen that story (docs, examples, a few helpers), not merge the two packages into a component framework.

### 6. The Juice runtime hookup is done

`@citrusworx/sigjs/juice` exports `bind(host, runtime?)`. It returns `{ state, dispose }`. `state` follows Juice’s `juice:change` / `getState()` contract for the twenty-five runtimes `bind` accepts. `state.set` writes back for switch, checkbox, disclosure, and modal. The other twenty-one are read-only. Icon button is the twenty-sixth Juice runtime, avatar is the twenty-seventh, and table is the twenty-eighth. None of them is a `JuiceRuntimeName`, so `bind` does not accept them. A follow-up for avatar is pending. A follow-up for table is pending. `dispose` drops the listeners, and a `bind` during Sig render also disposes on unmount.

Juice works without that module. The DOM contract stays in Juice, and the main Sig entry does not import Juice. The guide is [Sig.js + Juice](./sig-juice-integration.md#runtime-binding). The state table is [juice:change](../juice/juice-runtime-behavior.md#juicechange). The subpath shipped in `@citrusworx/sigjs@0.4.0`.

That hookup is the adapter. It is not a new state primitive, and it is not a per-runtime Sig factory.

---

## What is still holding Sig.js back

### 1. The JSX child model surprises people

Function children as **text only** is correct and documented, and it is still the first place authors fall down. `{() => items.map(<li />)}` looks like every other modern JSX dialect.

`bindList` is the keyed escape hatch. It does not make function children return elements. Teaching still has to say that out loud.

### 2. `batch` nesting is done; `set` always notifies

`batch` is a depth counter with `try` / `finally`. Nested calls and throws are tested.

`count.set(1); count.set(1)` notifies twice. That is the v1 contract: `Signal.set` always notifies, even when the value is unchanged. There is no equality check. Callers that want to skip a write compare first. A deep equality helper is not part of v1.

### 3. The router matches params; splat routes are still absent

`set` / `has` / `navigate` share `normalizePath`. `navigate("about")` hits `/about`. `/user/:id` passes `{ id }` to the view function. Exact routes win over param patterns. Register `"*"` for unknown paths. Without it, `navigate` to a missing path is a silent no-op and `popstate` empties the target.

That is teachable. Splat routes and a helper that fills named param URLs are still not shipped.

### 4. JSX-runtime tests exist but are still thin

`signal.test.ts`, `jsx.test.ts`, and `router.test.ts` cover the child text model, reactive props, Juice-style unknown attributes (`setAttribute` via `setProp`), `mount` / `disposeTree`, `navigate` normalize, `"*"` fallback, and `:param` matching. They do not cover every `setProp` branch.

---

## Revised status

If Sig.js is viewed as a UI system, its current maturity looks roughly like this:

- Signals and effects: strong
- JSX as DOM factory: strong, with a sharp child model
- Function-valued props: present and tested
- Cleanup / dispose: solid
- Router: exact + `:param` + `"*"`, still small
- Docs as product surface: much stronger after the tutorial and topic pages
- Keyed lists: decided — `bindList` (array or `Map`)
- Conditionals: `hidden` / `replaceChildren`; no `<Show>`
- Production-hardened SPA framework: not the goal yet

In practical terms:

- Sig.js already feels like a real behavior layer for Juice
- Sig.js does not yet feel like a complete alternative to a virtual-DOM framework, and it should not try to

That is a strong place to be.

---

## Priorities

### Priority 1. Keep the static-first model obvious

The next work that helps the most is not a new primitive. It is:

- examples that look like pages, not snippets
- anti-patterns for React habits
- a guided tutorial that includes a list and a route

This docs set is that work. Keep it aligned with `libraries/sig/src` when the code moves.

### Priority 2. `set` equality is decided

`Signal.set` always notifies, including when the new value is the same. That behavior is frozen for v1. Documented in [API surface](./api-surface.md) and covered by `libraries/sig/src/signal.test.ts`.

Do not add `peek` unless a real effect-tracking bug requires it. Reading outside an effect is already untracked. `untrack` is the supported snapshot read.

### Priority 3. Make the router harder to misuse

Useful increments, if they are built:

- a helper that fills named param URLs (`get("user")` still returns `/user/:id`)
- splat segments if a real app needs them
- a named 404 helper if `"*"` is too easy to miss

Exact paths, `:param` matching, `navigate` normalization, and an optional `"*"` fallback are already in source.

### Priority 4. Lists — decided

Keyed rows use `bindList(parent, source, key, render)` for an array, or `bindList(parent, source, render)` for a `Map`. The map's iteration order is display order, and the map key is the row key. `render` runs once per key and receives a per-row getter. Read `item.get()` in an effect or a function child; the node stays. Removed keys dispose their effects. The returned disposer, and `disposeTree` on the parent, dispose the list.

`replaceChildren` stays the simple non-keyed alternative. It rebuilds the children.

There is still no `<For>` or `<Show>`. `{condition && <X />}` and `{() => items.map(<li />)}` still stringify. A conditional that should keep state uses `hidden`. A conditional that should swap a subtree uses `replaceChildren`.

The recommended todo shape is a `Map<id, Todo>` plus an `order: id[]`, joined with `memo`. A `Map` alone is enough when insertion order is display order. Priority sorting is a derived array or map, not a third source of truth. See [Patterns](./sig-patterns.md#keyed-todo-list-bindlist).

### Priority 5. Test the runtime you document

Highest value tests that already exist:

- function child updates a text node and only that node
- function child stringifies an element
- `className={() =>}` / `value={() =>}` / boolean props subscribe
- `mount` disposes effects from a function component
- router factory views re-run after `disposeTree`
- param match, exact-over-param, `"*"` fallback

### Priority 6. Stay complementary to Juice

Sig.js should not grow a theme, a `<Button>`, or a layout system. If a pattern needs structure, the answer is a Juice attribute on a real element.

The runtime hookup is already the optional `@citrusworx/sigjs/juice` adapter. Further Juice work stays on Juice’s DOM contract. Sig does not absorb the runtimes.

---

## Recommended build order

1. Keep docs and examples locked to source (ongoing).
2. Nested-safe `batch`, `navigate` normalization, `"*"` fallback, and JSX-runtime tests (landed).
3. Function-valued props and parametric routes (landed).
4. Juice runtime hookup: `bind` on `@citrusworx/sigjs/juice`, docs in [Sig.js + Juice](./sig-juice-integration.md#runtime-binding) (shipped in 0.4.0).
5. Keyed `bindList`, with `replaceChildren` kept as the non-keyed rewrite (landed).

---

## What would not move Sig.js upward

- SSR before the client child model is widely understood
- a hook compatibility layer
- pretending JSX `.map()` is a reconciler (`bindList` is the explicit helper; the `key` argument to `jsxDEV` is still ignored)
- merging Juice and Sig into one “UI framework” package
- a compiler

Those would blur the split that justifies both libraries.

---

## API surface for v1

The classified inventory is [API surface](./api-surface.md). Stable exports are the v1 contract. `bindList` and `ListItem` stay experimental. `captureCleanupScope` is not exported. `jsxDEV` is only on `./jsx-dev-runtime`. `Signal.set` always notifies, and that is frozen. Public `any` is gone from the JSX factory and `JSX.IntrinsicElements`. The `JSX` namespace is exported from both runtime entries.

## Summary

Sig.js is in a meaningfully stronger place than a prototype.

It now has:

- a credible signals + effects core
- a JSX factory that is actually the DOM
- view dispose that makes routing viable
- a documented split with Juice
- an optional Juice host binding (`@citrusworx/sigjs/juice`) that Juice does not require
- a guided tutorial and topic depth that match that split

The next stage is not inventing Sig.js from scratch.

The next stage is refinement:

- lists are decided: `bindList` for keyed rows, `replaceChildren` for a rewrite, no `<For>` / `<Show>`
- keep the static-first promise
- keep param matching boring (exact wins, first registered pattern, `"*"` last)
- the public surface cleanup is in [API surface](./api-surface.md). `bindList` stays experimental. 1.0 is the publish of that surface

That is a strong place to be. The docs stay with [Status](./sig-status.md), [API surface](./api-surface.md), and the APIs in `libraries/sig/src`.
