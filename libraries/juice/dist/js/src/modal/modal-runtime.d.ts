/**
 * DOM-first dialog runtime for Juice modal chrome.
 *
 * Markup contract:
 *   [modal-overlay][hidden] > [modal role="dialog"] + [modal-close]
 * Closed vs open is the native `hidden` attribute on the overlay.
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
export type ModalController = {
    destroy: () => void;
    sync: () => void;
    open: (target?: HTMLElement | null) => void;
    close: (target?: HTMLElement | null) => void;
    toggle: (target?: HTMLElement | null) => void;
};
export declare const createModal: (options?: ModalOptions) => ModalController;
export declare const initModal: (options?: ModalOptions) => ModalController;
export declare const startModalRuntime: () => ModalController | null;
export declare const stopModalRuntime: () => void;
