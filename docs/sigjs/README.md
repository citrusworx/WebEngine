# Sig.js

`@citrusworx/sigjs` is a standalone signals library with a JSX-to-DOM runtime and a small client router. It has no runtime dependencies and does not require WebEngine, Nectarine, Seltzer, or Juice.

If you are new to the package, start with the published README — it is enough to install and ship a page:

**[libraries/sig/README.md](../../libraries/sig/README.md)**

This folder is extra detail: longer guides, a router walkthrough, and optional Juice notes.

---

## What it does

Host elements render once. Reactivity is opt-in: wrap a child or a prop in a function that reads a `Signal`, and only that node updates. There is no virtual DOM and no compiler beyond TypeScript's JSX transform.

```tsx
import { Signal, mount } from "@citrusworx/sigjs";

function Counter() {
  const count = Signal(0);

  return (
    <button
      className={() => (count.get() > 0 ? "hot" : "cold")}
      onClick={() => count.set(count.get() + 1)}
    >
      {() => count.get()}
    </button>
  );
}

mount(<Counter />, document.getElementById("root")!);
```

A Vite example that runs without the rest of this monorepo lives in [`libraries/sig/examples/counter`](../../libraries/sig/examples/counter).

---

## Docs in this folder

| Document | Purpose |
|----------|---------|
| [Getting Started](./sig-getting-started.md) | Install, `tsconfig` / Vite, first component |
| [API Reference](./sig-api.md) | `Signal`, `effect`, `batch`, `memo`, JSX, `mount`, `SigRouter` |
| [Router Guide](./sig-router.md) | Exact paths, `:param`, `*`, named routes, link interception |
| [Examples](./sig-examples.md) | Counter, todos, forms, fetch — vanilla DOM |
| [Project Status](./sig-status.md) | 0.2.0 surface, gaps, roadmap |
| [Troubleshooting](./sig-troubleshooting.md) | JSX config, missed subscriptions, router misses |
| [Sig.js + Juice](./sig-juice-integration.md) | Optional: using Sig with Juice styles (not required) |

---

## Also used by

CitrusWorx apps in this repo (Juice, KiwiPress, and others) depend on `@citrusworx/sigjs` the same way any other project would: `npm install` and `jsxImportSource`. You do not need those packages to use Sig.js.
