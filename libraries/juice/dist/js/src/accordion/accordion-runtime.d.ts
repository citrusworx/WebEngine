export type AccordionOptions = {
    root?: ParentNode;
    accordionSelector?: string;
    triggerSelector?: string;
};
export type AccordionController = {
    destroy: () => void;
    sync: () => void;
    expand: (trigger?: HTMLElement | null) => void;
    collapse: (trigger?: HTMLElement | null) => void;
    toggle: (trigger?: HTMLElement | null) => void;
};
export declare const createAccordion: (options?: AccordionOptions) => AccordionController;
export declare const initAccordion: (options?: AccordionOptions) => AccordionController;
export declare const startAccordionRuntime: () => AccordionController | null;
export declare const stopAccordionRuntime: () => void;
