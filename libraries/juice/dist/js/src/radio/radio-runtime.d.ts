/**
 * DOM-first APG Radio Group runtime for Juice radio chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [radiogroup] is the group root (layout only — no group chrome).
 *   [radio] is one option. Primary host is
 *   <button type="button" radio> inside the group. Visible labels live
 *   beside the control (wrapping <label>, aria-label, or
 *   aria-labelledby) — the host *is* the disc. The dot is a CSS
 *   pseudo-element; there is no [radio-dot] child.
 *
 * Hosts this runtime enhances:
 *   - [radiogroup] roots. Sync fills role="radiogroup". Authors supply
 *     the group's accessible name. Radios outside a [radiogroup] are
 *     ignored (no solo exclusive group).
 *   - HTMLButtonElement [radio] descendants (primary). Sync fills
 *     role="radio", aria-checked "true"|"false", type="button" when
 *     type is missing, and a roving tabindex (one tab stop per group).
 *   - HTMLInputElement type="radio" (secondary). Chrome already paints
 *     :checked. Sync keeps aria-checked in lockstep with the native
 *     checked property. Exclusivity is the [radiogroup], not only the
 *     input name.
 *
 * Other [radio] hosts (div, span, text inputs, checkboxes) are ignored.
 * A radio belongs to its nearest [radiogroup]. Do not invent accessible
 * names.
 *
 * v1 is exclusive and binary. aria-checked="mixed" coerces to "false".
 * When more than one radio is checked, sync keeps the first in document
 * order. Zero checked is allowed until something is selected. There is
 * no focus trap and no Escape handling (not a layered overlay).
 *
 * Click, Enter, and Space select the targeted radio. Arrow keys move
 * the selection among enabled radios in the group and wrap, skipping
 * disabled / aria-disabled radios. Native disabled or aria-disabled="true"
 * is ignored.
 */
export type RadioOptions = {
    root?: ParentNode;
    radiogroupSelector?: string;
    radioSelector?: string;
};
export type RadioController = {
    destroy: () => void;
    sync: () => void;
    select: (radio?: HTMLElement | null) => void;
    getChecked: (group?: HTMLElement | null) => HTMLElement | null;
};
export declare const createRadio: (options?: RadioOptions) => RadioController;
export declare const initRadio: (options?: RadioOptions) => RadioController;
export declare const startRadioRuntime: () => RadioController | null;
export declare const stopRadioRuntime: () => void;
