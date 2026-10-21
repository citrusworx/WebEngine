import { jsxs, Fragment, type JSX } from "./jsx-runtime.js";
export { jsxs, Fragment };
export { JSX } from "./jsx.js";
/**
 * Dev-mode JSX entry. Extra transform args (`key`, static children, source, self)
 * are unused: JSX itself has no VDOM. Keyed lists are `bindList`, not this `key` argument.
 */
export declare function jsxDEV(type: string, props: JSX.IntrinsicElements[string] | null, key?: unknown, isStaticChildren?: unknown, source?: unknown, self?: unknown): Node;
export declare function jsxDEV<P>(type: (props: P) => Node, props: P | null, key?: unknown, isStaticChildren?: unknown, source?: unknown, self?: unknown): Node;
