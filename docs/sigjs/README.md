# Sig.js

Sig.js is a lightweight, signals-based DOM reactivity library. It renders static HTML by default and surgically updates only the specific DOM elements that need to change--without a virtual DOM, without a compiler, and without re-rendering entire component trees.

Sig.js is a WebEngine native module but is fully independent. It can be used in any project.

---

## Philosophy

Most modern frameworks re-evaluate entire component trees when state changes. Sig.js takes a different approach--the DOM is static by default. Reactivity is opt-in, applied only to the elements that need it.

- Static first--everything renders once and stays put
- Surgical updates--only the exact DOM node tied to a signal updates
- No virtual DOM--changes go directly to the real DOM
- No compiler--no build-time transforms, just TypeScript
- Minimal API--Signal, effect, mount, and a JSX runtime

---

## Installation

```bash
yarn add @citrusworx/sigjs
```

---

## Core API

### Signal

Creates a reactive value. Any `effect` that reads the signal will re-run when the signal's value changes.

```js
import { Signal } from "@citrusworx/sigjs";

const count = new Signal(0);

count.get(); // 0
count.set(1); // notifies all subscribers

```

### effect

Registers a function that runs immediately and re-runs whenever a signal reads changes.
```js
import { Signal, effect } from "@citrusworx/sigjs";

const count = new Signal(0);

effect(() => {
    document.querySelector('#counter').textContent = String(count.get())
});

```

The effect runs once on registration, tracking which signals it accesses. When any of those signals update, the effect re-runs automatically.

### mount

Mounts a component into a DOM target.

```js
import { mount } from "@citrusworx/sigjs";

mount(<App />, document.getElementById("root")!);
```

---

## JSX Runtime

Sig.js includes its own JSX runtime that renders directly to real DOM nodes--no virtual DOM involved. Configure your `tsconfig.json` to use it:

```json
{
    "compilerOptions" : {
        "jsx": "react-jsx",
        "jsxImportSource": "@citrusworx/sigjs"
    }
}
```
Components are plain functions that return HTMLElement:

```tsx
export function Button(){
    return (
        <button>Click me</button>
    );
}
```

---

## Reactive Components

The recommended pattern is to define signals and effects inside the component that owns them. This keeps reactive logic co-located and prevents effects from running before their DOM elements exist.

```tsx
import {Signal, effect, mount} from "@citrusworx/sigjs";

function Counter(){
    const count = Signal(0);

    const btn = (
        <button onclick={() => {count.set(count.get() + 1)}}>
        0
        </button>
    ) as HTMLElement;

    effect(() => {
        btn.textContent = String(count.get());
    });

    return (
        <div>
            <h2>Counter</h2>
            {btn}
        </div>
    )
}

mount(<Counter />, document.getElementById("root");
```

The button element is created once. The effect updates only its `textContent` when `count` changes. Nothing else in the DOM is touched.

---

## Router

Sig.js includes a client-side router that intercepts anchor tag clicks globally. No special link components are needed--write standard HTML anchors and the router handles navigation transparently.


```tsx

import { SigRouter } from "@citrusworx/sigjs";

const router = new SigRouter("#root");

router
    .set("/", <Home />)
    .set("/about", <About />, { name: "about" })
    .set("/dashboard", <Dashboard />, { name: "dashboard" })

router.start();
```

### Named Routes

Register a name with a route to reference it without hardcoding paths:

```tsx
router.set("/about", <About />, { name: "about" })

// get the path by name
router.get("about") // returns "/about"
```

### Link Navigation

Standard anchor tags work automatically--the router intercepts internal links and prevents full page reloads:

```tsx
    <a href="/about">About</a>
```

External links, `target="_blank"`, `download`, `mailto`, `tel`, and `ftp` are all passed through without interception.

#### Progromatic Navigation

```tsx
    router.navigate("/about");
    router.goBack();
```

### Rendering Pattern
Sig.js is designed to work alongside static HTML. Only reactive nodes need to be mounted--the rest of the page stays static.

```
index.html          ← static shell
  └── #root         ← sig mounts here
        └── Counter ← only #counter text updates on state change
```

This makes Sig.js suitable for:
- Static sites with interactive components
- Full single page applications
- Anything in between

---

## Using with Juice

Sig.js and Juice are separate libraries that compose naturally. Juice provides static HTML components, Sig.js wires at the app level.

```tsx
import { Button } from "@citrusworx/juice";
import { Signal, effect, mount } from "@citrusworx/sigjs";

const count = Signal(0);

function App() {
  const btn = <Button id="counter" label="0" onclick={() => count.set(count.get() + 1)} />;

  effect(() => {
    (btn as HTMLButtonElement).textContent = String(count.get());
  });

  return btn;
}

mount(<App />, document.getElementById("root")!);
```

## Known Limitations

Sig.js is in active development. The following are known gaps for future releases:

|Feature|Status|
|--|--|
|Effect cleanup/dispose|Planned--v0.2|
|Router cleanup on navigate|Planned--v0.2|
|Dynamic route params (`/user/:id`)|planned--v0.3|
|Dervied signals (memo)|planned--v0.4|
|Error boundaries|Planned|
|Batched updates|Planned|

## Roadmap

```
v0.1  ← Signal, effect, mount, JSX runtime, router  ✅
v0.2  ← cleanup / dispose, router cleanup
v0.3  ← dynamic route params
v0.4  ← derived signals / memo
v1.0  ← stable API
```

## Status

Sig.js is in active development as a WebEngine native module. The core API is functional and in use in the CitrusWorx reference implementation.

---

## Documentation

Complete guides and references for using Sig.js:

| Document | Purpose |
|----------|---------|
| [Getting Started](./sig-getting-started.md) | Quick introduction and basic concepts |
| [API Reference](./sig-api.md) | Complete API for Signal, effect, batch, memo, JSX runtime, and router |
| [Router Guide](./sig-router.md) | Building SPAs with SigRouter, link interception, named routes |
| [Examples](./sig-examples.md) | Real-world patterns: counter, todo app, forms, API integration, WebSockets |
| [Sig.js + Juice Integration](./sig-juice-integration.md) | Building complete apps with Sig.js reactivity and Juice styling |
| [Project Status](./sig-status.md) | Roadmap, known limitations, comparison with other frameworks |
| [Troubleshooting](./sig-troubleshooting.md) | Common issues and solutions |