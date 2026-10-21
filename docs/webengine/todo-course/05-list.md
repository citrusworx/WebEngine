# 05 — State with signals, and the list

[Previous](./04-shell.md) · [Course](./README.md) · [Next](./06-mutations.md)

**Goal:** keep the todos in a signal, render one row per id with `bindList`, and update text without rebuilding the page.

## What you'll build

`App` loads the list. `TodoList` binds it. The row component is lesson 06 and lesson 08. Here you learn why the list is a signal and why the `<ul>` is otherwise empty.

## Steps

### 1. The value you store

`apps/todo/front/src/types.ts`:

```ts
export type Todo = {
  id: string;
  title: string;
  notes: string;
  done: boolean;
  created_at?: string;
};

/** What POST, PATCH, and DELETE return. Not the row, and not status 201. */
export type WriteAck = {
  ok: true;
  rowCount: number;
};

export type Sig<T> = { get(): T; set(value: T): void };
```

`created_at` is optional because the object you build in the browser does not have it until a refetch. `WriteAck` is the write response from lesson 06. `Sig` is the shape `Signal()` returns. `Signal` is a function, not a class.

### 2. Load into a signal

The top of `apps/todo/front/src/App.tsx`:

```ts
export function App() {
  const todos = Signal<Todo[]>([]);
  const error = Signal("");
  const phase = Signal<"loading" | "ready">("loading");

  void listTodos()
    .then((rows) => {
      todos.set(rows);
      error.set("");
    })
    .catch((err: unknown) => {
      error.set(err instanceof Error ? err.message : "Could not load todos");
    })
    .finally(() => {
      phase.set("ready");
    });
```

`Signal(value)` returns `{ get, set }`. `get` inside an `effect` or a function child subscribes. `set` notifies every subscriber, even when the next value is the same object identity... it always notifies. There is no equality check. That is the v1 signal.

The fetch is not an effect. It runs once when `App` runs. `set` is what wakes the subscribers. Do not read `todos.get()` inside this `.then` before `set` if you were trying to subscribe. You are writing, not reading.

The count line is a function child. It is the small proof the signal is live:

```tsx
<p>{() => `${todos.get().length} on the list`}</p>
```

Sig turns that function into a text node. The effect inside the JSX runtime writes `textContent` whenever `todos` changes. A function child must return text, a number, or a boolean. It must not return an element. Returning an element stringifies it. That is why there is no `{todos.get().map(...)}` in JSX.

### 3. bindList

`apps/todo/front/src/TodoList.tsx`:

```tsx
import { bindList } from "@citrusworx/sigjs";
import { TodoRow } from "./TodoRow";
import type { Sig, Todo } from "./types";

export function TodoList(props: { todos: Sig<Todo[]>; error: Sig<string> }) {
  return (
    <ul
      stack
      gap="1"
      ref={(el) => {
        bindList(
          el as HTMLElement,
          props.todos,
          (todo) => todo.id,
          (item) => <TodoRow item={item} todos={props.todos} error={props.error} />,
        );
      }}
    />
  );
}
```

`bindList` wants an element that is reserved for rows. The `<ul>` has no static children. One binding per parent. The ref runs once, when the element is created.

Arguments: parent, source, key function, render. The key is `todo.id`. Duplicate ids throw before the DOM changes. Render is called once per key. It receives `item`, a getter for that row, not the raw object. Read `item.get()` from an effect or a function child to update the row in place. A one-shot `item.get()` in render is a snapshot and will go stale.

When `todos.set` replaces the array, `bindList` reuses the DOM node for an id that is still there, creates a node for a new id, and disposes a node whose id left. It does not call render again for an id that stayed.

`stack` and `gap="1"` are Juice. `ul[stack]` also clears the browser's list markers. Lesson 07 says why `gap="1"` and not a word.

## Checkpoint

Reload `http://127.0.0.1:5173`. The count matches the number of rows. Add a todo if the form from the finished app is already on the page (it is, in this repo). The count changes and the new row appears without a full reload.

In the console, you should not see `bindList: parent already has a list`. That error means the ref ran twice on the same element.

## What's happening

`listTodos` in `api.ts` fetches `/api/todos` and maps each JSON object into a `Todo`. `notes: null` from a gapped PATCH becomes `""` in the client so the row can render. The database value is still null until something writes a string. Lesson 06 shows the raw JSON.

`bindList` is the list primitive. There is no `<For>`. `replaceChildren` exists for a cheap full rewrite of a small region. A todo list keeps focus and row-local signals, so it uses keys.

The row's `item` getter is itself a signal `bindList` owns. When the array entry for that id is a new object, `bindList` calls `item.set`. Effects inside `TodoRow` that read `item.get()` run again. The `<li>` stays.

## Gap

**No Show / when, and no JSX map.** Both are the same limit: Sig does not reconcile element trees returned from functions. Text is a function child. Structure is `bindList`, `hidden`, or `replaceChildren`. Lesson 08 is the conditional half.

**Client ids, preview.** `bindList` keys on `id`. Lesson 06 generates that id before POST so the optimistic row and the refetched row share a key and the DOM node can be reused.

## Next

[06 — Create, toggle, edit, delete](./06-mutations.md)
