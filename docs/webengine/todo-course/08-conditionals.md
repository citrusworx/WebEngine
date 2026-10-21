# 08 — Conditionals and empty states

[Previous](./07-juice.md) · [Course](./README.md) · [Next](./09-production.md)

**Goal:** show and hide regions without a `<Show>` component, and without returning elements from a function child.

## What you'll build

The empty-state block and the edit panel. Both nodes are created once. An effect, or a `hidden` getter, flips visibility.

## Steps

### 1. There is no Show

Sig's JSX runtime does not include `<Show>`, `<When>`, or `<For>`. A function child is stringified into a text node. `{open.get() && <Panel />}` is not a pattern here. The [Sig status page](../../sigjs/sig-status.md) lists `<Show>` as not present.

Two tools you do have:

- `hidden={() => condition}` on an element that stays mounted. The runtime wraps that getter in `effect` and assigns the DOM property `hidden`.
- an `effect` you write, when one read should update more than one node.

`EmptyState` uses the second so you can see the effect. The row uses both.

### 2. Empty state

`apps/todo/front/src/EmptyState.tsx`:

```tsx
import { effect } from "@citrusworx/sigjs";
import type { Sig, Todo } from "./types";

/**
 * Sig has no Show / when helper. This effect writes `hidden` on a node
 * that stays mounted. `hidden={() => ...}` is the same subscription.
 */
export function EmptyState(props: { todos: Sig<Todo[]>; phase: Sig<"loading" | "ready"> }) {
  let note!: HTMLDivElement;

  const node = (
    <div data-empty stack gap="1" padding="cozy" ref={(el) => { note = el as HTMLDivElement; }} hidden>
      <p>Nothing on the list yet. Add a task above.</p>
    </div>
  );

  effect(() => {
    const show = props.phase.get() === "ready" && props.todos.get().length === 0;
    note.hidden = !show;
  });

  return node;
}
```

Order matters. The ref runs while the JSX expression evaluates, so `note` is assigned before `effect` runs. The effect runs immediately, not on a later tick. `phase` starts as `"loading"`, so the block stays hidden during the fetch and appears only when the fetch finished and the list is empty. `data-empty`, `stack`, `gap="1"`, and `padding="cozy"` are the Juice shell from lesson 07. The effect does not know about them.

Read every signal you care about on every run. If you put `todos.get()` inside an `if` that is sometimes false, the effect will not subscribe to `todos` on that run and a later `set` will not wake it. This effect reads `phase` and `todos` before the `&&` result is used... it reads `phase` first, then `todos` only when phase is `"ready"`. On the loading run it does **not** read `todos`. That is safe here because `phase.set("ready")` happens after `todos.set` in the same `finally`, and `phase` is always read, so the effect re-runs when loading finishes and then subscribes to `todos`. If you reordered those reads, the empty message could stick. The comment in your head should be: read the signal that gates the effect unconditionally.

The loading line in `App` is the getter form of the same idea:

```tsx
      <p hidden={() => phase.get() !== "loading"}>Loading todos…</p>
```

### 3. Edit panel

`TodoRow` keeps the title view and the editor mounted together. The effect at the bottom of the component:

```tsx
  effect(() => {
    const todo = props.item.get();
    const isEditing = editing.get();
    titleText.style.textDecoration = todo.done ? "line-through" : "";
    titleText.style.color = todo.done ? "var(--tide-text-muted)" : "";
    saved.hidden = isEditing;
    editor.hidden = !isEditing;
    if (!isEditing) {
      return;
    }
    titleInput.value = todo.title;
    notesInput.value = todo.notes;
  });
```

`editing` is a signal created inside the row function. It lives as long as that row's DOM node. `bindList` disposes the row's effects when the id leaves the list.

The Edit button uses the getter form so it disappears while you edit:

```tsx
            <button type="button" btn="outline" hidden={() => editing.get()} onClick={() => editing.set(true)}>
              Edit
            </button>
```

The notes paragraph hides itself while editing, and also when there is nothing to say:

```tsx
        <p data-notes hidden={() => editing.get() || props.item.get().notes.length === 0}>
          {() => props.item.get().notes}
        </p>
```

The input values are copied when editing becomes true. They are not function props. A `value={() => ...}` getter would write the value on every keystroke's parent update and fight the cursor. Uncontrolled inputs, filled by the effect when you enter edit mode, stay still while you type.

## Checkpoint

1. Delete every todo. The sentence "Nothing on the list yet" appears, and it was not a second page load.
2. Add one with notes. Click Edit. The title text hides, the inputs show, and they already contain the current title and notes. Cancel restores the text without a request. Save sends the PATCH from lesson 06.
3. In devtools, the editor `<div>` is still in the document while you are not editing. Its `hidden` property is true.

## What's happening

`hidden` is a DOM boolean. The nodes, their listeners, and their effects stay. That is cheaper to reason about than rebuilding, and it is the pattern Sig's own docs use for disclosure.

The browser's own `[hidden]` rule is user-agent CSS. Juice's `:where([stack])` and `button { display: inline-flex }` are author CSS, so they win, and a node with `hidden === true` can still paint. `todo.css` puts `display: none` back on `[data-todo] [hidden]`. Lesson 07 quotes that rule. After it, the empty block, the editor, and the Edit button actually leave the screen.

`bindList` still owns structural change: a row that should not exist is removed, not hidden. Hide is for modes of a row that exists. Remove is for an id that left the array.

## Gap

**No `<Show>`.** Coming soon would be a component that mounts and disposes a child. It is not in `@citrusworx/sigjs` 0.7.0. Do not import one from React. The JSX runtime will not reconcile it.

**The empty-state effect's read order is part of the contract.** An effect subscribes only to signals it actually read on that run. The loading gate is why `phase.get()` is first and always.

## Next

[09 — Production build and config](./09-production.md)
