export type TabsOptions = {
    root?: ParentNode;
    tabsSelector?: string;
    listSelector?: string;
    triggerSelector?: string;
    panelSelector?: string;
};
/** `selected` is the trigger index. `-1` when the tab list is empty. */
export type TabsState = {
    selected: number;
};
export type TabsController = {
    destroy: () => void;
    sync: () => void;
    select: (trigger?: HTMLElement | null) => void;
    selected: (target?: HTMLElement | null) => HTMLElement | null;
    getState: (target?: HTMLElement | null) => TabsState | null;
};
export declare const createTabs: (options?: TabsOptions) => TabsController;
export declare const initTabs: (options?: TabsOptions) => TabsController;
export declare const startTabsRuntime: () => TabsController | null;
export declare const stopTabsRuntime: () => void;
