# Derived values

`memo` caches a computation. The function runs on the first `get()`, then again only after a signal it read notifies. Later reads return the cache.

Use it when several effects or text nodes share one derivation: a total, a filtered list, a greeting. Do not use it for side effects.

| | |
|---|---|
| Since | 0.2.0 |
| Import | `import { memo } from "@citrusworx/sigjs"` |
| Status | Stable |

## Use it

```ts
import { Signal, memo } from "@citrusworx/sigjs";

const items = Signal([1, 2, 3, 4, 5]);
const total = memo(() => items.get().reduce((sum, n) => sum + n, 0));

total.get(); // 15
total.get(); // cached, function does not run
items.set([1, 2, 3]);
total.get(); // 6
```

The signature is `memo<T>(fn: () => T): { get(): T }`. There is no `set`.

## Rules

| Rule | Detail |
|---|---|
| Lazy | Creating the memo does not run `fn` |
| Tracking | `get()` calls inside `fn` subscribe the memo |
| Cache | `get()` returns the last success until a dependency notifies |
| Invalidation | A dependency `set` marks the memo dirty and notifies effects that have read it |
| Recompute | The next `get()` runs `fn` again |
| Nested | A memo may read other memos |
| `untrack` | Reads inside `untrack` do not become dependencies |

`memo().get()` is declared as `T`. The cache slot is empty only before the first successful run.

## Prefer memo over a second signal

```ts
const name = Signal("");
const greeting = memo(() => name.get().trim() || "there");
```

An effect that copies `name` into another signal runs extra writes and can loop if both sides subscribe to each other. `memo` has one direction: inputs in, value out.

## Lists

`bindList` accepts any `{ get() }` of an array or `Map`, including a memo. Join a `Map` of records with an `order` array when display order is not insertion order:

```ts
const rows = memo(() => order.get().map((id) => todos.get().get(id)!));
```

The pattern is [Keyed todo list](./sig-patterns.md#keyed-todo-list-bindlist).

## Edge cases

<details>
<summary>Throws, disposal, and equality</summary>

If `fn` throws, the memo stays dirty. The next `get()` tries again. Dependencies read before the throw are dropped and re-collected on the retry.

There is no public `dispose`. A memo stays subscribed to the signals it last read until those signals are discarded. Keep memos as cheap derivations that live as long as their inputs.

`memo` does not compare the computed value to the previous one before notifying its own subscribers. If a dependency notifies, readers of the memo are notified even when `fn` returns an equal result. `Signal.set` is what marks it dirty, and `Signal.set` always notifies.

</details>

## Related

| | |
|---|---|
| [Signals](./sig-signals.md) | The inputs |
| [Effects](./sig-effects.md) | Reading a memo from a side effect |
| [API: memo](./sig-api.md#memo) | Signature |
