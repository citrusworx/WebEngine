import { jsx, jsxs, Fragment } from "./jsx-runtime.js";

export { jsxs, Fragment };

/**
 * Dev-mode JSX entry. Extra transform args (`key`, static children, source, self)
 * are unused: JSX itself has no VDOM. Keyed lists are `bindList`, not this `key` argument.
 */
export function jsxDEV(
    type: any,
    props: any,
    _key?: any,
    _isStaticChildren?: any,
    _source?: any,
    _self?: any
) {
    return jsx(type, props);
}