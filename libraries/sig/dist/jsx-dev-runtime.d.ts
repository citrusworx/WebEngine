import { jsxs, Fragment } from "./jsx-runtime.js";
export { jsxs, Fragment };
/**
 * Dev-mode JSX entry. Extra transform args (`key`, static children, source, self)
 * are unused: this runtime has no VDOM, keyed reconcile, or source overlay.
 */
export declare function jsxDEV(type: any, props: any, _key?: any, _isStaticChildren?: any, _source?: any, _self?: any): any;
