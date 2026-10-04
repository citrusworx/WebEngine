/**
 * DOM-first indeterminate busy-indicator runtime for Juice spinner chrome.
 *
 * Markup contract (Slice A — do not rename attrs):
 *   [spinner]        host. The ring is ::before. CSS owns the spin
 *                    (juice-spinner-spin). prefers-reduced-motion already
 *                    stops that animation. Any attribute value, including
 *                    spinner="busy", is still a spinner. Sync does not
 *                    rewrite the attribute. There is no <spinner> element.
 *                    A node without [spinner] is ignored.
 *   [spinner-label]  optional visible text, usually inside the host.
 *                    Authors own the accessible name. The label is not
 *                    copied into aria-label or aria-labelledby.
 *
 * Sync (markup-driven):
 *   1. Shown means the host does not have the native hidden attribute.
 *      While shown, role="status" and aria-busy="true". An author role
 *      that is not status is replaced. The host is not made focusable
 *      (no tabindex). There is no keyboard and no pointer handler.
 *   2. Hidden means native hidden. hide() sets that attribute and clears
 *      role="status" and aria-busy so the spinner does not announce as
 *      busy. show() removes hidden and restores the shown state.
 *      Siblings are left alone.
 *   3. When there is no visible [spinner-label], authors supply the
 *      accessible name (aria-label or aria-labelledby). This runtime
 *      does not invent label text, and it does not rewrite a name the
 *      author already set.
 *
 * Not a progress bar: no value, no aria-valuenow, no
 * --juice-progress-ratio. Not a layered overlay: no focus trap, no
 * Escape, no Sig Spinner factory.
 *
 * Limitations: full runtime docs are a later slice.
 */
export type SpinnerOptions = {
    root?: ParentNode;
    spinnerSelector?: string;
};
export type SpinnerController = {
    destroy: () => void;
    sync: () => void;
    show: (target?: HTMLElement | null) => void;
    hide: (target?: HTMLElement | null) => void;
    isShown: (target?: HTMLElement | null) => boolean;
};
export declare const createSpinner: (options?: SpinnerOptions) => SpinnerController;
export declare const initSpinner: (options?: SpinnerOptions) => SpinnerController;
export declare const startSpinnerRuntime: () => SpinnerController | null;
export declare const stopSpinnerRuntime: () => void;
