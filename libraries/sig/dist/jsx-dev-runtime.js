import { jsx, jsxs, Fragment } from "./jsx-runtime.js";
export { jsxs, Fragment };
/**
 * Dev-mode JSX entry. Extra transform args (`key`, static children, source, self)
 * are unused: JSX itself has no VDOM. Keyed lists are `bindList`, not this `key` argument.
 */
export function jsxDEV(type, props, _key, _isStaticChildren, _source, _self) {
    return jsx(type, props);
}
//# sourceMappingURL=jsx-dev-runtime.js.map