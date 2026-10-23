# Sig.js API Reference

Public surface of `@citrusworx/sigjs` as implemented in `libraries/sig/src`.

This page is the compact contract. For the mental model, start with [Signals](./sig-signals.md), [Effects](./sig-effects.md), and [JSX and the DOM](./sig-jsx.md).

Exports from the package root: `Signal`, `effect`, `batch`, `memo`, `untrack`, `bindList`, `jsx`, `jsxs`, `Fragment`, `mount`, `disposeTree`, `SigRouter`, the `JSX` namespace, plus the types named in [API surface](./api-surface.md). That page is the v1 freeze inventory (stable, experimental, internal). `jsxDEV` is not on the root. Import it from `@citrusworx/sigjs/jsx-dev-runtime`. `captureCleanupScope` is not exported.

Subpath exports:

- `@citrusworx/sigjs/jsx-runtime`
- `@citrusworx/sigjs/jsx-dev-runtime`
- `@citrusworx/sigjs/sig-router`
- `@citrusworx/sigjs/juice` — optional Juice host binding. The main entry does not import it. Shipped in `@citrusworx/sigjs@0.4.0`.

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

`get()` registers the current effect or memo (if any) as a subscriber. `set()` always notifies, even if the value is unchanged. That notification rule is frozen for v1. There is no equality check.

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

## untrack

```ts
function untrack<T>(fn: () => T): T
```

Runs `fn` and returns its value without subscribing the current effect or memo. `bindList` uses this so a row's first `item.get()` cannot subscribe the list effect. Call it yourself when a read should be a snapshot inside an effect that must stay subscribed to something else.

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

## Cleanup scopes

Component calls and `bindList` rows run inside an internal cleanup scope. Effects registered during that call are attached to the returned node and run on `disposeTree`. If the call throws, those effects are disposed before the error propagates. `@citrusworx/sigjs/juice` `bind` uses the same scope, so a bind during render disposes on unmount.

The helper is `captureCleanupScope` in `src/cleanup-scope.ts`. It is not a package export. App code should not import it. See [API surface](./api-surface.md).

## bindList

```ts
function bindList<T, K>(
  parent: Element,
  source: { get(): readonly T[] | undefined | null },
  key: (item: T) => K,
  render: (item: { get(): T }, key: K) => Node,
): () => void;

function bindList<T, K>(
  parent: Element,
  source: { get(): ReadonlyMap<K, T> | undefined | null },
  render: (item: { get(): T }, key: K) => Node,
): () => void;
```

Experimental (`@experimental`). The contract may still change before v1. See [API surface](./api-surface.md).

Keyed list. `source` is a `Signal` or a `memo`. `null` or `undefined` from `get()` throws `bindList: source.get() returned no list`. The per-row getter's public name is `ListItem<T>`, also experimental.

- **Array.** Pass `key`. Display order is array order.
- **Map.** Omit `key`. Iteration order is display order. The map key is the row key.

`render` runs **once per key**. It must return a single `Node` (not a `DocumentFragment`). It receives a per-row getter. Read `item.get()` inside an effect or a function child to update that row when the item for the key changes. `bindList` does not call `render` again for a key that stayed. A bare `item.get()` in `render` is a snapshot, same as any other read outside an effect.

Reconciliation:

- a key that stays keeps its node, so focus and per-row effects stay
- a new key creates a row
- a key that leaves is removed, and its effects are disposed
- nodes are moved with `insertBefore` only when they are not already at the next index. If that move blurs an element inside the row, `bindList` focuses it again

`parent` should be an empty element reserved for the rows. One `bindList` per parent. Children that were already there are pushed after the rows.

Keys use SameValueZero (`Map` / `Set` equality), so `NaN` matches `NaN`. An array that yields the same key twice throws `bindList: duplicate key …` **before** that update changes the DOM. The previous rows stay mounted, and a later valid `set` reconciles from there. The first call throws out of `bindList` and leaves `parent` empty. A `Map` cannot contain duplicate keys.

