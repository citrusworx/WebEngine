# Effects

An effect runs a function now, subscribes to the signals that function reads, and runs it again when those signals change. The return value may be a cleanup function.

Use an effect for DOM writes that are more than one text node, for timers, for `fetch`, and for list rewrites. Do not use one to copy a signal into another signal. That copy is a [memo](./sig-memo.md).

| | |
|---|---|
| Since | 0.2.0 |
| Import | `import { effect } from "@citrusworx/sigjs"` |
| Status | Stable |

## Use it

```ts
import { Signal, effect } from "@citrusworx/sigjs";

const count = Signal(0);

const dispose = effect(() => {
  console.log("count", count.get());
  return () => {
    console.log("cleanup");
  };
});

count.set(1);
dispose();
```

The signature is `effect(fn: () => void | (() => void)): () => void`.

## Rules

| Step | What happens |
|---|---|
| Create | `fn` runs immediately |
| Track | Every `Signal` or `memo` `get()` in that run becomes a dependency |
| Notify | Cleanup from the previous run runs, then `fn` runs again and dependencies are collected from scratch |
| Dispose | The returned function unsubscribes the effect and runs the last cleanup. A second call does nothing |
| Scope | If a component or `bindList` row is collecting cleanups, this disposer is registered there too |

`untrack(fn)` reads signals without adding those reads as dependencies. The signature is `untrack<T>(fn: () => T): T`.

## Dependencies are rebuilt every run

Only signals read on the latest run stay subscribed. A branch that does not run is not a dependency for that run.

```ts
effect(() => {
  if (open.get()) {
    console.log(panel.get());
  }
});
```

While `open` is false, changes to `panel` do not re-run this effect. The next time `open` is true, `panel.get()` subscribes again.

## Cleanup

Return a function to release a timer, an abort controller, or a listener you added yourself.

```ts
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
```

Cleanup runs after the signal already holds the new value, and before the next body. A cleanup that calls `get()` sees the new value, not the previous one. That read does not subscribe: cleanup runs outside the tracking window.

The disposer from `effect` also runs that cleanup. `mount` and `SigRouter` do this for you when they tear a component tree down. See [Lifecycle](./sig-lifecycle.md).

## Cleanup scopes and component functions

A component call and a `bindList` row run inside an internal scope. `effect` registers its disposer on that scope. The JSX runtime attaches the scope's dispose function to the returned node. `disposeTree` runs it.

If the component throws, cleanups registered so far run before the error propagates. The helper is `captureCleanupScope`. It is not a package export.

`bind` from `@citrusworx/sigjs/juice` uses the same path. A bind during render disposes on unmount.

Create the effect inside the component that owns the nodes. An effect created once at module scope is not tied to a view, so the router cannot stop it.

## Writing the DOM

```tsx
const button = <button type="button">Off</button> as HTMLButtonElement;

effect(() => {
  const on = pressed.get();
  button.textContent = on ? "On" : "Off";
  button.setAttribute("aria-pressed", String(on));
});
```

A single attribute can be a function prop instead: `className={() => ...}`. That prop is an effect the JSX runtime installs. See [Templating](./sig-jsx.md).

## Batch

`batch` groups `set` calls so this effect flushes once. The contract, including throws and nesting, is [Batching](./sig-batch.md).

## Memo

`memo` is the cached derivation. Effects may read it. The contract is [Derived values](./sig-memo.md).

## Effects to avoid

| Pattern | Why |
|---|---|
| `effect(() => { copy.set(source.get()); })` | A second source of truth. Use `memo` |
| `effect(() => { node.replaceChildren(<App />) })` on every signal | Rebuilds the page. Write the node that changed |
| `effect(() => { count.set(count.get() + 1); })` | Re-enters immediately. There is no recursion cap |
| Reading a signal only to log it, then wondering why a child updated | The read is the subscription |

## Related

| | |
|---|---|
| [Lifecycle](./sig-lifecycle.md) | Where disposers are stored |
| [API: effect](./sig-api.md#effect) | Signature and edge cases |
| [Troubleshooting](./sig-troubleshooting.md) | An effect that never re-runs |
