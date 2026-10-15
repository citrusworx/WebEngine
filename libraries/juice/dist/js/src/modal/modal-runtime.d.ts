/**
 * DOM-first dialog runtime for Juice modal chrome.
 *
 * Markup contract:
 *   [modal-overlay][hidden] > [modal role="dialog"] + [modal-close]
 * Closed vs open is the native `hidden` attribute on the overlay.
 * Enter removes `hidden`, then plays. Exit plays first; `hidden` is set
 * only after it finishes. Focus moves in when `hidden` is removed and
 * restores when `hidden` is set. Reduced motion (or a zero computed
 * duration) does both in the same turn. An in-flight exit stays the open
 * dialog for Escape and the focus trap until that commit, and a new open
 * cancels it.
 *
 * Openers: any element whose `aria-controls` token list includes a
 * `[modal-overlay]` id. `[modal-close]` closes the containing overlay.
 * Backdrop click closes unless `modal-overlay="static"` or
 * `closeOnBackdrop` is false.
 */
export type ModalOptions = {
    root?: ParentNode;
    overlaySelector?: string;
    dialogSelector?: string;
    closeSelector?: string;
    closeOnBackdrop?: boolean;
};
export type ModalState = {
    open: boolean;
};
export type ModalController = {
    destroy: () => void;
    sync: () => void;
    open: (target?: HTMLElement | null) => void;
    close: (target?: HTMLElement | null) => void;
    toggle: (target?: HTMLElement | null) => void;
    isOpen: (target?: HTMLElement | null) => boolean;
    getState: (target?: HTMLElement | null) => ModalState | null;
};
export declare const createModal: (options?: ModalOptions) => ModalController;
export declare const initModal: (options?: ModalOptions) => ModalController;
export declare const startModalRuntime: () => ModalController | null;
export declare const stopModalRuntime: () => void;
