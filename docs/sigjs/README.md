# Sig.js

Signals-based DOM reactivity for CitrusWorx apps.

Sig.js keeps the page static by default and updates only the nodes you wire to a signal. There is no virtual DOM, no compiler, and no component-tree re-render. You write TypeScript (or JSX that compiles to the Sig runtime) and talk to the real DOM.

The current model is:

- **Signals** own values. `get()` reads; `set()` notifies subscribers.
- **Effects** own side effects. An effect that reads a signal re-runs when that signal changes.
- **JSX** creates real `HTMLElement`s once. Reactivity is opt-in: a function child becomes a live text node, or you hold an element and update it from an effect.
- **Juice** owns structure and style. Sig.js owns behavior.

Sig.js is strongest when you treat most of the page as static markup and apply reactivity only where something actually changes.

## Who it is for

- App authors who need toggles, counters, forms, and route-aware UI on top of Juice (or plain HTML)
- Anyone who wants fine-grained DOM updates without adopting a virtual-DOM framework
- WebEngine apps, and any project that can import `@citrusworx/sigjs`

It is not a full UI framework. It does not ship components, SSR, or a form library.

## Why it exists

CitrusWorx split UI into two jobs:

- **Juice** expresses layout and identity in markup (`stack`, `row`, `gap`, `card`, `surface`)
- **Sig.js** expresses *change* — the few values and effects that should move after first paint

Most modern UI stacks re-evaluate a component tree when state changes. That is the wrong default for Juice pages, which are mostly static structure. Sig.js exists so you do not have to pull in a heavyweight runtime just to increment a counter or swap a label.

The design bets:

- Static first — everything renders once and stays put unless you subscribe
- Surgical updates — only the node you touch is rewritten
- No virtual DOM — writes go to the real DOM
- No compiler — JSX is a thin factory, not a compile-time reactive transform
- Small API — `Signal`, `effect`, `batch`, `memo`, `mount`, and `SigRouter`

That split is healthier than stuffing behavior into CSS, or stuffing layout into a component runtime.

## Current setup shape

```ts
import { Signal, effect, mount } from "@citrusworx/sigjs";
```

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@citrusworx/sigjs"
  }
}
```

`Signal` is a **factory**, not a class. Call `Signal(0)`, not `new Signal(0)`.

## What it can do

### 1. A value and a live text node

Function children are the smallest reactive surface. The JSX runtime turns `() => …` into a text node and re-runs the function when signals it reads change.

```tsx
import { Signal, mount } from "@citrusworx/sigjs";

function Counter() {
  const count = Signal(0);

  return (
    <div>
      <p>Count: {() => String(count.get())}</p>
      <button onClick={() => count.set(count.get() + 1)}>Increment</button>
    </div>
  );
}

mount(<Counter />, document.getElementById("root")!);
```

The button and the wrapping `div` are created once. Only the text node after `Count:` updates.

### 2. An effect that owns one element

When you need more than text — `textContent`, `className`, `disabled`, a list rewrite — capture the element and update it from an `effect`.

```tsx
import { Signal, effect, mount } from "@citrusworx/sigjs";

function Toggle() {
  const on = Signal(false);

  const button = (
    <button onClick={() => on.set(!on.get())}>Off</button>
  ) as HTMLButtonElement;

  effect(() => {
    const value = on.get();
    button.textContent = value ? "On" : "Off";
    button.setAttribute("aria-pressed", String(value));
  });

  return button;
}

mount(<Toggle />, document.getElementById("root")!);
```

This is the pattern the library is built around: **create the node once, subscribe once, write to that node**.

### 3. Batch related writes

Without `batch`, each `set()` notifies effects immediately. Group related updates so dependents run once.

```ts
import { Signal, batch, effect } from "@citrusworx/sigjs";

const first = Signal("");
const last = Signal("");

effect(() => {
  console.log(`${first.get()} ${last.get()}`);
});

batch(() => {
  first.set("Ada");
  last.set("Lovelace");
});
// the effect runs once after the batch, not twice
```

### 4. Memoized derived values

`memo` caches a computation and invalidates when its signal dependencies change.

```ts
import { Signal, memo } from "@citrusworx/sigjs";

