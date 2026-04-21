import { Signal } from "@citrusworx/sigjs";

interface AccordionProps {
    name: string;
    title?: string;
    defaultExpanded?: boolean;
    children?: unknown;
    attributes: Record<string, string>;
}

export function Accordion(props: AccordionProps) {
    const isExpanded = Signal(props.defaultExpanded ?? false);
    const panelId = `${props.name}-panel`;

    return (
        <section accordion name={props.name}>
            <button
                {...(props.attributes ?? {})}
                type="button"
                accordion-item
                aria-expanded={() => { String(isExpanded.get()) }}
                aria-controls={panelId}
                onclick={() => isExpanded.set(!isExpanded.get())}
            >
                {props.title ?? props.name}
            </button>

            <div
                id={panelId}
                content={() => { isExpanded.get() ? "active" : "hidden" }}
                hidden={!isExpanded.get()}
                aria-hidden={String(!isExpanded.get())}
            >
                {props.children}
            </div>
        </section>
    ) as HTMLElement;
}
