import { jsx, jsxs, Fragment } from "./jsx-runtime.js";

export { jsxs, Fragment };

export function jsxDEV(
    type: any,
    props: any,
    key: any,
    isStaticChildren: any,
    source: any,
    self: any
) {
    return jsx(type, props);
}