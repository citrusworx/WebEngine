import { type Child } from "@citrusworx/sigjs";
interface AccordionProps {
    name: string;
    title?: string;
    defaultExpanded?: boolean;
    children?: Child;
    attributes: Record<string, string>;
}
export declare function Accordion(props: AccordionProps): HTMLElement;
export {};
