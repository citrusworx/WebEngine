import { Signal } from "@citrusworx/sigjs";
import { listTodos } from "./api";
import { EmptyState } from "./EmptyState";
import { TodoForm } from "./TodoForm";
import { TodoList } from "./TodoList";
import type { Todo } from "./types";

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

  return (
    <main container narrow stack gap="2" padding="comfortable" data-todo>
      <section tide-card stack gap="2" padding="comfortable">
        <header stack gap="1">
          <h1 fontSize="xl">ToDo</h1>
          <p>{() => `${todos.get().length} on the list`}</p>
        </header>
        <p hidden={() => phase.get() !== "loading"}>Loading todos…</p>
        <p data-error hidden={() => error.get().length === 0}>{() => error.get()}</p>
        <TodoForm todos={todos} error={error} />
        <EmptyState todos={todos} phase={phase} />
        <TodoList todos={todos} error={error} />
      </section>
    </main>
  );
}
