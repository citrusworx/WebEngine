const COLLECTIONS = [
    "posts",
    "pages",
    "users",
    "categories",
    "tags",
    "comments"
];
function emptyBuckets() {
    return {
        posts: [],
        pages: [],
        users: [],
        categories: [],
        tags: [],
        comments: []
    };
}
export class NectarineStore {
    records = emptyBuckets();
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
        for (const collection of COLLECTIONS) {
            this.records[collection] = [...(snapshot[collection] ?? [])];
        }
    }
    clear() {
        this.records = emptyBuckets();
    }
}
//# sourceMappingURL=store.js.map