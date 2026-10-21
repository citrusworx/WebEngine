import { disposeTree } from "./node-cleanup.js";
import { type Child, type JSX } from "./jsx.js";
export { disposeTree };
export { JSX, type Child } from "./jsx.js";
export declare function jsx(type: string, props?: JSX.IntrinsicElements[string] | null): Node;
export declare function jsx<P>(type: (props: P) => Node, props?: P | null): Node;
export declare function mount(node: Node, target: HTMLElement): void;
export declare const jsxs: typeof jsx;
export declare const Fragment: (props: {
    children?: Child;
} | null) => DocumentFragment;
