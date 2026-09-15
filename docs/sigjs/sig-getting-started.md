# Sig.js Getting Started

Install `@citrusworx/sigjs` in any TypeScript or JavaScript app. The rest of the WebEngine monorepo is not required.

## Install

```bash
npm install @citrusworx/sigjs
```

## JSX config

Sig.js ships its own JSX runtime. Point the transform at the package:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@citrusworx/sigjs",
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

### Vite

```ts
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "@citrusworx/sigjs",
  },
});
```

```html
<!doctype html>
<html>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

A complete Vite counter is in [`libraries/sig/examples/counter`](../../libraries/sig/examples/counter).

### Plain `tsc`

Use the same `compilerOptions` with `"moduleResolution": "nodenext"` if you want Node-style package exports. `tsc` emits imports of `@citrusworx/sigjs`; you still need a bundler or import-map tool to resolve those in the browser. Serving `dist/` as static files without a bundler will not resolve npm subpaths.

## First component

```tsx
// src/main.tsx
import { Signal, mount } from "@citrusworx/sigjs";

function Counter() {
  const count = Signal(0);

  return (
    <div>
      <h1>Count: {() => count.get()}</h1>
      <button
        className={() => (count.get() % 2 === 0 ? "even" : "odd")}
        onClick={() => count.set(count.get() + 1)}
      >
        Increment
      </button>
    </div>
  );
}

mount(<Counter />, document.getElementById("root")!);
```

`{() => count.get()}` is a **function child**: the runtime keeps a text node in sync. `className={() => ...}` is a **function prop**: the runtime re-applies the property when the signal changes. `onClick` is an event listener, not a reactive getter.

`{count.get()}` without a function is a one-shot read when the element is created. It will not update later.

## Signals and effects

```ts
import { Signal, effect, batch, memo } from "@citrusworx/sigjs";

const name = Signal("Ada");

effect(() => {
  console.log("hello", name.get());
});

name.set("Lovelace");

batch(() => {
  name.set("Alan");
  name.set("Turing");
});

const greeting = memo(() => `Hello, ${name.get()}`);
greeting.get();
```

`effect` runs immediately and re-runs when any `get()` inside it changes. Return a cleanup function from the callback if you set up timers or listeners. Call the disposer that `effect` returns to stop it.

`batch` flushes subscribers once, including nested `batch()` calls (they flush when the outer call finishes).

## Components

Components are ordinary functions that return a `Node`:

```tsx
function Greeting(props: { name: string }) {
  return <p>Hello, {props.name}</p>;
}
```

Keep signals inside the component that owns them. Effects created during render are disposed when `mount` or `SigRouter` replaces that tree.

## Router (optional)

```tsx
import { SigRouter } from "@citrusworx/sigjs/sig-router";

const router = new SigRouter("#root");

router.set({
  "/": Home,
  "/user/:id": (params) => <p>User {params.id}</p>,
  about: About,
  "*": () => <p>Not found</p>,
});

router.start();
```

Exact paths win, then `:param` routes, then `*`. See the [Router Guide](./sig-router.md).

## Next

- [API Reference](./sig-api.md)
- [Examples](./sig-examples.md)
- [Troubleshooting](./sig-troubleshooting.md)
