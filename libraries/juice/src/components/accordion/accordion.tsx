import { effect, Signal } from "@citrusworx/sigjs";

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
    let buttonRef: HTMLButtonElement | null = null;
    let panelRef: HTMLDivElement | null = null;

    const syncExpandedState = (expanded: boolean) => {
        buttonRef?.setAttribute("aria-expanded", String(expanded));

        if (!panelRef) {
            return;
        }

        panelRef.hidden = !expanded;
        panelRef.setAttribute("aria-hidden", String(!expanded));
        panelRef.setAttribute("content", expanded ? "active" : "hidden");
    };

    effect(() => {
        syncExpandedState(isExpanded.get());
    });

    return (
        <section accordion name={props.name}>
            <button
                {...(props.attributes ?? {})}
                ref={(element: HTMLButtonElement) => {
                    buttonRef = element;
                    syncExpandedState(isExpanded.get());
                }}
                type="button"
                id={buttonId}
                accordion-item
                aria-expanded={String(isExpanded.get())}
                aria-controls={panelId}
                onclick={() => isExpanded.set(!isExpanded.get())}
            >
                {props.title ?? props.name}
            </button>

            <div
                ref={(element: HTMLDivElement) => {
                    panelRef = element;
                    syncExpandedState(isExpanded.get());
                }}
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                content={isExpanded.get() ? "active" : "hidden"}
                hidden={!isExpanded.get()}
                aria-hidden={String(!isExpanded.get())}
            >
                {props.children}
            </div>
        </section>
    ) as HTMLElement;
}
