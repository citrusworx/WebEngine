export type NavigationOptions = {
    root?: ParentNode;
    navSelector?: string;
    sidebarSelector?: string;
    toggleSelector?: string;
    mobileBreakpoint?: number;
};
export type NavigationController = {
    destroy: () => void;
    openSidebar: (toggle?: HTMLElement | null) => void;
    closeSidebar: (toggle?: HTMLElement | null) => void;
    toggleSidebar: (toggle?: HTMLElement | null) => void;
    sync: () => void;
    isMobile: () => boolean;
};
export declare const createNavigation: (options?: NavigationOptions) => NavigationController;
export declare const initNavigation: (options?: NavigationOptions) => NavigationController;
export declare const startNavigationRuntime: () => NavigationController | null;
export declare const stopNavigationRuntime: () => void;
