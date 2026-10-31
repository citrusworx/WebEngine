# API reference

Every public export of workspace `@citrusworx/sigjs` **1.1.0** (not published). npm `latest` is **1.0.0**. The 1.0.0 signatures match `dist/*.d.ts` in that published tarball. **1.1.0** adds `pressable`, `touchable-row`, and `keyboard-avoider` to `JuiceRuntimeName`. `sheet` is not a name. The classification (stable, experimental, internal) is [API surface](./api-surface.md).

## Entry points

| Entry | Values | Types |
|---|---|---|
| `@citrusworx/sigjs` | `Signal`, `effect`, `batch`, `memo`, `untrack`, `bindList`, `jsx`, `jsxs`, `Fragment`, `mount`, `disposeTree`, `SigRouter`, `JSX` | `Child`, `ListItem`, `RouteFactory`, `RouteMap`, `RouteParams`, `RouteView` |
| `@citrusworx/sigjs/jsx-runtime` | `jsx`, `jsxs`, `Fragment`, `mount`, `disposeTree`, `JSX` | `Child` |
| `@citrusworx/sigjs/jsx-dev-runtime` | `jsxDEV`, `jsxs`, `Fragment`, `JSX` | |
| `@citrusworx/sigjs/sig-router` | `SigRouter` | `RouteFactory`, `RouteMap`, `RouteParams`, `RouteView` |
| `@citrusworx/sigjs/juice` | `bind` | `JuiceBinding`, `JuiceRuntimeName`, `JuiceRuntimeState`, `JuiceSignal` |

`jsxDEV` is not on the package root. `captureCleanupScope` and `attachNodeCleanup` are not entries. See [Lifecycle](./sig-lifecycle.md).

## Index

