# Effects

How `effect`, `batch`, `memo`, and cleanup actually work in `libraries/sig/src/signal.ts`.

An effect is the unit of work that runs when a signal changes. Function-child text, list rewrites, attribute updates, timers, and fetch all sit on this primitive.

Related:

- [Signals](./sig-signals.md) — `get` / `set`
- [JSX and the DOM](./sig-jsx.md) — when the runtime creates an effect for you
- [Anti-patterns](./sig-anti-patterns.md) — effects that fight the model

## What an effect is

```ts
function effect(fn: () => void | (() => void)): () => void
```

```ts
import { Signal, effect } from "@citrusworx/sigjs";

const count = Signal(0);

const dispose = effect(() => {
  console.log(count.get());
  return () => {
    console.log("cleanup");
  };
});

count.set(1); // cleanup, then the callback again
dispose();    // cleanup once more; further sets are ignored
```

The contract:

1. `fn` runs **immediately**.
2. Every `get()` during that run becomes a dependency.
3. When a dependency notifies, cleanup (if any) runs, then `fn` runs again.
4. The return value of `effect` is a disposer. Calling it unsubscribes and runs the last cleanup.

Tests in `signal.test.ts` pin this down: an effect that reads `count` runs once at registration and once per `set`.

## Tracking

While `fn` runs, a module-level `currentSubscriber` points at this effect. `Signal.get` / `memo.get` see that pointer and add the effect to their subscriber set.

```ts
const prevSubscriber = currentSubscriber;
currentSubscriber = subscriber;
try {
  maybeCleanup = fn();
} finally {
  currentSubscriber = prevSubscriber;
}
```

Nested effects work because each `run` saves and restores the pointer. The inner effect becomes its own subscriber; it does not steal the outer one’s dependency list.

Reads that happen **asynchronously** are not tracked:

```ts
effect(() => {
  setTimeout(() => {
    console.log(count.get()); // no currentSubscriber — this is a bare read
  }, 0);
});
```

That callback will not re-subscribe. If you need the later read to be reactive, read the signal **before** you yield, or put a second effect on the value you actually care about.

The same pitfall shows up with `fetch`:

```ts
effect(() => {
  const id = userId.get(); // tracked
  fetch(`/api/users/${id}`).then((res) => res.json()).then((data) => {
    user.set(data); // fine — that is a write
    // extra.get() here would not subscribe this effect
  });
});
```

## Dependencies are rebuilt every run

At the start of each `run()`, the effect **drops its old subscriptions** and tracks from scratch.

```ts
effect(() => {
  if (open.get()) {
    console.log(detail.get());
  }
});
```

When `open` is `false`, `detail` is not a dependency. Flipping `detail` will not re-run the effect. Flipping `open` to `true` will, and the next run *will* subscribe to `detail`.

This is correct and useful. It is also why an effect that “sometimes” reads a signal can look dead. If you need to always react, read the signal unconditionally, even if you ignore the value.

## Cleanup

If `fn` returns a function, that function is the cleanup.

Cleanup runs:

- before the next execution (the previous run’s leftover work)
- when you call the disposer
- when a cleanup scope disposes the effect (router / `mount` / `disposeTree`)

```ts
effect(() => {
  const id = window.setInterval(() => {
    ticks.set(ticks.get() + 1);
  }, 1000);
  return () => window.clearInterval(id);
});
```

Return `clearInterval`, `AbortController.abort`, unsubscribe functions. Do not assume the JS engine will do it for you.

If you construct `<About />` once and pass that **node** to the router, the effects created during that first call are disposed on the first leave and never rebuilt. Register `About`, the function. See [Router](./sig-router.md).

## Cleanup scopes and component functions

When the JSX runtime calls a function component, it wraps the call in `captureCleanupScope`:

```ts
const { value, dispose } = captureCleanupScope(() => type(props));
if (value instanceof Node) {
  attachCleanup(value, dispose);
}
```

Every `effect` registered while `type(props)` runs has its disposer added to that scope. `disposeTree` (used by `mount` and `SigRouter`) walks the node and runs those disposers.

Practical rule: **create effects inside the component function** that returns the tree. Then leaving a route, or `mount`ing over the same target, will stop timers and abort fetches.

Function-child and function-valued-prop effects also attach their disposer to the host node, so `disposeTree` can stop them even without a component wrapper. Effects you call yourself still need a function-component root (or an explicit disposer) to be found. Prefer a function component as the mount root.

`captureCleanupScope` is exported. You almost never need to call it yourself; the JSX runtime already does.

