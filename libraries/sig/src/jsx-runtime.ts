import { attachNodeCleanup, disposeTree } from "./node-cleanup.js";
import { captureCleanupScope, effect } from "./signal.js";

export { disposeTree };

export type Child =
    | Node
    | string
    | number
    | null
    | undefined
    | (() => any)
    | Child[];

function appendChild(parent: Node, child: Child): void {
    if (child == null) return;

    if (Array.isArray(child)) {
        child.forEach(c => appendChild(parent, c));
        return;
    }

    if(typeof child === "function"){
        const textNode = document.createTextNode("");
        parent.appendChild(textNode);

        const dispose = effect(() => {
            textNode.textContent = String(child());
        });
        attachNodeCleanup(textNode, dispose);
        return;
    }

    if(typeof child === "string" || typeof child === "number"){
        parent.appendChild(document.createTextNode(String(child)));
        return;
    }
    
  parent.appendChild(child); // Now guaranteed Node
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

function applyPropValue(el: HTMLElement, key: string, value: any) {
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
        (el as any)[key] = value;
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

function setProp(el: HTMLElement, key: string, value: any) {
    if (key === "children") return;

    if (key === "ref" && typeof value === "function") {
        value(el);
        return;
    }

    if (key.startsWith("on") && typeof value === "function") {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, value);
        return;
    }

    // Function-valued host props (not ref / on*) are reactive getters.
    if (typeof value === "function") {
        const dispose = effect(() => {
            applyPropValue(el, key, value());
        });
        attachNodeCleanup(el, dispose);
        return;
    }

    applyPropValue(el, key, value);
}

export function jsx(type: any, props: any) {
    if (typeof type === "function") {
        const { value, dispose } = captureCleanupScope(() => type(props));
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

export function mount(node: Node, target: HTMLElement){
    [...target.childNodes].forEach(child => disposeTree(child));
    target.replaceChildren(node);
}

export const jsxs = jsx;

export const Fragment = (props: any) => {
    const frag = document.createDocumentFragment();
    appendChild(frag, props.children);
    return frag;
};
