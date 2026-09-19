import { CMS_COLLECTIONS } from "./types.js";
import { coerceDocument, emptySnapshot } from "./persistence.js";
import { isCollectionSlug, isCustomTypeSlug, normalizeTypeDefinition } from "./type-registry.js";
function emptyBuckets() {
    return emptySnapshot();
}
export class NectarineStore {
    records = emptyBuckets();
    typeDefs = new Map();
    adapter;
    hydrated = false;
    hydrating;
    flushQueue = Promise.resolve();
    usePersistence(persistence) {
        if (this.adapter === persistence) {
            return this;
        }
        this.adapter = persistence;
        this.hydrated = false;
        this.hydrating = undefined;
        return this;
    }
    get persistence() {
        return this.adapter;
    }
    get persistenceKind() {
        return this.adapter?.kind ?? "memory";
    }
    async hydrate() {
        if (!this.adapter || this.hydrated) {
            return;
        }
        if (!this.hydrating) {
            this.hydrating = (async () => {
                const loaded = await this.adapter.load();
                const document = coerceDocument(loaded);
                if (document) {
                    this.replaceDocument(document);
                }
                this.hydrated = true;
            })().finally(() => {
                this.hydrating = undefined;
            });
        }
        await this.hydrating;
    }
    async flush() {
        if (!this.adapter) {
            return;
        }
        const run = this.flushQueue.then(() => this.adapter.save(this.document()));
        this.flushQueue = run.then(() => undefined, () => undefined);
        await run;
    }
    isRegisteredCollection(collection) {
        return CMS_COLLECTIONS.includes(collection) || this.typeDefs.has(collection);
    }
    isEditableCollection(collection) {
        return collection === "posts" || collection === "pages" || this.typeDefs.has(collection);
    }
    list(collection) {
        return [...(this.records[collection] ?? [])];
    }
    get(collection, id) {
        const needle = String(id);
        return this.list(collection).find((record) => record.id === needle);
    }
    findBySlug(collection, slug) {
        return this.list(collection).find((record) => record.slug === slug);
    }
    upsert(record) {
        if (!this.isRegisteredCollection(record.collection)) {
            throw new Error(`Unknown KiwiPress collection "${record.collection}".`);
        }
        const native = {
            ...record,
            source: {
                ...record.source,
                cms: "nectarine"
            }
        };
        const bucket = this.ensureBucket(native.collection);
        const index = bucket.findIndex((entry) => entry.id === native.id);
        if (index >= 0) {
            bucket[index] = native;
        }
        else {
            bucket.push(native);
        }
        return native;
    }
    remove(collection, id) {
        const needle = String(id);
        const bucket = this.records[collection];
        if (!bucket) {
            return false;
        }
        const next = bucket.filter((record) => record.id !== needle);
        this.records[collection] = next;
        return next.length !== bucket.length;
    }
    listTypes() {
        return [...this.typeDefs.values()].sort((left, right) => left.slug.localeCompare(right.slug));
    }
    getType(slug) {
        return this.typeDefs.get(slug);
    }
    registerType(input) {
        const definition = normalizeTypeDefinition(input);
        if (this.typeDefs.has(definition.slug)) {
            throw new Error(`Custom type "${definition.slug}" already exists.`);
        }
        this.typeDefs.set(definition.slug, definition);
        this.ensureBucket(definition.slug);
        return definition;
    }
    updateType(slug, input) {
        const existing = this.typeDefs.get(slug);
        if (!existing) {
            throw new Error(`Custom type "${slug}" was not found.`);
        }
        const definition = normalizeTypeDefinition({ ...input, slug }, existing);
        this.typeDefs.set(definition.slug, definition);
        this.ensureBucket(definition.slug);
        return definition;
    }
    removeType(slug) {
        if (!this.typeDefs.has(slug)) {
            return false;
        }
        this.typeDefs.delete(slug);
        delete this.records[slug];
        return true;
    }
    document() {
        return {
            collections: this.snapshot(),
            types: this.listTypes()
        };
    }
    snapshot() {
        const snapshot = emptySnapshot();
        for (const collection of CMS_COLLECTIONS) {
            snapshot[collection] = this.list(collection);
        }
        for (const slug of Object.keys(this.records)) {
            if (CMS_COLLECTIONS.includes(slug)) {
                continue;
            }
            snapshot[slug] = this.list(slug);
        }
        return snapshot;
    }
    replaceDocument(document) {
        this.typeDefs.clear();
        for (const definition of document.types) {
            this.typeDefs.set(definition.slug, definition);
        }
        this.records = emptyBuckets();
        for (const [collection, items] of Object.entries(document.collections)) {
            if (!isCollectionSlug(collection) && !this.typeDefs.has(collection)) {
                continue;
            }
            this.records[collection] = [...(items ?? [])];
        }
    }
    replace(snapshot) {
        for (const collection of CMS_COLLECTIONS) {
            this.records[collection] = [...(snapshot[collection] ?? [])];
        }
        for (const [collection, items] of Object.entries(snapshot)) {
            if (CMS_COLLECTIONS.includes(collection)) {
                continue;
            }
            if (!isCustomTypeSlug(collection) && !this.typeDefs.has(collection)) {
                continue;
            }
            this.records[collection] = [...(items ?? [])];
        }
    }
    clear() {
        this.records = emptyBuckets();
        this.typeDefs.clear();
    }
    ensureBucket(collection) {
        if (!this.records[collection]) {
            this.records[collection] = [];
        }
        return this.records[collection];
    }
}
//# sourceMappingURL=store.js.map