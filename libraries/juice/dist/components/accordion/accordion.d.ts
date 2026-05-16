interface AccordionProps {
    name: string;
    title?: string;
    defaultExpanded?: boolean;
    children?: unknown;
    attributes: Record<string, string>;
}
export declare function Accordion(props: AccordionProps): HTMLElement;
export {};
