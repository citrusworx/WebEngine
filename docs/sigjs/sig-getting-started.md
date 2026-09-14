# Getting Started With Sig.js

This is the best starting point if you want to use Sig.js the way the library works today.

## What Sig.js is

Sig.js is a small signals runtime plus a JSX factory that creates real DOM nodes.

It gives you:

- `Signal(value)` — a box with `get` / `set`
- `effect(fn)` — run now, re-run when signals you read change, optional cleanup
- `batch(fn)` — one notification after several `set`s
- `memo(fn)` — cached derivation
- JSX that compiles to `jsx()` / `jsxs()` / `Fragment` from `@citrusworx/sigjs`
- `mount(node, target)` — replace a container's children
- `SigRouter` — exact-path client routing

It is not React. There is no `useState`, `useEffect`, or virtual DOM. Components are functions that return a `Node`.

## Install

```bash
yarn add @citrusworx/sigjs
```

Package version today: **0.2.0**.

## Configure TypeScript for JSX

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@citrusworx/sigjs",
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

That points the JSX transform at `@citrusworx/sigjs/jsx-runtime` (and the dev runtime). You do not import `jsx` yourself.

## The mental model

1. Render **once**. JSX builds real elements.
2. Put changing values in a `Signal`.
3. Subscribe with either:
   - a **function child** for live text: `{() => String(count.get())}`
   - an **effect** that writes to an element you already created
4. Do not expect `{() => <div />}` or `className={() => …}` to be reactive. They are not.

## First reactive page

```tsx
import { Signal, mount } from "@citrusworx/sigjs";

function Counter() {
  const count = Signal(0);

  return (
    <div>
      <h1>Counter: {() => String(count.get())}</h1>
      <button onClick={() => count.set(count.get() + 1)}>Increment</button>
      <button onClick={() => count.set(count.get() - 1)}>Decrement</button>
    </div>
  );
}

mount(<Counter />, document.getElementById("root")!);
```

`onClick` works. The runtime lowercases `on*` keys and calls `addEventListener`. `onclick` works too.

`Signal` is a factory:

```ts
const count = Signal(0);      // correct
// const count = new Signal(0); // wrong — Signal is not a constructor
```

## When text is not enough

Function children only update a text node (`String(child())`). For attributes, lists, or swapping structure, keep the element and write from an effect.

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
      <button onClick={() => ready.set(true)}>Mark ready</button>
    </div>
  );
}

mount(<Status />, document.getElementById("root")!);
```

`ref` is also available if you prefer not to assign the element to a variable first:

```tsx
function Status() {
  const ready = Signal(false);

  return (
    <span
      ref={(el) => {
        effect(() => {
          el.textContent = ready.get() ? "Ready" : "Starting…";
        });
      }}
    />
  );
}
```

## Effects and cleanup

`effect` runs immediately. If it returns a function, that cleanup runs before the next execution and again when you dispose.

```ts
import { Signal, effect } from "@citrusworx/sigjs";

const seconds = Signal(0);

const dispose = effect(() => {
  const id = setInterval(() => seconds.set(seconds.get() + 1), 1000);
  return () => clearInterval(id);
});

// later
dispose();
```

When a `SigRouter` replaces a view, it disposes the previous tree. Effects created while that view's component function ran are cleaned up automatically.

## A form field

Inputs are not two-way bound. Read from the event; write back from an effect if you need a controlled value.

```tsx
import { Signal, effect, mount } from "@citrusworx/sigjs";

function NameField() {
  const name = Signal("");

  const input = (
    <input
      type="text"
      onInput={(e) => name.set((e.target as HTMLInputElement).value)}
    />
  ) as HTMLInputElement;

  effect(() => {
    if (input.value !== name.get()) {
      input.value = name.get();
    }
  });

  return (
    <label>
      Name
      {input}
      <p>Hello, {() => name.get() || "stranger"}</p>
    </label>
  );
}

mount(<NameField />, document.getElementById("root")!);
```

## A list (rewrite the children)

There is no keyed reconciler. The honest pattern is `replaceChildren` inside an effect.

```tsx
import { Signal, effect, mount } from "@citrusworx/sigjs";

function TodoList() {
  const todos = Signal<string[]>(["Read the getting started"]);
  const draft = Signal("");

  const list = <ul /> as HTMLUListElement;
  const input = (
    <input
      onInput={(e) => draft.set((e.target as HTMLInputElement).value)}
      onKeyDown={(e) => {
        if (e.key !== "Enter") return;
        const text = draft.get().trim();
        if (!text) return;
        todos.set([...todos.get(), text]);
        draft.set("");
        input.value = "";
      }}
    />
  ) as HTMLInputElement;

  effect(() => {
    list.replaceChildren(
      ...todos.get().map((text) => <li>{text}</li>),
    );
  });

  return (
    <div>
      {input}
      {list}
    </div>
  );
}

mount(<TodoList />, document.getElementById("root")!);
```

## Router (optional)

```tsx
import { SigRouter } from "@citrusworx/sigjs";

function Home() {
  return <h1>Home</h1>;
}

function About() {
  return <h1>About</h1>;
}

const router = new SigRouter("#root");
router.set({
  "/": Home,
  about: About,
});
router.start();
```

You can also import `SigRouter` from `@citrusworx/sigjs/sig-router`. Paths are exact. `/about` and `/about/` are different. There is no `:id` matching.

## Pair with Juice when you need styling

```ts
import "@citrusworx/juiceui/styles";
import "./generated/my-theme.css";
```

```html
<body theme="my-theme">
  <div id="root"></div>
</body>
```

Juice attributes (`stack`, `row`, `gap`, `card`, `padding`) are ordinary HTML attributes. Sig's `setProp` writes them onto the element. They are not a Sig API.

## What to use first

1. Install `@citrusworx/sigjs` and set `jsxImportSource`
2. `Signal` + function-child text for the smallest demo
3. `effect` when you need attributes, timers, or fetch
4. `batch` / `memo` when updates or derivations get noisy
5. `SigRouter` when you have more than one view
6. Juice only for structure and theme — not for state

## Where to go next

- [API Reference](./sig-api.md)
- [Examples](./sig-examples.md)
- [Router Guide](./sig-router.md)
- [Sig.js + Juice](./sig-juice-integration.md)
- [Troubleshooting](./sig-troubleshooting.md)
