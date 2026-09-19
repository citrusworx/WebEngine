function asRecord(value) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value;
    }
    return {};
}
export function extractTextValue(value) {
    if (typeof value === "string") {
        return value;
    }
    const candidate = asRecord(value);
    if (typeof candidate.raw === "string") {
        return candidate.raw;
    }
    if (typeof candidate.rendered === "string") {
        return candidate.rendered;
    }
    return "";
}
export function asCollection(value) {
    if (Array.isArray(value)) {
        return value;
    }
    if (value == null) {
        return [];
    }
    return [value];
}
function mapStatus(value) {
    switch (String(value ?? "").toLowerCase()) {
        case "publish":
        case "published":
            return "published";
        case "pending":
            return "pending";
        case "approved":
            return "approved";
        case "spam":
            return "spam";
        case "private":
        case "future":
        case "trash":
        case "archived":
            return "archived";
        default:
            return "draft";
    }
}
function stringId(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
    }
    if (typeof value === "string" && value.length > 0) {
        return value;
    }
    return "";
}
export function normalizeWordPressItem(collection, value, sourceUrl) {
    const item = asRecord(value);
    const id = stringId(item.id) || stringId(item.ID);
    const title = extractTextValue(item.title) ||
        extractTextValue(item.name) ||
        extractTextValue(item.slug) ||
        `Untitled ${collection.slice(0, -1)}`;
    const content = extractTextValue(item.content) ||
        extractTextValue(item.description) ||
        extractTextValue(item.excerpt);
    return {
        id: id || `${collection}:${title}`,
        collection,
        title,
        content,
        slug: typeof item.slug === "string" ? item.slug : "",
        status: mapStatus(item.status),
        authorId: stringId(item.author) || stringId(item.author_id) || undefined,
        featuredImage: typeof item.featured_image === "string"
            ? item.featured_image
            : typeof item.featured_media === "number"
                ? String(item.featured_media)
                : undefined,
        createdAt: typeof item.date === "string" ? item.date : typeof item.date_gmt === "string" ? item.date_gmt : undefined,
        updatedAt: typeof item.modified === "string" ? item.modified : undefined,
        source: {
            cms: "wordpress",
            id: id || title,
            url: sourceUrl
        },
        meta: {
            email: item.email,
            name: item.name,
            count: item.count,
            parent: item.parent,
            post: item.post,
            raw: item
        }
    };
}
export function normalizeWordPressCollection(collection, value, sourceUrl) {
    return asCollection(value).map((item) => normalizeWordPressItem(collection, item, sourceUrl));
}
export function toNectarinePost(record) {
    const rawStatus = String(record.status);
    const status = rawStatus === "published" || rawStatus === "archived" ? rawStatus : "draft";
    return {
        id: record.id,
        title: record.title,
        content: record.content,
        slug: record.slug,
        status,
        featured_image: record.featuredImage,
        author_id: record.authorId,
        created_at: record.createdAt,
        updated_at: record.updatedAt
    };
}
//# sourceMappingURL=normalize.js.map