const items = Signal([1, 2, 3, 4, 5]);
const total = memo(() => items.get().reduce((sum, n) => sum + n, 0));

total.get(); // 15
total.get(); // cached
items.set([1, 2, 3]);
total.get(); // 6
```

### 5. Client-side routes

`SigRouter` matches **exact paths**. Keys without a leading slash become named routes (`about` → `/about`). Prefer component functions so each visit builds a fresh tree; the router disposes the previous view's effects.

```tsx
import { SigRouter } from "@citrusworx/sigjs";

const router = new SigRouter("#root");

router.set({
  "/": Home,
  about: About,
  contact: Contact,
});

router.start();
```

```html
<nav>
  <a href="/">Home</a>
  <a href="/about">About</a>
</nav>
```

There is no `/user/:id` matcher yet. Parse `window.location.pathname` yourself if you need a segment.

## Mental model

| You want… | Use |
|---|---|
| A reactive value | `Signal(initial)` |
| Live **text** in JSX | `{() => String(signal.get())}` |
| Live attributes, lists, or structure | Hold the element; update it in `effect` |
| Several writes, one notification | `batch(() => { … })` |
| A cached derivation | `memo(() => …)` |
| To put a tree on the page | `mount(node, target)` |
| SPA navigation | `new SigRouter("#root")` |

Function children are **text only**. The runtime does `textNode.textContent = String(child())`. Returning an element from a function child stringifies it; it does not swap subtrees. Attributes such as `className={() => …}` or `value={() => …}` are **not** reactive — `setProp` assigns the function once. Use an effect for those.

## Using with Juice

Juice styles the tree. Sig.js moves values inside it. Import Juice core + a theme, then write attributes on the same elements Sig creates:

```tsx
import "@citrusworx/juiceui/styles";
import "./generated/my-theme.css";
import { Signal, effect, mount } from "@citrusworx/sigjs";

function App() {
  const count = Signal(0);
  const label = <span>0</span> as HTMLSpanElement;

  effect(() => {
    label.textContent = String(count.get());
  });

  return (
    <main stack gap="2rem" padding="2rem">
      <section card padding="1.25rem" stack gap="1rem">
        <h1>Clicks</h1>
        <p>Count: {label}</p>
        <button onClick={() => count.set(count.get() + 1)}>Add one</button>
      </section>
    </main>
  );
}

mount(<App />, document.getElementById("root")!);
```

Juice does not export a `Button` component for Sig to import. Use HTML plus Juice attributes.

## Suggested reading order

1. [Getting Started](./sig-getting-started.md) — install, JSX setup, first reactive page
2. [API Reference](./sig-api.md) — `Signal`, `effect`, `batch`, `memo`, JSX, `mount`, router
3. [Examples](./sig-examples.md) — counter, form, list rewrite, fetch
4. [Router Guide](./sig-router.md) — exact paths, named routes, cleanup
5. [Sig.js + Juice](./sig-juice-integration.md) — behavior vs structure
6. [Troubleshooting](./sig-troubleshooting.md) — the usual “why didn’t it update?” cases
7. [Status](./sig-status.md) — what is shipped vs planned

## Status

**Alpha** (`@citrusworx/sigjs` 0.2.0). Core reactivity is implemented and tested. The public direction is stable enough to describe clearly:

- `Signal`, `effect` (with cleanup / dispose), `batch`, `memo`
- JSX runtime (direct DOM, function-child text, `ref`, `on*` events)
- `mount` and tree dispose
- `SigRouter` — exact paths, named routes, link interception, view cleanup

Not shipped:

- Dynamic route params (`/user/:id`)
- Reactive attribute bindings in JSX
- Function children that return elements or lists
- SSR / hydration
- Error boundaries

See [Status](./sig-status.md) for the honest matrix.

## Sibling packages

- [Juice](../juice/README.md) — attribute-first styling
- [Nectarine](../nectarine/README.md) — YAML models and database adapters
- [Seltzer](../seltzer/README.md) — HTTP runtime
- [Grapevine](../grapevine/README.md) — DigitalOcean provisioning
