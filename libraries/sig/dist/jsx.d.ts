declare global {
    namespace JSX {
        type Element = Node;
        interface IntrinsicElements {
            [elemName: string]: any;
        }
        interface ElementChildrenAttribute {
            children: {};
        }
    }
}
export {};
