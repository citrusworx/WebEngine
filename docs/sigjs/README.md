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

- App authors who need toggles, counters, forms, lists, fetch, and route-aware UI on top of Juice (or plain HTML)
- Anyone who wants fine-grained DOM updates without adopting a virtual-DOM framework
- WebEngine apps, and any project that can import `@citrusworx/sigjs`

It is not a full UI framework. It does not ship components, SSR, or a form library.

## Why it exists

CitrusWorx split UI into two jobs:

- **Juice** expresses layout and identity in markup (`stack`, `row`, `gap`, `card`, `surface`)
- **Sig.js** expresses *change* — the few values and effects that should move after first paint

Most modern UI stacks re-evaluate a component tree when state changes. That is the wrong default for Juice pages, which are mostly static structure. A hero, a card grid, and a footer do not need to be recreated because a counter incremented. Sig.js exists so you do not have to pull in a heavyweight runtime just to increment a tally, open a disclosure, rewrite a list, or swap a view.

The design bets:

- **Static first** — everything renders once and stays put unless you subscribe
- **Surgical updates** — only the node you touch is rewritten
- **No virtual DOM** — writes go to the real DOM
- **No compiler** — JSX is a thin factory, not a compile-time reactive transform
- **Small API** — `Signal`, `effect`, `batch`, `memo`, `mount`, and `SigRouter`

That split is healthier than stuffing behavior into CSS, or stuffing layout into a component runtime. Juice already knows how to place things. Sig.js only needs to know how values move.

If you have already built a page with the [Juice tutorial](../juice/juice-page-tutorial.md), Sig.js is the next layer: the same markup, plus the handful of live values the page actually needs.

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

The sections below are the capability showcase. Every snippet matches `libraries/sig/src`. If a pattern is not here, it is probably not in the library — check [Status](./sig-status.md) before assuming a React-shaped API.

### 1. A value and a live text node

Function children are the smallest reactive surface. The JSX runtime turns `() => …` into a text node and re-runs the function when signals it reads change.

```tsx
import { Signal, mount } from "@citrusworx/sigjs";

function Counter() {
  const count = Signal(0);

  return (
    <div>
      <p>Count: {() => String(count.get())}</p>
      <button type="button" onClick={() => count.set(count.get() + 1)}>
        Increment
      </button>
    </div>
  );
}

mount(<Counter />, document.getElementById("root")!);
```

The button and the wrapping `div` are created once. Only the text node after `Count:` updates. That is the whole trick: the page is a real DOM tree, and one text node is subscribed.

### 2. An effect that owns one element

When you need more than text — `textContent`, `className`, `disabled`, `hidden`, a list rewrite — capture the element and update it from an `effect`.

```tsx
import { Signal, effect, mount } from "@citrusworx/sigjs";

function Toggle() {
  const on = Signal(false);

  const button = (
    <button type="button" onClick={() => on.set(!on.get())}>
      Off
    </button>
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

This is the pattern the library is built around: **create the node once, subscribe once, write to that node**. Juice's own accordion component uses the same shape — a `Signal` for expanded state, an `effect` that writes `hidden` and `aria-expanded`.

### 3. Conditional UI without a virtual DOM

There is no `{open && <Panel />}`. Returning an element from a function child stringifies it. Show and hide with the DOM you already have:

```tsx
import { Signal, effect, mount } from "@citrusworx/sigjs";

function Notes() {
  const open = Signal(false);
  const panel = (
    <aside panel padding="1.25rem" hidden>
      Shift notes stay mounted. Only `hidden` flips.
    </aside>
  ) as HTMLElement;

  effect(() => {
    panel.hidden = !open.get();
  });

  return (
    <section stack gap="1rem">
      <button type="button" onClick={() => open.set(!open.get())}>
        {() => (open.get() ? "Hide notes" : "Show notes")}
      </button>
      {panel}
    </section>
  );
}

mount(<Notes />, document.getElementById("root")!);
```

The panel is created on first render. The effect toggles `hidden`. For swapping *which* children exist, use `replaceChildren` — see [JSX and the DOM](./sig-jsx.md).

### 4. Lists you rewrite yourself

There is no keyed reconciler. The honest list pattern is `replaceChildren` inside an effect.

```tsx
import { Signal, effect, mount } from "@citrusworx/sigjs";

function Queue() {
  const items = Signal<string[]>(["Review the deploy window"]);
  const list = <ul stack gap="0.5rem"></ul> as HTMLUListElement;

  effect(() => {
    list.replaceChildren(
      ...items.get().map((text) => <li>{text}</li>),
    );
  });

  return (
    <section stack gap="1rem">
      <button
        type="button"
        onClick={() =>
          items.set([...items.get(), `Item ${items.get().length + 1}`])
        }
      >
        Add
      </button>
      {list}
    </section>
  );
}

mount(<Queue />, document.getElementById("root")!);
```

`{() => items.get().map((text) => <li>{text}</li>)}` does **not** produce a list. Function children become `String(child())` text. The [tutorial](./sig-page-tutorial.md) builds a real queue this way.

### 5. A form field that is not two-way bound

Inputs are platform controls. Read from the event; write back from an effect if you need a controlled value. Derive labels with `memo` when several readers share one computation.

```tsx
import { Signal, effect, memo, mount } from "@citrusworx/sigjs";