The return value is a disposer. It removes every row and disposes row effects. Calling it twice is safe. The same disposer is attached to `parent`, so `disposeTree` and `mount` stop the list. While a component function is running, the list effect is also on that cleanup scope.

`replaceChildren` is the non-keyed alternative. It throws the previous children away. Use it when rebuilding the row is fine.

```ts
import { Signal, bindList, effect } from "@citrusworx/sigjs";

const todos = Signal(new Map<string, { text: string }>());
const list = document.createElement("ul");

bindList(list, todos, (item, id) => {
  const li = document.createElement("li");
  li.dataset.id = id;
  effect(() => {
    li.textContent = item.get().text;
  });
  return li;
});
```

The usual todo shape is a `Map<id, Todo>` plus an `order: id[]`, joined with `memo`, so sequence is not trapped inside insertion order. Priority sorting is that same derivation. See [Keyed todo list](./sig-patterns.md#keyed-todo-list-bindlist).

## JSX runtime

Configured via `jsxImportSource: "@citrusworx/sigjs"`.

```ts
function jsx(type: string, props?: JSX.IntrinsicElements[string] | null): Node
function jsx<P>(type: (props: P) => Node, props?: P | null): Node
function Fragment(props: { children?: Child } | null): DocumentFragment
```

`jsxs` is an alias of `jsx`. `jsxDEV` is the same factory on `@citrusworx/sigjs/jsx-dev-runtime`. Its extra arguments are `unknown` and ignored.

Host props accept a string, number, boolean, null, a reactive getter `() =>` of those, an event listener, a `ref`, or a style object. Unknown keys are attributes. Function children are `() => string | number | boolean | null | undefined`. The `JSX` namespace is exported from `./jsx-runtime` and `./jsx-dev-runtime`.

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

## bind (Juice hosts)

```ts
import { bind } from "@citrusworx/sigjs/juice";

function bind<R extends JuiceRuntimeName>(
  host: HTMLElement,
  runtime: R
): JuiceBinding<JuiceRuntimeState[R]>;
function bind(
  host: HTMLElement,
  runtime?: JuiceRuntimeName
): JuiceBinding<JuiceRuntimeState[JuiceRuntimeName]>;

type JuiceBinding<T> = {
  state: { get(): T; set(value: T): void };
  dispose(): void;
};
```

Optional. Requires `@citrusworx/juiceui` (optional peer). `state` is seeded from `getState()` and updated from `juice:change`. Select, input, and textarea follow native `input` and `change`. `state.set` writes the host for switch (`setChecked`), checkbox (`setChecked`), disclosure (`expand` / `collapse`), and modal (`open` / `close`). The other twenty-one runtimes `bind` accepts are read-only. Icon button and avatar are not `JuiceRuntimeName` values, so `bind` does not accept them. A follow-up for avatar is pending. `dispose` removes the listeners and is safe to call twice. A `bind` during Sig render also disposes on unmount.

State shapes and the write-back column are the table in [Juice runtime behavior](../juice/juice-runtime-behavior.md#juicechange). Usage is [Runtime binding](./sig-juice-integration.md#runtime-binding). Juice works without this function.

## Practices that match the implementation

- Use `Signal(value)`, never `new Signal(value)`
- Keep effects small: one element or one subscription
- Use function children for live text; function-valued props for live attributes
- Use `batch` when several signals should notify together
- Use `memo` for derived numbers/lists you read often
- Register routes as functions; call `start()` after `set`
- Do not invent `useEffect`, `<For>`, or `<Show>`. Keyed rows are `bindList`. A cheap rewrite is `replaceChildren`.

See [Best practices](./sig-best-practices.md) and [Anti-patterns](./sig-anti-patterns.md) for the same rules with examples. [Status](./sig-status.md) is the maturity matrix.
