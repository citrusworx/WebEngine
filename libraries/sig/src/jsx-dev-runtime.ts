import { jsx, jsxs, Fragment, type JSX } from "./jsx-runtime.js";

export { jsxs, Fragment };
export { JSX } from "./jsx.js";

type ElementProps = JSX.IntrinsicElements[string];

/**
 * Dev-mode JSX entry. Extra transform args (`key`, static children, source, self)
 * are unused: JSX itself has no VDOM. Keyed lists are `bindList`, not this `key` argument.
 */
export function jsxDEV(type: string, props: JSX.IntrinsicElements[string] | null, key?: unknown, isStaticChildren?: unknown, source?: unknown, self?: unknown): Node;
export function jsxDEV<P>(type: (props: P) => Node, props: P | null, key?: unknown, isStaticChildren?: unknown, source?: unknown, self?: unknown): Node;
export function jsxDEV(
    type: string | ((props: ElementProps | null) => Node),
    props: ElementProps | null,
    _key?: unknown,
    _isStaticChildren?: unknown,
    _source?: unknown,
    _self?: unknown
): Node {
    // Narrow `type` so the `jsx` overloads apply. A union matches neither one.
    if (typeof type === "function") {
        return jsx(type, props);
    }
    return jsx(type, props);
}
