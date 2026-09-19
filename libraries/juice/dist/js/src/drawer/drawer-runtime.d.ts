/**
 * DOM-first dialog runtime for Juice drawer chrome.
 *
 * Markup contract:
 *   [drawer-overlay][hidden] > [drawer role="dialog"] + [drawer-close]
 * Closed vs open is the native `hidden` attribute on the overlay.
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
export type DrawerController = {
    destroy: () => void;
    sync: () => void;
    open: (target?: HTMLElement | null) => void;
    close: (target?: HTMLElement | null) => void;
    toggle: (target?: HTMLElement | null) => void;
};
export declare const createDrawer: (options?: DrawerOptions) => DrawerController;
export declare const initDrawer: (options?: DrawerOptions) => DrawerController;
export declare const startDrawerRuntime: () => DrawerController | null;
export declare const stopDrawerRuntime: () => void;
