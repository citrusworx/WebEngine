# Sig.js API Reference

Complete reference documentation for all Sig.js APIs.

## Core APIs

### Signal

Creates a reactive value that tracks subscribers and notifies them of changes.

#### Syntax

```typescript
Signal<T>(initialValue: T): SignalInstance<T>
```

#### Parameters

- `initialValue` (T): The initial value of the signal

#### Return Value

Returns an object with `get` and `set` methods:

```typescript
{
  get(): T;
  set(newValue: T): void;
}
```

#### Description

A signal is the fundamental unit of reactivity in Sig.js. When a signal is accessed within an `effect`, that effect automatically subscribes to the signal. When the signal's value changes, all subscribed effects re-run.

#### Example

```typescript
import { Signal } from "@citrusworx/sigjs";

const count = Signal(0);
const message = Signal("Hello");

console.log(count.get());    // 0
console.log(message.get());  // "Hello"

count.set(5);                // Notifies subscribers
message.set("World");        // Notifies subscribers
```

#### Use Cases

- Storing application state
- Tracking user input
- Managing async results
- Holding component-local state

---

### effect

Registers a function to automatically re-run whenever its signal dependencies change.

#### Syntax

```typescript
effect(fn: () => void): void
```

#### Parameters

- `fn` (Function): Callback function to execute and track for reactive updates

#### Description

Executes the function immediately, tracking which signals are accessed. When any of those signals update, the effect automatically re-runs. Effects are the primary way to cause DOM updates in response to signal changes.

#### Example

```typescript
import { Signal, effect } from "@citrusworx/sigjs";

const count = Signal(0);

// Effect runs immediately
effect(() => {
  console.log("Count is:", count.get());
});

count.set(1); // Effect runs again, logs "Count is: 1"
count.set(2); // Effect runs again, logs "Count is: 2"
```

#### Dependency Tracking

Effects automatically track dependencies based on which signals are read:

```typescript
const name = Signal("Alice");
const age = Signal(25);

effect(() => {
  // This effect depends on both signals
  console.log(`${name.get()} is ${age.get()} years old`);
});

name.set("Bob");  // Effect runs (reads name)
age.set(30);      // Effect runs (reads age)
```

#### Common Patterns

**Updating DOM:**
```typescript
const message = Signal("Hello");

effect(() => {
  document.getElementById("greeting").textContent = message.get();
});
```

**Side Effects:**
```typescript
const userId = Signal(1);

effect(() => {
  const id = userId.get();
  fetch(`/api/users/${id}`)
    .then(r => r.json())
    .then(data => console.log(data));
});
```

---

### batch

Groups multiple signal updates into a single effect re-run batch.

#### Syntax

```typescript
batch(fn: () => void): void
```

#### Parameters

- `fn` (Function): Function containing signal updates

#### Description

When multiple signals are updated in sequence, `batch` ensures that dependent effects only run once after all updates are complete. Without batching, effects run after each individual signal update.

#### Example

```typescript
import { Signal, batch, effect } from "@citrusworx/sigjs";

const first = Signal("");
const last = Signal("");
let renderCount = 0;

effect(() => {
  first.get();
  last.get();
  renderCount++;
});

// Without batch: renderCount = 3 (initial + 2 updates)
// batch({
first.set("John");
last.set("Doe");
// }); renderCount = 2 (initial + 1 batch)

batch(() => {
  first.set("Jane");
  last.set("Smith");
});
// renderCount = 3 (batch only runs effects once)
```

#### Performance Benefits

Use `batch` when updating multiple related signals:

```typescript
batch(() => {
  user.set(newUser);
  loading.set(false);
  error.set(null);
});

// All dependent effects run once, not three times
```

---

### memo

Creates a memoized computed value that caches results.

#### Syntax

```typescript
memo<T>(fn: () => T): MemoInstance<T>
```

#### Parameters

- `fn` (Function): Computation function

#### Return Value

Returns an object with a `get` method:

```typescript
{
  get(): T;
}
```

#### Description

Memoized values are computed on-demand and cached. The computation only re-runs when signal dependencies change. Useful for expensive computations that depend on signals.

#### Example

```typescript
import { Signal, memo } from "@citrusworx/sigjs";

const items = Signal([1, 2, 3, 4, 5]);

// Expensive computation
const sum = memo(() => {
  console.log("Computing sum...");
  return items.get().reduce((a, b) => a + b, 0);
});

console.log(sum.get()); // "Computing sum...", returns 15
console.log(sum.get()); // Returns cached 15 (no computation)

items.set([1, 2, 3]);   // Updates dependency
console.log(sum.get()); // "Computing sum...", returns 6
```

---

## JSX Runtime

### jsx

Processes JSX elements and creates corresponding DOM nodes.

#### Syntax

```typescript
jsx(type: string | Function, props: any): Node
```

#### Parameters

