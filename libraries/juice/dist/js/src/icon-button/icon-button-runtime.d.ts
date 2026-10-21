/**
 * DOM-first runtime for Juice icon-button chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [icon-button]         host. Square control on the existing button
 *                         chrome. Any value, including "round", is still
 *                         an icon button. Sync does not rewrite the
 *                         attribute. [icon-button][round] is the same
 *                         circle option. [scale="sm"|"lg"] stays CSS.
 *   [toggle]              on the host, this control is a pressed toggle.
 *                         Click flips it. Enter and Space flip it only
 *                         when the host is not a native button (and not
 *                         an <a href>, matching the other runtimes'
 *                         native-interactive check). A native <button>
 *                         already turns those keys into a click.
 *   [pressed]             kept in sync with aria-pressed on toggles.
 *                         An initial [pressed] or aria-pressed="true"
 *                         starts pressed. Anything else starts
 *                         aria-pressed="false". Non-toggles are not
 *                         given aria-pressed.
 *
 * Sync (markup-driven):
 *   1. Name check. An accessible name is a non-empty aria-label, an
 *      aria-labelledby that resolves to visible text, or visible text
 *      on the host. Blank values are not names. title is left
 *      untouched and is not a name (same convention as input and
 *      select). SVG subtrees and icon-only content contribute no
 *      text. Hidden and aria-hidden subtrees are skipped. This
 *      runtime does not invent a label.
 *   2. In development (NODE_ENV === "development"), an unnamed host
 *      warns once per element via console.warn. Production and test
 *      stay silent. A name added later does not warn again.
 *   3. Toggles write aria-pressed "true"|"false" and mirror [pressed].
 *      Disabled hosts ([disabled] or aria-disabled="true", including
 *      a native disabled button) still receive the initial value and
 *      do not flip.
 *   4. A non-button toggle gets role="button" and tabindex="0" when
 *      those are missing, so Enter and Space can reach it. An author
 *      role or tabindex is kept. Native buttons and links are left
 *      alone, including type.
 *
 * State is { pressed, disabled, named }. The first observation is
 * recorded and does not dispatch. Later changes dispatch a bubbling
 * juice:change CustomEvent with detail { runtime: "icon-button", state }.
 *
 * Not a switch and not a checkbox. No focus trap, no Escape handler,
 * and no Sig IconButton factory.
 */
export type IconButtonOptions = {
    root?: ParentNode;
    iconButtonSelector?: string;
};
export type IconButtonState = {
    pressed: boolean;
    disabled: boolean;
    named: boolean;
};
export type IconButtonController = {
    destroy: () => void;
    sync: () => void;
    toggle: (target?: HTMLElement | null) => void;
    getState: (target?: HTMLElement | null) => IconButtonState | null;
};
export declare const createIconButton: (options?: IconButtonOptions) => IconButtonController;
export declare const initIconButton: (options?: IconButtonOptions) => IconButtonController;
export declare const startIconButtonRuntime: () => IconButtonController | null;
export declare const stopIconButtonRuntime: () => void;
