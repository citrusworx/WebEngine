/**
 * DOM-first dialog runtime for Juice drawer chrome.
 *
 * Markup contract:
 *   [drawer-overlay][hidden] > [drawer role="dialog"] + [drawer-close]
 * Closed vs open is the native `hidden` attribute on the overlay.
 * Enter removes `hidden`, then plays. Exit plays first; `hidden` is set
 * only after it finishes. Focus moves in when `hidden` is removed and
 * restores when `hidden` is set. Reduced motion (or a zero computed
 * duration) does both in the same turn. An in-flight exit stays on the
 * layer stack for Escape and the focus trap until that commit, and a new
 * open cancels it. Escape and backdrop presses follow open order on the
 * internal layer stack. This runtime does not handle Escape itself, so a
 * defaultPrevented Escape never closes the dialog. Tab and focus-in trap
 * only when this overlay is the top modal layer. Focus return stays here.
 *
 * Openers: any element whose `aria-controls` token list includes a
 * `[drawer-overlay]` id. `[drawer-close]` closes the containing overlay.
 * Backdrop click closes unless `drawer-overlay="static"` or
 * `closeOnBackdrop` is false.
 */
export type DrawerOptions = {
    root?: ParentNode;
    overlaySelector?: string;
    dialogSelector?: string;
    closeSelector?: string;
    closeOnBackdrop?: boolean;
};
export type DrawerState = {
    open: boolean;
};
export type DrawerController = {
    destroy: () => void;
    sync: () => void;
    open: (target?: HTMLElement | null) => void;
    close: (target?: HTMLElement | null) => void;
    toggle: (target?: HTMLElement | null) => void;
    isOpen: (target?: HTMLElement | null) => boolean;
    getState: (target?: HTMLElement | null) => DrawerState | null;
};
export declare const createDrawer: (options?: DrawerOptions) => DrawerController;
export declare const initDrawer: (options?: DrawerOptions) => DrawerController;
export declare const startDrawerRuntime: () => DrawerController | null;
export declare const stopDrawerRuntime: () => void;
