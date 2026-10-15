export type AccordionOptions = {
    root?: ParentNode;
    accordionSelector?: string;
    triggerSelector?: string;
};
/** `expanded` is one flag per trigger, in DOM order. */
export type AccordionState = {
    expanded: boolean[];
};
export type AccordionController = {
    destroy: () => void;
    sync: () => void;
    expand: (trigger?: HTMLElement | null) => void;
    collapse: (trigger?: HTMLElement | null) => void;
    toggle: (trigger?: HTMLElement | null) => void;
    isExpanded: (trigger?: HTMLElement | null) => boolean;
    getState: (target?: HTMLElement | null) => AccordionState | null;
};
export declare const createAccordion: (options?: AccordionOptions) => AccordionController;
export declare const initAccordion: (options?: AccordionOptions) => AccordionController;
export declare const startAccordionRuntime: () => AccordionController | null;
export declare const stopAccordionRuntime: () => void;
