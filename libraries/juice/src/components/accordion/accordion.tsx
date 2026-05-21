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
    const slug = props.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "accordion";
    const buttonId = `${slug}-trigger`;
    const panelId = `${slug}-panel`;

    return (
        <section accordion name={props.name}>
            <button
                {...(props.attributes ?? {})}
                type="button"
                id={buttonId}
                accordion-item
                aria-expanded={() => String(isExpanded.get())}
                aria-controls={panelId}
                onclick={() => isExpanded.set(!isExpanded.get())}
            >
                {props.title ?? props.name}
            </button>

            <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                content={() => (isExpanded.get() ? "active" : "hidden")}
                hidden={() => (!isExpanded.get() ? true : undefined)}
                aria-hidden={() => String(!isExpanded.get())}
            >
                {props.children}
            </div>
        </section>
    ) as HTMLElement;
}
