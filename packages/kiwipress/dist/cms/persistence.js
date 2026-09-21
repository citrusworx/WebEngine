import { CMS_COLLECTIONS } from "./types.js";
import { asTypeDefinition, isCollectionSlug, PERSISTED_TYPES_COLLECTION } from "./type-registry.js";
export function emptySnapshot() {
    return {
        posts: [],
        pages: [],
        users: [],
        categories: [],
        tags: [],
        comments: [],
        media: []
    };
}
export function emptyDocument() {
    return {
        collections: emptySnapshot(),
        types: []
    };
}
export function isCmsCollection(value) {
    return CMS_COLLECTIONS.includes(value);
}
export function isCmsDocument(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }
    const candidate = value;
    return Boolean(candidate.collections) && Array.isArray(candidate.types);
}
function asObject(value) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value;
    }
    return null;
}
function asContentRecord(value) {
    const record = asObject(value);
    if (!record || typeof record.id !== "string" || typeof record.collection !== "string") {
        return null;
    }
    if (!isCollectionSlug(record.collection) || record.collection === PERSISTED_TYPES_COLLECTION) {
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
        status: typeof record.status === "string" && record.status.trim()
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
function readCollectionItems(value, collection) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((item) => asContentRecord(item))
        .filter((item) => item !== null)
        .map((item) => ({ ...item, collection }));
}
export function normalizeSnapshot(value) {
    const root = asObject(value);
    if (!root) {
        throw new Error("KiwiPress persistence snapshot must be an object.");
    }
    const source = asObject(root.collections) ?? root;
    const snapshot = emptySnapshot();
    for (const [collection, items] of Object.entries(source)) {
        if (collection === "types" || collection === PERSISTED_TYPES_COLLECTION) {
            continue;
        }
        if (!isCollectionSlug(collection) && !isCmsCollection(collection)) {
            continue;
        }
        snapshot[collection] = readCollectionItems(items, collection);
    }
    return snapshot;
}
export function normalizeDocument(value) {
    const root = asObject(value);
    if (!root) {
        throw new Error("KiwiPress persistence document must be an object.");
    }
    const typesSource = Array.isArray(root.types)
        ? root.types
        : Array.isArray(asObject(root.collections)?.types)
            ? asObject(root.collections)?.types
            : [];
    const types = typesSource
        .map((entry) => asTypeDefinition(entry))
        .filter((entry) => entry !== null);
    return {
        collections: normalizeSnapshot(value),
        types
    };
}
export function coerceDocument(value) {
    if (!value) {
        return null;
    }
    if (isCmsDocument(value)) {
        return {
            collections: normalizeSnapshot({ collections: value.collections }),
            types: value.types
                .map((entry) => asTypeDefinition(entry))
                .filter((entry) => entry !== null)
        };
    }
    return {
        collections: normalizeSnapshot(value),
        types: []
    };
}
//# sourceMappingURL=persistence.js.map