- `type` (string | Function): HTML tag name or component function
- `props` (object): Element properties and attributes

#### Return Value

Returns a DOM Node

#### Description

The JSX runtime is invoked automatically when using JSX syntax. It handles:
- Creating HTML elements
- Setting properties and attributes
- Attaching event listeners
- Processing children (including signals and functions)

#### Example

```tsx
// JSX syntax
<div class="container">
  <h1>Hello</h1>
  <button onClick={() => console.log("clicked")}>Click me</button>
</div>

// Compiled to
jsx("div", { class: "container" }, [
  jsx("h1", null, "Hello"),
  jsx("button", { onClick: () => console.log("clicked") }, "Click me")
])
```

---

### jsxs

Alias for `jsx`, used for elements with multiple children.

---

### Fragment

Renders a group of elements without a wrapper element.

#### Syntax

```typescript
<>
  <div>Item 1</div>
  <div>Item 2</div>
</>
```

#### Example

```tsx
function ItemList() {
  return (
    <>
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </>
  );
}

// Renders without a wrapper element
```

---

### mount

Mounts a component into a DOM element.

#### Syntax

```typescript
mount(node: Node, target: HTMLElement): void
```

#### Parameters

- `node` (Node): DOM node or component to mount
- `target` (HTMLElement): Container element to mount into

#### Description

Replaces the target element's contents with the given node. Typically called once during application initialization.

#### Example

```typescript
import { mount } from "@citrusworx/sigjs";

function App() {
  return <div>Hello, World!</div>;
}

mount(<App />, document.getElementById("root")!);
```

---

## Router APIs

### SigRouter

Client-side router for single-page applications.

#### Constructor

```typescript
constructor(target: string = "#root")
```

Parameters:
- `target` (string): CSS selector for the container element (default: "#root")

#### Methods

##### set

Registers a route with a component.

```typescript
set(path: string, component: Node | null, name?: string): this
```

Parameters:
- `path` (string): URL path (e.g., "/about")
- `component` (Node | null): DOM node to render for this route
- `name` (string, optional): Named route for easier reference

Returns: `this` for method chaining

Example:
```typescript
const router = new SigRouter("#app");

router
  .set("/", <Home />)
  .set("/about", <About />, "about")
  .set("/contact", <Contact />, "contact");
```

---

##### get

Retrieves a named route or component.

```typescript
get(name: string): string | undefined
```

Parameters:
- `name` (string): Named route or path

Returns: Path string or undefined

Example:
```typescript
const aboutPath = router.get("about");  // Returns "/about"
```

---

##### start

Enables client-side routing with automatic link interception.

```typescript
start(): void
```

Description:
- Intercepts all link clicks (excluding external links)
- Handles browser back/forward buttons
- Renders appropriate components based on URL

Example:
```typescript
const router = new SigRouter("#app");
router.set("/", <Home />);
router.set("/about", <About />);
router.start();
```

---

##### navigate

Programmatically navigate to a route.

```typescript
navigate(path: string): void
```

Parameters:
- `path` (string): Route path

Example:
```typescript
router.navigate("/about");
button.addEventListener("click", () => router.navigate("/"));
```

---

##### goBack

Navigate to previous page in history.

```typescript
goBack(): void
```

Example:
```typescript
const backButton = <button onClick={() => router.goBack()}>Back</button>;
```

---

##### has

Check if a route is registered.

```typescript
has(path: string): boolean
```

Parameters:
- `path` (string): Route path

Returns: true if route exists

Example:
```typescript
if (router.has("/admin")) {
  showAdminLink();
}
```

---

## Type Definitions

### Child Type

```typescript
type Child =
  | Node
  | string
  | number
  | null
  | undefined
  | (() => any)
  | Child[];
```

Represents valid JSX children:
- DOM nodes
- Strings and numbers
- Functions (become reactive signals)
- Arrays of children
- Null/undefined (rendered as nothing)

---

## Best Practices

### Use Signals for State
```typescript
// Good: Signals track state
const count = Signal(0);

// Avoid: Plain variables won't trigger effects
let count = 0;
```

### Keep Effects Focused
```typescript
// Good: Single responsibility
effect(() => {
  renderCount(count.get());
});

// Avoid: Multiple unrelated side effects
effect(() => {
  renderCount(count.get());
  syncToServer(count.get());
  logAnalytics(count.get());
});
```

### Use Batch for Related Updates
```typescript
// Good: Batch related updates
batch(() => {
  isLoading.set(true);
  error.set(null);
  data.set(null);
});

// Avoid: Individual updates trigger effects each time
isLoading.set(true);
error.set(null);
data.set(null);
```

### Memoize Expensive Computations
```typescript
// Good: Cache expensive results
const expensiveTotal = memo(() => items.get().reduce((a, b) => a + b, 0));

// Avoid: Recalculating every access
const total = () => items.get().reduce((a, b) => a + b, 0);
```