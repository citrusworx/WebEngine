export type FocusTarget = "ingredients" | "steps";

let pending: FocusTarget | null = null;

export function armFocus(target: FocusTarget) {
  pending = target;
}

export function peekFocus(): FocusTarget | null {
  return pending;
}

export function takeFocus(): FocusTarget | null {
  const value = pending;
  pending = null;
  return value;
}
