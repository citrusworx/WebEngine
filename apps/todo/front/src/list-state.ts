import type { Sig, Todo } from "./types";

export function replaceTodo(todos: Sig<Todo[]>, next: Todo) {
  todos.set(todos.get().map((row) => (row.id === next.id ? next : row)));
}

export function removeTodo(todos: Sig<Todo[]>, id: string) {
  todos.set(todos.get().filter((row) => row.id !== id));
}
