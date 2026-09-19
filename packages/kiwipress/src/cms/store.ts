import { CMS_COLLECTIONS, type CmsDocument, type CmsSnapshot, type CollectionSlug, type CollectionTypeDefinition, type ContentRecord } from "./types.js";
import type { CmsPersistence, CmsPersistenceKind } from "./persistence.js";
import { coerceDocument, emptySnapshot } from "./persistence.js";
import { isCollectionSlug, isCustomTypeSlug, normalizeTypeDefinition, type TypeDefinitionInput } from "./type-registry.js";

function emptyBuckets(): CmsSnapshot {
    return emptySnapshot();
}

export class NectarineStore {
    private records: CmsSnapshot = emptyBuckets();
    private typeDefs = new Map<string, CollectionTypeDefinition>();
    private adapter?: CmsPersistence;
    private hydrated = false;
    private hydrating?: Promise<void>;
    private flushQueue: Promise<void> = Promise.resolve();

    usePersistence(persistence: CmsPersistence): this {
        if (this.adapter === persistence) {
            return this;
        }

        this.adapter = persistence;
        this.hydrated = false;
        this.hydrating = undefined;
        return this;
    }

    get persistence(): CmsPersistence | undefined {
        return this.adapter;
    }

    get persistenceKind(): CmsPersistenceKind {
        return this.adapter?.kind ?? "memory";
    }

    async hydrate(): Promise<void> {
        if (!this.adapter || this.hydrated) {
            return;
        }

        if (!this.hydrating) {
            this.hydrating = (async () => {
                const loaded = await this.adapter!.load();
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

    async flush(): Promise<void> {
        if (!this.adapter) {
            return;
        }

        const run = this.flushQueue.then(() => this.adapter!.save(this.document()));
        this.flushQueue = run.then(
            () => undefined,
            () => undefined
        );
        await run;
    }

    isRegisteredCollection(collection: string): boolean {
        return (CMS_COLLECTIONS as readonly string[]).includes(collection) || this.typeDefs.has(collection);
    }

    isEditableCollection(collection: string): boolean {
        return collection === "posts" || collection === "pages" || this.typeDefs.has(collection);
    }

    list(collection: CollectionSlug): ContentRecord[] {
        return [...(this.records[collection] ?? [])];
    }

    get(collection: CollectionSlug, id: string | number): ContentRecord | undefined {
        const needle = String(id);
        return this.list(collection).find((record) => record.id === needle);
    }

    findBySlug(collection: CollectionSlug, slug: string): ContentRecord | undefined {
        return this.list(collection).find((record) => record.slug === slug);
    }

    upsert(record: ContentRecord): ContentRecord {
        if (!this.isRegisteredCollection(record.collection)) {
            throw new Error(`Unknown KiwiPress collection "${record.collection}".`);
        }

        const native: ContentRecord = {
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
        } else {
            bucket.push(native);
        }

        return native;
    }

    remove(collection: CollectionSlug, id: string | number): boolean {
        const needle = String(id);
        const bucket = this.records[collection];
        if (!bucket) {
            return false;
        }

        const next = bucket.filter((record) => record.id !== needle);
        this.records[collection] = next;
        return next.length !== bucket.length;
    }

    listTypes(): CollectionTypeDefinition[] {
        return [...this.typeDefs.values()].sort((left, right) => left.slug.localeCompare(right.slug));
    }

    getType(slug: string): CollectionTypeDefinition | undefined {
        return this.typeDefs.get(slug);
    }

    registerType(input: TypeDefinitionInput): CollectionTypeDefinition {
        const definition = normalizeTypeDefinition(input);
        if (this.typeDefs.has(definition.slug)) {
            throw new Error(`Custom type "${definition.slug}" already exists.`);
        }

        this.typeDefs.set(definition.slug, definition);
        this.ensureBucket(definition.slug);
        return definition;
    }

    updateType(slug: string, input: TypeDefinitionInput): CollectionTypeDefinition {
        const existing = this.typeDefs.get(slug);
        if (!existing) {
            throw new Error(`Custom type "${slug}" was not found.`);
        }

        const definition = normalizeTypeDefinition({ ...input, slug }, existing);
        this.typeDefs.set(definition.slug, definition);
        this.ensureBucket(definition.slug);
        return definition;
    }

    removeType(slug: string): boolean {
        if (!this.typeDefs.has(slug)) {
            return false;
        }

        this.typeDefs.delete(slug);
        delete this.records[slug];
        return true;
    }

    document(): CmsDocument {
        return {
            collections: this.snapshot(),
            types: this.listTypes()
        };
    }

    snapshot(): CmsSnapshot {
        const snapshot = emptySnapshot();

        for (const collection of CMS_COLLECTIONS) {
            snapshot[collection] = this.list(collection);
        }

        for (const slug of Object.keys(this.records)) {
            if ((CMS_COLLECTIONS as readonly string[]).includes(slug)) {
                continue;
            }

            snapshot[slug] = this.list(slug);
        }

        return snapshot;
    }

    replaceDocument(document: CmsDocument): void {
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

    replace(snapshot: Partial<CmsSnapshot>): void {
        for (const collection of CMS_COLLECTIONS) {
            this.records[collection] = [...(snapshot[collection] ?? [])];
        }

        for (const [collection, items] of Object.entries(snapshot)) {
            if ((CMS_COLLECTIONS as readonly string[]).includes(collection)) {
                continue;
            }

            if (!isCustomTypeSlug(collection) && !this.typeDefs.has(collection)) {
                continue;
            }

            this.records[collection] = [...(items ?? [])];
        }
    }

    clear(): void {
        this.records = emptyBuckets();
        this.typeDefs.clear();
    }

    private ensureBucket(collection: CollectionSlug): ContentRecord[] {
        if (!this.records[collection]) {
            this.records[collection] = [];
        }

        return this.records[collection];
    }
}
