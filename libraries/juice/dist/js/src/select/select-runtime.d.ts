/**
 * DOM-first runtime for Juice native select chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [select]        host, on the native element: <select select>.
 *                   Any attribute value is still a select. Sync does
 *                   not rewrite the attribute. A node that is not a
 *                   <select>, including [combobox], is ignored. A
 *                   <select> without [select] is ignored.
 *   [select-label]  optional visible label. Pair it with the control
 *                   (wrapping element, or for/id).
 *
 * The open list stays the platform popup. There is no [select-list]
 * and no [select-option]. [multiple] and size listboxes stay native
 * <select> elements. Sync does not set role, aria-expanded,
 * aria-multiselectable, or tabindex, and it does not build a listbox.
 *
 * Sync (markup-driven):
 *   1. Name the control from a visible label when the author has not
 *      set an accessible name. Sources, in order: an associated
 *      <label for>, a wrapping <label>, then [select-label] (for/id,
 *      a wrapping element, or the nearest preceding sibling).
 *   2. An author aria-label or aria-labelledby is kept. A blank value
 *      is not a name. title is left untouched and does not block a
 *      visible label.
 *   3. A label that does not contain the control is referenced with
 *      aria-labelledby (an id is added only when that label has none).
 *      A wrapping label is copied into aria-label as its visible text,
 *      excluding the control, so the selected option is not part of
 *      the name. Hidden labels and empty text are skipped.
 *   4. When no visible label exists, sync does not invent a name.
 *      A name this runtime wrote is removed if that label goes away.
 *
 * Change and keys stay on the native control. There is no keyboard
 * handler, no Escape handler, no focus trap, and no Sig Select factory.
 */
export type SelectOptions = {
    root?: ParentNode;
    selectSelector?: string;
};
export type SelectController = {
    destroy: () => void;
    sync: () => void;
};
export declare const createSelect: (options?: SelectOptions) => SelectController;
export declare const initSelect: (options?: SelectOptions) => SelectController;
export declare const startSelectRuntime: () => SelectController | null;
export declare const stopSelectRuntime: () => void;
