/**
 * DOM-first runtime for Juice native textarea chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [textarea]        host, on the native element: <textarea textarea>.
 *                     Any attribute value is still a textarea. Sync does
 *                     not rewrite the attribute. A node that is not a
 *                     <textarea> is ignored. A <textarea> without
 *                     [textarea] is ignored. A textarea inside [combobox],
 *                     including [combobox-input], is ignored.
 *   [textarea-label]  optional visible label. Pair it with the control
 *                     (wrapping element, or for/id).
 *
 * Sync (markup-driven):
 *   1. Name the control from a visible label when the author has not
 *      set an accessible name. Sources, in order: an associated
 *      <label for>, a wrapping <label>, then [textarea-label] (for/id,
 *      a wrapping element, or the nearest preceding sibling).
 *   2. An author aria-label or aria-labelledby is kept. A blank value
 *      is not a name. title is left untouched and does not block a
 *      visible label.
 *   3. A label that does not contain the control is referenced with
 *      aria-labelledby (an id is added only when that label has none).
 *      A wrapping label is copied into aria-label as its visible text,
 *      excluding the control, so the textarea's own value is not part
 *      of the name. Hidden labels and empty text are skipped.
 *   4. When no visible label exists, sync does not invent a name.
 *      A name this runtime wrote is removed if that label goes away
 *      or the host stops being a [textarea] textarea.
 *
 * Typing, change, and keys stay on the native control. There is no
 * auto-grow, no character count, no validation engine, no floating
 * label, no keyboard handler, no Escape handler, no focus trap, and
 * no Sig Textarea factory.
 *
 * Limitations: auto-grow, a character count, validation, a floating
 * label, keyboard handling, Escape, a focus trap, and a Sig Textarea
 * factory are out of scope. Runtime docs are later.
 */
export type TextareaOptions = {
    root?: ParentNode;
    textareaSelector?: string;
};
export type TextareaController = {
    destroy: () => void;
    sync: () => void;
};
export declare const createTextarea: (options?: TextareaOptions) => TextareaController;
export declare const initTextarea: (options?: TextareaOptions) => TextareaController;
export declare const startTextareaRuntime: () => TextareaController | null;
export declare const stopTextareaRuntime: () => void;
