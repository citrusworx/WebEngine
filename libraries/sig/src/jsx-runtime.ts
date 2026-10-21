import { attachNodeCleanup, disposeTree } from "./node-cleanup.js";
import { captureCleanupScope } from "./cleanup-scope.js";
import { effect } from "./signal.js";
import { type Child, type JSX } from "./jsx.js";

export { disposeTree };
export { JSX, type Child } from "./jsx.js";

type ElementProps = JSX.IntrinsicElements[string];

function appendChild(parent: Node, child: Child | undefined): void {
    if (child == null) return;

    if (Array.isArray(child)) {
        child.forEach(c => appendChild(parent, c));
        return;
    }

    if (typeof child === "function") {
        const textNode = document.createTextNode("");
        parent.appendChild(textNode);

        const dispose = effect(() => {
            textNode.textContent = String(child());
        });
        attachNodeCleanup(textNode, dispose);
        return;
    }

    if (typeof child === "string" || typeof child === "number") {
        parent.appendChild(document.createTextNode(String(child)));
        return;
    }

    parent.appendChild(child);
}

function isDomPropertyKey(el: HTMLElement, key: string): boolean {
    return (
        key in el &&
        key !== "animate" &&
        key !== "animation" &&
        key !== "motion" &&
        !key.startsWith("data-") &&
        !key.startsWith("aria-")
    );
}

function applyPropValue(el: HTMLElement, key: string, value: unknown) {
    if (key === "class") {
        if (value === false || value == null) {
            el.removeAttribute("class");
            el.className = "";
            return;
        }

        el.className = String(value === true ? "" : value);
        return;
    }

    // DOM properties that must be assigned directly
    if (isDomPropertyKey(el, key)) {
        (el as unknown as Record<string, unknown>)[key] = value;
        return;
    }

    if (value === true) {
        el.setAttribute(key, "");
    } else if (value === false || value == null) {
        el.removeAttribute(key);
    } else {
        el.setAttribute(key, String(value));
    }
}

function setProp(el: HTMLElement, key: string, value: unknown) {
    if (key === "children") return;

    if (key === "ref" && typeof value === "function") {
        value(el);
        return;
    }

    if (key.startsWith("on") && typeof value === "function") {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, value as EventListener);
        return;
    }

    // Function-valued host props (not ref / on*) are reactive getters.
    if (typeof value === "function") {
        const read = value as () => unknown;
        const dispose = effect(() => {
            applyPropValue(el, key, read());
        });
        attachNodeCleanup(el, dispose);
        return;
    }

    applyPropValue(el, key, value);
}

export function jsx(type: string, props?: JSX.IntrinsicElements[string] | null): Node;
export function jsx<P>(type: (props: P) => Node, props?: P | null): Node;
export function jsx(
    type: string | ((props: ElementProps | null) => Node),
    props?: ElementProps | null
): Node {
    if (typeof type === "function") {
        const { value, dispose } = captureCleanupScope(() => type(props ?? null));
        if (value instanceof Node) {
            attachNodeCleanup(value, dispose);
        }
        return value;
    }

    const el = document.createElement(type);

    if (props) {
        for (const key in props) {
            setProp(el, key, props[key]);
        }

        appendChild(el, props.children);
    }

    return el;
}

export function mount(node: Node, target: HTMLElement): void {
    [...target.childNodes].forEach(child => disposeTree(child));
    target.replaceChildren(node);
}

export const jsxs = jsx;

export const Fragment = (props: { children?: Child } | null): DocumentFragment => {
    const frag = document.createDocumentFragment();
    appendChild(frag, props?.children);
    return frag;
};
