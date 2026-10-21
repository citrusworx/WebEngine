import { Signal, effect } from "@citrusworx/sigjs";
import { createTodo, listTodos } from "./api";
import type { Sig, Todo } from "./types";

export function TodoForm(props: { todos: Sig<Todo[]>; error: Sig<string> }) {
  const notice = Signal("");
  let form!: HTMLFormElement;
  let message!: HTMLParagraphElement;

  const node = (
    <form
      panel
      stack
      gap="1"
      bgColor="white-100"
      ref={(el) => { form = el as HTMLFormElement; }}
      onSubmit={(event: Event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <label field stack gap="1">
        <span field-label>Title</span>
        <input name="title" type="text" required autocomplete="off" />
      </label>
      <label field stack gap="1">
        <span field-label>Notes</span>
        <textarea name="notes" rows={3}></textarea>
      </label>
      <p ref={(el) => { message = el as HTMLParagraphElement; }} hidden></p>
      <div row>
        <button type="submit" btn="flat">Add todo</button>
      </div>
    </form>
  );

  effect(() => {
    const text = notice.get();
    message.hidden = text.length === 0;
    message.textContent = text;
  });

  return node;

  async function submit() {
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const notes = String(data.get("notes") ?? "").trim();
    if (!title) {
      notice.set("Title is required.");
      return;
    }

    const todo: Todo = {
      id: crypto.randomUUID(),
      title,
      notes,
      done: false,
    };

    try {
      const ack = await createTodo(todo);
      if (ack.rowCount < 1) {
        notice.set("The API did not store a row.");
        return;
      }
      // POST does not return the row. Keep this object, then refetch.
      props.todos.set([todo, ...props.todos.get().filter((row) => row.id !== todo.id)]);
      form.reset();
      notice.set("");
      props.error.set("");
      props.todos.set(await listTodos());
    } catch (err) {
      notice.set(err instanceof Error ? err.message : "Could not add the todo");
    }
  }
}
