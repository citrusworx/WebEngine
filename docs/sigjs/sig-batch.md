# Batching

`batch` queues subscriber notifications until the outermost call finishes. Several `set` calls inside it wake each effect once.

Use it when one user action writes more than one signal: a form submit, a list insert that updates both a `Map` and an `order` array.

| | |
|---|---|
| Since | 0.2.0 |
| Import | `import { batch } from "@citrusworx/sigjs"` |
| Status | Stable |

## Use it

```ts
import { Signal, batch, effect } from "@citrusworx/sigjs";

const first = Signal("");
const last = Signal("");
let runs = 0;

effect(() => {
  first.get();
  last.get();
  runs += 1;
});

batch(() => {
  first.set("Ada");
  last.set("Lovelace");
});
// runs === 2: the initial run, then one flush
```

The signature is `batch(fn: () => void): void`.

## Rules

| Rule | Detail |
|---|---|
| Depth | Nested `batch` calls share one counter. Only the outermost flush runs |
| Who is queued | Each subscriber is stored in a set, so it runs once even if several signals notify it |
| Order | Flush follows the order subscribers were queued |
| Throw | `finally` decrements the depth. Successful `set`s from that batch still flush |
| Nested throw | The inner `batch` does not flush. The outer `finally` does, if the error propagates that far |
| Outside | A `set` with depth 0 notifies immediately |

## Nested batch is safe

```ts
batch(() => {
  first.set("Ada");
  batch(() => {
    last.set("Lovelace");
  });
  // the effect has not re-run yet
});
// one flush here
```

Flattening related writes into one outer `batch` is easier to read. Nesting is still one flush.

## Edge cases

<details>
<summary>Reads inside a batch, and effects that set signals</summary>

`get()` inside a batch returns the value already stored. The queue only delays notifications. It does not delay the write.

An effect that calls `set` on a signal it also reads will run again immediately when it is not inside `batch`. That re-entry is synchronous and has no built-in cap. Guard the write, or batch a write that should not re-enter the effect that caused it.

`bindList` reconciles from an effect. Wrapping the `Map` update and the `order` update in one `batch` makes that reconcile see both new values.

</details>

## Related

| | |
|---|---|
| [Signals](./sig-signals.md) | What `set` does before the flush |
| [Effects](./sig-effects.md) | The subscribers |
| [API: batch](./sig-api.md#batch) | Signature |
