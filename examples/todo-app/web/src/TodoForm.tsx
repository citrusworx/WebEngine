import { Signal, effect } from "@citrusworx/sigjs";
import { createTodo, listTodos } from "./api";
import type { Sig, Todo } from "./types";

export function TodoForm(props: { todos: Sig<Todo[]>; error: Sig<string> }) {
  const notice = Signal("");
  let form!: HTMLFormElement;
  let message!: HTMLParagraphElement;

  const node = (
    <form
      stack
      gap="1"
      ref={(el) => { form = el as HTMLFormElement; }}
      onSubmit={(event: Event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <label field stack gap="0.5">
        <span field-label>Title</span>
        <input input name="title" type="text" required autocomplete="off" placeholder="What needs doing?" />
      </label>
      <label field stack gap="0.5">
        <span field-label>Notes</span>
        <textarea textarea name="notes" rows={3} placeholder="Optional details"></textarea>
      </label>
      <p data-error ref={(el) => { message = el as HTMLParagraphElement; }} hidden></p>
      <div row space="end" data-inline>
        <button data-primary type="submit" btn="flat">Add todo</button>
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

    try {
      const created = await createTodo({ title, notes, done: false });
      // POST returns the row, including the SERIAL id and created_at.
      props.todos.set([created, ...props.todos.get().filter((row) => row.id !== created.id)]);
      form.reset();
      notice.set("");
      props.error.set("");
      props.todos.set(await listTodos());
    } catch (err) {
      notice.set(err instanceof Error ? err.message : "Could not add the todo");
    }
  }
}