| Export | Kind | Since |
|---|---|---|
| [`Signal`](#signal) | function | 0.2.0 |
| [`effect`](#effect) | function | 0.2.0 |
| [`batch`](#batch) | function | 0.2.0 |
| [`memo`](#memo) | function | 0.2.0 |
| [`untrack`](#untrack) | function | 0.6.0 |
| [`bindList`](#bindlist) | function | 0.6.0 |
| [`ListItem`](#listitem) | type | 0.6.0 |
| [`jsx`](#jsx) | function | 0.2.0 |
| [`jsxs`](#jsxs) | const | 0.2.0 |
| [`jsxDEV`](#jsxdev) | function | 0.2.0 |
| [`Fragment`](#fragment) | function | 0.2.0 |
| [`Child`](#child) | type | 0.2.0, tightened in 0.7.0 |
| [`JSX`](#jsx-namespace) | namespace | Exported from the JSX entries in 0.7.0 |
| [`mount`](#mount) | function | 0.2.0 |
| [`disposeTree`](#disposetree) | function | 0.2.0 |
| [`SigRouter`](#sigrouter) | class | 0.2.0 |
| [`RouteParams`](#routeparams) | type | 0.3.0 |
| [`RouteFactory`](#routefactory) | type | 0.3.0 (exported). 0.2.0 was `() => Node` and not exported |
| [`RouteView`](#routeview) | type | 0.3.0 |
| [`RouteMap`](#routemap) | type | 0.3.0 |
| [`bind`](#bind) | function | 0.4.0. Icon button, avatar, and table in 0.7.2. Pressable, touchable-row, and keyboard-avoider in workspace 1.1.0 |
| [`JuiceBinding`](#juicebinding) | type | 0.4.0 |
| [`JuiceSignal`](#juicesignal) | type | 0.4.0 |
| [`JuiceRuntimeName`](#juiceruntimename) | type | 0.4.0, three names added in 0.7.2, three more in workspace 1.1.0 |
| [`JuiceRuntimeState`](#juiceruntimestate) | type | 0.4.0, three local shapes in 0.7.2, three more in workspace 1.1.0 |

`0.6.0` was published from a build that `package.json` never recorded. `0.7.0` is the versioned release that kept `untrack` and `bindList`.

---

## `Signal`

| | |
|---|---|
| Since | 0.2.0 |
| Entry | `.` |
| Status | Stable |
| Kind | function |

Creates `{ get, set }` closed over an initial value. Not a class. There is no exported `Signal<T>` type.

```ts
function Signal<T>(value: T): {
  get(): T;
  set(newValue: T): void;
};
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `value` | `T` | Initial value. Stored as-is |

### Returns

An object with `get` and `set`. No `peek`, `update`, `subscribe`, or `dispose`.

### Example

```ts
import { Signal, effect } from "@citrusworx/sigjs";

const count = Signal(0);
effect(() => console.log(count.get()));
count.set(1);
```

### Notes

- `get` returns the current value. Inside an effect or memo it subscribes that computation.
- `set` stores the next value, then notifies every subscriber. Notification is synchronous unless a `batch` is open.
- `set` always notifies, including when the value is unchanged. Frozen for 1.0. There is no equality check.
- In-place mutation of an object or array does not notify. Call `set` with the next value.

<details>
<summary>Edge cases</summary>

Calling `set` from an effect that also reads that signal re-enters the effect immediately. There is no recursion limit.

`get` during another effect's cleanup sees the value `set` already stored, and does not subscribe. See [Effects](./sig-effects.md).

</details>

### `Signal.get`

```ts
get(): T
```

Returns the current value. Subscribes `currentSubscriber` when one is active.

### `Signal.set`

```ts
set(newValue: T): void
```

| Name | Type | Description |
|---|---|---|
| `newValue` | `T` | Replaces the stored value |

Notifies a copy of the subscriber set, so a subscriber disposed during notification is not visited twice.

---

## `effect`

| | |
|---|---|
| Since | 0.2.0 |
| Entry | `.` |
| Status | Stable |
| Kind | function |

Runs `fn` immediately and again when a signal or memo it read notifies.

```ts
function effect(fn: () => void | (() => void)): () => void;
```

The parameter type in `signal.d.ts` is the unexported alias `EffectCallback`. It is not importable. The structural type above is the contract.

### Parameters

| Name | Type | Description |
|---|---|---|
| `fn` | `() => void \| (() => void)` | Body. An optional returned function is cleanup |

### Returns

A disposer. It unsubscribes the effect and runs the last cleanup. A second call does nothing.

### Example

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

### Notes

- Dependencies are cleared and re-collected on every run.
- Cleanup runs before the next body, after `set` has stored the new value.
- The disposer is also registered on the active component or `bindList` scope, if any.
- The effect does not compare `fn`'s result. Only a function return is kept as cleanup.

<details>
<summary>Edge cases</summary>

If `fn` throws, dependencies read before the throw stay subscribed, and no new cleanup is stored. The previous cleanup already ran at the start of that attempt.

A disposed effect ignores later notifications. Its disposer also drops it from the pending batch queue.

</details>

---

## `batch`

| | |
|---|---|
| Since | 0.2.0 |
| Entry | `.` |
| Status | Stable |
| Kind | function |

Queues notifications until the outermost call returns.

```ts
function batch(fn: () => void): void;
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `fn` | `() => void` | Writes to run before subscribers flush |

### Returns

`void`.

### Example

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
// runs === 2
```

### Notes

- Nested calls share a depth counter. Inner calls do not flush.
- Each subscriber is queued at most once per flush.
- If `fn` throws, depth still resets. Successful `set`s flush when depth hits 0.
- `get` inside the batch sees the values already written.

See [Batching](./sig-batch.md).

---

## `memo`

| | |
|---|---|
| Since | 0.2.0 |
| Entry | `.` |
| Status | Stable |
| Kind | function |

Lazy cached derivation.

```ts
function memo<T>(fn: () => T): {
  get(): T;
};
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `fn` | `() => T` | Computation. Signal reads inside it are dependencies |

### Returns

`{ get(): T }`. No `set` and no public `dispose`.

### Example

```ts
import { Signal, memo } from "@citrusworx/sigjs";

const items = Signal([1, 2, 3]);
const sum = memo(() => items.get().reduce((a, b) => a + b, 0));
sum.get(); // 6
```

### Notes

- `fn` does not run at creation.
- A dependency notification marks the cache dirty and notifies effects that have read `get()`.
- The next `get()` recomputes. Until then, `get()` returns the last success.
- Declared return is `T`, including the first call.

### `memo.get`

```ts
get(): T
```

Subscribes the current effect or memo, then returns the cache or recomputes.

<details>
<summary>Edge cases</summary>

If `fn` throws, the memo stays dirty and the next `get()` retries. There is no dispose, so an abandoned memo remains in the subscriber sets of the signals it read.

A dirty memo notifies its readers even if the next `fn()` result is equal to the previous one.

</details>

---

## `untrack`

| | |
|---|---|
| Since | 0.6.0 (kept in 0.7.0) |
| Entry | `.` |
| Status | Stable |
| Kind | function |

Runs `fn` without subscribing the current effect or memo.

```ts
function untrack<T>(fn: () => T): T;
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `fn` | `() => T` | Reads inside here do not subscribe the outer computation |

### Returns

The return value of `fn`.

### Example

```ts
import { Signal, effect, untrack } from "@citrusworx/sigjs";

const a = Signal(1);
const b = Signal(2);

effect(() => {
  console.log(a.get(), untrack(() => b.get()));
});
b.set(3); // effect does not re-run
```

### Notes

- This is the supported peek. There is no `.peek()` on a signal.
- `bindList` uses it so creating a row cannot subscribe the list effect to that row's signal.
- If `fn` throws, the previous subscriber is restored.

---

## `bindList`

| | |
|---|---|
| Since | 0.6.0 (kept in 0.7.0) |
| Entry | `.` |
| Status | Experimental |
| Kind | function |

Keyed list. A key that stays keeps its DOM node. A new key creates one. A key that leaves is removed and its effects are disposed.

```ts
function bindList<T, K>(
  parent: Element,
  source: { get(): readonly T[] | undefined | null },
  key: (item: T) => K,
  render: (item: ListItem<T>, key: K) => Node,
): () => void;

function bindList<T, K>(
  parent: Element,
  source: { get(): ReadonlyMap<K, T> | undefined | null },
  render: (item: ListItem<T>, key: K) => Node,
): () => void;
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `parent` | `Element` | Host for the rows. One list per element |
| `source` | `{ get(): ... }` | A `Signal` or `memo` of an array or `Map` |
| `key` | `(item: T) => K` | Array form only. Map form uses the map key |
| `render` | `(item, key) => Node` | Called once per key. Must return one `Node`, not a fragment |

### Returns

A disposer. It removes every row and disposes row effects. A second call does nothing. The same function is stored on `parent`, so `disposeTree` and `mount` stop the list.

### Example

```ts
import { Signal, bindList, effect } from "@citrusworx/sigjs";

const todos = Signal(new Map<string, { text: string }>());
const list = document.createElement("ul");

const dispose = bindList(list, todos, (item, id) => {
  const li = document.createElement("li");
  li.dataset.id = id;
  effect(() => {
    li.textContent = item.get().text;
  });
  return li;
});
```

### Notes

- Array form is four arguments. Map form is three. Passing an array to the three-argument form throws. Passing a `Map` to the four-argument form throws.
- `render` receives a [`ListItem`](#listitem). A bare `item.get()` in `render` is a snapshot. Read it from an effect or a function child.
- Keys use SameValueZero, so `NaN` matches `NaN`.
- Duplicate array keys throw `bindList: duplicate key …` before that update changes the DOM. The previous rows stay. The first call throws out of `bindList` and leaves `parent` empty.
- `source.get()` of `null` or `undefined` throws `bindList: source.get() returned no list`.
- An unchanged item reference does not call the row signal's `set` (`Object.is`).
- Moving a row re-focuses the active element inside it if the move blurred it.
- Existing children of `parent` are pushed after the rows.
- `replaceChildren` remains the non-keyed rewrite.

The usual shape when order is not insertion order is a `Map` plus an `id[]`, joined with `memo`. See [Keyed todo list](./sig-patterns.md#keyed-todo-list-bindlist).

<details>
<summary>Edge cases</summary>

`render` must return a single `Node`. A `DocumentFragment`, a non-node, or a node already used by another row throws, and effects started for that attempt are disposed.

`parent` must be an `Element`. A second `bindList` on the same parent throws `bindList: parent already has a list` until the first disposer runs.

The list effect reads `source` and applies the reconcile inside `untrack`, so row signals do not become list dependencies.

</details>

---

## `ListItem`

| | |
|---|---|
| Since | 0.6.0 |
| Entry | `.` |
| Status | Experimental |
| Kind | type |

Per-row view of the current item. `bindList` does not call `render` again when the item changes.

```ts
type ListItem<T> = {
  get(): T;
};
```

### `ListItem.get`

```ts
get(): T
```

Returns the current item for that key. Subscribes when called from an effect or memo.

---

## `jsx`

| | |
|---|---|
| Since | 0.2.0 |
| Entry | `.`, `./jsx-runtime` |
| Status | Stable |
| Kind | function |

Creates a DOM node from a tag, or calls a function component once.

```ts
function jsx(
  type: string,
  props?: JSX.IntrinsicElements[string] | null,
): Node;
function jsx<P>(type: (props: P) => Node, props?: P | null): Node;
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `type` | `string` or `(props: P) => Node` | Tag name, or a component |
| `props` | host props, component props, or `null` | Includes `children` |

### Returns

The created `Node`, or whatever the component returned. Cleanups are attached only when that value is a `Node`.

### Example

```tsx
const el = <button type="button" className={() => "ready"}>Go</button>;
```

The automatic runtime calls `jsx` for you. Prop and child rules are [Templating](./sig-jsx.md).

### Notes

- A function component runs inside a cleanup scope. If it throws, effects it started are disposed.
- `children` are not passed to `setProp`.
- Extra arguments, including a React `key`, are ignored.

---

## `jsxs`

| | |
|---|---|
| Since | 0.2.0 |
| Entry | `.`, `./jsx-runtime`, `./jsx-dev-runtime` |
| Status | Stable |
| Kind | const |

Alias of [`jsx`](#jsx). The automatic runtime imports this name for static children. It does not treat children differently.

```ts
const jsxs: typeof jsx;
```

---

## `jsxDEV`

| | |
|---|---|
| Since | 0.2.0 on `./jsx-dev-runtime`. Removed from `.` in 0.7.0 |
| Entry | `./jsx-dev-runtime` |
| Status | Stable |
| Kind | function |

Dev JSX entry. Same factory as `jsx`. The extra transform arguments are unused.

```ts
function jsxDEV(
  type: string,
  props: JSX.IntrinsicElements[string] | null,
  key?: unknown,
  isStaticChildren?: unknown,
  source?: unknown,
  self?: unknown,
): Node;
function jsxDEV<P>(
  type: (props: P) => Node,
  props: P | null,
  key?: unknown,
  isStaticChildren?: unknown,
  source?: unknown,
  self?: unknown,
): Node;
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `type` | tag or component | Passed to `jsx` |
| `props` | props | Passed to `jsx`. Required in this signature; may be `null` |
| `key` | `unknown` | Ignored. Keyed lists are `bindList` |
| `isStaticChildren` | `unknown` | Ignored |
| `source` | `unknown` | Ignored |
| `self` | `unknown` | Ignored |

### Returns

The node `jsx` returned.

### Example

`jsx: react-jsxdev` selects this module. Application code does not import it.

---

## `Fragment`

| | |
|---|---|
| Since | 0.2.0 |
| Entry | `.`, `./jsx-runtime`, `./jsx-dev-runtime` |
| Status | Stable |
| Kind | function |

Builds a `DocumentFragment` with the same child rules as a host element.

```ts
const Fragment: (
  props: { children?: Child } | null,
) => DocumentFragment;
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `props` | `{ children?: Child } \| null` | Only `children` is read |

### Returns

A `DocumentFragment`.

### Example

```tsx
<>
  <span>A</span>
  <span>B</span>
</>
```

### Notes

A component that returns a fragment still gets its cleanup attached. `attachNodeCleanup` copies that cleanup onto the fragment's child nodes.

---

## `Child`

| | |
|---|---|
| Since | Present since 0.2.0. The function arm was tightened, and `any` was removed, in 0.7.0 |
| Entry | `.`, `./jsx-runtime` |
| Status | Stable |
| Kind | type |

```ts
type Child =
  | Node
  | string
  | number
  | null
  | undefined
  | (() => string | number | boolean | null | undefined)
  | Child[];
```

The function arm is text. The runtime assigns `String(child())`.

---

## `JSX` namespace

| | |
|---|---|
| Since | Namespace export from the JSX entries in 0.7.0. A global `JSX` namespace has existed longer |
| Entry | `.`, `./jsx-runtime`, `./jsx-dev-runtime` |
| Status | Stable |
| Kind | namespace |

`jsxImportSource` resolves this namespace from the runtime entry. A file that never imports the package root still sees it. Loading `.` also applies the global namespace.

```ts
export namespace JSX {
  type Element = Node;
  interface IntrinsicElements {
    [elemName: string]: { /* open attribute map */ };
  }
  interface ElementChildrenAttribute {
    children: {};
  }
  interface IntrinsicAttributes {
    key?: string | number;
  }
}
```

### `JSX.Element`

`type Element = Node`. A component returns a DOM node.

### `JSX.IntrinsicElements`

An open string index, not a closed HTML map. Any tag name is legal, so Juice attributes type-check.

Each prop may be a string, number, boolean, `null`, `undefined`, a getter of those, a style object or a getter of one, an event listener, a `ref`, or a `Child`. Listeners and `ref` are bivariant so a more specific element or event still assigns.

Unknown keys become attributes at runtime. The style-object arm is in the type. Assigning an object to the DOM `style` property does not copy CSS fields.

A string does. See [Templating](./sig-jsx.md).

### `JSX.ElementChildrenAttribute`

Children are taken from `props.children`. The field is typed as `{}`.

### `JSX.IntrinsicAttributes`

Optional `key` of `string | number`. The runtime ignores it.

---

## `mount`

| | |
|---|---|
| Since | 0.2.0 |
| Entry | `.`, `./jsx-runtime` |
| Status | Stable |
| Kind | function |

Disposes the target's current children, then inserts `node`.

```ts
function mount(node: Node, target: HTMLElement): void;
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `node` | `Node` | The next tree. A fragment's children are inserted |
| `target` | `HTMLElement` | Container whose children are replaced |

### Returns

`void`.

### Example

```ts
import { mount } from "@citrusworx/sigjs";

mount(<App />, document.getElementById("root")!);
```

### Notes

- Each current child is passed to `disposeTree` before `replaceChildren`.
- A second `mount` on the same target disposes the previous tree, including component effects and `bindList`.
- Do not also point a `SigRouter` at the same element unless you mean the router to own it.

---

## `disposeTree`

| | |
|---|---|
| Since | 0.2.0 |
| Entry | `.`, `./jsx-runtime` |
| Status | Stable |
| Kind | function |

Walks a node and runs the cleanups attached to it.

```ts
function disposeTree(node: Node): void;
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `node` | `Node` | Root of the walk. Children are disposed first |

### Returns

`void`.

### Example

```ts
import { disposeTree } from "@citrusworx/sigjs";

disposeTree(panel);
```

### Notes

- Cleanups live in a `WeakMap`. A node with none is a no-op.
- The node is not removed from its parent.
- Event listeners added with `on*` are not removed.
- `attachNodeCleanup` is the internal writer and is not exported from a package entry.

---

## `SigRouter`

| | |
|---|---|
| Since | 0.2.0 for exact paths. `:param` matching in 0.3.0 |
| Entry | `.`, `./sig-router` |
| Status | Stable. The [status matrix](./sig-status.md) still marks the router Emerging because splat routes are absent |
| Kind | class |

Client router. Matches an exact path, then a `:param` pattern, then an optional `"*"` view.

```ts
class SigRouter {
  constructor(target?: string);
  set(path: string, component: RouteView, name?: string): this;
  set(routes: RouteMap): this;
  get(name: string): string | undefined;
  start(): void;
  navigate(path: string): void;
  goBack(): void;
  stop(): void;
  has(path: string): boolean;
}
```

### Example

```tsx
import { SigRouter } from "@citrusworx/sigjs";

const router = new SigRouter("#root");

router.set({
  "/": Home,
  "/user/:id": (params) => User(params),
  about: () => <p>About</p>,
  "*": NotFound,
});

router.start();
```

Import from `@citrusworx/sigjs/sig-router` when you do not want the JSX runtime in that module graph. It is the same class.

### `constructor`

```ts
constructor(target?: string);
```

| Name | Type | Default | Description |
|---|---|---|---|
| `target` | `string` | `"#root"` | `querySelector` string, not an element |

### `set`

```ts
set(path: string, component: RouteView, name?: string): this;
set(routes: RouteMap): this;
```

| Name | Type | Description |
|---|---|---|
| `path` | `string` | Exact path, `:param` pattern, or `"*"` |
| `component` | `RouteView` | A node, a factory, or `null` |
| `name` | `string` optional | Stored for `get` when you use the one-route form |
| `routes` | `RouteMap` | Keys without a leading `/` are also stored as names |

Returns `this`. A key is normalized: `"about"` is stored as `"/about"`. `"*"` and `"/"` stay as they are. Registering the same path again replaces that route.

### `get`

```ts
get(name: string): string | undefined;
```

Returns a registered path or pattern. Named routes are checked first, then `routes.get(normalize(name))`. It does not fill `:param` placeholders. `get("about")` is `"/about"` when that path was registered, even if the key was already `"/about"`.

### `start`

```ts
start(): void;
```

Adds a document `click` listener and a `window` `popstate` listener, then renders `location.pathname`. A second call renders again and does not stack listeners.

### `navigate`

```ts
navigate(path: string): void;
```

Normalizes a leading slash, then `pushState` and render when the path matches. No match and no `"*"` is a no-op: history does not change and the current view stays.

### `goBack`

```ts
goBack(): void;
```

Calls `history.back()`. The `popstate` listener renders the resulting pathname.

### `stop`

```ts
stop(): void;
```

Removes the click and `popstate` listeners. Does not clear the current view. A second call does nothing. `start` after `stop` attaches listeners again.

### `has`

```ts
has(path: string): boolean;
```

True only when that normalized path string was registered. `has("/user/42")` is false after `set("/user/:id")`. It is not a match test. `has("/user/:id")` is true.

### Path rules

| Order | Pattern | Params |
|---|---|---|
| 1 | Exact path, including `"/"` | `{}` |
| 2 | First registered pattern whose segments match, with `:name` capturing one segment | Decoded segment strings |
| 3 | `"*"` if registered | `{}` |

Exact routes win over a colliding param pattern. `/about` and `/about/` are different. There is no splat. `"*"` is only the fallback key, not a prefix.

`decodeURIComponent` is applied to param segments. A segment that throws stays raw.

### Link interception

A click on an `<a>` is handled when the event target is an `HTMLElement`. These are left to the browser:

| Left alone | |
|---|---|
| `target="_blank"` | |
| `download` attribute | |
| missing `href` | |
| `href` starting with `http`, `mailto`, `tel`, or `ftp` | `https` is covered because it starts with `http` |

Modifier clicks (`metaKey`, `ctrlKey`, and the rest) are still intercepted. That includes Command-click and Control-click. Protocol-relative `//` URLs and hash-only hrefs are intercepted too.

### Views

Pass a function. The router calls it on every visit and disposes the previous children first. A prebuilt `Node` is inserted as-is. Leaving that view disposes its effects, and the next visit does not rebuild them.

If the factory returns `null`, or nothing matches and there is no `"*"`, the target is emptied. `popstate` to an unknown path does that. `navigate` to an unknown path does not: it returns before touching history.

If `querySelector(target)` finds nothing, render returns without throwing.

See [Router](./sig-router.md).

---

## `RouteParams`

| | |
|---|---|
| Since | 0.3.0 |
| Entry | `.`, `./sig-router` |
| Status | Stable |
| Kind | type |

```ts
type RouteParams = Record<string, string>;
```

Matched `:param` values. Exact routes and `"*"` pass `{}`.

---

## `RouteFactory`

| | |
|---|---|
| Since | Exported in 0.3.0. 0.2.0 used an unexported `() => Node \| null` |
| Entry | `.`, `./sig-router` |
| Status | Stable |
| Kind | type |

```ts
type RouteFactory = (params: RouteParams) => Node | null;
```

Called on every visit. Prefer this over a prebuilt node.

---

## `RouteView`

| | |
|---|---|
| Since | 0.3.0 |
| Entry | `.`, `./sig-router` |
| Status | Stable |
| Kind | type |

```ts
type RouteView = Node | RouteFactory | null;
```

---

## `RouteMap`

| | |
|---|---|
| Since | 0.3.0 |
| Entry | `.`, `./sig-router` |
| Status | Stable |
| Kind | type |

```ts
type RouteMap = Record<string, RouteView>;
```

The object form of `SigRouter.set`. The name says Map. The type is a record.

---

## `bind`

| | |
|---|---|
| Since | 0.4.0. Icon button, avatar, and table names in 0.7.2 |
| Entry | `./juice` only |
| Status | Stable |
| Kind | function |

Returns a signal kept in sync with a Juice runtime host, plus `dispose`.

```ts
function bind<R extends JuiceRuntimeName>(
  host: HTMLElement,
  runtime: R,
): JuiceBinding<JuiceRuntimeState[R]>;
function bind(
  host: HTMLElement,
  runtime?: JuiceRuntimeName,
): JuiceBinding<JuiceRuntimeState[JuiceRuntimeName]>;
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `host` | `HTMLElement` | The runtime host, already enhanced by Juice |
| `runtime` | `JuiceRuntimeName` optional | Skips inference and types the state |

### Returns

[`JuiceBinding`](#juicebinding). `state` is seeded with `structuredClone` of `getState()`.

### Example

```ts
import { bind } from "@citrusworx/sigjs/juice";

const host = document.querySelector<HTMLElement>("[switch]")!;
const notes = bind(host, "switch");

notes.state.get(); // { checked: boolean }
notes.state.set({ checked: true });
notes.dispose();
```

### Notes

- The main entry does not import Juice. This module does. The peer is optional: `@citrusworx/juiceui` `>=0.9.1 <1`.
- Importing this module against Juice **0.9.1** throws. The named import `startDisclosureRuntime` is missing. **0.9.2** loads and binds 25 names. Icon button, avatar, and table need **0.9.3**. Pressable and touchable row need **0.9.4**. Keyboard avoider needs **0.9.5**, which binds all 31. The table is [Runtime binding](./sig-juice-integration.md#runtime-binding).
- Omit `runtime` to infer from the host. The first matcher in source order wins. `[icon-button]` wins over `[pressable]`. `[pressable]` wins over `[touchable-row]`.
- `getState()` of `null` throws `Sig juice bind: <runtime> getState() returned null for this host.`
- Inference failure throws `Sig juice bind: could not infer a runtime from this host. Pass a runtime name.`
- Icon button, avatar, table, pressable, touchable-row, and keyboard-avoider throw `Sig juice bind: "<runtime>" needs a newer @citrusworx/juiceui that exports <start function>.` when that export is missing. The rest of the module still works on 0.9.2. `sheet` is not a name until juiceui publishes it.
- Select, input, and textarea listen for native `input` and `change`. The other 28 follow a bubbling `juice:change` whose `detail` is `{ runtime, state }`, and only when `event.target` is the bound host. Pressable's opt-in `juice:longpress` is a separate event. `bind` does not listen for it.
- `state.set` skips the write when the next state is deeply equal to the current one. That is not `Signal.set`.
- Write-back runs for switch, checkbox, disclosure, modal, and icon button. Pressable, touchable-row, keyboard-avoider, avatar, table, and the other names update the signal only. The next host event copies the host back over a local `set`. Keyboard-avoider does dispatch `juice:change` with `{ open, inset }`. A sub-threshold inset step updates Juice's custom property and `getState` without moving the signal.
- A bind during a Sig component render disposes with the view.

<details>
<summary>Write-back calls</summary>

| Runtime | `state.set` |
|---|---|
| `switch` | `setChecked(state.checked, host)` |
| `checkbox` | `setChecked(state.checked, host)` |
| `disclosure` | `expand` or `collapse` on the host when it matches `[disclosure-trigger]`, otherwise on the first such descendant |
| `modal` | `open(host)` or `close(host)` |
| `icon-button` | `toggle(host)` only when the host has `[toggle]` and `pressed` changes, then the signal is republished from `getState()`. A disabled host or a host without `[toggle]` leaves the signal on the host's state |

</details>

---

## `JuiceBinding`

| | |
|---|---|
| Since | 0.4.0 |
| Entry | `./juice` |
| Status | Stable |
| Kind | type |

```ts
type JuiceBinding<T> = {
  state: JuiceSignal<T>;
  dispose: () => void;
};
```

### `JuiceBinding.state`

The signal seeded from `getState`. See [`JuiceSignal`](#juicesignal).

### `JuiceBinding.dispose`

```ts
dispose(): void
```

Removes `juice:change`, and `input` / `change` for select, input, and textarea. A second call does nothing.

---

## `JuiceSignal`

| | |
|---|---|
| Since | 0.4.0 |
| Entry | `./juice` |
| Status | Stable |
| Kind | type |

```ts
type JuiceSignal<T> = {
  get: () => T;
  set: (value: T) => void;
};
```

Same shape as `Signal`'s return value. It is not that object. `set` deep-compares before notifying, and it may call a Juice controller.

`get` reads the latest copied state. It subscribes a surrounding Sig effect, because the implementation is a `Signal`.

There is still no shared `Signal<T>` type.

---

## `JuiceRuntimeName`

| | |
|---|---|
| Since | 0.4.0 for the original names. `"icon-button"`, `"avatar"`, and `"table"` in 0.7.2. `"pressable"`, `"touchable-row"`, and `"keyboard-avoider"` in workspace 1.1.0 (not published) |
| Entry | `./juice` |
| Status | Stable |
| Kind | type |

```ts
type JuiceRuntimeName =
  | "switch" | "checkbox" | "disclosure" | "accordion" | "modal"
  | "drawer" | "popover" | "menu" | "combobox" | "slider"
  | "progress" | "radio" | "tabs" | "pagination" | "breadcrumb"
  | "wizard" | "toast" | "banner" | "tooltip" | "spinner"
  | "nav" | "field" | "select" | "input" | "textarea"
  | "icon-button" | "avatar" | "table"
  | "pressable" | "touchable-row" | "keyboard-avoider";
```

Thirty-one names in workspace 1.1.0. Published 1.0.0 stops at `"table"`. `sheet` is not in this union. Binding it waits until juiceui publishes it. Icon button, avatar, and table shipped in juiceui 0.9.3. Pressable and touchable row shipped in 0.9.4. Keyboard avoider shipped in 0.9.5.

Adding a name later would be a minor. Renaming one is a major. Inference attributes and which Juice versions can bind each name are in [Runtime binding](./sig-juice-integration.md#runtime-binding).

---

## `JuiceRuntimeState`

| | |
|---|---|
| Since | 0.4.0. Three local shapes in 0.7.2. Three more in workspace 1.1.0 |
| Entry | `./juice` |
| Status | Stable |
| Kind | type |

Maps each [`JuiceRuntimeName`](#juiceruntimename) to a state type. Twenty-five of the types are imported from `@citrusworx/juiceui`. Icon button, avatar, table, pressable, touchable-row, and keyboard-avoider are declared locally so this file does not name Juice types that older builds do not export.

```ts
type JuiceRuntimeState = {
  switch: SwitchState;
  checkbox: CheckboxState;
  disclosure: DisclosureState;
  accordion: AccordionState;
  modal: ModalState;
  drawer: DrawerState;
  popover: PopoverState;
  menu: MenuState;
  combobox: ComboboxState;
  slider: SliderState;
  progress: ProgressState;
  radio: RadioState;
  tabs: TabsState;
  pagination: PaginationState;
  breadcrumb: BreadcrumbState;
  wizard: WizardState;
  toast: ToastState;
  banner: BannerState;
  tooltip: TooltipState;
  spinner: SpinnerState;
  nav: NavigationState;
  field: FieldState;
  select: SelectState;
  input: InputState;
  textarea: TextareaState;
  "icon-button": {
    pressed: boolean;
    disabled: boolean;
    named: boolean;
  };
  avatar: {
    loaded: boolean;
    fallback: boolean;
    hasImage: boolean;
  };
  table: {
    column: number | null;
    direction: "ascending" | "descending" | "none";
  };
  pressable: { pressed: boolean; longPressed: boolean };
  "touchable-row": { selected: boolean; disabled: boolean };
  "keyboard-avoider": { open: boolean; inset: number };
};
```

The imported names follow the installed peer. Fields Sig's write-back reads are `checked` (switch, checkbox), `expanded` (disclosure), `open` (modal), and `pressed` (icon button). Table has no Juice API to set sort. Avatar has no write API.

A breaking change to a Juice state type breaks this alias for people on that peer. Widening the peer range is a minor for Sig. Narrowing it is a major. See [Semver](./release-checklist.md#semver).
