# Sig.js Getting Started Guide

This guide will help you get up and running with Sig.js, a lightweight signals-based DOM reactivity library.

## What is Sig.js?

Sig.js is a minimal, modern approach to DOM reactivity that uses **signals** (reactive values) and **effects** (tracking functions) to update the DOM. Unlike traditional frameworks, Sig.js:

- Keeps HTML static by default
- Updates only the specific DOM elements that need to change
- Avoids virtual DOM overhead
- Requires no compiler or build-time transforms
- Provides a simple, TypeScript-first API

## Installation

Install Sig.js via yarn:

```bash
yarn add @citrusworx/sigjs
```

## Basic Setup

### Step 1: Configure TypeScript for JSX

Update your `tsconfig.json` to use Sig.js's JSX runtime:

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

### Step 2: Create Your First Component

```tsx
// main.tsx
import { Signal, effect, mount } from "@citrusworx/sigjs";

function Counter() {
  const count = Signal(0);

  return (
    <div>
      <h1>Counter: {count.get()}</h1>
      <button onClick={() => count.set(count.get() + 1)}>
        Increment
      </button>
    </div>
  );
}

mount(<Counter />, document.getElementById("root")!);
```

### Step 3: Add Reactivity

To make elements update automatically when signals change, use the `effect` function:

```tsx
function Counter() {
  const count = Signal(0);

  return (
    <div>
      <h1 ref={(el) => {
        effect(() => {
          el.textContent = `Counter: ${count.get()}`;
        });
      }}></h1>
      <button onClick={() => count.set(count.get() + 1)}>
        Increment
      </button>
    </div>
  );
}
```

Or use a functional child for simpler cases:

```tsx
function Counter() {
  const count = Signal(0);

  return (
    <div>
      <h1>Counter: {() => count.get()}</h1>
      <button onClick={() => count.set(count.get() + 1)}>
        Increment
      </button>
    </div>
  );
}
```

## Key Concepts

### Signals

A **signal** is a reactive value that tracks who depends on it. When the value changes, all dependents are notified.

```typescript
import { Signal } from "@citrusworx/sigjs";

const name = Signal("Alice");
console.log(name.get()); // "Alice"
name.set("Bob");          // Notifies subscribers
```

### Effects

An **effect** is a function that automatically re-runs when its signal dependencies change.

```typescript
import { Signal, effect } from "@citrusworx/sigjs";

const count = Signal(5);

effect(() => {
  console.log("Count is now:", count.get());
});

count.set(10); // Effect runs again, logs "Count is now: 10"
```

### Component Primitives

Components in Sig.js are plain functions that return DOM elements:

```tsx
function Greeting(props: { name: string }) {
  return <div>Hello, {props.name}!</div>;
}
```

They can use signals, effects, and return JSX:

```tsx
function Timer() {
  const seconds = Signal(0);

  useEffect(() => {
    const interval = setInterval(() => {
      seconds.set(seconds.get() + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <div>Elapsed: {() => seconds.get()}s</div>;
}
```

## Common Patterns

### Updating DOM on Signal Change

Use functional children or effects with refs:

```tsx
// Functional child
<p>{() => `Count: ${count.get()}`}</p>

// Or with ref
<p ref={(el) => {
  effect(() => {
    el.textContent = `Count: ${count.get()}`;
  });
}}></p>
```

### Two-Way Binding

Bind input values to signals:

```tsx
function Form() {
  const email = Signal("");

  return (
    <div>
      <input
        type="email"
        value={email.get()}
        onInput={(e) => email.set((e.target as HTMLInputElement).value)}
      />
      <p>You entered: {() => email.get()}</p>
    </div>
  );
}
```

### Conditional Rendering

Signals work great with functional children:

```tsx
function UserGreeting(props: { isLoggedIn: Signal<boolean> }) {
  return (
    <div>
      {() => props.isLoggedIn.get() ? (
        <button>Logout</button>
      ) : (
        <button>Login</button>
      )}
    </div>
  );
}
```

### Lists and Collections

```tsx
function TodoList() {
  const todos = Signal([]);

  return (
    <ul>
      {() => todos.get().map((todo) => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}
```

## Using the Router

Sig.js includes a simple client-side router for single-page applications:

```tsx
import { SigRouter } from "@citrusworx/sigjs/sig-router";

const router = new SigRouter("#app");

router.set("/", <Home />);
router.set("/about", <About />);
router.set("/contact", <Contact />);

router.start();
```

For more details, see the [Router Guide](./sig-router.md).

## Performance Considerations

### Optimal Signal Usage

1. **Keep signals close to where they're used**: Define signals in the component that owns them
2. **Use effects for side effects**: DOM updates, API calls, etc.
3. **Batch updates**: Use `batch()` for multiple signal updates that should trigger effects once

### Avoiding Over-Reactivity

```tsx
// Good: Effect only runs when count changes
effect(() => {
  console.log(count.get());
});

// Avoid: Effect runs for every render
const logger = () => console.log(count.get());
```

## Debugging

### Check Signal Values

```typescript
const count = Signal(0);
console.log(count.get()); // See current value
```

### Trace Effects

```typescript
effect(() => {
  console.log("Effect running, count =", count.get());
  // ... DOM update logic ...
});
```

### Inspect Effect Dependencies

Effects automatically track signal access:

```typescript
effect(() => {
  // This effect depends on both signals
  const total = count.get() + multiplier.get();
  console.log("Total:", total);
});
```

## Next Steps

- Explore the [API Reference](./sig-api.md) for complete documentation
- Read the [Router Guide](./sig-router.md) for client-side routing
- Check out [Examples](./sig-examples.md) for real-world patterns
- Review the [Project Status](./sig-status.md) to see what's coming next