/**
 * DOM-first runtime for Juice field wrappers.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [field]         host wrapper around a control. Any attribute value
 *                   is still a field. Sync does not rewrite the attribute.
 *   [field-label]   chrome only. This runtime does not name the control.
 *                   Naming stays with the input, textarea, and select
 *                   runtimes.
 *   [field-help]    optional help text.
 *   [field-error]   optional error text.
 *   [field][invalid] wrapper invalid state. Paints in CSS. This runtime
 *                   mirrors it onto the control when the author has not
 *                   set aria-invalid.
 *
 * Sync (markup-driven):
 *   1. Find the control: the first input, textarea, or select inside
 *      the field that is not inside a nested field. A button, a nested
 *      field's control, and a field with no control are skipped.
 *   2. When the author has not set aria-describedby, point it at the
 *      visible [field-help] and [field-error] in that field, in
 *      document order. Nested fields keep their own parts. Give a part
 *      an id only when it lacks one. Hidden parts and empty text are
 *      skipped. An author aria-describedby is kept. A blank value is
 *      not a description.
 *   3. [field][invalid] sets aria-invalid="true" on the control when
 *      the author has not set aria-invalid. A blank value is not set.
 *      Clearing [invalid] removes only an aria-invalid this runtime
 *      wrote.
 *   4. Anything this runtime wrote (aria-describedby, aria-invalid, or
 *      an id on a help or error part) is removed when its source goes
 *      away, or on destroy. An author value is left in place.
 *
 * Typing, change, and keys stay on the native control. There is no
 * validation engine, no floating label, no keyboard handler, no
 * Escape handler, no focus trap, and no Sig Field factory.
 *
 * Limitations: validation, a floating label, keyboard handling,
 * Escape, a focus trap, naming, and a Sig Field factory are out of
 * scope. [field-label] is chrome only.
 */
export type FieldOptions = {
    root?: ParentNode;
    fieldSelector?: string;
};
export type FieldController = {
    destroy: () => void;
    sync: () => void;
};
export declare const createField: (options?: FieldOptions) => FieldController;
export declare const initField: (options?: FieldOptions) => FieldController;
export declare const startFieldRuntime: () => FieldController | null;
export declare const stopFieldRuntime: () => void;
