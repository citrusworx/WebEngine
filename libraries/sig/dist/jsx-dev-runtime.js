import { jsx, jsxs, Fragment } from "./jsx-runtime.js";
export { jsxs, Fragment };
export function jsxDEV(type, props, _key, _isStaticChildren, _source, _self) {
    // Narrow `type` so the `jsx` overloads apply. A union matches neither one.
    if (typeof type === "function") {
        return jsx(type, props);
    }
    return jsx(type, props);
}
//# sourceMappingURL=jsx-dev-runtime.js.map