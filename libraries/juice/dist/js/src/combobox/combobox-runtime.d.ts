/**
 * DOM-first combobox runtime for Juice combobox chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [combobox] > [combobox-input] + [combobox-trigger]? +
 *   [combobox-list] > [combobox-option]+
 * Closed vs open is the native `hidden` attribute on [combobox-list].
 *
 * This is an editable combobox with a listbox popup (APG list
 * autocomplete, manual selection). It is not a native <select>
 * polyfill, not a popover, not a tooltip, and not a dialog overlay.
 * Single-select only. No async/remote fetch, no creatable options,
 * no multi-select, no Floating UI.
 *
 * Accessibility (honest v1):
 *   [combobox-input]  role="combobox" aria-autocomplete="list"
 *                     aria-expanded aria-controls aria-activedescendant
 *   [combobox-list]   role="listbox"
 *   [combobox-option] role="option" + guaranteed id on sync
 * Focus stays on the input. Visual focus on options is
 * `aria-activedescendant` plus `combobox-option="active"` paint.
 * Committed choice is `aria-selected="true"`.
 *
 * Open on input focus, typing, or trigger click. Close on Escape,
 * outside click, blur (option mousedown preventDefault so the input
 * keeps focus through click-to-select), or after select.
 *
 * Filter: case-insensitive substring against option text and, when
 * present, `data-value`. Non-matches get `hidden` on the option.
 * An empty match set stays open with no visible options.
 *
 * Keyboard (list autocomplete, manual selection):
 *   ArrowDown / ArrowUp  open if needed; move active among visible
 *                        options (no wrap)
 *   Home / End           first / last visible option while open
 *                        (closed: native input cursor)
 *   Enter                select the active option
 *   Escape               close
 *   Tab                  close without committing the active option
 *                        (APG manual selection). Focus moves on.
 *
 * Select: input value becomes option text, or `data-value` when that
 * attribute is present. Chosen option gets `aria-selected="true"` and
 * `combobox-option="active"`; others are cleared. List closes.
 *
 * Trigger toggles the list. `aria-expanded` is written on the input
 * and, when present, the trigger. Opening one managed combobox closes
 * the others. Placement stays CSS (`[combobox-list]` is absolute
 * under the field at z-index 1050).
 */
export type ComboboxOptions = {
    root?: ParentNode;
    rootSelector?: string;
    inputSelector?: string;
    triggerSelector?: string;
    listSelector?: string;
    optionSelector?: string;
};
export type ComboboxController = {
    destroy: () => void;
    sync: () => void;
    open: (target?: HTMLElement | null) => void;
    close: (target?: HTMLElement | null) => void;
    toggle: (target?: HTMLElement | null) => void;
    select: (target?: HTMLElement | null) => void;
};
export declare const createCombobox: (options?: ComboboxOptions) => ComboboxController;
export declare const initCombobox: (options?: ComboboxOptions) => ComboboxController;
export declare const startComboboxRuntime: () => ComboboxController | null;
export declare const stopComboboxRuntime: () => void;
