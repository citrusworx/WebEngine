function slugFromTitle(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `item-${Date.now()}`;
}
function asStatus(value, fallback = "draft") {
    if (value === "draft" ||
        value === "published" ||
        value === "archived" ||
        value === "pending" ||
        value === "approved" ||
        value === "spam") {
        return value;
    }
    if (value === "publish") {
        return "published";
    }
    return fallback;
}
export class NativeCollection {
    store;
    collection;
    constructor(store, collection) {
        this.store = store;
        this.collection = collection;
    }
    getAll() {
        return Promise.resolve(this.store.list(this.collection));
    }
    getById(id) {
        return Promise.resolve(this.store.get(this.collection, id));
    }
    getBySlug(slug) {
        return Promise.resolve(this.store.findBySlug(this.collection, slug));
    }
    create(data) {
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
            meta: {}
        };
        return Promise.resolve(this.store.upsert(record));
    }
    update(id, data) {
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
            updatedAt: new Date().toISOString()
        };
        return Promise.resolve(this.store.upsert(next));
    }
    delete(id) {
        return Promise.resolve(this.store.remove(this.collection, id));
    }
}
export function createNativeCms(store) {
    return {
        posts: new NativeCollection(store, "posts"),
        pages: new NativeCollection(store, "pages"),
        users: new NativeCollection(store, "users"),
        categories: new NativeCollection(store, "categories"),
        tags: new NativeCollection(store, "tags"),
        comments: new NativeCollection(store, "comments")
    };
}
//# sourceMappingURL=native.js.map