# Templating

JSX in Sig is a factory. A tag becomes a DOM node. A function component runs once and must return a node. Updates happen only where you passed a function that reads a signal.

There is no compiler pass that makes JSX reactive. `jsxImportSource` selects this runtime. It does not rewrite your components into a virtual DOM.

| | |
|---|---|
| Since | JSX factory in 0.2.0. Function-valued props in 0.3.0 |
| Import | Set `jsxImportSource` to `@citrusworx/sigjs` |
| Status | Stable |

## Use it

```tsx
import { Signal, mount } from "@citrusworx/sigjs";

function Counter() {
  const count = Signal(0);

  return (
    <p className={() => (count.get() > 0 ? "hot" : "cold")}>
      Count: {() => count.get()}
      <button type="button" onClick={() => count.set(count.get() + 1)}>
        Increment
      </button>
    </p>
  );
}

mount(<Counter />, document.getElementById("root")!);
```

The `p` and the button are created once. The text node and `className` update later.

## Children

| Child | Result |
|---|---|
| string or number | A text node |
| `null` or `undefined` | Omitted |
| A `Node` | Appended |
| An array | Each item appended, including nested arrays |
| `() => string \| number \| boolean \| null \| undefined` | A text node. An effect sets `textContent` to `String(child())` |

`String(null)` is `"null"`. `String(undefined)` is `"undefined"`. `String(false)` is `"false"`. `String(0)` is `"0"`.

A function that returns an element does not mount it. The text becomes `[object HTMLDivElement]`. Show and hide with `hidden`, or replace children from an effect.

```tsx
{() => (open.get() ? <aside>Notes</aside> : null)}
```

That line is text, not a panel.

## Props

| Prop | When it updates |
|---|---|
| string, number, or boolean | Once, at create time |
| `() => string \| number \| boolean \| null \| undefined` | Whenever signals it reads change |
| `onClick`, `onInput`, any `on*` function | Once. Registered with `addEventListener`. Not a getter |
| `ref={(el) => ...}` | Once, with the element |
| `style="color: red"` | Once, as a CSS string. A function that returns a string updates |
| `style={{ color: "red" }}` | Accepted by the types. Does not apply CSS. See below |
| Unknown keys (`stack`, `card`, `data-*`, `aria-*`) | Attributes. `true` sets `""`. `false` or `null` removes the attribute |

DOM properties (`className`, `value`, `checked`, `hidden`, `disabled`, and other keys that exist on the element) are assigned on the object. `data-*` and `aria-*` are attributes even though some exist as properties. `class` is special: a string sets `className`; `false` or `null` clears it.

`className={false}` assigns the string `"false"`, because `className` is a property. Use `class={false}` or `className=""` when you mean no class.

`disabled={busy.get()}` is a snapshot. `disabled={() => busy.get()}` stays live.

## Events and ref

```tsx
<button
  type="button"
  ref={(el) => {
    el.dataset.ready = "1";
  }}
  onClick={(event) => {
    const target = event.target as HTMLButtonElement;
    target.dataset.clicks = "1";
  }}
>
  Go
</button>
```

The listener receives the browser `Event`. There is no pooling and no synthetic event. `disposeTree` does not remove these listeners. Dropping the node drops them with it, unless something else still holds the node.

`ref` is the place to subscribe when you want the element without assigning JSX to a variable. Pair it with `effect` if the subscription must be live. `ref` itself does not re-run.

## Components and fragments

```tsx
function Card(props: { title: string; children?: unknown }) {
  return (
    <section>
      <h2>{props.title}</h2>
      {props.children}
    </section>
  );
}

<>
  <Card title="A">One</Card>
  <Card title="B">Two</Card>
</>
```

`Card` runs once per creation. It does not re-run when a signal changes. Read signals in a child function or an effect inside `Card`, not in the props you captured once.

`<>...</>` is a `DocumentFragment` with the same child rules. A component that returns a fragment still gets its cleanups attached to the fragment's children.

The `key` prop is in the JSX types and ignored. Keyed lists are `bindList`, not `key`.

## Conditionals

| Goal | Pattern |
|---|---|
| Keep the node, flip visibility | `hidden={() => !open.get()}` or set `hidden` in an effect |
| Swap which children exist | `parent.replaceChildren(...)` inside an effect |
| Choose text | `{() => (open.get() ? "Hide" : "Show")}` |

`replaceChildren` drops the previous nodes. That is the non-keyed list. It is the right default when rows are cheap.

## Lists

```tsx
const list = <ul></ul> as HTMLUListElement;

effect(() => {
  list.replaceChildren(...items.get().map((text) => <li>{text}</li>));
});
```

`bindList` keeps a node for each key. It is experimental. An array needs a key function. A `Map` uses iteration order and the map key.

`render` runs once per key and receives `{ get() }` for the current item. Read that getter from an effect or a function child.

Duplicate array keys throw `bindList: duplicate key …` before that update changes the DOM. The first call throws out of `bindList` and leaves the parent empty. A later duplicate leaves the previous rows in place.

The parent should be an empty element reserved for the rows. Children that were already there are pushed after the rows. One binding per parent. The walkthrough is [Keyed todo list](./sig-patterns.md#keyed-todo-list-bindlist).

## Juice attributes

Any tag name is legal. Unknown keys become attributes, so `stack`, `gap`, and `card` survive. A function value on those keys updates the attribute.

They are not a typed Juice plugin. See [Sig.js + Juice](./sig-juice-integration.md).

## What "surgical" means

The runtime does not diff a tree. It re-runs the function you gave it and writes one text node or one property. If an effect calls `replaceChildren` on a large parent, that parent is rebuilt because the effect said so.

## Related

| | |
|---|---|
| [Lifecycle](./sig-lifecycle.md) | Where prop effects are stored |
| [API: jsx](./sig-api.md#jsx) | Factory signatures |
| [Anti-patterns](./sig-anti-patterns.md) | The React habits that print `[object HTMLElement]` |
