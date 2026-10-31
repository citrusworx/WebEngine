# Troubleshooting

When a `set` seems to do nothing, the read was usually outside an effect or a function child. The cases below are the ones the 1.0.0 runtime actually produces.

## Reactivity

### The DOM does not change when I `set`

The value was read once, while the component function ran.

```tsx
<div>Count: {count.get()}</div>
<div>Count: {() => String(count.get())}</div>
```

The second line is live. The first is not.

### A function child printed `[object HTMLDivElement]`

Function children assign `String(child())` to a text node. Returning an element stringifies it. `null` from that function becomes the text `null`.

```tsx
const panel = <aside hidden>Notes</aside> as HTMLElement;

effect(() => {
  panel.hidden = !open.get();
});
```

`{() => items.get().map(...)}` stringifies the array. Rebuild with `replaceChildren`, or keep nodes with `bindList`. See [Keyed todo list](./sig-patterns.md#keyed-todo-list-bindlist).

### `className`, `value`, or `disabled` stayed frozen

`flag.get()` at create time is a snapshot. Pass a function:

```tsx
<div className={() => (on.get() ? "on" : "off")} />
<input value={() => name.get()} />
<button disabled={() => !ready.get()} />
```

`on*` and `ref` are not getters. One effect can write several properties if a single getter is not enough.

### `style={{ color: "red" }}` did nothing

The type allows a style object. The runtime assigns that object to the DOM `style` property, which does not copy CSS fields. A string works: `style="color: red"` or `style={() => "color: red"}`. For more than one property, set `el.style.color` from an effect.

### The effect never re-runs

It did not call `.get()` on that signal, or you already disposed it. A `get()` inside a branch that did not run is not a dependency for that run. See [Dependencies are rebuilt every run](./sig-effects.md#dependencies-are-rebuilt-every-run).

### Several `set` calls run work several times

Wrap them in `batch`. Nested `batch` still flushes once, when the outer call finishes. See [Batching](./sig-batch.md).

### An interval or fetch keeps running

Return a cleanup from the effect, and create the effect inside the component so `mount` or the router can dispose it.

```ts
effect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
});
```

`router.set("/about", <About />)` disposes those effects on the first leave and does not rebuild them. Pass `About`, not `<About />`.

### I mutated an object and nothing updated

`user.get().name = "Ada"` does not notify. `user.set({ ...user.get(), name: "Ada" })` does. `Signal.set` of the same value still notifies. See [Arrays, objects, and identity](./sig-signals.md#arrays-objects-and-identity).

## Rendering

### The click handler never fires

Use an `on*` function: `onClick`, `onInput`, `onKeyDown`. A non-function `onClick` is ignored. The runtime lowercases the event name and calls `addEventListener`. `disposeTree` does not remove that listener.

### Juice styles are missing

Import `@citrusworx/juiceui/styles` and a theme before `mount`. Set `theme` on the document root. See [Sig.js + Juice](./sig-juice-integration.md).

### `bind` throws before I call it

Importing `@citrusworx/sigjs/juice` against Juice 0.9.1 fails because `startDisclosureRuntime` is not exported. Juice 0.9.2 loads.

Binding icon button, avatar, or table on 0.9.2 throws `needs a newer @citrusworx/juiceui`. Use Juice 0.9.3 or newer for those three. See [Runtime binding](./sig-juice-integration.md#runtime-binding).

### `ref` ran once and then stopped

That is the contract. Subscribe inside the ref callback, or close over the element from an effect created in the same component.

## Router

### Links reload the page

Call `start()` after `set`. The href must match a registered path. Modifier-clicks are still intercepted, so Command-click does not open a new tab.

### `navigate` does nothing

The path is not registered and there is no `"*"`. `navigate` returns without `pushState`. `navigate("about")` finds a route stored as `/about`. `/about?x=1` does not match `/about`.

### The Back button clears the view

`popstate` renders `location.pathname`. An unregistered path with no `"*"` empties the target. `navigate` to that same path would have been a no-op instead.

### Two routers fight

Create one `SigRouter` for the app. A second `start()` on the same instance re-renders. It does not stack listeners. A second instance adds another click listener.

## TypeScript

### JSX fails to type-check

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@citrusworx/sigjs"
  }
}
```

Details are in [TypeScript](./sig-typescript.md).

### `new Signal` is not a constructor

Call `Signal(0)` or `Signal<number>(0)`.

### The event target has no `value`

```tsx
onInput={(event) => {
  name.set((event.target as HTMLInputElement).value);
}}
```

## Where to look

| Symptom | Page |
|---|---|
| Snapshot reads, element children | [Anti-patterns](./sig-anti-patterns.md) |
| Signatures | [API reference](./sig-api.md) |
| A full page | [Page tutorial](./sig-page-tutorial.md) |
| Forms, lists, fetch | [Patterns](./sig-patterns.md) |
| Routes | [Router](./sig-router.md) |
