/**
 * Per-row view of the current item. Read it inside an effect or a function
 * child. `bindList` does not call `render` again when the item changes.
 */
export type ListItem<T> = {
    get(): T;
};
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
 */
export declare function bindList<T, K>(parent: Element, source: {
    get(): readonly T[] | undefined | null;
}, key: (item: T) => K, render: (item: ListItem<T>, key: K) => Node): () => void;
export declare function bindList<T, K>(parent: Element, source: {
    get(): ReadonlyMap<K, T> | undefined | null;
}, render: (item: ListItem<T>, key: K) => Node): () => void;
