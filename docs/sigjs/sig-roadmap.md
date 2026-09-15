# Sig.js Roadmap

## Current position

Sig.js is no longer just an idea for “signals on the DOM.”

It is a small, implemented runtime with five visible layers:

- `Signal` / `effect` / `batch` / `memo` in `signal.ts`
- a JSX factory that creates real DOM in `jsx-runtime.ts`
- cleanup scopes so views can die cleanly
- `mount` / `disposeTree`
- `SigRouter` for exact-path client navigation

The strongest part of Sig.js today is still the static-first model: build the tree once, subscribe at the leaves. The next strongest areas are effect cleanup and Juice composition (attributes survive `setProp`).

The weakest areas are still:

- reactive JSX beyond text children
- list / conditional primitives
- router expressiveness (params)
- tests beyond the current signal, JSX, and router files

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

There is no reactive transform. Function children are text. Attributes are assigned once. That limitation is currently a feature: the runtime stays readable.

The roadmap should not “fix” this by pretending a VDOM exists. If reactive attributes land, they should be an explicit helper or a documented `ref` + `effect` convention — not silent magic that still stringifies element children.

### 4. The router is useful for a handful of pages

Exact paths, named routes, click interception, `popstate`, and view dispose are implemented. That is a real SPA kernel for Juice shells.

It is not file-based routing, not a data loader, and not `/user/:id`.

### 5. Juice composition is real

Unknown keys become attributes. `stack`, `card`, `gap`, `hero` work on Sig-created elements. Juice’s accordion already uses `Signal` and `effect` in-tree.

The split — Juice for structure, Sig for behavior — is the product story. The roadmap should deepen that story (docs, examples, a few helpers), not merge the two packages into a component framework.

---

## What is still holding Sig.js back

### 1. The JSX child model surprises people

Function children as **text only** is correct and documented, and it is still the first place authors fall down. `{() => items.map(<li />)}` looks like every other modern JSX dialect.

Until there is either a tiny list helper or even stronger teaching (tutorial + anti-patterns — this docs pass), this will keep generating support questions.

### 2. `batch` nesting is done; equality on `set` is not

`batch` is a depth counter with `try` / `finally`. Nested calls and throws are tested.

`count.set(1); count.set(1)` still notifies twice. That is simple and sometimes useful. It is noisy for derived stores and for controlled inputs that write the same string.

An opt-in compare, or a documented “check before set” practice (already in the form pattern), is enough. A deep equality rabbit hole is not.

### 3. The router normalizes `navigate`; params are still absent

`set` / `has` / `navigate` share `normalizePath`. `navigate("about")` hits `/about`. Register `"*"` for unknown paths. Without it, `navigate` to a missing path is a silent no-op and `popstate` empties the target.

That is teachable. Parametric routes are still not shipped.

### 4. JSX-runtime tests exist but are still thin

`signal.test.ts`, `jsx.test.ts`, and `router.test.ts` cover the child text model, `mount` / `disposeTree`, `navigate` normalize, and `"*"` fallback. They do not cover every `setProp` branch or Juice attributes on Sig elements.

---

## Revised status

If Sig.js is viewed as a UI system, its current maturity looks roughly like this:

- Signals and effects: strong
- JSX as DOM factory: strong, with a sharp child model
- Cleanup / dispose: solid
- Router: useful and narrow
- Docs as product surface: much stronger after the tutorial and topic pages
- Reactive attributes / list components: not started
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

### Priority 2. Harden the edges of `set`

If the core is opened:

1. decide whether `set` should skip identical values (and document either choice)

Do not add `peek` unless a real effect-tracking bug requires it. Reading outside an effect is already untracked.

### Priority 3. Make the router harder to misuse

Useful increments, if they are built:

- parametric routes **after** exact-path behavior stays boring and tested
- a named 404 helper if `"*"` is too easy to miss

`navigate` normalization and an optional `"*"` fallback are already in source.

Param routes are the most requested missing piece. They are also the easiest to fake in docs. Do not document them until they exist.

### Priority 4. Decide the story for lists and attributes

Two honest options:

1. **Never** add reactive attributes or list helpers. Double down on `ref` + `effect` + `replaceChildren`. The docs already teach this.
2. Add a very small, explicit helper (`bindText` is already a function child; a `bindList(el, signal, renderRow)` would be new code).

What would be a mistake: JSX that *looks* like Solid/React (`className={() =>}`, `{condition && <X />}`) but still stringifies.

### Priority 5. Test the runtime you document

Highest value tests:

- function child updates a text node and only that node
- function child stringifies an element
- `className={() =>}` does not subscribe
- `mount` disposes effects from a function component
- router factory views re-run after `disposeTree` (already partially covered)

### Priority 6. Stay complementary to Juice

Sig.js should not grow a theme, a `<Button>`, or a layout system. If a pattern needs structure, the answer is a Juice attribute on a real element.

---

## Recommended build order

1. Keep docs and examples locked to source (ongoing).
2. Nested-safe `batch`, `navigate` normalization, `"*"` fallback, and JSX-runtime tests (landed).
3. Broader JSX / `setProp` tests if the child model is still surprising people.
4. Only then: param routes or an explicit list helper — not both at once.

---

## What would not move Sig.js upward

- SSR before the client child model is widely understood
- a hook compatibility layer
- inventing reactive props in documentation
- merging Juice and Sig into one “UI framework” package
- a compiler

Those would blur the split that justifies both libraries.

---

## Summary

Sig.js is in a meaningfully stronger place than a prototype.

It now has:

- a credible signals + effects core
- a JSX factory that is actually the DOM
- view dispose that makes routing viable
- a documented split with Juice
- a guided tutorial and topic depth that match that split

The next stage is not inventing Sig.js from scratch.

The next stage is refinement:

- decide lists/attributes explicitly
- keep the static-first promise
- parametric routes only after exact-path behavior stays boring

That is a strong place to be. Until those land, the docs stay with [Status](./sig-status.md) and the APIs in `libraries/sig/src`.
