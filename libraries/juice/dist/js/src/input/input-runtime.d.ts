/**
 * DOM-first runtime for Juice native text-input chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [input]        host, on the native element: <input input>.
 *                  Text-like types only: missing type, empty type,
 *                  text, email, password, search, tel, url, and
 *                  number. Any attribute value is still an input.
 *                  Sync does not rewrite the attribute. A node that
 *                  is not an <input> is ignored. An <input> without
 *                  [input] is ignored. Checkbox, radio, range, file,
 *                  date, time, datetime-local, month, week, color,
 *                  hidden, button, submit, reset, and image are
 *                  ignored. An input inside [combobox], including
 *                  [combobox-input], is ignored.
 *   [input-label]  optional visible label. Pair it with the control
 *                  (wrapping element, or for/id).
 *
 * Sync (markup-driven):
 *   1. Name the control from a visible label when the author has not
 *      set an accessible name. Sources, in order: an associated
 *      <label for>, a wrapping <label>, then [input-label] (for/id,
 *      a wrapping element, or the nearest preceding sibling).
 *   2. An author aria-label or aria-labelledby is kept. A blank value
 *      is not a name. title is left untouched and does not block a
 *      visible label.
 *   3. A label that does not contain the control is referenced with
 *      aria-labelledby (an id is added only when that label has none).
 *      A wrapping label is copied into aria-label as its visible text,
 *      excluding the control, so the input's own value is not part of
 *      the name. Hidden labels and empty text are skipped.
 *   4. When no visible label exists, sync does not invent a name.
 *      A name this runtime wrote is removed if that label goes away
 *      or the host stops being a text-like [input].
 *
 * Typing, change, and keys stay on the native control. There is no
 * mask, no validation engine, no floating label, no keyboard handler,
 * no Escape handler, no focus trap, and no Sig Input factory.
 *
 * Limitations: a mask, validation, a floating label, keyboard
 * handling, Escape, a focus trap, and a Sig Input factory are out of
 * scope. Runtime docs are later.
 */
export type InputOptions = {
    root?: ParentNode;
    inputSelector?: string;
};
export type InputController = {
    destroy: () => void;
    sync: () => void;
};
export declare const createInput: (options?: InputOptions) => InputController;
export declare const initInput: (options?: InputOptions) => InputController;
export declare const startInputRuntime: () => InputController | null;
export declare const stopInputRuntime: () => void;
