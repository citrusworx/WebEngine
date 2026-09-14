# Sig.js Troubleshooting

Issues that show up when the mental model and the runtime disagree. All of these follow from `libraries/sig/src/signal.ts` and `jsx-runtime.ts`.

## Reactivity

### The DOM does not change when I `set`

**Cause:** the value was read once at create time, not inside an `effect` or a function child.

```tsx
// Static text from the first get()
const count = Signal(0);
<div>Count: {count.get()}</div>

// Live text
<div>Count: {() => String(count.get())}</div>
```

### I returned JSX from a function child and got `[object HTMLDivElement]`

**Cause:** function children become text nodes: `textNode.textContent = String(child())`.

```tsx
// Wrong
{() => (open.get() ? <Panel /> : null)}

// Right — effect rewrites children or toggles hidden
const panel = <div>…</div> as HTMLElement;
effect(() => {
  panel.hidden = !open.get();
});
```

Lists are the same: `{() => items.get().map(…)}` stringifies an array. Use `replaceChildren` in an effect. See [JSX and the DOM](./sig-jsx.md), [Patterns](./sig-patterns.md), and [Examples](./sig-examples.md).

### `className={() => …}` / `value={() => …}` / `disabled={() => …}` do nothing useful

**Cause:** only `ref` and `on*` treat functions specially. Other function props are assigned as values.

```tsx
const input = <input /> as HTMLInputElement;
effect(() => {
  input.disabled = !ready.get();
});
```

### The effect never re-runs

**Cause:** the callback never called `.get()` on the signal you expected, or you `dispose`d it.

```ts
effect(() => {
  console.log("no signal read — runs once");
});

effect(() => {
  console.log(count.get()); // subscribed
});
```

### Several `set`s flicker or run work N times

Use `batch`:

```ts
batch(() => {
  loading.set(true);
  error.set(null);
});
```

Do not nest `batch` — the implementation is a single boolean.

### Memory leak / interval keeps firing

Return a cleanup from the effect, and create the effect **inside** the component function so the router can dispose it.

```ts
effect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
});
```

If you construct `<Page />` once and pass that node to `router.set`, cleanup on navigate will dispose those effects and they will not come back.

## Rendering

### Event handler never fires

Handlers must be `on*` functions in JSX (`onClick`, `onInput`, `onKeyDown`). Assigning `onclick` later works as a DOM property, but a non-function `onClick` is ignored.

### Juice styles missing

Import `@citrusworx/juiceui/styles` (and a theme) **before** `mount`. Set `theme="…"` on the document root. See [Juice integration](./sig-juice-integration.md).

### `ref` runs but later updates do not

`ref` is called once after create. Put the `effect` **inside** the ref callback (or close over the element) so it can subscribe.

## Router

### Links reload the page or do nothing

Call `router.start()` after `set`. Hrefs must match registered paths exactly (`/about`, not `/About`).

### `navigate` is a no-op

The path is not in the map. `navigate` returns without pushing history when `routes.get(path)` is missing. It also does not normalize: `navigate("about")` will not find `/about`.

### Back button clears the view

`popstate` renders `location.pathname`. If that path was never `set`, the container is emptied.

### Two routers fight

Create one `SigRouter` at the app edge. Do not construct it inside a component that re-runs.

## TypeScript

### JSX is an error

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@citrusworx/sigjs"
  }
}
```

### `new Signal` does not type-check (or does the wrong thing)

Use the factory: `const count = Signal(0)` or `Signal<number>(0)`.

### Event target types

```tsx
onInput={(e) => name.set((e.target as HTMLInputElement).value)}
```

## Debug habits

```ts
effect(() => {
  console.log("count", count.get());
});
```

```ts
const dispose = effect(() => {
  return () => console.log("cleanup");
});
```

Inspect the real DOM: function children are text nodes, not comment anchors.

## Help

- [Getting Started](./sig-getting-started.md)
- [Page Tutorial](./sig-page-tutorial.md)
- [Signals](./sig-signals.md) · [Effects](./sig-effects.md) · [JSX](./sig-jsx.md)
- [Anti-Patterns](./sig-anti-patterns.md) — the usual React / VDOM mistakes
- [API](./sig-api.md)
- [Examples](./sig-examples.md)
- [Router](./sig-router.md)
- [Status](./sig-status.md)
