type Cleanup = () => void;
export declare function attachNodeCleanup(node: Node, cleanup: Cleanup): void;
export declare function disposeTree(node: Node): void;
export {};
