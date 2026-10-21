const nodeCleanups = new WeakMap();
export function attachNodeCleanup(node, cleanup) {
    if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        node.childNodes.forEach(child => attachNodeCleanup(child, cleanup));
        return;
    }
    const cleanups = nodeCleanups.get(node) ?? new Set();
    cleanups.add(cleanup);
    nodeCleanups.set(node, cleanups);
}
export function disposeTree(node) {
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
//# sourceMappingURL=node-cleanup.js.map