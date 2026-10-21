type Cleanup = () => void;

const nodeCleanups = new WeakMap<Node, Set<Cleanup>>();

export function attachNodeCleanup(node: Node, cleanup: Cleanup): void {
    if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        node.childNodes.forEach(child => attachNodeCleanup(child, cleanup));
        return;
    }

    const cleanups = nodeCleanups.get(node) ?? new Set<Cleanup>();
    cleanups.add(cleanup);
    nodeCleanups.set(node, cleanups);
}

export function disposeTree(node: Node): void {
    node.childNodes.forEach(child => disposeTree(child));

    const cleanups = nodeCleanups.get(node);
    if (!cleanups) {
        return;
    }

    nodeCleanups.delete(node);
    for (const cleanup of cleanups) {
        cleanup();
    }
}
