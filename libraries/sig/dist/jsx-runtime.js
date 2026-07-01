// juice/jsx-runtime.ts
import { captureCleanupScope, effect } from "./signal.js";
const nodeCleanups = new WeakMap();
function attachCleanup(node, cleanup) {
    if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        node.childNodes.forEach(child => attachCleanup(child, cleanup));
        return;
    }
    const cleanups = nodeCleanups.get(node) ?? new Set();
    cleanups.add(cleanup);
    nodeCleanups.set(node, cleanups);
}
export function disposeTree(node) {
    node.childNodes.forEach(child => disposeTree(child));
    const cleanups = nodeCleanups.get(node);
    if (!cleanups) {
        return;
    }
    nodeCleanups.delete(node);
    for (const cleanup of cleanups) {
        cleanup();
    }
}
function appendChild(parent, child) {
    if (child == null)
        return;
    if (Array.isArray(child)) {
        child.forEach(c => appendChild(parent, c));
        return;
    }
    if (typeof child === "function") {
        const textNode = document.createTextNode("");
        parent.appendChild(textNode);
        effect(() => {
            textNode.textContent = String(child());
        });
        return;
    }
    if (typeof child === "string" || typeof child === "number") {
        parent.appendChild(document.createTextNode(String(child)));
        return;
    }
    parent.appendChild(child); // Now guaranteed Node
}
function setProp(el, key, value) {
    if (key === "children")
        return;
    if (key === "ref" && typeof value === "function") {
        value(el);
        return;
    }
    if (key.startsWith("on") && typeof value === "function") {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, value);
        return;
    }
    // DOM properties that must be assigned directly
    if (key in el &&
        key !== "animate" &&
        key !== "animation" &&
        key !== "motion" &&
        !key.startsWith("data-") &&
        !key.startsWith("aria-")) {
        el[key] = value;
        return;
    }
    if (value === true) {
        el.setAttribute(key, "");
    }
    else if (value === false || value == null) {
        el.removeAttribute(key);
    }
    else {
        el.setAttribute(key, value);
    }
}
export function jsx(type, props) {
    if (typeof type === "function") {
        const { value, dispose } = captureCleanupScope(() => type(props));
        if (value instanceof Node) {
            attachCleanup(value, dispose);
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
export function mount(node, target) {
    [...target.childNodes].forEach(child => disposeTree(child));
    target.replaceChildren(node);
}
export const jsxs = jsx;
export const Fragment = (props) => {
    const frag = document.createDocumentFragment();
    appendChild(frag, props.children);
    return frag;
};
//# sourceMappingURL=jsx-runtime.js.map