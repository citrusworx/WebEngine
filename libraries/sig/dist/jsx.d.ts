/**
 * Public JSX types. Host tags are open: Juice attributes are unknown keys,
 * and a function prop (other than `ref` / `on*`) is a getter the runtime
 * subscribes to. Function children are text. `String(child())` is the contract.
 */
export type Child = Node | string | number | null | undefined | (() => string | number | boolean | null | undefined) | Child[];
export declare namespace JSX {
    /**
     * Any tag name is legal, so unknown Juice keys stay attributes.
     * A function prop other than `ref` / `on*` is a getter. `ref` and event
     * listeners are bivariant so a more specific element or `Event` still assigns.
     */
    type Element = Node;
    interface IntrinsicElements {
        [elemName: string]: {
            children?: Child;
            ref?: {
                bivarianceHack(element: Element): void;
            }["bivarianceHack"];
            style?: string | number | boolean | null | undefined | (() => string | number | boolean | null | undefined) | {
                [key: string]: string | number | null | undefined;
            } | (() => {
                [key: string]: string | number | null | undefined;
            });
            [name: string]: string | number | boolean | null | undefined | (() => string | number | boolean | null | undefined) | {
                [key: string]: string | number | null | undefined;
            } | {
                bivarianceHack(event: Event): unknown;
            }["bivarianceHack"] | {
                bivarianceHack(element: Element): void;
            }["bivarianceHack"] | Child | undefined;
        };
    }
    interface ElementChildrenAttribute {
        children: {};
    }
    interface IntrinsicAttributes {
        key?: string | number;
    }
}
declare global {
    namespace JSX {
        type Element = Node;
        interface IntrinsicElements {
            [elemName: string]: import("./jsx.js").JSX.IntrinsicElements[string];
        }
        interface ElementChildrenAttribute {
            children: {};
        }
        interface IntrinsicAttributes {
            key?: string | number;
        }
    }
}
