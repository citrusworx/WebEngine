import { Signal, effect } from "@citrusworx/sigjs";
import { deleteTodo, listTodos, updateTodo } from "./api";
import { removeTodo, replaceTodo } from "./list-state";
import type { Sig, Todo } from "./types";

export function TodoRow(props: {
  item: { get(): Todo };
  todos: Sig<Todo[]>;
  error: Sig<string>;
}) {
  const editing = Signal(false);
  let box!: HTMLInputElement;
  let titleText!: HTMLSpanElement;
  let titleInput!: HTMLInputElement;
  let notesInput!: HTMLTextAreaElement;
  let saved!: HTMLDivElement;
  let editor!: HTMLDivElement;

  const node = (
    <li data-row>
      <div stack gap="0.75">
        <div row gap="1" space="between" data-inline>
          <label row gap="0.75" data-inline>
            <input
              checkbox
              type="checkbox"
              aria-label="Done"
              ref={(el) => { box = el as HTMLInputElement; }}
              checked={() => props.item.get().done}
              onChange={() => { void toggle(); }}
            />
            <span data-title ref={(el) => { titleText = el as HTMLSpanElement; }}>
              {() => props.item.get().title}
            </span>
          </label>
          <div row gap="0.5" data-inline>
            <button type="button" btn="outline" hidden={() => editing.get()} onClick={() => editing.set(true)}>
              Edit
            </button>
            <button type="button" btn="outline" onClick={() => { void remove(); }}>
              Delete
            </button>
          </div>
        </div>
        <p data-notes hidden={() => editing.get() || props.item.get().notes.length === 0}>
          {() => props.item.get().notes}
        </p>
        <div data-meta stack ref={(el) => { saved = el as HTMLDivElement; }}>
          <small>{() => {
            const created = props.item.get().created_at;
            if (!created) return "";
            const date = new Date(created);
            if (Number.isNaN(date.getTime())) return `Saved ${created}`;
            return `Saved ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
          }}</small>
        </div>
        <div stack gap="1" hidden ref={(el) => { editor = el as HTMLDivElement; }}>
          <label field stack gap="0.5">
            <span field-label>Title</span>
            <input input type="text" ref={(el) => { titleInput = el as HTMLInputElement; }} />
          </label>
          <label field stack gap="0.5">
            <span field-label>Notes</span>
            <textarea textarea rows={3} ref={(el) => { notesInput = el as HTMLTextAreaElement; }}></textarea>
          </label>
          <div row gap="0.5" data-inline>
            <button data-primary type="button" btn="flat" onClick={() => { void save(); }}>Save</button>
            <button type="button" btn="outline" onClick={() => editing.set(false)}>Cancel</button>
          </div>
        </div>
      </div>
    </li>
  );

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

  return node;

  async function toggle() {
    const current = props.item.get();
    const next: Todo = { ...current, done: !current.done };
    try {
      await updateTodo(next);
      replaceTodo(props.todos, next);
      props.error.set("");
      props.todos.set(await listTodos());
    } catch (err) {
      props.error.set(err instanceof Error ? err.message : "Could not update the todo");
    } finally {
      box.checked = props.item.get().done;
    }
  }

  async function save() {
    const current = props.item.get();
    const next: Todo = {
      ...current,
      title: titleInput.value.trim(),
      notes: notesInput.value.trim(),
    };
    if (!next.title) {
      props.error.set("Title is required.");
      return;
    }
    try {
      await updateTodo(next);
      editing.set(false);
      replaceTodo(props.todos, next);
      props.error.set("");
      props.todos.set(await listTodos());
    } catch (err) {
      props.error.set(err instanceof Error ? err.message : "Could not update the todo");
    }
  }

  async function remove() {
    const id = props.item.get().id;
    try {
      await deleteTodo(id);
      removeTodo(props.todos, id);
      props.error.set("");
      props.todos.set(await listTodos());
    } catch (err) {
      props.error.set(err instanceof Error ? err.message : "Could not delete the todo");
    }
  }
}
