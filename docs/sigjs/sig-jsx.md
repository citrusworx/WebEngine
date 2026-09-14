# JSX and the DOM

How `@citrusworx/sigjs` turns JSX into real DOM, and why lists, conditionals, and attributes do **not** behave like React.

Implemented in `libraries/sig/src/jsx-runtime.ts`, with types in `jsx.ts`. Configure TypeScript with `jsx: "react-jsx"` and `jsxImportSource: "@citrusworx/sigjs"`.

Related:

- [Signals](./sig-signals.md) — what `{() => count.get()}` is actually subscribing to
- [Effects](./sig-effects.md) — the primitive function children use
- [Patterns](./sig-patterns.md) — lists, tabs, forms built on this model
- [Anti-patterns](./sig-anti-patterns.md) — the VDOM habits that break here

## Static first

`jsx(type, props)` either:

- calls a **function component** once, inside `captureCleanupScope`, and returns whatever `Node` it returned, or
- `document.createElement(type)`, assigns props, appends children, and returns that element

There is no virtual tree, no diff, no second pass. A second call to `<Header />` is a second element, not an update.

```tsx
function Header() {
  return <h1>Operator desk</h1>;
}

const a = <Header />;
const b = <Header />;
a === b; // false — two real h1s
```

Component functions are **element factories**. They are not render functions. They do not re-run when a signal changes. That is the whole point of Sig.js: the page stays put; only subscribed nodes move.

## The child model

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

`appendChild` handles each kind:

| Child | What the runtime does |
|---|---|
| `null` / `undefined` | skipped |
| array | each item appended |
| `string` / `number` | static `Text` node |
| `function` | a `Text` node whose `textContent` is `String(child())`, updated by an `effect` |
| `Node` | `parent.appendChild(child)` |

That table is the DOM model. Everything people assume from React has to fit into one of those rows or it does not exist.

## Function children are text only

```ts
if (typeof child === "function") {
  const textNode = document.createTextNode("");
  parent.appendChild(textNode);

  effect(() => {
    textNode.textContent = String(child());
  });
  return;
}
```

The runtime never looks at the *return type* of the function. It always does `String(child())`.

```tsx
// Live text — correct
<p>Count: {() => String(count.get())}</p>

// Snapshot — the get() ran while building the tree
<p>Count: {count.get()}</p>

// Stringifies a DOM node — you will see "[object HTMLDivElement]"
<div>{() => <p>Hi</p>}</div>

// Stringifies an array — you will see "1,2,3" or "[object HTMLLIElement],…"
<ul>{() => items.get().map((text) => <li>{text}</li>)}</ul>
```

Live **structure** is not a child function. It is an effect you write against a node you hold. See lists and conditionals below.

`Fragment` uses the same `appendChild`, so function children inside `<>…</>` are still text nodes.

## Props are assigned once

`setProp` runs at create time:

| Kind | Behavior |
|---|---|
| `children` | ignored here; appended separately |
| `ref` (function) | called with the element after create |
| `on*` (function) | `addEventListener(name.toLowerCase(), fn)` — `onClick` → `click` |
| Known DOM properties | assigned (`el[key] = value`), except `animate` / `animation` / `motion`, `data-*`, `aria-*` |
| `true` | `setAttribute(key, "")` |
| `false` / `null` / `undefined` | `removeAttribute` |
| other | `setAttribute(key, value)` |

Function values that are **not** `ref` or `on*` are assigned as-is. They are **not** subscribed.

```tsx
// Stores a function on className. The CSS class is not "active".
<div className={() => (on.get() ? "active" : "")} />

// Stores a function on the Juice attribute. Juice cannot see a gap.
<section padding={() => size.get()} />
```

Live attributes are an effect:

```tsx
const el = <div className="off" /> as HTMLDivElement;

effect(() => {
  el.className = on.get() ? "on" : "off";
});
```

### Why Juice attributes work

`stack`, `gap`, `padding`, `card`, `surface`, `hero`, `panel`, `muted` are not DOM properties, so they take the `setAttribute` path. Juice CSS then matches `[stack]`, `[gap="2rem"]`, `[card]`.

That assignment happens **once**. To change a Juice attribute later, `setAttribute` / `removeAttribute` from an effect. Do not pass a function into the JSX attribute.

Boolean Juice flags (`stack`, `card`, `muted`) should be `true` so they become `setAttribute(key, "")`.

## Events

`onClick`, `onInput`, `onKeyDown`, `onSubmit`, `onclick` — any `on*` function — become `addEventListener`. The prefix is sliced and lowercased: `onClick` → `click`, `onKeyDown` → `keydown`.

