# Signals

How `Signal` actually works in `libraries/sig/src/signal.ts`. This is the mental model for values in Sig.js — not a React state hook, not a proxy, and not a class.

Related:

- [Effects](./sig-effects.md) — what happens after `set`
- [API Reference](./sig-api.md) — the type signature
- [Page tutorial](./sig-page-tutorial.md) — a tally built on one signal

## What a signal is

A signal is a box:

```ts
function Signal<T>(value: T): { get(): T; set(newValue: T): void }
```

```ts
import { Signal } from "@citrusworx/sigjs";

const count = Signal(0);

count.get(); // 0
count.set(1); // value is now 1; every subscriber is notified
```

`Signal` is a **factory**. It closes over `value` and a `Set` of subscribers, then returns `{ get, set }`. It is not a constructor:

```ts
const count = Signal(0);       // correct
// const count = new Signal(0); // not the API
```

There is no `.peek()`, no `.update()`, no `.subscribe()`, and no equality check. Those names do not exist on the object.

## What `get` does

`get()` always returns the current value.

If it is called while an effect or memo is running, it also **registers that effect/memo as a subscriber**:

```ts
function getter() {
  if (currentSubscriber) {
    subscribers.add(currentSubscriber);
    currentSubscriber.addDependency(subscribers);
  }
  return value;
}
```

That is the entire tracking rule. Read a signal outside an effect or memo, and you get the value with no subscription:

```ts
const count = Signal(0);

count.get(); // 0, no subscriber registered

effect(() => {
  console.log(count.get()); // subscribed; re-runs on set
});
```

This is why `{count.get()}` in JSX is static. The component function is not an effect. `get()` runs once while the tree is being built, produces a string/number child, and never runs again. Wrap it:

```tsx
<p>{() => String(count.get())}</p>
```

The function child is installed as an effect by the JSX runtime. That effect's `get()` is the subscription.

## What `set` does

`set(newValue)` assigns the value, then notifies **every current subscriber**.

```ts
function setter(newValue: T) {
  value = newValue;
  [...subscribers].forEach((subscriber) => scheduleSubscriber(subscriber));
}
```

Important consequences:

1. **No equality check.** `count.set(1)` followed by `count.set(1)` notifies twice. If you need “only when it changes,” compare yourself before calling `set`.
2. **Synchronous by default.** Unless you are inside `batch`, each subscriber's `notify()` runs before `set` returns.
3. **Snapshot of subscribers.** The copy `[...subscribers]` means a subscriber that disposes mid-loop is still safe; a subscriber added during notify will not run until a later `set`.

```ts
const ready = Signal(false);

ready.set(false); // still notifies — effects re-run even though the value did not change
```

That is useful when you want to bounce a derivation. It is a footgun when a noisy writer sits in a timer.

## When updates fire

A write becomes a DOM update only if something that **subscribed** does work:

| Read site | Subscribed? | What happens on `set` |
|---|---|---|
| Bare `count.get()` in a component body | No | Nothing. The text/attribute is already on the node. |
| `{() => String(count.get())}` | Yes — function-child effect | That text node’s `textContent` is rewritten. |
| `effect(() => { el.textContent = String(count.get()); })` | Yes | Your callback runs again. |
| `memo(() => count.get() * 2)` after a `get()` | The memo’s invalidator is subscribed | Memo is marked dirty; *its* subscribers are notified. |
| `count.get()` inside an `if` that was false this run | No, for this run | See [dynamic dependencies](./sig-effects.md#dependencies-are-rebuilt-every-run). |

Sig.js does **not** re-call your component function. `Desk()` in the tutorial runs once per mount. The tally updates because a text node’s effect re-ran, not because `Desk` rendered again.

## Sharing signals

Signals are plain objects. Pass them into child factories, close over them, or keep them at module scope.

```tsx
function Tally(count: { get(): number; set(n: number): void }) {
  return (
    <p>
      {() => String(count.get())}
      <button type="button" onClick={() => count.set(count.get() + 1)}>
        +
      </button>
    </p>
  );
}

function App() {
  const count = Signal(0);
  return (
    <div stack gap="1rem">
      {Tally(count)}
      {Tally(count)}
    </div>
  );
}
```

Both tallies subscribe to the same box. One `set` updates both text nodes.

Module-scope signals survive route changes. That can be what you want (auth, theme) and it can leak (a timer signal that nobody disposes). Prefer creating signals **inside** the view function so they die with the view, unless you truly need them to outlive it.

## Arrays, objects, and identity

The box holds whatever you put in it. Mutating an array in place does **not** notify:

```ts
const items = Signal<string[]>(["a"]);

items.get().push("b"); // subscribers never run
items.set(items.get()); // notifies, because set always notifies
items.set([...items.get(), "b"]); // the usual pattern: replace the value
```

Same for objects:

```ts
const job = Signal({ id: 1, title: "Deploy" });

job.get().title = "Hold";       // silent
job.set({ ...job.get(), title: "Hold" }); // notifies
```

Treat signal values as immutable from the outside. Replace them. Let effects read the new snapshot.

## Several signals, one fact

If two writes describe one user action, use `batch` so subscribers run once. That is an effect concern — see [Batch](./sig-effects.md#batch) — but the rule starts here: **each `set` is a notification**.

```ts
batch(() => {
  jobs.set([...jobs.get(), next]);
  draft.set("");
});
```

## Derived values are memos, not more signals

Do not keep a second signal in sync with the first:

```ts
// Fragile — two sources of truth
const name = Signal("");
const greeting = Signal("operator");

effect(() => {
  greeting.set(name.get().trim() || "operator");
});
```

Use `memo`:

```ts
const name = Signal("");
const greeting = memo(() => name.get().trim() || "operator");
```

`memo` exposes `{ get }`. It tracks the signals *it* reads, caches until they notify, and can itself be a dependency of an effect. Details in [Effects — memo](./sig-effects.md#memo).

## What a signal is not

- **Not a proxy.** `user.name = "Ada"` does not deep-track. Replace the object.
- **Not React state.** There is no render, no hook rules, no `setCount(c => c + 1)` updater form. Read with `get`, write with `set`.
- **Not an observable with operators.** No `map`, `filter`, `combineLatest`. Derive with `memo` or read several signals in one effect.
- **Not serialized.** There is no persistence helper. Write `localStorage` from an effect if you need it.

## A compact picture

```
Signal(0)
  └─ subscribers: Set<effect | memo invalidator>

count.get()  ──inside effect──►  subscribe
count.set(1) ─────────────────►  each subscriber.notify()
                                  ├─ effect: run cleanup, run fn again
                                  └─ memo:   mark dirty, notify *its* subscribers
```

Once this picture is solid, [effects](./sig-effects.md) are just “the things in that set,” and [JSX](./sig-jsx.md) is “how a function child puts one of those things on a text node.”
