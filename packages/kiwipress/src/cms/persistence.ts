import {
    CMS_COLLECTIONS,
    type CmsCollection,
    type CmsSnapshot,
    type ContentRecord
} from "./types.js";

export type CmsPersistenceKind = "file" | "postgres" | "memory" | "custom";

export interface CmsPersistence {
    readonly kind?: CmsPersistenceKind;
    load(): Promise<CmsSnapshot | null>;
    save(snapshot: CmsSnapshot): Promise<void>;
}

export function emptySnapshot(): CmsSnapshot {
    return {
        posts: [],
        pages: [],
        users: [],
        categories: [],
        tags: [],
        comments: []
    };
}

export function isCmsCollection(value: string): value is CmsCollection {
    return (CMS_COLLECTIONS as readonly string[]).includes(value);
}

function asObject(value: unknown): Record<string, unknown> | null {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }

    return null;
}

function asContentRecord(value: unknown): ContentRecord | null {
    const record = asObject(value);
    if (!record || typeof record.id !== "string" || typeof record.collection !== "string") {
        return null;
    }

    if (!isCmsCollection(record.collection)) {
        return null;
    }

    const source = asObject(record.source);
    if (!source || (source.cms !== "wordpress" && source.cms !== "nectarine") || typeof source.id !== "string") {
        return null;
    }

    return {
        id: record.id,
        collection: record.collection,
        title: typeof record.title === "string" ? record.title : "",
        content: typeof record.content === "string" ? record.content : "",
        slug: typeof record.slug === "string" ? record.slug : record.id,
        status:
            record.status === "draft" ||
            record.status === "published" ||
            record.status === "archived" ||
            record.status === "pending" ||
            record.status === "approved" ||
            record.status === "spam"
                ? record.status
                : "draft",
        authorId: typeof record.authorId === "string" ? record.authorId : undefined,
        featuredImage: typeof record.featuredImage === "string" ? record.featuredImage : undefined,
        createdAt: typeof record.createdAt === "string" ? record.createdAt : undefined,
        updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : undefined,
        source: {
            cms: source.cms,
            id: source.id,
            url: typeof source.url === "string" ? source.url : undefined
        },
        meta: asObject(record.meta) ?? {}
    };
}

export function normalizeSnapshot(value: unknown): CmsSnapshot {
    const root = asObject(value);
    if (!root) {
        throw new Error("KiwiPress persistence snapshot must be an object.");
    }

    const source = asObject(root.collections) ?? root;
    const snapshot = emptySnapshot();

    for (const collection of CMS_COLLECTIONS) {
        const items = source[collection];
        if (!Array.isArray(items)) {
            continue;
        }

        snapshot[collection] = items
            .map((item) => asContentRecord(item))
            .filter((item): item is ContentRecord => item !== null)
            .map((item) => ({ ...item, collection }));
    }

    return snapshot;
}
