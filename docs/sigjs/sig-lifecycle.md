# Lifecycle

Sig creates DOM once, attaches cleanups to nodes, and runs those cleanups when the tree is disposed. `mount` and `SigRouter` are the two public ways a whole tree is replaced.

There is no `onMount` callback and no `onCleanup` export. Cleanup is the function you return from `effect`, plus the disposers the JSX runtime stores for you.

| | |
|---|---|
| Since | `mount` and `disposeTree` in 0.2.0 |
| Import | `import { mount, disposeTree } from "@citrusworx/sigjs"` |
| Status | Stable |

## Use it

```tsx
import { Signal, effect, mount } from "@citrusworx/sigjs";

function Clock() {
  const label = <p></p> as HTMLParagraphElement;

  effect(() => {
    const id = setInterval(() => {
      label.textContent = new Date().toISOString();
    }, 1000);
    return () => clearInterval(id);
  });

  return label;
}

const root = document.getElementById("root")!;
mount(<Clock />, root);
```

A later `mount(next, root)` disposes the clock's effect, then inserts `next`.

## What gets disposed

| Source | Stored on | Runs when |
|---|---|---|
| `effect` inside a component function | The node the component returned | `disposeTree` on that node, or `mount` / route change that disposes it |
| `effect` inside `bindList`'s `render` | The row node | The key leaves, or the list is disposed |
| Function-child text | The text node | `disposeTree` walks that node |
| Function-valued prop | The host element | `disposeTree` on that element |
| `bindList` itself | The parent element | `disposeTree` or `mount` on the parent |
| `bind` during render | The component node, via the effect scope | The view is disposed. `binding.dispose()` also works |
| `onClick` and other `on*` listeners | The element, as a normal listener | Not removed by `disposeTree` |
| `ref` | Nowhere | Runs once. No cleanup callback |

`disposeTree` walks children first, then runs the cleanups stored for that node. It does not remove the node from its parent. `mount` and the router remove children after disposing them.

## Component scope

```tsx
function Panel() {
  const open = Signal(false);
  effect(() => {
    console.log(open.get());
  });
  return <section>{() => (open.get() ? "open" : "closed")}</section>;
}
```

The call to `Panel` is wrapped in an internal cleanup scope. Both the hand-written effect and the function-child effect are registered. If `Panel` throws, those cleanups run before the error leaves the call.

The scope helper is `captureCleanupScope`. `registerCleanup` adds a disposer to the active scope. Neither name is a package entry.

`attachNodeCleanup` stores a disposer on a node and is also not public. Both files are in the published tarball because the runtime imports them. `package.json` `exports` does not expose them.

## Router views

`start` and `navigate` dispose the target's current children, then insert the next view. A view function runs again on the next visit, so its effects are new.

A prebuilt node is reused. The first leave disposes its effects. The next visit inserts the same node with those effects already stopped.

Register functions. See [Router](./sig-router.md).

## `mount` and a missing root

```ts
mount(node, target);
```

`target` must be an `HTMLElement`. Its current child nodes are disposed, then `replaceChildren(node)` runs. Passing a node that is already one of those children disposes it before insert.

`disposeTree(node)` is safe on a node that has no cleanups. It does not throw.

## Related

| | |
|---|---|
| [Effects](./sig-effects.md) | Returning a cleanup |
| [Templating](./sig-jsx.md) | Which JSX props install effects |
| [API: mount](./sig-api.md#mount) | Signatures |
