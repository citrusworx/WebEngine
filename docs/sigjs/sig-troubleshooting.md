# Sig.js Troubleshooting Guide

Solutions for common issues when using Sig.js.

## Table of Contents

- [Reactivity Issues](#reactivity-issues)
- [Rendering Issues](#rendering-issues)
- [Router Issues](#router-issues)
- [Performance Issues](#performance-issues)
- [TypeScript Issues](#typescript-issues)
- [Getting Help](#getting-help)

---

## Reactivity Issues

### Signal Changes Aren't Visible in DOM

**Problem**: You update a signal but the DOM doesn't change.

**Cause**: Signal value used outside a function in JSX, so binding is never established.

**Solution**: Wrap signal accesses in functions

```tsx
// ❌ Wrong - signal accessed at render time, not tracked
function Counter() {
  const count = Signal(0);
  return <div>Count: {count.get()}</div>;
}

// ✅ Correct - signal accessed in function, tracked for updates
function Counter() {
  const count = Signal(0);
  return <div>Count: {() => count.get()}</div>;
}
```

### Signal Updates Don't Trigger Effects

**Problem**: You call `signal.set()` but the effect doesn't run.

**Cause**: Effect was registered before the signal was accessed, or signal isn't actually changing.

**Solution**: Ensure effects are registered after signals are created

```tsx
// ❌ Wrong - effect registered but signal not accessed
const count = Signal(0);
effect(() => {
  console.log("This won't run");
});

// ✅ Correct - effect accesses signal
effect(() => {
  console.log("Count:", count.get()); // Effect sees this access
});
```

### Multiple Signal Updates Cause Multiple Re-renders

**Problem**: Updating multiple signals causes several re-renders.

**Cause**: Each signal update triggers dependent effects separately.

**Solution**: Use `batch()` to group updates

```tsx
// ❌ Bad - 3 separate updates, multiple re-renders
firstName.set("John");
lastName.set("Doe");
email.set("john@example.com");

// ✅ Good - batched, single re-render
batch(() => {
  firstName.set("John");
  lastName.set("Doe");
  email.set("john@example.com");
});
```

### Effect Runs Multiple Times

**Problem**: An effect runs more times than expected.

**Cause**: Effect registers multiple times or accesses signal in unexpected way.

**Solution**: Check that effect is defined at component level, not in another effect

```tsx
// ❌ Wrong - effect registration inside render creates new effect each time
function App() {
  effect(() => {
    // This will register new effect frequently
  });
}

// ✅ Correct - effect at function level
const data = Signal(null);

effect(() => {
  // Registered once
  fetch("/api/data").then(r => r.json()).then(d => data.set(d));
});

function App() {
  return <div>{() => data.get()}</div>;
}
```

### Memory Leaks with Effects

**Problem**: Effects and signals accumulate over time, memory grows.

**Cause**: Effects not cleaned up when components unmount, subscriptions not removed.

**Solution**: Clear effects when component is destroyed

```tsx
// ✅ Correct - clean up effect
const data = Signal(null);

const cleanup = effect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 1000);

  return () => clearInterval(interval); // Cleanup function
});

// Later, when component unmounts:
// cleanup(); // Call returned function to stop effect
```

---

## Rendering Issues

### Text Content Not Updating in Real Time

**Problem**: Element text should update but doesn't.

**Cause**: Text node created at render time, no reactivity wired.

**Solution**: Use `effect()` to update element content

```tsx
// ❌ Wrong - text set once at render time
function Counter() {
  const count = Signal(0);
  const el = <div>Count: 0</div>;
  return el;
}

// ✅ Correct - effect updates text when count changes
function Counter() {
  const count = Signal(0);
  const el = <div /> as HTMLElement;

  effect(() => {
    el.textContent = `Count: ${count.get()}`;
  });

  return el;
}

// ✅ Alternative - use functions in JSX
function Counter() {
  const count = Signal(0);
  return <div>Count: {() => count.get()}</div>;
}
```

### Styles Not Applying from Juice

**Problem**: Juice attributes aren't generating styles.

**Cause**: Juice CSS not loaded before rendering, or attributes used incorrectly.

**Solution**: Import Juice CSS first

```tsx
// ✅ Correct - CSS first
import "@citrusworx/juice/dist/juice.css";
import { mount } from "@citrusworx/sigjs";

// Then use Juice attributes
function App() {
  return <div padding="lg" bg="primary-50">Hello</div>;
}

mount(<App />, document.getElementById("root"));
```

### Event Handlers Not Firing

**Problem**: onClick, onInput, etc. don't trigger.

**Cause**: Handler assigned after element created, or handler not a function.

**Solution**: Define handlers when creating element

```tsx
// ❌ Wrong - handler added separately
const btn = <button>Click</button> as HTMLButtonElement;
btn.onclick = () => count.set(count.get() + 1);

// ✅ Correct - handler in JSX
const btn = <button onClick={() => count.set(count.get() + 1)}>
  Click
</button>;
```

### List Items Not Rendering

**Problem**: Array of items doesn't appear in DOM.

**Cause**: Array rendering outside function, not tracked as reactive.

**Solution**: Wrap array mapping in function

```tsx
// ❌ Wrong - array rendered once
function TodoList() {
  const todos = Signal([
    { id: 1, text: "Todo 1" },
    { id: 2, text: "Todo 2" },
  ]);

  return (
    <ul>
      {todos.get().map(todo => <li key={todo.id}>{todo.text}</li>)}
    </ul>
  );
}

// ✅ Correct - array mapping in function
function TodoList() {
  const todos = Signal([
    { id: 1, text: "Todo 1" },
    { id: 2, text: "Todo 2" },
  ]);

  return (
    <ul>
      {() => todos.get().map(todo => <li key={todo.id}>{todo.text}</li>)}
    </ul>
  );
}
```

### Conditional Elements Not Showing/Hiding

**Problem**: Conditional elements (if/ternary) don't update when signal changes.

**Cause**: Condition evaluated once at render time, not wrapped in function.

**Solution**: Wrap conditions in functions

```tsx
// ❌ Wrong - condition evaluated once
function LoginForm() {
  const isLoggedIn = Signal(false);

  return (
    <div>
      {isLoggedIn.get() ? <Dashboard /> : <LoginForm />}
    </div>
  );
}

// ✅ Correct - condition in function, re-evaluated on signal change
function LoginForm() {
  const isLoggedIn = Signal(false);

  return (
    <div>
      {() => isLoggedIn.get() ? <Dashboard /> : <LoginForm />}
    </div>
  );
}
```

---

## Router Issues

### Links Not Working

**Problem**: Clicking links doesn't navigate to new route.

**Cause**: Router not started, or internal links not formatted correctly.

**Solution**: Call `router.start()` after defining routes

```tsx
// ❌ Wrong - routes defined but not started
const router = new SigRouter("#app");
router.set("/", <Home />);
router.set("/about", <About />);
// Missing router.start()!

// ✅ Correct
const router = new SigRouter("#app");
router.set("/", <Home />);
router.set("/about", <About />);
router.start(); // Required!
```

### External Links Triggering Navigation

**Problem**: Links to external sites navigate within app instead of opening in new page.

**Cause**: Router intercepting all links.

**Solution**: External links are automatically handled; if not working, check href format

```tsx
// ✅ These are automatically excluded from routing:
<a href="https://example.com">External</a>
<a href="mailto:user@example.com">Email</a>
<a href="tel:+1234567890">Phone</a>
<a href="ftp://files.example.com">FTP</a>
<a target="_blank">Opens in new tab</a>
<a download>Download</a>
```

### Back Button Not Working

**Problem**: Browser back button doesn't navigate to previous page.

**Cause**: Router not properly managing history.

**Solution**: Ensure router is started

```tsx
router.start(); // Enables history interception

// Also check:
// 1. Is the app running in a real browser (not some sandbox)?
// 2. Has user actually navigated to a page first?
// 3. Are you using window.history.replaceState elsewhere?
```

### Routes Not Matching

**Problem**: URL changes but route component doesn't render.

**Cause**: Path not registered or formatted incorrectly.

**Solution**: Check exact path registration

```tsx
// Make sure paths match exactly
router.set("/about", <About />); // Route registered
// <a href="/about">About</a> ✅ Works
// <a href="/About">About</a> ❌ Doesn't work (case-sensitive)
// <a href="/about/">About</a> ❌ Doesn't work (trailing slash)
```

### Named Routes Returning Wrong Path

**Problem**: `router.get("name")` returns wrong or undefined path.

**Cause**: Route registered without a name.

**Solution**: Ensure route was registered with a name

```tsx
// ✅ Correct - route with name
router.set("/user/profile", <Profile />, "user-profile");
router.get("user-profile"); // Returns "/user/profile"

// This doesn't work:
const name = "user-profile";
router.get(name); // ❌ Need to register with this name first
```

### Multiple Router Instances

**Problem**: Multiple routers created, navigation broken.

**Cause**: Creating new router instances in components.

**Solution**: Create single router instance at app level

```tsx
// ❌ Wrong - new router created each render
function App() {
  const router = new SigRouter("#app"); // Created every time!
  router.set("/", <Home />);
  router.start();
}

// ✅ Correct - single router instance
const router = new SigRouter("#app");
router.set("/", <Home />);
router.start();

function App() {
  return <main id="app" />;
}
```

---

## Performance Issues

### App Feels Sluggish

**Problem**: UI updates feel slow or laggy.

**Common Causes**:
1. Too many re-renders
2. Effects doing expensive operations
3. Large lists without optimization

**Solutions**:

```tsx
// 1. Use batch() for multiple updates
batch(() => {
  signal1.set(value1);
  signal2.set(value2);
});

// 2. Use memo() for expensive computations
const filtered = memo(() => {
  return largeArray.filter(expensiveCondition);
});

// 3. Split large lists
function LargeList() {
  const items = Signal(generateLargeList());
  const page = Signal(0);
  const pageSize = 50;

  const currentPage = memo(() => {
    const start = page.get() * pageSize;
    return items.get().slice(start, start + pageSize);
  });

  return (
    <div>
      {() => currentPage.get().map(item => <Item key={item.id} {...item} />)}
    </div>
  );
}
```

### Many Signals Cause Lag

**Problem**: App slows down when managing many signals.

**Cause**: Each signal creates subscriptions, effects trigger frequently.

**Solution**: Consolidate related signals into single object signal

```tsx
// ❌ Not ideal - many separate signals
const firstName = Signal("");
const lastName = Signal("");
const email = Signal("");
const phone = Signal("");
// ... many more

// ✅ Better - single object signal
const formData = Signal({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
});
```

### Large Component Trees Are Slow

**Problem**: Component with many child signals is slow.

**Cause**: Each child effect runs independently.

**Solution**: Move effects to leaf components

```tsx
// ❌ Wrong - parent effect updates all children
function Parent() {
  const data = Signal([...]);

  effect(() => {
    updateAllChildrenDOM();
  });

  return <div>{children}</div>;
}

// ✅ Better - each child manages its own state
function Child(props: { item: Item }) {
  const processed = memo(() => heavyProcessing(props.item));
  return <div>{() => processed.get()}</div>;
}
```

---

## TypeScript Issues

### JSX Not Recognized

**Problem**: JSX syntax highlighted as error.

**Cause**: TypeScript not configured to use Sig.js JSX runtime.

**Solution**: Update tsconfig.json

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@citrusworx/sigjs"
  }
}
```

### Type Errors with Signal

**Problem**: TypeScript complaining about Signal types.

**Cause**: Signal type not inferred correctly.

**Solution**: Explicitly type signals

```tsx
// ✅ Type explicitly
const count = Signal<number>(0);
const user = Signal<User>({ name: "", email: "" });
const items = Signal<Item[]>([]);

// Or let TypeScript infer
const count = Signal(0); // Inferred as Signal<number>
```

### Event Handler Types

**Problem**: onClick/onChange handlers showing type errors.

**Cause**: Handler type not matching expected event type.

**Solution**: Cast event target if needed

```tsx
// ✅ Correct - cast input to HTMLInputElement
<input
  onInput={(e) => input.set((e.target as HTMLInputElement).value)}
/>

// ✅ Or use proper typing
function handleInput(e: Event) {
  const target = e.target as HTMLInputElement;
  input.set(target.value);
}
```

---

## Getting Help

### Debugging Strategies

1. **Console Logging**
   ```tsx
   effect(() => {
     console.log("Signal changed:", signal.get());
   });
   ```

2. **Element Inspection**
   - Open browser DevTools
   - Check elements for correct attributes
   - Verify CSS is applied

3. **Effect Tracking**
   ```tsx
   effect(() => {
     console.log("Effect running");
     return () => console.log("Effect cleaning up");
   });
   ```

4. **Step Through Code**
   - Set breakpoints in DevTools
   - Inspect signal values during execution
   - Check effect call stack

### Getting Help Resources

- **Documentation**: Read [sig-getting-started.md](./sig-getting-started.md)
- **Examples**: Review [sig-examples.md](./sig-examples.md) for patterns
- **API Reference**: Check [sig-api.md](./sig-api.md) for method details
- **Issues**: Check GitHub issues for similar problems
- **Router Guide**: See [sig-router.md](./sig-router.md) for routing help

### Minimal Reproduction

When reporting issues, create minimal reproduction:

```tsx
import { Signal, mount } from "@citrusworx/sigjs";

// Simplest possible example showing the issue
const count = Signal(0);

function App() {
  return (
    <div>
      <p>{() => count.get()}</p>
      <button onClick={() => count.set(count.get() + 1)}>
        Increment
      </button>
    </div>
  );
}

mount(<App />, document.getElementById("root"));
```

Include:
- Sig.js version
- Browser version
- Steps to reproduce
- Expected vs actual behavior