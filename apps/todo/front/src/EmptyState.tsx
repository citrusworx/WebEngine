import { effect } from "@citrusworx/sigjs";
import type { Sig, Todo } from "./types";

/**
 * Sig has no Show / when helper. This effect writes `hidden` on a node
 * that stays mounted. `hidden={() => ...}` is the same subscription.
 */
export function EmptyState(props: { todos: Sig<Todo[]>; phase: Sig<"loading" | "ready"> }) {
  let note!: HTMLParagraphElement;

  const node = (
    <p ref={(el) => { note = el as HTMLParagraphElement; }} hidden>
      Nothing on the list yet. Add a task above.
    </p>
  );

  effect(() => {
    const show = props.phase.get() === "ready" && props.todos.get().length === 0;
    note.hidden = !show;
  });

  return node;
}
