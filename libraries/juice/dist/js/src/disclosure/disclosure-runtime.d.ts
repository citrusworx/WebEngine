/**
 * DOM-first disclosure runtime for Juice disclosure chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [disclosure]         standalone root. One trigger, one panel.
 *                        Not an accordion and not a stack.
 *   [disclosure-trigger] the button. Expanded state is aria-expanded.
 *   [disclosure-panel]   the controlled region.
 *
 * Pairing: aria-controls inside the root, otherwise the next sibling
 * [disclosure-panel] or the next panel sibling. Orphans outside
 * [disclosure] are ignored. There is no exclusive group and no Sig
 * factory. Accordion markup is not enhanced here.
 *
 * Open/closed state is aria-expanded on the trigger plus native hidden
 * and aria-hidden on the panel. This runtime never writes layout
 * content="active" or content="hidden".
 *
 * Keyboard: click toggles. Enter and Space activate non-button triggers.
 * Escape collapses the focused open disclosure, or the last opened one,
 * and returns focus to that trigger. It yields to an open modal, drawer,
 * or popover (and to an already-handled Escape). There is no global
 * disclosure Escape and no arrow-key roving tabindex.
 *
 * Limitations: full runtime docs are a later slice. Exclusive groups,
 * arrow-key roving tabindex, and a Sig Disclosure factory are out of scope.
 */
export type DisclosureOptions = {
    root?: ParentNode;
    disclosureSelector?: string;
    triggerSelector?: string;
};
export type DisclosureController = {
    destroy: () => void;
    sync: () => void;
    expand: (trigger?: HTMLElement | null) => void;
    collapse: (trigger?: HTMLElement | null) => void;
    toggle: (trigger?: HTMLElement | null) => void;
};
export declare const createDisclosure: (options?: DisclosureOptions) => DisclosureController;
export declare const initDisclosure: (options?: DisclosureOptions) => DisclosureController;
export declare const startDisclosureRuntime: () => DisclosureController | null;
export declare const stopDisclosureRuntime: () => void;
