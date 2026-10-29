# @citrusworx/sigjs

Signals, a JSX-to-DOM runtime, and a small client router. Use it in any TypeScript or JavaScript project — Vite, `tsc`, or a bundler of your choice. There are no runtime dependencies and no WebEngine / Nectarine / Seltzer / Juice requirement.

Reactivity is opt-in. Host elements render once; wrap a child or a prop in a function that reads a signal, and only that node updates.

## Install

```bash
npm install @citrusworx/sigjs
```

Yarn / pnpm work the same: `yarn add @citrusworx/sigjs` or `pnpm add @citrusworx/sigjs`. The workspace copy in this repo is **1.0.0** (`package.json`). npm latest is still **0.7.2** until **1.0.0** is published, so this command installs **0.7.2** today and **1.0.0** after that publish. The API is the same. `^1.0.0` is `>=1.0.0 <2.0.0`. `^0.7.0` does not install **1.0.0**.

From **1.0.0**, a breaking change to a documented export is a major. `0.7.0` removed root exports under the old 0.x rule, where that break was a minor. The written policy is [Sig.js release checklist](../../docs/sigjs/release-checklist.md#semver).

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
- **`untrack(fn)`** — read signals inside `fn` without subscribing the current effect or memo.

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

## Lists

`replaceChildren` in an effect rebuilds children. That is the non-keyed list.

`bindList` keeps a DOM node for each key. An array needs a key function. A `Map` uses iteration order and the map key. `render` is called once per key and receives `{ get() }` for the current item — read it from an effect or a function child. Removing a key, disposing the list, or `disposeTree` on the parent disposes that row's effects. Duplicate array keys throw.

```ts
import { Signal, bindList, effect } from "@citrusworx/sigjs";

const todos = Signal(new Map<string, { text: string }>());
const list = document.createElement("ul");

const dispose = bindList(list, todos, (item, id) => {
  const li = document.createElement("li");
  li.dataset.id = id;
  effect(() => {
    li.textContent = item.get().text;
  });
  return li;
});
```

A `Map<id, Todo>` plus an `order: id[]`, joined with `memo`, is the shape to use when display order is not insertion order. The walkthrough is [Keyed todo list](../../docs/sigjs/sig-patterns.md#keyed-todo-list-bindlist).

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
| `@citrusworx/sigjs` | `Signal`, `effect`, `batch`, `memo`, `untrack`, `bindList` (experimental), `mount`, `disposeTree`, `jsx` / `jsxs` / `Fragment`, the `JSX` namespace, `SigRouter`, types. `jsxDEV` is not on this entry. |
| `@citrusworx/sigjs/jsx-runtime` | Production JSX runtime (`jsx`, `jsxs`, `Fragment`, `mount`, `disposeTree`, `Child`, the `JSX` namespace) |
| `@citrusworx/sigjs/jsx-dev-runtime` | Dev JSX runtime (`jsxDEV`, `jsxs`, `Fragment`, the `JSX` namespace) |
| `@citrusworx/sigjs/sig-router` | `SigRouter`, plus route types `RouteFactory`, `RouteMap`, `RouteParams`, `RouteView` |
| `@citrusworx/sigjs/juice` | Optional. `bind(host, runtime?)` returns `{ state, dispose }` for twenty-eight `JuiceRuntimeName` values, including icon-button, avatar, and table. Write-back is switch, checkbox, disclosure, modal, and icon-button (`pressed`, `[toggle]` hosts only). Avatar and table are read-only. Binding one of those three throws `needs a newer @citrusworx/juiceui` when that start function is missing (published `@citrusworx/juiceui` 0.9.1 and 0.9.2). Optional peer `>=0.9.1 <1`. Juice works without this subpath. Guide: [Runtime binding](../../docs/sigjs/sig-juice-integration.md#runtime-binding). The subpath shipped in 0.4.0. The three names are in npm 0.7.2 and in **1.0.0**. |

`jsxImportSource` uses the `jsx-runtime` / `jsx-dev-runtime` subpaths automatically. You do not import those by hand unless you are calling `jsx()` yourself.

The v1 freeze inventory (stable, experimental, internal) is [API surface](../../docs/sigjs/api-surface.md).

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

CitrusWorx apps (Juice UI, KiwiPress, and others in this monorepo) consume `@citrusworx/sigjs` as a normal npm dependency. Those stacks are optional. The main entry does not import them. `@citrusworx/sigjs/juice` is the optional Juice adapter and the only module here that imports Juice. Juice’s own `juice:change` / `getState()` contract does not require it. `bind` during a Sig component render disposes on unmount. See [Runtime binding](../../docs/sigjs/sig-juice-integration.md#runtime-binding).

## Development (this repo)

```bash
yarn workspace @citrusworx/sigjs build
yarn workspace @citrusworx/sigjs test
```
