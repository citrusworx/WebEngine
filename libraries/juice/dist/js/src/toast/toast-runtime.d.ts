/**
 * DOM-first toast / snackbar runtime for Juice toast chrome.
 *
 * Markup contract (authors place the region — this is not a portal):
 *   [toast-region] > [toast] + [toast-title]? + [toast-body]? + [toast-close]?
 * Individual toasts use native `hidden` when dismissed. The region stays in the DOM.
 *
 * Toast is NOT a dialog:
 *   - no focus trap, no aria-modal, no exclusive "one toast only"
 *   - stacking is the point; show() never hides siblings
 *   - do not move focus into the toast on show (disruptive)
 *
 * Duration:
 *   - createToast({ defaultDuration: 5000 }) — ms before auto-dismiss
 *   - Per-toast override: toast-duration="3000"
 *   - Sticky: toast-duration="0", toast-duration="Infinity", or a negative number
 *   - defaultDuration of 0 / Infinity / negative also means no auto-dismiss
 *
 * Auto-dismiss pauses while pointer or focus is inside the toast, then resumes.
 *
 * Escape dismisses the most recently shown visible toast, but only when no
 * open [modal-overlay] or [drawer-overlay] exists (those dialogs own Escape).
 *
 * Live region: sync fills missing aria-live="polite" and
 * aria-relevant="additions" on [toast-region]. Opt into assertive with
 * aria-live="assertive" or toast-live="assertive" on the region or toast.
 * role="status" for polite; role="alert" for toast="error" or assertive.
 */
export type ToastOptions = {
    root?: ParentNode;
    regionSelector?: string;
    toastSelector?: string;
    closeSelector?: string;
    defaultDuration?: number;
};
export type ToastController = {
    destroy: () => void;
    sync: () => void;
    show: (target?: HTMLElement | null) => void;
    dismiss: (target?: HTMLElement | null) => void;
};
export declare const createToast: (options?: ToastOptions) => ToastController;
export declare const initToast: (options?: ToastOptions) => ToastController;
export declare const startToastRuntime: () => ToastController | null;
export declare const stopToastRuntime: () => void;
