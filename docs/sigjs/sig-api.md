# Sig.js API Reference

Public surface of `@citrusworx/sigjs` as implemented in `libraries/sig/src`.

Exports from the package root: `Signal`, `effect`, `batch`, `memo`, `captureCleanupScope`, `jsx`, `jsxs`, `Fragment`, `mount`, `disposeTree`, `SigRouter`, plus JSX types.

Subpath exports:

- `@citrusworx/sigjs/jsx-runtime`
- `@citrusworx/sigjs/jsx-dev-runtime`
- `@citrusworx/sigjs/sig-router`

## Signal

```ts
function Signal<T>(value: T): { get(): T; set(newValue: T): void }
```

Factory. **Not** a class. Do not call `new Signal`.

```ts
import { Signal } from "@citrusworx/sigjs";

const count = Signal(0);
count.get(); // 0
count.set(1); // notifies subscribers
```

`get()` registers the current effect or memo (if any) as a subscriber. `set()` always notifies, even if the value is unchanged.

There is no `.peek()`, no `.update()`, and no equality check.

## effect

```ts
function effect(fn: () => void | (() => void)): () => void
```

Runs `fn` immediately. Any `Signal` / `memo` `get()` during that run becomes a dependency. On the next notify, cleanup (if the previous run returned a function) runs first, then `fn` runs again.

The return value is a disposer. Calling it unsubscribes the effect and runs the last cleanup.

```ts
import { Signal, effect } from "@citrusworx/sigjs";

const count = Signal(0);

const dispose = effect(() => {
  console.log(count.get());
  return () => {
    console.log("cleanup");
  };
});

count.set(1);
dispose();
```

Effects created while a component function runs are registered on a cleanup scope and disposed when the router (or `mount`) tears down that tree.

## batch

```ts
function batch(fn: () => void): void
```

While `fn` runs, subscriber notifications are queued. After `fn` returns, each pending subscriber is notified once.

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

Nested `batch` is not a counter: the flag is a boolean. Do not nest batches.

## memo

```ts
function memo<T>(fn: () => T): { get(): T }
```

Lazy cached computation. The first `get()` runs `fn` and tracks signal dependencies. Later `get()`s return the cache until a dependency notifies.

```ts
import { Signal, memo } from "@citrusworx/sigjs";

const items = Signal([1, 2, 3]);
const sum = memo(() => items.get().reduce((a, b) => a + b, 0));

sum.get(); // 6
items.set([10, 20]);
sum.get(); // 30
```

`memo` is readable from effects and from other memos. It has no `set`.

## captureCleanupScope

```ts
function captureCleanupScope<T>(fn: () => T): { value: T; dispose: () => void }
```

Internal building block used by the JSX runtime when it calls a component function. Effects registered during `fn` are attached to the returned `dispose`. You rarely call this yourself.

## JSX runtime

Configured via `jsxImportSource: "@citrusworx/sigjs"`.

```ts
function jsx(type: string | Function, props: any): Node
function jsxs(type: string | Function, props: any): Node
function Fragment(props: { children?: Child }): DocumentFragment
```

`jsxs` is an alias of `jsx`.

### Elements

Tag names become `document.createElement(type)`. Function types are called as components with `props` and wrapped in `captureCleanupScope`.

### Props

| Kind | Behavior |
|---|---|
| `children` | Appended; see Child |
| `ref` (function) | Called with the element after create |
| `on*` (function) | `addEventListener(name.toLowerCase(), fn)` — `onClick` → `click` |
| Known DOM properties | Assigned (`el[key] = value`) |
| `true` | `setAttribute(key, "")` |
| `false` / `null` / `undefined` | `removeAttribute` |
| other | `setAttribute(key, value)` |

Function values that are **not** `ref` or `on*` are assigned as-is. They are **not** subscribed. `className={() => "active"}` stores a function on `className`. Use an effect to update attributes.

Juice attributes (`stack`, `gap`, `padding`, `card`, `surface`) are unknown DOM properties, so they become attributes. That is why Juice markup works on Sig-created elements.

### Child

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

- `null` / `undefined` — skipped
- arrays — each child appended
- `string` / `number` — static text node
- `function` — a text node whose `textContent` is `String(child())`, updated by an `effect` that calls the function
- `Node` — appended

Function children are **text only**. Returning an element produces `"[object HTMLDivElement]"` (or similar), not a mounted subtree.

## mount

```ts
function mount(node: Node, target: HTMLElement): void
```

Disposes existing children of `target`, then `replaceChildren(node)`.

```ts
import { mount } from "@citrusworx/sigjs";

mount(<App />, document.getElementById("root")!);
```

## disposeTree

```ts
function disposeTree(node: Node): void
```

Walks the node, runs attached cleanups (effects created under that component), and recurses. `SigRouter` and `mount` call this for you.

## SigRouter

```ts
class SigRouter {
  constructor(target?: string); // default "#root"
  set(routes: Record<string, RouteView>): this;
  set(path: string, view: RouteView, name?: string): this;
  get(name: string): string | undefined;
  start(): void;
  stop(): void;
  navigate(path: string): void;
  goBack(): void;
  has(path: string): boolean;
}

type RouteView = Node | (() => Node | null) | null;
```

### Path rules

- Paths are exact strings. `/about` ≠ `/about/`.
- A map key without a leading `/` is stored as `/${key}` and registered as a **name**.
- There is no parametric matcher. `set("/user/:id", …)` registers the literal path `/user/:id`.

### Views

Prefer a **function** (`Home`, or `() => <Layout><Home /></Layout>`). The router calls it on every navigation so you get a fresh tree. A prebuilt `Node` is reused as-is; do not pass `<Home />` if `Home` creates effects you need cleaned up per visit.

On render, the router `disposeTree`s the target's current children, then `replaceChildren` with the next view.

### Navigation

- `start()` attaches a document click listener and a `popstate` listener, then renders `window.location.pathname`.
- `navigate(path)` no-ops if the path is not registered. On success it `pushState`s and renders.
- Intercepted clicks: internal `href`s. Passed through: `http(s)`, `mailto`, `tel`, `ftp`, `download`, `target="_blank"`.
- `stop()` removes listeners.
- `get(name)` returns the path for a named route, or the path itself if it is registered.
- `has(path)` normalizes a leading slash.

```ts
import { SigRouter } from "@citrusworx/sigjs";

const router = new SigRouter("#root");

router.set({
  "/": Home,
  about: About,
});

router.get("about"); // "/about"
router.has("/about"); // true
router.start();
router.navigate("/about");
router.goBack();
router.stop();
```

## Practices that match the implementation

- Use `Signal(value)`, never `new Signal(value)`
- Keep effects small: one element or one subscription
- Use function children only for text
- Use `batch` when several signals should notify together
- Use `memo` for derived numbers/lists you read often
- Register routes as functions; call `start()` after `set`
- Do not invent `useEffect`, keyed list diffs, or reactive props — they are not here
