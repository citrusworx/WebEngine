import { CMS_COLLECTIONS, type CmsCollection, type CmsSnapshot, type ContentRecord } from "./types.js";
import type { CmsPersistence, CmsPersistenceKind } from "./persistence.js";
import { emptySnapshot } from "./persistence.js";

function emptyBuckets(): CmsSnapshot {
    return emptySnapshot();
}

export class NectarineStore {
    private records: CmsSnapshot = emptyBuckets();
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
                const snapshot = await this.adapter!.load();
                if (snapshot) {
                    this.replace(snapshot);
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

        const run = this.flushQueue.then(() => this.adapter!.save(this.snapshot()));
        this.flushQueue = run.then(
            () => undefined,
            () => undefined
        );
        await run;
    }

    list(collection: CmsCollection): ContentRecord[] {
        return [...this.records[collection]];
    }

    get(collection: CmsCollection, id: string | number): ContentRecord | undefined {
        const needle = String(id);
        return this.records[collection].find((record) => record.id === needle);
    }

    findBySlug(collection: CmsCollection, slug: string): ContentRecord | undefined {
        return this.records[collection].find((record) => record.slug === slug);
    }

    upsert(record: ContentRecord): ContentRecord {
        const native: ContentRecord = {
            ...record,
            source: {
                ...record.source,
                cms: "nectarine"
            }
        };
        const bucket = this.records[native.collection];
        const index = bucket.findIndex((entry) => entry.id === native.id);

        if (index >= 0) {
            bucket[index] = native;
        } else {
            bucket.push(native);
        }

        return native;
    }

    remove(collection: CmsCollection, id: string | number): boolean {
        const needle = String(id);
        const before = this.records[collection].length;
        this.records[collection] = this.records[collection].filter((record) => record.id !== needle);
        return this.records[collection].length !== before;
    }

    snapshot(): CmsSnapshot {
        return {
            posts: this.list("posts"),
            pages: this.list("pages"),
            users: this.list("users"),
            categories: this.list("categories"),
            tags: this.list("tags"),
            comments: this.list("comments")
        };
    }

    replace(snapshot: Partial<CmsSnapshot>): void {
        for (const collection of CMS_COLLECTIONS) {
            this.records[collection] = [...(snapshot[collection] ?? [])];
        }
    }

    clear(): void {
        this.records = emptyBuckets();
    }
}
