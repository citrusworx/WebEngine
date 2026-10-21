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
