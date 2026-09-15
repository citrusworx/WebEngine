# Sig.js API Reference

Standalone APIs for `@citrusworx/sigjs` 0.2.0. Import from `@citrusworx/sigjs` unless noted.

## Signal

```ts
Signal<T>(initialValue: T): { get(): T; set(value: T): void }
```

`get()` inside `effect` or `memo` subscribes. `set` notifies subscribers (or queues them inside `batch`).

```ts
import { Signal } from "@citrusworx/sigjs";

const count = Signal(0);
count.get();
count.set(1);
```

## effect

```ts
effect(fn: () => void | (() => void)): () => void
```

Runs `fn` immediately and again when any signal it read is set. If `fn` returns a function, that cleanup runs before the next execution and when you call the disposer.

```ts
import { Signal, effect } from "@citrusworx/sigjs";

const count = Signal(0);

const dispose = effect(() => {
  console.log(count.get());
  return () => console.log("cleanup");
});

count.set(1);
dispose();
```

## batch

```ts
batch(fn: () => void): void
```

Groups `set` calls. Subscribers run once after the **outermost** `batch` finishes. Nested `batch()` does not flush early. If `fn` throws, depth is still decremented and successful sets flush.

```ts
import { Signal, batch, effect } from "@citrusworx/sigjs";

const first = Signal("");
const last = Signal("");

effect(() => {
  console.log(first.get(), last.get());
});

batch(() => {
  first.set("Ada");
  batch(() => {
    last.set("Lovelace");
  });
});
// the effect runs once after the outer batch, not twice
```

## memo

```ts
memo<T>(fn: () => T): { get(): T | undefined }
```

Lazy cached computation. Re-runs when its signal (or memo) dependencies change.

```ts
import { Signal, memo } from "@citrusworx/sigjs";

const items = Signal([1, 2, 3]);
const sum = memo(() => items.get().reduce((a, b) => a + b, 0));

sum.get(); // 6
sum.get(); // cached
items.set([10, 20]);
sum.get(); // 30
```

## captureCleanupScope

```ts
captureCleanupScope<T>(fn: () => T): { value: T; dispose: () => void }
```

Used by the JSX runtime so effects created while rendering a function component are disposed with that node. You rarely call this directly.

---

## JSX runtime

Configured with `"jsx": "react-jsx"` and `"jsxImportSource": "@citrusworx/sigjs"`. You can also import `jsx`, `jsxs`, `Fragment`, `mount`, and `disposeTree` from `@citrusworx/sigjs` or `@citrusworx/sigjs/jsx-runtime`.

### jsx / jsxs

```ts
jsx(type: string | Function, props: any): Node
```

- Function `type` → component. Effects inside it are scoped and disposed with the returned node.
- String `type` → `document.createElement`.
- Function **children** → reactive **text** node (`String(child())`).
- Function **props** except `ref` and `on*` → reactive property/attribute.
- `onClick` / `onInput` / … → `addEventListener`.
- `ref` function → called once with the element.

```tsx
const count = Signal(0);

<div className={() => (count.get() ? "on" : "off")}>
  {() => count.get()}
</div>
```

### Fragment

```tsx
<>
  <span>A</span>
  <span>B</span>
</>
```

### mount / disposeTree

```ts
mount(node: Node, target: HTMLElement): void
disposeTree(node: Node): void
```

`mount` disposes existing children of `target`, then replaces them with `node`.

### Child type

```ts
type Child =
  | Node
  | string
  | number
  | null
  | undefined
  | (() => any)
  | Child[];
```

A function child is always stringified into a text node. It does not mount a returned `HTMLElement`.

### jsxDEV

`@citrusworx/sigjs/jsx-dev-runtime` — extra transform arguments are ignored (no VDOM, no source overlay).

---

## SigRouter

Import from `@citrusworx/sigjs/sig-router` or `@citrusworx/sigjs`.

```ts
new SigRouter(target?: string) // default "#root"
```

### set

```ts
set(routes: Record<string, RouteView>): this
set(path: string, view: RouteView, name?: string): this

type RouteParams = Record<string, string>
type RouteView = Node | ((params: RouteParams) => Node | null) | null
```

Object keys without a leading `/` are normalized to `/${key}` and registered as names. Prefer factories so each navigation creates a new tree.

Matching: **exact** → **`:param`** → **`*`**. Exact wins over a colliding param pattern. `*` is last.

```ts
router.set({
  "/": Home,
  "/user/:id": (params) => User(params),
  about: About,
  "*": NotFound,
});
```

### get / has / start / navigate / goBack / stop

```ts
get(name: string): string | undefined
has(path: string): boolean
start(): void
navigate(path: string): void  // no-op if unmatched and no *
goBack(): void
stop(): void
```

`navigate("about")` becomes `"/about"`. `start()` intercepts same-origin `<a>` clicks (not `http(s)`, `mailto`, `tel`, `ftp`, `download`, `target="_blank"`) and listens to `popstate`.

---

## Practices

- Read signals inside functions (`effect`, `memo`, JSX function child/prop), not as one-shot `{count.get()}`.
- `batch` related `set`s.
- `memo` expensive derived values.
- Register route **functions**, not pre-built nodes.