A non-function `onClick` is ignored (it falls through; if `onClick` is not a DOM property it may even land as an attribute named `onClick`). Pass a function.

There is no event pooling and no synthetic event. You get the browser’s `Event`. Cast `e.target` when you need `.value`.

## `ref`

```tsx
<input
  ref={(el) => {
    effect(() => {
      el.disabled = !ready.get();
    });
  }}
/>
```

`ref` is called once. It is not called again on signal change. Put the `effect` inside (or close over the element) so something actually subscribes.

## Components

```tsx
function Card(props: { title: string; children?: Node }) {
  return (
    <article card padding="1.25rem" stack gap="0.75rem">
      <h2>{props.title}</h2>
      {props.children}
    </article>
  );
}

<Card title="Queue">{list}</Card>
```

The function receives `props` and must return a `Node` (or something `jsx` will return to the parent — typically a `Node`). Effects created during the call are attached to that node via `captureCleanupScope`.

There are no hooks. Calling `Signal` or `effect` inside the function is just calling functions. Call them at the top of the factory so they run once per mount. Calling `effect` inside a click handler would create a **new** effect per click; do not do that.

`jsxs` is an alias of `jsx`. `jsxDEV` (dev runtime) also delegates to `jsx`.

## Conditionals

Three honest patterns, in order of preference:

### 1. Hide structure that already exists

```tsx
const panel = <aside panel hidden>Notes</aside> as HTMLElement;

effect(() => {
  panel.hidden = !open.get();
});
```

Best when the hidden UI is cheap and you want to keep its state (input text, scroll).

### 2. Rewrite children when membership changes

```tsx
const body = <div /> as HTMLDivElement;

effect(() => {
  const value = tab.get();
  if (value === "queue") {
    body.replaceChildren(<Queue />);
    return;
  }
  body.replaceChildren(<About />);
});
```

Best for tabs and routes-inside-a-page. Each branch is a fresh tree.

### 3. Do not use a function child as a conditional element

```tsx
// Wrong
{() => (open.get() ? <Panel /> : null)}
```

That is text. See the child table.

## Lists

Same rule as conditionals. The runtime will not reconcile `{items.map(…)}` **as a function child**. It will append a **static** mapped array if you pass the array *as* children at create time:

```tsx
// Static — mapped once while the component runs
<ul>
  {initial.map((text) => (
    <li>{text}</li>
  ))}
</ul>
```

That is fine for data that never changes. For a live list:

```tsx
const list = <ul /> as HTMLUListElement;

effect(() => {
  list.replaceChildren(
    ...items.get().map((text) => <li>{text}</li>),
  );
});
```

`replaceChildren` drops the previous `<li>` nodes. There is no keyed reuse. For a small operator queue this is the intended pattern. If you need to preserve focus inside a row, keep those row elements yourself and mutate them — Sig will not do it for you.

## `mount` and `disposeTree`

```ts
function mount(node: Node, target: HTMLElement): void
```

Disposes existing children of `target`, then `replaceChildren(node)`.

```ts
function disposeTree(node: Node): void
```

Walks the node, runs attached cleanups, recurses. `SigRouter` and `mount` call this for you.

Cleanup is stored on a `WeakMap<Node, Set<Cleanup>>`. Function components attach their scope disposer to the returned node. Host-only trees with function children may not attach those text effects — wrap the app in a function component so dispose can see them. See [Effects — cleanup scopes](./sig-effects.md#cleanup-scopes-and-component-functions).

## `Fragment`

```tsx
function Title() {
  return (
    <>
      <h1>Desk</h1>
      <p muted>Operations</p>
    </>
  );
}
```

`Fragment` builds a `DocumentFragment` and appends children into it. When that fragment is inserted, its children move into the parent. Cleanup attached to a fragment is copied onto those children.

## What “surgical updates” means in this runtime

Sig.js does not re-render a component function when a signal changes.

- A function child updates **one text node**.
- An `effect` runs your callback; you decide which properties to write.
- A list example that calls `replaceChildren` rebuilds those children. That is your code, not a reconciler.

If the page “re-renders,” you wrote an effect that rebuilt it. That is allowed. It is also how you accidentally recreate the problem Sig.js exists to avoid. Keep the writes small.

## Practices that match the implementation

- Treat JSX as `document.createElement` plus a few helpers
- Use function children only for text
- Hold elements for attributes, lists, and conditionals
- Put the app in a function component so `disposeTree` can find effects
- Let Juice attributes ride along as static HTML attributes
- Do not invent reactive props, keyed lists, or `{condition && <X />}` element swapping
