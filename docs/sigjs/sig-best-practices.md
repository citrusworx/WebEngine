# Sig.js Best Practices

This guide focuses on how to compose Sig.js well in real app code. The goal is not to list every export, but to show the patterns that keep reactivity small, honest, and easy to dispose.

## Core principle

Use Sig.js to express:

- values that change after first paint
- subscriptions to those values
- the few DOM writes those subscriptions should make

Use Juice (or HTML) for:

- layout
- spacing
- surfaces
- typography
- static structure

Use the platform for:

- fetch
- timers
- form controls
- history

Sig.js is strongest when it is the thin behavior layer on top of markup you could already read without JavaScript.

## Render once, subscribe at the leaves

Component functions run once per mount. Put `Signal`, `effect`, and `memo` at the top of the factory. Do not wait for a signal change to “render” the page again.

Good:

```tsx
function Tally() {
  const count = Signal(0);
  return (
    <p>
      {() => String(count.get())}
      <button type="button" onClick={() => count.set(count.get() + 1)}>
        +
      </button>
    </p>
  );
}
```

The heading around this tally can be a Juice `card` that never remounts.

Less ideal:

```tsx
effect(() => {
  root.replaceChildren(<App state={state.get()} />);
});
```

That rebuilds the world on every write. It works. It also throws away the reason to use Sig.js.

## Let function children own live text

If the changing thing is a string or number inside existing markup, use a function child.

Good:

```tsx
<p>Open sessions: {() => String(sessions.get())}</p>
```

The runtime already creates the effect and the text node. You do not need a second `effect` that assigns `textContent` for that case.

## Let effects own everything that is not text

Attributes, `hidden`, `disabled`, `className`, lists, fetch, timers — hold the node, write from an `effect`.

Good:

```tsx
const button = <button type="button">Save</button> as HTMLButtonElement;

effect(() => {
  button.disabled = busy.get();
  button.textContent = busy.get() ? "Saving…" : "Save";
});
```

`ref` is a fine place to close over the element if you do not want a variable.

## Keep effects small

One effect, one job:

- one list container
- one disclosure panel
- one in-flight request
- one interval

Small effects are easier to dispose and harder to accidentally rebuild a page with.

When one gesture updates several signals, **`batch` the writes** rather than merging every reader into a mega-effect.

## Create effects inside the component that owns the tree

Effects registered while a function component runs are attached to that node’s cleanup scope. `SigRouter` and `mount` will dispose them.

Good:

```tsx
function About() {
  const ticks = Signal(0);
  effect(() => {
    const id = window.setInterval(() => ticks.set(ticks.get() + 1), 1000);
    return () => window.clearInterval(id);
  });
  return <p>{() => String(ticks.get())}</p>;
}

router.set({ about: About });
```

Risky:

```tsx
router.set({ about: <About /> }); // built once; cleanup on first leave is permanent
```

Also risky: `effect` inside a click handler (a new subscriber every click) or at module scope with a timer that nobody disposes.

## Replace values; do not mutate them in place

```ts
items.set([...items.get(), next]);
job.set({ ...job.get(), title: "Hold" });
```

`push` and `job.title = …` do not notify. `set` always notifies, even with the same reference — but relying on `set(items.get())` after a mutation is harder to read than a fresh value.

## Derive with `memo`, do not mirror with a second signal

Good:

```ts
const valid = memo(() => email.get().includes("@"));
```

Less ideal:

```ts
const valid = Signal(false);
effect(() => valid.set(email.get().includes("@")));
```

The second form is two sources of truth and an extra notify. Use it only when something else must *write* the derived slot, which is rare.

## Batch related writes

```ts
batch(() => {
  jobs.set([...jobs.get(), job]);
  nextId.set(nextId.get() + 1);
  draft.set("");
});
```

Do not nest `batch`. The flag is a boolean; the inner call flushes early.

## Return cleanup for anything you start

```ts
effect(() => {
  const controller = new AbortController();
  fetch(url.get(), { signal: controller.signal });
  return () => controller.abort();
});
```

Same for `setInterval`, `addEventListener` on `window`, and `EventSource`. If you did not return cleanup, the router cannot save you unless you dispose the whole effect — and even then the interval still fires.

## Let Juice own layout

Good:

```tsx
<main stack gap="2rem" padding="2rem">
  <section card padding="1.25rem" stack gap="1rem">
    …
  </section>
</main>
```

Risky:

```ts
effect(() => {
  if (window.innerWidth < 640) {
    el.style.flexDirection = "column";
  }
});
```

Juice already collapses rows. Do not re-implement responsive layout in Sig. Change Juice attributes from an effect only when the *product state* should change structure (a panel open, a density toggle) — not because the window resized.

## Prefer a function component as the mount root

```tsx
mount(<App />, document.getElementById("root")!);
```

Host-only trees (`mount(<div>{() => n.get()}</div>, root)`) may not attach function-child effects to `disposeTree`. A component root does, because `captureCleanupScope` wraps the factory. See [Effects](./sig-effects.md#cleanup-scopes-and-component-functions).

## Register routes as functions, after `set`, then `start`

```ts
const router = new SigRouter("#root");
router.set({
  "/": Home,
  about: About,
});
router.start();
```

- Functions, not `<Home />`
- Exact paths (`navigate("/about")`, not `navigate("about")`)
- Nav outside the target
- One router at the app edge

## Keep the public surface small in your own helpers

When wrapping Sig for an app, ask:

1. Is this still a signal, an effect, or a DOM write?
2. Am I hiding a React-shaped API (`useState`, reactive `className`) that the runtime does not have?
3. Will the wrapper still dispose when the view unmounts?

If the wrapper pretends Sig is React, the next author will write `{() => items.map(<li />)}` and wonder why the list is a string.

## A good mental model

Sig.js works best when:

- markup controls structure
- signals control values
- function children control live text
- effects control writes and resources
- the router controls which tree is alive
- Juice controls how it looks

That split keeps the runtime small and prevents the few APIs from turning into a shadow framework. See [Layers in Juice](../juice/juice-layers.md) for the styling half of the same idea, and [Anti-patterns](./sig-anti-patterns.md) for the ways this split usually fails.
