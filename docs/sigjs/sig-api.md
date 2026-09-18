# Sig.js API Reference

Public surface of `@citrusworx/sigjs` as implemented in `libraries/sig/src`.

This page is the compact contract. For the mental model, start with [Signals](./sig-signals.md), [Effects](./sig-effects.md), and [JSX and the DOM](./sig-jsx.md).

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

While `fn` runs, subscriber notifications are queued. After the **outermost** `fn` returns, each pending subscriber is notified once. Nesting is a depth counter: inner `batch` calls do not flush early. `try` / `finally` keeps the depth honest if `fn` throws; successful `set`s from that batch still flush.

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

Nested `batch` is safe. Flattening related writes into one outer `batch` is still the clearer style.

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

`memo` is readable from effects and from other memos. It has no `set`. There is no public `dispose`; keep memos as cheap derivations.

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
| `ref` (function) | Called with the element after create. Not a reactive getter. |
| `on*` (function) | `addEventListener(name.toLowerCase(), fn)` — `onClick` → `click`. Not a reactive getter. |
| Any other function | Subscribed via `effect`. The function is a getter; its **result** is assigned with the same property/attribute rule as a static value. Cleanup is attached to the element. |
| Known DOM properties | Assigned (`el[key] = value`) |
| `true` | `setAttribute(key, "")` |
| `false` / `null` / `undefined` | `removeAttribute` |
| other | `setAttribute(key, value)` |

`className={() => on.get() ? "on" : "off"}`, `value={() => name.get()}`, `checked={() => on.get()}`, and Juice attributes like `padding={() => size.get()}` are live. `class` updates the HTML class attribute.

Non-function values are assigned once. `disabled={busy.get()}` is a snapshot; `disabled={() => busy.get()}` is live.

`ref` + `effect` remains a supported pattern for multi-property writes. There is no live `style={{}}` object binder.

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

type RouteParams = Record<string, string>;
type RouteFactory = (params: RouteParams) => Node | null;
type RouteView = Node | RouteFactory | null;
```

### Path rules

- Paths are exact strings unless a segment starts with `:`. `/about` ≠ `/about/`.
- A map key without a leading `/` is stored as `/${key}` and registered as a **name**.
- `"/user/:id"` is a param pattern. The view function receives `{ id: "…" }`. Exact routes win over param patterns. First registered param match wins among patterns. `"*"` is last.
- `"*"` is a fallback view for unknown paths. It is stored as the literal key `*`, not `/*`.
- `has(path)` is registration-only. `has("/user/:id")` is true after `set`; `has("/user/42")` is not.

### Views

Prefer a **function** (`Home`, or `() => <Layout><Home /></Layout>`). The router calls it on every navigation so you get a fresh tree. A prebuilt `Node` is reused as-is; do not pass `<Home />` if `Home` creates effects you need cleaned up per visit.

On render, the router `disposeTree`s the target's current children, then `replaceChildren` with the next view.

### Navigation

- `start()` attaches a document click listener and a `popstate` listener, then renders `window.location.pathname`.
- `navigate(path)` normalizes a leading slash the same way as `set` / `has`. `navigate("about")` hits `/about`.
- If the path is not registered, `navigate` tries a param pattern, then the `"*"` fallback when one exists. Without a match or fallback it no-ops (no `pushState`).
- Intercepted clicks: internal `href`s. Passed through: `http(s)`, `mailto`, `tel`, `ftp`, `download`, `target="_blank"`.
- `stop()` removes listeners.
- `get(name)` returns the path for a named route, or the path itself if it is registered.
- `has(path)` normalizes a leading slash. `has("*")` is true only if a fallback was registered; unknown concrete paths stay `false`.

```ts
import { SigRouter } from "@citrusworx/sigjs";

const router = new SigRouter("#root");

router.set({
  "/": Home,
  about: About,
  "/user/:id": UserPage,
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
- Use function children for live text; function-valued props for live attributes
- Use `batch` when several signals should notify together
- Use `memo` for derived numbers/lists you read often
- Register routes as functions; call `start()` after `set`
- Do not invent `useEffect` or keyed list diffs — they are not here

See [Best practices](./sig-best-practices.md) and [Anti-patterns](./sig-anti-patterns.md) for the same rules with examples. [Status](./sig-status.md) is the maturity matrix.