function OperatorName() {
  const name = Signal("");
  const greeting = memo(() => name.get().trim() || "operator");

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
    <label stack gap="0.5rem">
      Name
      {input}
      <p>Hello, {() => greeting.get()}</p>
    </label>
  );
}

mount(<OperatorName />, document.getElementById("root")!);
```

### 6. Batch related writes

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

`batch` uses a depth counter: nested calls flush once, when the outermost `batch` finishes. A throw inside `fn` still resets the depth. Details in [Effects](./sig-effects.md).

### 7. Memoized derived values

`memo` caches a computation and invalidates when its signal dependencies change. It is lazy: the function runs on `get()`, not at creation.

```ts
import { Signal, memo } from "@citrusworx/sigjs";

const items = Signal([1, 2, 3, 4, 5]);
const total = memo(() => items.get().reduce((sum, n) => sum + n, 0));

total.get(); // 15
total.get(); // cached
items.set([1, 2, 3]);
total.get(); // 6
```

`set()` on a signal always notifies, even if the value is unchanged. `memo` has no `set` and no public `dispose`.

### 8. Fetch with abort on the next tick

Effects may return a cleanup. It runs before the next execution and again when the effect is disposed — including when `SigRouter` leaves a view.

```tsx
import { Signal, effect, batch } from "@citrusworx/sigjs";

function StatusLine() {
  const path = Signal("/health");
  const body = <pre></pre> as HTMLPreElement;

  effect(() => {
    const url = path.get();
    const controller = new AbortController();

    fetch(url, { signal: controller.signal })
      .then((res) => res.text())
      .then((text) => {
        body.textContent = text;
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        body.textContent = String(err);
      });

    return () => controller.abort();
  });

  return body;
}
```

### 9. Client-side routes

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

There is no `/user/:id` matcher yet. Parse `window.location.pathname` yourself if you need a segment. `navigate("about")` normalizes to `/about`, same as `set` / `has`. Register `"*"` if you want an unknown-path view; without it, `navigate` to a missing path is a no-op and `popstate` empties the target.

## Mental model

| You want… | Use |
|---|---|
| A reactive value | `Signal(initial)` |
| Live **text** in JSX | `{() => String(signal.get())}` |
| Live attributes, lists, or structure | Hold the element; update it in `effect` |
| Show / hide existing structure | `hidden` (or similar) from an effect |
| Swap list children | `replaceChildren` from an effect |
| Several writes, one notification | `batch(() => { … })` |
| A cached derivation | `memo(() => …)` |
| To put a tree on the page | `mount(node, target)` |
| SPA navigation | `new SigRouter("#root")` |

Function children are **text only**. The runtime does `textNode.textContent = String(child())`. Returning an element from a function child stringifies it; it does not swap subtrees. Attributes such as `className={() => …}` or `value={() => …}` are **not** reactive — `setProp` assigns the function once. Use an effect for those.

Component functions run **once** per mount (or per router visit). They are factories for DOM, not render functions. That is why `{count.get()}` without a function wrapper is a static snapshot.

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
        <button type="button" onClick={() => count.set(count.get() + 1)}>
          Add one
        </button>
      </section>
    </main>
  );
}

mount(<App />, document.getElementById("root")!);
```

Juice does not export a `Button` component for Sig to import. Use HTML plus Juice attributes. The [page tutorial](./sig-page-tutorial.md) builds a whole operator desk this way — hero, cards, form fields, a live queue, and a second route.

## Suggested reading order

1. [Getting Started](./sig-getting-started.md) — install, JSX setup, first reactive page
2. [Page Tutorial](./sig-page-tutorial.md) — guided build: counter → disclosure → list → form → route
3. [Signals](./sig-signals.md) — `get` / `set`, when updates fire, sharing values
4. [Effects](./sig-effects.md) — tracking, cleanup, `batch`, `memo`
5. [JSX and the DOM](./sig-jsx.md) — static first, function children, lists, conditionals
6. [Patterns](./sig-patterns.md) — truthful cookbook for common UI
7. [Best Practices](./sig-best-practices.md) — how to compose Sig so it stays small
8. [Anti-Patterns](./sig-anti-patterns.md) — React habits, reactive attributes, VDOM assumptions
9. [Examples](./sig-examples.md) — longer showcases (forms, lists, fetch, router)
10. [Router Guide](./sig-router.md) — exact paths, named routes, cleanup
11. [Sig.js + Juice](./sig-juice-integration.md) — behavior vs structure
12. [API Reference](./sig-api.md) — the public surface, one page
13. [Troubleshooting](./sig-troubleshooting.md) — the usual “why didn’t it update?” cases
14. [Status](./sig-status.md) — Alpha maturity matrix
15. [Roadmap](./sig-roadmap.md) — what would move Sig upward, and what would not

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

Alpha here means the core is real and documented, not that the API is frozen. See [Status](./sig-status.md) for the area-by-area matrix and [Roadmap](./sig-roadmap.md) for what is worth building next.

## Sibling packages

- [Juice](../juice/README.md) — attribute-first styling
- [Nectarine](../nectarine/README.md) — YAML models and database adapters
- [Seltzer](../seltzer/README.md) — HTTP runtime
- [Grapevine](../grapevine/README.md) — DigitalOcean provisioning
