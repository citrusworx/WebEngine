import { CMS_COLLECTIONS } from "./types.js";
import { emptySnapshot } from "./persistence.js";
function emptyBuckets() {
    return emptySnapshot();
}
export class NectarineStore {
    records = emptyBuckets();
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
                const snapshot = await this.adapter.load();
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
    async flush() {
        if (!this.adapter) {
            return;
        }
        const run = this.flushQueue.then(() => this.adapter.save(this.snapshot()));
        this.flushQueue = run.then(() => undefined, () => undefined);
        await run;
    }
    list(collection) {
        return [...this.records[collection]];
    }
    get(collection, id) {
        const needle = String(id);
        return this.records[collection].find((record) => record.id === needle);
    }
    findBySlug(collection, slug) {
        return this.records[collection].find((record) => record.slug === slug);
    }
    upsert(record) {
        const native = {
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
        }
        else {
            bucket.push(native);
        }
        return native;
    }
    remove(collection, id) {
        const needle = String(id);
        const before = this.records[collection].length;
        this.records[collection] = this.records[collection].filter((record) => record.id !== needle);
        return this.records[collection].length !== before;
    }
    snapshot() {
        return {
            posts: this.list("posts"),
            pages: this.list("pages"),
            users: this.list("users"),
            categories: this.list("categories"),
            tags: this.list("tags"),
            comments: this.list("comments")
        };
    }
    replace(snapshot) {
        for (const collection of CMS_COLLECTIONS) {
            this.records[collection] = [...(snapshot[collection] ?? [])];
        }
    }
    clear() {
        this.records = emptyBuckets();
    }
}
//# sourceMappingURL=store.js.map