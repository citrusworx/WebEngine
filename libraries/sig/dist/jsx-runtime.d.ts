export type Child = Node | string | number | null | undefined | (() => any) | Child[];
export declare function jsx(type: any, props: any): any;
export declare function mount(node: Node, target: HTMLElement): void;
export declare const jsxs: typeof jsx;
export declare const Fragment: (props: any) => DocumentFragment;
