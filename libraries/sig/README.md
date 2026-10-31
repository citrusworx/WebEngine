# Sig.js

Sig.js is a small client library for fine-grained DOM updates. A signal holds a value. An effect or a function in JSX reads it and writes only the node that should change. There is no virtual DOM and no component re-render.

It exists so a mostly static page can move a few values without adopting a UI framework. JSX creates real DOM nodes once. Reactivity is opt-in.

## Install

```bash
npm install @citrusworx/sigjs
```

This installs npm **1.0.0** (published 2026-10-29). The workspace copy is **1.1.0**, not published yet. `yarn add` and `pnpm add` work the same way. `^1.0.0` stays on the 1.x line. `^0.7.0` does not install 1.0.0.

## Quick start

Point the JSX transform at this package, then mount a function that returns DOM.

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@citrusworx/sigjs"
  }
}
```

```tsx
import { Signal, mount } from "@citrusworx/sigjs";

function Counter() {
  const count = Signal(0);

  return (
    <div>
      <p>Count: {() => count.get()}</p>
      <button type="button" onClick={() => count.set(count.get() + 1)}>
        Increment
      </button>
    </div>
  );
}

mount(<Counter />, document.getElementById("root")!);
```

`Signal` is a factory. Call `Signal(0)`, not `new Signal(0)`. `{() => count.get()}` is live text. `{count.get()}` is a one-time snapshot.

A runnable copy of this counter, plus a small router, is in [`examples/counter`](./examples/counter).

## Read next

| | |
|---|---|
| [Documentation](../../docs/sigjs/README.md) | Hub for concepts, API, guides, and migration |
| [Getting started](../../docs/sigjs/sig-getting-started.md) | Install, first page, Juice, and WebEngine |
| [API reference](../../docs/sigjs/sig-api.md) | Every public export |
| [What's new in 1.0](../../docs/sigjs/sig-whats-new.md) | What 1.0.0 freezes, and what it does not add |
| [Migrating from 0.x](../../docs/sigjs/sig-migrating.md) | Breaks since 0.2, including 0.7.0 and the stale 0.7.1 tarball |

## How a value reaches the DOM

| You want | Write |
|---|---|
| A value | `const count = Signal(0)` |
| Live text | `{() => count.get()}` |
| One live attribute | `className={() => (count.get() > 0 ? "hot" : "cold")}` |
| Several writes, a list, or a fetch | Hold the element and update it in `effect` |
| One notification for several writes | `batch(() => { ... })` |
| A cached derivation | `memo(() => ...)` |
| Keyed rows | `bindList` (experimental) |
| Another view | `new SigRouter("#root")` |

`onClick` and other `on*` props are event listeners. `ref` runs once. Function children are text: returning an element from `{() => ...}` stringifies it.

## Packages around it

Sig does not import WebEngine, Nectarine, Seltzer, or Juice from the main entry. WebEngine does not mount Sig for you. Use Sig in the browser the same way you would in any Vite or `tsc` app.

Juice styles the elements Sig creates. Attributes such as `stack` and `card` are ordinary HTML attributes. The optional adapter is a separate import:

```ts
import { bind } from "@citrusworx/sigjs/juice";
```

`bind` in this workspace follows 31 Juice runtime names, through keyboard-avoider. npm **1.0.0** follows 28, through table. Icon button, avatar, and table need `@citrusworx/juiceui` **0.9.3** or newer. Pressable and touchable row need **0.9.4**. Keyboard avoider needs **0.9.5**. **0.9.2** loads the adapter and throws if you bind any of those six. `sheet` is not a name until juiceui publishes it.

**0.9.1** cannot load the adapter at all. The table is in [Sig.js + Juice](../../docs/sigjs/sig-juice-integration.md#runtime-binding).

## Entry points

You only import these by hand when you are not using the JSX transform.

| Import | Exports |
|---|---|
| `@citrusworx/sigjs` | `Signal`, `effect`, `batch`, `memo`, `untrack`, `bindList`, `mount`, `disposeTree`, `jsx`, `jsxs`, `Fragment`, `JSX`, `SigRouter`, and the route and child types |
| `@citrusworx/sigjs/jsx-runtime` | Production JSX runtime, plus `mount` and `disposeTree` |
| `@citrusworx/sigjs/jsx-dev-runtime` | `jsxDEV`. Not re-exported from the package root |
| `@citrusworx/sigjs/sig-router` | `SigRouter` and the route types, without JSX |
| `@citrusworx/sigjs/juice` | Optional `bind`. The main entry does not import it |

`jsxDEV` and `captureCleanupScope` are not on the package root. `captureCleanupScope` is not a public entry. The freeze inventory is [API surface](../../docs/sigjs/api-surface.md).

From 1.0.0, a breaking change to a documented stable export is a major. The policy is [Semver](../../docs/sigjs/release-checklist.md#semver).

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

`tsc` emits imports of `@citrusworx/sigjs`. Serve those files with a tool that understands package `exports`. A plain static file server will not resolve the subpaths.

## Development in this repo

```bash
yarn workspace @citrusworx/sigjs build
yarn workspace @citrusworx/sigjs test
```