## Writing to the DOM

Effects do not patch JSX. You hold a node and write:

```tsx
const button = <button type="button">Off</button> as HTMLButtonElement;

effect(() => {
  const value = on.get();
  button.textContent = value ? "On" : "Off";
  button.disabled = !ready.get();
  button.className = value ? "on" : "off";
  button.setAttribute("aria-pressed", String(value));
});
```

That is how multi-property live attributes work. A single binding can be a function-valued prop: `className={() => …}`. See [JSX](./sig-jsx.md).

Keep effects **small**. One list container, one button, one fetch. A single effect that rewrites the entire page on every keystroke is how you accidentally rebuild a virtual-DOM tree by hand.

## `ref` as a place to subscribe

If you would rather not assign the element to a variable first:

```tsx
<span
  ref={(el) => {
    effect(() => {
      el.textContent = ready.get() ? "Ready" : "Starting…";
    });
  }}
/>
```

`ref` is called once after create. The effect inside it is still a normal effect: it runs immediately, tracks `ready`, and is registered on the current cleanup scope if you are inside a component.

## Batch

```ts
function batch(fn: () => void): void
```

While `fn` runs, `scheduleSubscriber` queues subscribers instead of calling `notify`. After the outermost `fn` returns, each queued subscriber is notified once.

```ts
import { Signal, batch, effect } from "@citrusworx/sigjs";

const a = Signal(0);
const b = Signal(0);
let runs = 0;

effect(() => {
  a.get();
  b.get();
  runs += 1;
});

batch(() => {
  a.set(1);
  b.set(2);
});
// runs === 2  (initial + one batched notify)
```

Without `batch`, that would be three runs (initial + `a` + `b`).

### Nested batch is safe

`batch` keeps a depth counter. Inner calls increment it; the queue flushes only when depth returns to zero. If `fn` throws, `finally` still decrements and the outer flush still runs, so `batch` cannot stick “on” and successful `set`s from that batch still notify.

```ts
batch(() => {
  a.set(1);
  batch(() => b.set(2));
  c.set(3);
});
// dependents of a, b, and c run once after the outer batch
```

One outer `batch` around related writes is still the clearer style. You do not have to un-nest library code that also calls `batch`.

## Memo

```ts
function memo<T>(fn: () => T): { get(): T }
```

A lazy cached computation. The first `get()` runs `fn` and tracks signal (and memo) dependencies. Later `get()`s return the cache until a dependency notifies.

```ts
const items = Signal([1, 2, 3]);
const sum = memo(() => items.get().reduce((a, b) => a + b, 0));

sum.get(); // 6, computes
sum.get(); // 6, cached
items.set([10, 20]);
sum.get(); // 30, computes again
```

When a dependency notifies, the memo:

1. marks itself dirty
2. notifies **its** subscribers (effects and other memos that called `sum.get()`)

It does not recompute until the next `get()`. If nobody reads it, the function does not run.

Memos have no `set`. The internal invalidator has a `dispose`, but it is not on the public object — you cannot unsubscribe a memo from the outside. Keep memos as cheap derivations, not as long-lived resource owners. Resources belong in `effect` so they can clean up.

Memos may read other memos. Cycles are not detected; do not build them.

## Choosing the primitive

| Job | Primitive |
|---|---|
| Store a value | `Signal` |
| Live text in JSX | function child (an effect the runtime creates) |
| Live attributes, lists, `hidden` | `effect` you write |
| Timers, fetch, subscriptions | `effect` with a cleanup return |
| Several writes, one notify | `batch` |
| Derived number / string / list you read often | `memo` |
| Tear down with the view | create the effect inside the component function |

## Effects that should not exist

```ts
// Re-renders the world
effect(() => {
  document.getElementById("root")!.innerHTML = renderApp(state.get());
});

// Syncs two signals that should have been a memo
effect(() => {
  fullName.set(`${first.get()} ${last.get()}`);
});

```

The first is a homemade VDOM. The second is a duplicated source of truth. [Anti-patterns](./sig-anti-patterns.md) collects more of these.

## A compact picture

```
effect(fn)
  run()
    drop old deps
    run previous cleanup
    currentSubscriber = this
    fn()          ← Signal.get / memo.get subscribe
    store cleanup if fn returned one

Signal.set
  scheduleSubscriber
    if batching → queue
    else        → notify → run()
```

Once you know this loop, the [JSX runtime](./sig-jsx.md) is a thin layer that either appends a static node or installs one of these effects on a text node.
