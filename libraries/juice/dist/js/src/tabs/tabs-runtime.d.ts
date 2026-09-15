export type TabsOptions = {
    root?: ParentNode;
    tabsSelector?: string;
    listSelector?: string;
    triggerSelector?: string;
    panelSelector?: string;
};
export type TabsController = {
    destroy: () => void;
    sync: () => void;
    select: (trigger?: HTMLElement | null) => void;
};
export declare const createTabs: (options?: TabsOptions) => TabsController;
export declare const initTabs: (options?: TabsOptions) => TabsController;
export declare const startTabsRuntime: () => TabsController | null;
export declare const stopTabsRuntime: () => void;
