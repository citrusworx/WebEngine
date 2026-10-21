import { attachNodeCleanup, disposeTree } from "./node-cleanup.js";
import { captureCleanupScope } from "./cleanup-scope.js";
import { Signal, effect, untrack } from "./signal.js";

/**
 * Per-row view of the current item. Read it inside an effect or a function
 * child. `bindList` does not call `render` again when the item changes.
 *
 * @experimental
 */
export type ListItem<T> = {
    get(): T;
};

type ListRender<T, K> = (item: ListItem<T>, key: K) => Node;

type Entry<K, T> = {
    key: K;
    value: T;
};

type Row<T> = {
    item: ReturnType<typeof Signal<T>>;
    node: Node;
    disposed: boolean;
};

const boundParents = new WeakSet<Element>();

/**
 * Keyed list. Reuses the DOM node for a key that is still present, creates a
 * node for a new key, and disposes a node when its key leaves.
 *
 * Array form (`key` required):
 *
 * ```ts
 * bindList(parent, source, (item) => item.id, (item, id) => row)
 * ```
 *
 * Map form (iteration order is display order; the map key is the row key):
 *
 * ```ts
 * bindList(parent, source, (item, id) => row)
 * ```
 *
 * `source` is any `{ get() }` — a `Signal` or a `memo` — of `T[]` or
 * `Map<K, T>`. `render` is called once per key and receives a per-row getter.
 * Read `item.get()` from an effect or a function child to update that row
 * without recreating it. A one-shot `item.get()` in `render` is a snapshot.
 *
 * Keys use SameValueZero (`Map` / `Set` equality). An array that produces the
 * same key twice throws `bindList: duplicate key …` before that update
 * changes the DOM. The previous rows stay. The first call throws out of
 * `bindList` and leaves `parent` empty.
 *
 * `parent` should be an empty element reserved for the rows. Existing
 * children are pushed after the rows. One binding per parent.
 *
 * Returns a disposer. It removes every row and disposes row effects. The same
 * disposer is attached to `parent`, so `disposeTree` / `mount` stop the list
 * too. Row effects are also disposed when that row's key disappears.
 * `replaceChildren` remains the non-keyed alternative: it rebuilds nodes.
 *
 * @experimental
 */
export function bindList<T, K>(
    parent: Element,
    source: { get(): readonly T[] | undefined | null },
    key: (item: T) => K,
    render: (item: ListItem<T>, key: K) => Node,
): () => void;
export function bindList<T, K>(
    parent: Element,
    source: { get(): ReadonlyMap<K, T> | undefined | null },
    render: (item: ListItem<T>, key: K) => Node,
): () => void;
export function bindList<T, K>(
    parent: Element,
    source: { get(): readonly T[] | ReadonlyMap<K, T> | undefined | null },
    keyOrRender: ((item: T) => K) | ListRender<T, K>,
    maybeRender?: ListRender<T, K>,
): () => void {
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

    const keyFn = mapMode ? null : keyOrRender as (item: T) => K;
    const render = (mapMode ? keyOrRender : maybeRender) as ListRender<T, K>;
    const rows = new Map<K, Row<T>>();
    let disposed = false;
    let ready = false;
    let startupError: unknown;
    let stopEffect: (() => void) | undefined;

    boundParents.add(parent);

    function destroyRow(row: Row<T>) {
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

    function readEntries(): Entry<K, T>[] {
        const value = source.get();
        if (value == null) {
            throw new Error("bindList: source.get() returned no list");
        }

        if (mapMode) {
            if (!(value instanceof Map)) {
                throw new Error(
                    "bindList: 3-argument form expects a Map. For an array, pass a key function: bindList(parent, source, key, render).",
                );
            }
            const entries: Entry<K, T>[] = [];
            for (const [key, item] of value) {
                entries.push({ key: key as K, value: item as T });
            }
            return entries;
        }

        if (!Array.isArray(value)) {
            throw new Error(
                "bindList: 4-argument form expects an array. For a Map, omit the key function: bindList(parent, source, render).",
            );
        }

        const entries: Entry<K, T>[] = [];
        for (const item of value as readonly T[]) {
            entries.push({ key: keyFn!(item), value: item });
        }
        return entries;
    }

    function createRow(key: K, value: T): Row<T> {
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

    function placeNode(node: Node, before: Node | null) {
        const active = parent.ownerDocument?.activeElement ?? null;
        const refocus = active && node.contains(active) ? active : null;
        parent.insertBefore(node, before);
        if (
            refocus &&
            refocus !== parent.ownerDocument?.activeElement &&
            "focus" in refocus &&
            typeof refocus.focus === "function"
        ) {
            refocus.focus();
        }
    }

    function apply(entries: Entry<K, T>[]) {
        const nextKeys = new Set<K>();
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
            } else if (!Object.is(row.item.get(), value)) {
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
        } catch (error) {
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
