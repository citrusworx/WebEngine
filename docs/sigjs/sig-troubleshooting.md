# Sig.js Troubleshooting

Standalone `@citrusworx/sigjs` issues. Juice is not required; if you are mixing in Juice styles, see [Sig.js + Juice](./sig-juice-integration.md).

## Reactivity

### DOM does not update

Wrap the read in a function. `{count.get()}` is a one-shot. `{() => count.get()}` is a reactive text node. `className={() => ...}` is a reactive prop.

```tsx
// one-shot
<div>{count.get()}</div>

// reactive text
<div>{() => count.get()}</div>
```

### Effect does not re-run

The callback must call `.get()` on the signal. Creating an effect that never reads a signal runs once.

### Too many re-runs

Group `set`s:

```ts
batch(() => {
  first.set("Ada");
  last.set("Lovelace");
});
```

Nested `batch()` calls still flush once, when the outer call returns.

### Function child shows `[object HTMLDivElement]`

Function children are **text**. Returning an element from `{() => <span/>}` stringifies. Mount nodes as real children, or rebuild a list in `effect` + `ref`. See [Examples](./sig-examples.md).

### Memory growth

`effect` returns a disposer. Router/`mount` dispose trees they replace. If you create effects outside a component, call the disposer yourself.

## JSX / TypeScript

### JSX is a type error

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@citrusworx/sigjs"
  }
}
```

Vite needs the same source:

```ts
export default defineConfig({
  esbuild: { jsx: "automatic", jsxImportSource: "@citrusworx/sigjs" },
});
```

Browser 404s on `@citrusworx/sigjs/jsx-runtime` usually mean the app is not bundled. Use Vite/esbuild; static `tsc` output cannot resolve package `exports` by itself.

### `onInput` target typing

```tsx
onInput={(e) => value.set((e.target as HTMLInputElement).value)}
```

## Router

### Links do not navigate

Call `router.start()` after `set()`.

### `/user/42` is empty

Register `/user/:id` as a **function** `(params) => view`. A static node cannot see the id.

### Unknown URL clears the outlet

Without `*`, unmatched `navigate` is a no-op and a direct load of an unknown path renders nothing. Register `"*": NotFound`.

### Exact vs param

`/user/new` as an exact route wins over `/user/:id`. Register both if you need a static page and a param page.

### External links captured

Use `https://...` or `target="_blank"`. `mailto:`, `tel:`, `ftp:`, and `download` are not intercepted.

## Help

- [Getting Started](./sig-getting-started.md)
- [API Reference](./sig-api.md)
- [Router Guide](./sig-router.md)
- Package README: [`libraries/sig/README.md`](../../libraries/sig/README.md)

Minimal reproduction:

```tsx
import { Signal, mount } from "@citrusworx/sigjs";

const count = Signal(0);

mount(
  <div>
    <p>{() => count.get()}</p>
    <button onClick={() => count.set(count.get() + 1)}>Inc</button>
  </div>,
  document.getElementById("root")!,
);
```
