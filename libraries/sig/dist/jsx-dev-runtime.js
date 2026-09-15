import { jsx, jsxs, Fragment } from "./jsx-runtime.js";
export { jsxs, Fragment };
/**
 * Dev-mode JSX entry. Extra transform args (`key`, static children, source, self)
 * are unused: this runtime has no VDOM, keyed reconcile, or source overlay.
 */
export function jsxDEV(type, props, _key, _isStaticChildren, _source, _self) {
    return jsx(type, props);
}
//# sourceMappingURL=jsx-dev-runtime.js.map