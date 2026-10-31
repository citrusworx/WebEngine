# Getting started

Install Sig, point JSX at it, and mount one component. After that, the [operator desk tutorial](./sig-page-tutorial.md) builds a full page.

Sig is signals plus a JSX factory that creates real DOM nodes. It is not React. There is no `useState`, no `useEffect`, and no virtual DOM.

## Install

```bash
npm install @citrusworx/sigjs
```

npm `latest` is **1.0.0** (published 2026-10-29). `yarn add @citrusworx/sigjs` and `pnpm add @citrusworx/sigjs` install the same version. `^1.0.0` is `>=1.0.0 <2.0.0`. `^0.7.0` does not install 1.0.0.

## JSX

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

The transform imports `@citrusworx/sigjs/jsx-runtime`. You do not import `jsx` yourself. Vite can set the same source without a full `tsc` emit:

```ts
import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "@citrusworx/sigjs",
  },
});
```

More compiler settings are in [TypeScript](./sig-typescript.md).

## First page

```tsx
import { Signal, mount } from "@citrusworx/sigjs";

function Counter() {
  const count = Signal(0);

  return (
    <div>
      <h1>Counter: {() => String(count.get())}</h1>
      <button type="button" onClick={() => count.set(count.get() + 1)}>
        Increment
      </button>
    </div>
  );
}

mount(<Counter />, document.getElementById("root")!);
```

```html
<div id="root"></div>
<script type="module" src="./main.js"></script>
```

`Signal` is a factory. `new Signal(0)` is not the API. The button and the `div` are created once. Only the text node updates.

| Piece | Role |
|---|---|
| `Signal(0)` | Holds the number |
| `{() => String(count.get())}` | Live text. Re-runs when `count` changes |
| `{count.get()}` | Snapshot. Does not update later |
| `onClick` | Browser listener, not a reactive getter |
| `mount` | Disposes the target's current children, then inserts the tree |

## When text is not enough

A function child can only replace text. For several properties, hold the element and write it from an effect.

```tsx
import { Signal, effect, mount } from "@citrusworx/sigjs";

function Status() {
  const ready = Signal(false);
  const badge = <span>Starting…</span> as HTMLSpanElement;

  effect(() => {
    const value = ready.get();
    badge.textContent = value ? "Ready" : "Starting…";
    badge.hidden = !value;
  });

  return (
    <div>
      {badge}
      <button type="button" onClick={() => ready.set(true)}>
        Mark ready
      </button>
    </div>
  );
}

mount(<Status />, document.getElementById("root")!);
```

One attribute can stay in JSX: `hidden={() => !ready.get()}` or `className={() => ...}`. Lists, fetch, and timers belong in an effect. The child rules are in [Templating](./sig-jsx.md).

## A list and a field

`replaceChildren` rebuilds rows. `{() => items.map(...)}` is still text, not a list.

```tsx
import { Signal, effect, memo, mount } from "@citrusworx/sigjs";

function NameAndQueue() {
  const name = Signal("");
  const greeting = memo(() => name.get().trim() || "there");
  const items = Signal<string[]>(["First"]);
  const list = <ul></ul> as HTMLUListElement;

  effect(() => {
    list.replaceChildren(...items.get().map((text) => <li>{text}</li>));
  });

  return (
    <div>
      <input
        value={() => name.get()}
        onInput={(event) => {
          name.set((event.target as HTMLInputElement).value);
        }}
      />
      <p>Hello, {() => greeting.get()}</p>
      <button
        type="button"
        onClick={() => items.set([...items.get(), "Next"])}
      >
        Add
      </button>
      {list}
    </div>
  );
}
```

When a row should keep its node, use `bindList`. The walkthrough is [Keyed todo list](./sig-patterns.md#keyed-todo-list-bindlist).

## Router

```tsx
import { SigRouter } from "@citrusworx/sigjs";

function Home() {
  return <h1>Home</h1>;
}

const router = new SigRouter("#root");
router.set({
  "/": Home,
  about: () => <h1>About</h1>,
});
router.start();
```

Register functions, not `<Home />` elements, so each visit builds a fresh tree. Exact paths win, then `:param` segments, then `"*"`. Details are in [Router](./sig-router.md).

## Juice

Juice styles the DOM Sig creates. Sig does not import Juice unless you import `@citrusworx/sigjs/juice`.

```ts
import "@citrusworx/juiceui/styles";
```

```html
<body theme="my-theme">
  <div id="root"></div>
</body>
```

```tsx
<main stack gap="1rem">
  <section card padding="1.25rem">
    <p>Count: {() => String(count.get())}</p>
  </section>
</main>
```

`stack`, `card`, and `padding` are HTML attributes. They are not Sig APIs. To follow a Juice widget's state, use `bind`. Compatibility with Juice 0.9.1 through 0.9.5 is the table in [Runtime binding](./sig-juice-integration.md#runtime-binding).

## WebEngine

WebEngine does not mount Sig, start the router, or import this package from the engine class. Its lifecycle methods are stubs. A browser app imports `@citrusworx/sigjs` directly, the same way the counter above does.

The reading order for that stack is [WebEngine getting started](../webengine/webengine-getting-started.md), then this page, then [Juice](../juice/juice-getting-started.md) if the page needs a theme.

## Where to go next

| Next | When |
|---|---|
| [Page tutorial](./sig-page-tutorial.md) | You want one guided page |
| [Signals](./sig-signals.md) | `get` and `set` still feel unclear |
| [Effects](./sig-effects.md) | You need cleanup, fetch, or several writes |
| [Templating](./sig-jsx.md) | A function child printed `[object HTMLElement]` |
| [Patterns](./sig-patterns.md) | You have a form, list, or request to build |
| [Troubleshooting](./sig-troubleshooting.md) | A `set` did not change the DOM |
