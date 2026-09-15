import type { WordPressPayload } from "../types/api.js";
import type { CmsCollection, ContentRecord, ContentStatus } from "./types.js";
import { NectarineStore } from "./store.js";

function slugFromTitle(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `item-${Date.now()}`;
}

function asStatus(value: unknown, fallback: ContentStatus = "draft"): ContentStatus {
    if (
        value === "draft" ||
        value === "published" ||
        value === "archived" ||
        value === "pending" ||
        value === "approved" ||
        value === "spam"
    ) {
        return value;
    }

    if (value === "publish") {
        return "published";
    }

    return fallback;
}

export class NativeCollection {
    constructor(
        private readonly store: NectarineStore,
        private readonly collection: CmsCollection
    ) {}

    getAll(): Promise<ContentRecord[]> {
        return Promise.resolve(this.store.list(this.collection));
    }

    getById(id: string | number): Promise<ContentRecord | undefined> {
        return Promise.resolve(this.store.get(this.collection, id));
    }

    getBySlug(slug: string): Promise<ContentRecord | undefined> {
        return Promise.resolve(this.store.findBySlug(this.collection, slug));
    }

    create(data: WordPressPayload | Partial<ContentRecord>): Promise<ContentRecord> {
        const title = typeof data.title === "string" ? data.title : "Untitled";
        const id = typeof data.id === "string" || typeof data.id === "number" ? String(data.id) : crypto.randomUUID();
        const record: ContentRecord = {
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

    update(id: string | number, data: WordPressPayload | Partial<ContentRecord>): Promise<ContentRecord> {
        const existing = this.store.get(this.collection, id);

        if (!existing) {
            throw new Error(`Nectarine ${this.collection} ${id} was not found.`);
        }

        const next: ContentRecord = {
            ...existing,
            title: typeof data.title === "string" ? data.title : existing.title,
            content: typeof data.content === "string" ? data.content : existing.content,
            slug: typeof data.slug === "string" ? data.slug : existing.slug,
            status: asStatus(data.status, existing.status),
            updatedAt: new Date().toISOString()
        };

        return Promise.resolve(this.store.upsert(next));
    }

    delete(id: string | number): Promise<boolean> {
        return Promise.resolve(this.store.remove(this.collection, id));
    }
}

export type NativeCms = {
    posts: NativeCollection;
    pages: NativeCollection;
    users: NativeCollection;
    categories: NativeCollection;
    tags: NativeCollection;
    comments: NativeCollection;
};

export function createNativeCms(store: NectarineStore): NativeCms {
    return {
        posts: new NativeCollection(store, "posts"),
        pages: new NativeCollection(store, "pages"),
        users: new NativeCollection(store, "users"),
        categories: new NativeCollection(store, "categories"),
        tags: new NativeCollection(store, "tags"),
        comments: new NativeCollection(store, "comments")
    };
}
