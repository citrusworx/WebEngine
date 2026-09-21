/**
 * DOM-first APG Checkbox runtime for Juice checkbox chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [checkbox] on the control host. Primary host is
 *   <button type="button" checkbox>. Visible labels live beside the
 *   control (wrapping <label>, aria-label, or aria-labelledby) — the
 *   host *is* the box. The checkmark is a CSS pseudo-element; there
 *   is no [checkbox-box] child.
 *
 * Hosts this runtime enhances:
 *   - HTMLButtonElement (primary). Sync fills role="checkbox",
 *     aria-checked "true"|"false", and type="button" when type is
 *     missing (so a form does not submit).
 *   - HTMLInputElement type="checkbox" (secondary). Chrome already
 *     paints :checked. Sync fills role="checkbox" and keeps
 *     aria-checked in lockstep with the native checked property
 *     (change events, and a static aria-checked="true" on an
 *     unchecked box is promoted onto .checked so :checked paint
 *     matches). This is not a form-checkbox restyle as the only
 *     story, and it is not menuitemcheckbox or [switch].
 *
 * Other [checkbox] hosts (div, span, text inputs, radios) are ignored.
 * Do not invent accessible names — authors must supply aria-label,
 * aria-labelledby, or visible text.
 *
 * v1 is binary. aria-checked="mixed" and any other value coerce to
 * "false". There is no tri-state, no focus trap, and no Escape
 * handling (not a layered overlay).
 *
 * Click and Enter/Space toggle. Native disabled or aria-disabled="true"
 * is ignored. Button click preventDefault stops accidental submit when
 * type is still the default.
 */
export type CheckboxOptions = {
    root?: ParentNode;
    checkboxSelector?: string;
};
export type CheckboxController = {
    destroy: () => void;
    sync: () => void;
    toggle: (target?: HTMLElement | null) => void;
    check: (target?: HTMLElement | null) => void;
    uncheck: (target?: HTMLElement | null) => void;
    setChecked: (checked: boolean, target?: HTMLElement | null) => void;
    isChecked: (target?: HTMLElement | null) => boolean;
};
export declare const createCheckbox: (options?: CheckboxOptions) => CheckboxController;
export declare const initCheckbox: (options?: CheckboxOptions) => CheckboxController;
export declare const startCheckboxRuntime: () => CheckboxController | null;
export declare const stopCheckboxRuntime: () => void;
