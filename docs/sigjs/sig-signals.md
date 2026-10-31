# Signals

A signal is a value plus a subscriber set. `get` reads it. `set` replaces it and notifies every subscriber. Create one with `Signal(initial)`.

Use a signal for something that changes after the first paint: a count, a field, a list of records. Do not use one for a constant.

| | |
|---|---|
| Since | 0.2.0 |
| Import | `import { Signal } from "@citrusworx/sigjs"` |
| Status | Stable |

## Use it

```ts
import { Signal, effect } from "@citrusworx/sigjs";

const count = Signal(0);

effect(() => {
  console.log(count.get());
});

count.set(1);
```

`Signal` is a factory. It is not a class.

```ts
const count = Signal(0);
```

`new Signal(0)` is not the API. There is no exported `Signal<T>` type. The return value is `{ get(): T; set(newValue: T): void }`.

## Rules

| Call | What happens |
|---|---|
| `get()` outside an effect or memo | Returns the value. Subscribes nothing |
| `get()` inside an effect or memo | Returns the value and subscribes that computation |
| `get()` inside `untrack` | Returns the value. Does not subscribe the surrounding effect or memo |
| `set(next)` | Stores `next`, then notifies every current subscriber |
| `set` with the same value | Still notifies. There is no equality check. Frozen for 1.0 |

`{count.get()}` in JSX is a snapshot. The component function is not an effect. Wrap the read: `{() => count.get()}`.

## Sharing

Pass the signal object. Do not copy `.get()` into another variable and expect it to stay live.

```ts
const count = Signal(0);

function label(count: { get(): number }) {
  return () => String(count.get());
}
```

Several components can close over the same signal. They subscribe only when their effect or function child reads it.

## Objects and arrays

`set` replaces the stored reference. It does not deep-watch properties. Mutating `user.name` or `items.push` does not notify.

```ts
const items = Signal<string[]>(["a"]);

items.set([...items.get(), "b"]);
```

Same-reference writes still notify if you call `set`, because `Signal.set` does not compare. `bindList` is different: it skips `set` on a row when `Object.is` says the item did not change. See [arrays, objects, and identity](#arrays-objects-and-identity).

## Arrays, objects, and identity

Store the next value, not a mutation of the current one.

| Update | Notifies a `Signal` subscriber |
|---|---|
| `count.set(count.get())` | Yes |
| `user.set({ ...user.get(), name: "Ada" })` | Yes |
| `user.get().name = "Ada"` | No |
| `items.get().push("b")` | No |
| `items.set(items.get())` after that push | Yes, because `set` always notifies |

`memo` and Juice `bind` both skip work when the next value is equal. `Signal.set` does not. If you need "only when it changed," compare before you call `set`.

Two `set` calls are two notifications unless you wrap them in `batch`. See [Batching](./sig-batch.md).

## What a signal is not

| Not available | Use instead |
|---|---|
| `.peek()` | `untrack(() => signal.get())` |
| `.update(fn)` | `signal.set(fn(signal.get()))` |
| `.subscribe` | `effect` |
| A class constructor | `Signal(value)` |
| Deep proxies | Replace the object |

Derived values belong in `memo`, not in a second signal that an effect keeps in sync. See [Derived values](./sig-memo.md).

## Related

| | |
|---|---|
| [Effects](./sig-effects.md) | Who gets notified |
| [Batching](./sig-batch.md) | Several writes, one flush |
| [API: Signal](./sig-api.md#signal) | Signature and edge cases |
