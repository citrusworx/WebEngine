# @citrusworx/sigjs

Signals, a JSX-to-DOM runtime, and a small client router. Use it in any TypeScript or JavaScript project — Vite, `tsc`, or a bundler of your choice. There are no runtime dependencies and no WebEngine / Nectarine / Seltzer / Juice requirement.

Reactivity is opt-in. Host elements render once; wrap a child or a prop in a function that reads a signal, and only that node updates.

## Install

```bash
npm install @citrusworx/sigjs@^0.3.0
```

Yarn / pnpm work the same: `yarn add @citrusworx/sigjs@^0.3.0` or `pnpm add @citrusworx/sigjs@^0.3.0`.

## Signals

```ts
import { Signal, effect, batch, memo } from "@citrusworx/sigjs";

const count = Signal(0);

effect(() => {
  console.log("count is", count.get());
});

count.set(1);

batch(() => {
  count.set(2);
  count.set(3);
});

const doubled = memo(() => count.get() * 2);
doubled.get(); // 6
```

- **`Signal(value)`** — `{ get, set }`. `get()` inside an effect (or memo) subscribes.
- **`effect(fn)`** — runs immediately, re-runs when read signals change. Return a function to clean up before the next run and on dispose. `effect` itself returns a disposer.
- **`batch(fn)`** — groups `set` calls so subscribers flush once. Nested batches flush when the outermost call finishes; a throw still resets batching and flushes successful sets.
- **`memo(fn)`** — lazy cached derived value. Recomputes when its signal dependencies change.

## JSX

Point TypeScript (and your bundler) at this package as the JSX source:

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

Vite can do the same without a full `tsc` emit:

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

Components are functions that return real DOM nodes:

```tsx
import { Signal, mount } from "@citrusworx/sigjs";

function Counter() {
  const count = Signal(0);

  return (
    <div>
      <p>Count: {() => count.get()}</p>
      <button
        className={() => (count.get() > 0 ? "hot" : "cold")}
        onClick={() => count.set(count.get() + 1)}
      >
        Increment
      </button>
    </div>
  );
}

mount(<Counter />, document.getElementById("root")!);
```

- Function **children** become a text node that re-runs when signals change.
- Function **host props** (anything except `ref` and `on*`) re-apply when signals change — `className`, `value`, `checked`, `hidden`, `disabled`, attributes, and so on.
- `onClick` / `onInput` / other `on*` functions are event listeners, not reactive getters.
- `ref={(el) => { ... }}` runs once with the element. Pair it with `effect` if you need an imperative subscription.
- `{count.get()}` (no function) is a one-shot read at create time. Wrap it: `{() => count.get()}`.

`mount(node, target)` replaces `target`'s children (and disposes the previous tree).

A runnable copy of this counter lives in [`examples/counter`](./examples/counter).

## Router

```tsx
import { SigRouter } from "@citrusworx/sigjs/sig-router";
// or: import { SigRouter } from "@citrusworx/sigjs";

function Home() {
  return <p>Home</p>;
}

function User(params: { id: string }) {
  return <p>User {params.id}</p>;
}

function NotFound() {
  return <p>Not found</p>;
}

const router = new SigRouter("#root");

router.set({
  "/": Home,
  "/user/:id": (params) => User(params),
  about: () => <p>About</p>,
  "*": NotFound,
});

router.start();
```

Matching order:

1. **Exact** path (`/about`, `/user/new`)
2. **`:param`** segments (`/user/:id` → `{ id: "42" }` on the factory)
3. **`*`** fallback, if registered

Exact routes win over a colliding param pattern. Register view **functions** (not pre-rendered `<Home />`) so each visit gets a fresh tree; the router disposes the previous view on navigate.

Plain `<a href="/about">` links are intercepted. External, `target="_blank"`, `download`, `mailto`, `tel`, and `ftp` links are left alone. `router.navigate("/about")`, `router.goBack()`, and `router.stop()` cover programmatic control. Keys without a leading `/` in an object map become named routes (`router.get("about")` → `"/about"`).

## Subpath exports

| Import | What it is |
|--------|------------|
| `@citrusworx/sigjs` | `Signal`, `effect`, `batch`, `memo`, `mount`, `jsx` / `jsxs` / `Fragment`, `SigRouter`, types |
| `@citrusworx/sigjs/jsx-runtime` | Production JSX runtime (`jsx`, `jsxs`, `Fragment`, `mount`) |
| `@citrusworx/sigjs/jsx-dev-runtime` | Dev JSX runtime (`jsxDEV`) |
| `@citrusworx/sigjs/sig-router` | `SigRouter` only |

`jsxImportSource` uses the `jsx-runtime` / `jsx-dev-runtime` subpaths automatically. You do not import those by hand unless you are calling `jsx()` yourself.

## TypeScript without a bundler

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@citrusworx/sigjs",
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "nodenext"
  }
}
```

```html
<script type="module" src="./dist/main.js"></script>
```

`tsc` emits `.js` that import from `@citrusworx/sigjs`. Serve `node_modules` with a tool that understands package `exports` (Vite, esbuild, or a similar bundler). Plain static file serving will not resolve npm subpaths.

## Also used by

CitrusWorx apps (Juice UI, KiwiPress, and others in this monorepo) consume `@citrusworx/sigjs` as a normal npm dependency. Those stacks are optional. This package does not import them.

## Development (this repo)

```bash
yarn workspace @citrusworx/sigjs build
yarn workspace @citrusworx/sigjs test
```
