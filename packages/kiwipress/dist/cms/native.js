function slugFromTitle(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `item-${Date.now()}`;
}
function asStatus(value, fallback = "draft") {
    if (value === "publish") {
        return "published";
    }
    if (typeof value === "string" && value.trim()) {
        return value.trim();
    }
    return fallback;
}
function asMeta(value) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return { ...value };
    }
    return {};
}
export class NativeCollection {
    store;
    collection;
    constructor(store, collection) {
        this.store = store;
        this.collection = collection;
    }
    async getAll() {
        await this.store.hydrate();
        return this.store.list(this.collection);
    }
    async getById(id) {
        await this.store.hydrate();
        return this.store.get(this.collection, id);
    }
    async getBySlug(slug) {
        await this.store.hydrate();
        return this.store.findBySlug(this.collection, slug);
    }
    async create(data) {
        await this.store.hydrate();
        if (!this.store.isRegisteredCollection(this.collection)) {
            throw new Error(`Unknown KiwiPress collection "${this.collection}".`);
        }
        const title = typeof data.title === "string" ? data.title : "Untitled";
        const id = typeof data.id === "string" || typeof data.id === "number" ? String(data.id) : crypto.randomUUID();
        const record = {
            id,
            collection: this.collection,
            title,
            content: typeof data.content === "string" ? data.content : "",
            slug: typeof data.slug === "string" ? data.slug : slugFromTitle(title),
            status: asStatus(data.status),
            authorId: typeof data.authorId === "string" ? data.authorId : undefined,
            featuredImage: typeof data.featuredImage === "string" ? data.featuredImage : undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: {
                cms: "nectarine",
                id
            },
            meta: asMeta("meta" in data ? data.meta : undefined)
        };
        const created = this.store.upsert(record);
        await this.store.flush();
        return created;
    }
    async update(id, data) {
        await this.store.hydrate();
        const existing = this.store.get(this.collection, id);
        if (!existing) {
            throw new Error(`Nectarine ${this.collection} ${id} was not found.`);
        }
        const next = {
            ...existing,
            title: typeof data.title === "string" ? data.title : existing.title,
            content: typeof data.content === "string" ? data.content : existing.content,
            slug: typeof data.slug === "string" ? data.slug : existing.slug,
            status: asStatus(data.status, existing.status),
            updatedAt: new Date().toISOString(),
            meta: "meta" in data ? { ...existing.meta, ...asMeta(data.meta) } : existing.meta
        };
        const updated = this.store.upsert(next);
        await this.store.flush();
        return updated;
    }
    async delete(id) {
        await this.store.hydrate();
        const removed = this.store.remove(this.collection, id);
        await this.store.flush();
        return removed;
    }
}
export function createNativeCms(store) {
    return {
        posts: new NativeCollection(store, "posts"),
        pages: new NativeCollection(store, "pages"),
        users: new NativeCollection(store, "users"),
        categories: new NativeCollection(store, "categories"),
        tags: new NativeCollection(store, "tags"),
        comments: new NativeCollection(store, "comments"),
        media: new NativeCollection(store, "media"),
        collection(slug) {
            return new NativeCollection(store, slug);
        }
    };
}
//# sourceMappingURL=native.js.map