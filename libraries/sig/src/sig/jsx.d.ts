import type { Child } from "./jsx-runtime";

declare global {
declare namespace JSX {
    type Element = Node;

    interface IntrinsicElements {
        [elemName: string]: any;
    }

    interface ElementChildrenAttribute {
        children: {};
    }
}
}