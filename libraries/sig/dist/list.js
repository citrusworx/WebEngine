import { attachNodeCleanup, disposeTree } from "./node-cleanup.js";
import { captureCleanupScope } from "./cleanup-scope.js";
import { Signal, effect, untrack } from "./signal.js";
const boundParents = new WeakSet();
export function bindList(parent, source, keyOrRender, maybeRender) {
    if (!(parent instanceof Element)) {
        throw new Error("bindList: parent must be an Element");
    }
    if (boundParents.has(parent)) {
        throw new Error("bindList: parent already has a list");
    }
    const mapMode = maybeRender === undefined;
    if (typeof keyOrRender !== "function" || (!mapMode && typeof maybeRender !== "function")) {
        throw new Error("bindList: expected (parent, source, key, render) or (parent, source, render)");
    }
    const keyFn = mapMode ? null : keyOrRender;
    const render = (mapMode ? keyOrRender : maybeRender);
    const rows = new Map();
    let disposed = false;
    let ready = false;
    let startupError;
    let stopEffect;
    boundParents.add(parent);
    function destroyRow(row) {
        if (row.disposed) {
            return;
        }
        row.disposed = true;
        disposeTree(row.node);
        row.node.parentNode?.removeChild(row.node);
    }
    function dispose() {
        if (disposed) {
            return;
        }
        disposed = true;
        boundParents.delete(parent);
        stopEffect?.();
        for (const row of rows.values()) {
            destroyRow(row);
        }
        rows.clear();
    }
    function readEntries() {
        const value = source.get();
        if (value == null) {
            throw new Error("bindList: source.get() returned no list");
        }
        if (mapMode) {
            if (!(value instanceof Map)) {
                throw new Error("bindList: 3-argument form expects a Map. For an array, pass a key function: bindList(parent, source, key, render).");
            }
            const entries = [];
            for (const [key, item] of value) {
                entries.push({ key: key, value: item });
            }
            return entries;
        }
        if (!Array.isArray(value)) {
            throw new Error("bindList: 4-argument form expects an array. For a Map, omit the key function: bindList(parent, source, render).");
        }
        const entries = [];
        for (const item of value) {
            entries.push({ key: keyFn(item), value: item });
        }
        return entries;
    }
    function createRow(key, value) {
        const item = Signal(value);
        const captured = captureCleanupScope(() => render(item, key));
        const node = captured.value;
        if (!(node instanceof Node) || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            captured.dispose();
            throw new Error("bindList: render must return a single Node");
        }
        for (const existing of rows.values()) {
            if (existing.node === node) {
                captured.dispose();
                throw new Error("bindList: render returned a node that already belongs to another row");
            }
        }
        attachNodeCleanup(node, captured.dispose);
        return { item, node, disposed: false };
    }
    function placeNode(node, before) {
        const active = parent.ownerDocument?.activeElement ?? null;
        const refocus = active && node.contains(active) ? active : null;
        parent.insertBefore(node, before);
        if (refocus &&
            refocus !== parent.ownerDocument?.activeElement &&
            "focus" in refocus &&
            typeof refocus.focus === "function") {
            refocus.focus();
        }
    }
    function apply(entries) {
        const nextKeys = new Set();
        for (const entry of entries) {
            if (nextKeys.has(entry.key)) {
                throw new Error(`bindList: duplicate key ${String(entry.key)}`);
            }
            nextKeys.add(entry.key);
        }
        for (const [key, row] of rows) {
            if (!nextKeys.has(key)) {
                destroyRow(row);
                rows.delete(key);
            }
        }
        for (let index = 0; index < entries.length; index++) {
            if (disposed) {
                return;
            }
            const { key, value } = entries[index];
            let row = rows.get(key);
            if (!row) {
                row = createRow(key, value);
                rows.set(key, row);
            }
            else if (!Object.is(row.item.get(), value)) {
                row.item.set(value);
            }
            const current = parent.childNodes[index];
            if (current !== row.node) {
                placeNode(row.node, current ?? null);
            }
        }
    }
    stopEffect = effect(() => {
        if (disposed) {
            return;
        }
        try {
            const entries = readEntries();
            untrack(() => apply(entries));
        }
        catch (error) {
            if (!ready) {
                startupError = error;
                return;
            }
            throw error;
        }
        ready = true;
    });
    if (startupError) {
        dispose();
        throw startupError;
    }
    attachNodeCleanup(parent, dispose);
    return dispose;
}
//# sourceMappingURL=list.js.map