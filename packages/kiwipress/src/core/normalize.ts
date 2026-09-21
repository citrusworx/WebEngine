import type {
    CollectionSlug,
    ContentRecord,
    ContentRecordMeta,
    ContentStatus,
    NectarinePost
} from "../cms/types.js";

export type TextParts = {
    raw?: string;
    rendered?: string;
    text: string;
};

export type MediaByIdClient = {
    getById(id: string | number): Promise<unknown>;
};

function asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }

    return {};
}

/**
 * Split a WordPress rendered-object (`{ raw, rendered }`) or a plain string.
 * `text` is the best available value (raw, then rendered) for titles and compat.
 */
export function extractTextParts(value: unknown): TextParts {
    if (typeof value === "string") {
        return { text: value };
    }

    const candidate = asRecord(value);
    const raw = typeof candidate.raw === "string" ? candidate.raw : undefined;
    const rendered = typeof candidate.rendered === "string" ? candidate.rendered : undefined;
    const text = raw !== undefined ? raw : rendered !== undefined ? rendered : "";

    return {
        ...(raw !== undefined ? { raw } : {}),
        ...(rendered !== undefined ? { rendered } : {}),
        text
    };
}

export function extractRaw(value: unknown): string {
    return extractTextParts(value).raw ?? "";
}

export function extractRendered(value: unknown): string {
    return extractTextParts(value).rendered ?? "";
}

/** Best available text: `raw`, then `rendered`, then a plain string. */
export function extractTextValue(value: unknown): string {
    if (typeof value === "string") {
        return value;
    }

    return extractTextParts(value).text;
}

export function asCollection(value: unknown): unknown[] {
    if (Array.isArray(value)) {
        return value;
    }

    if (value == null) {
        return [];
    }

    return [value];
}

function mapStatus(value: unknown): ContentStatus {
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

function stringId(value: unknown): string {
    if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
    }

    if (typeof value === "string" && value.length > 0) {
        return value;
    }

    return "";
}

function embeddedFeaturedMediaUrl(item: Record<string, unknown>): string | undefined {
    const embedded = asRecord(item._embedded);
    const media = asCollection(embedded["wp:featuredmedia"]);
    const first = asRecord(media[0]);

    return typeof first.source_url === "string" && first.source_url ? first.source_url : undefined;
}

/**
 * Featured image URL from a WordPress item.
 * Prefers `_embedded["wp:featuredmedia"][0].source_url`, then the previous
 * normalize fallbacks (`featured_image`, `source_url`, numeric `featured_media`).
 */
export function featuredImageFrom(value: unknown): string | undefined {
    const item = asRecord(value);
    const embeddedUrl = embeddedFeaturedMediaUrl(item);
    if (embeddedUrl) {
        return embeddedUrl;
    }

    if (typeof item.featured_image === "string" && item.featured_image) {
        return item.featured_image;
    }

    if (typeof item.source_url === "string" && item.source_url) {
        return item.source_url;
    }

    if (typeof item.featured_media === "number" && Number.isFinite(item.featured_media) && item.featured_media > 0) {
        return String(item.featured_media);
    }

    if (typeof item.featured_media === "string" && item.featured_media) {
        return item.featured_media;
    }

    return undefined;
}

/**
 * Resolve a featured-media id through `Media.getById` and return `source_url`.
 * Returns undefined for empty/zero ids. Does not change `getAll()` behavior.
 */
export async function resolveFeaturedImageUrl(
    mediaClient: MediaByIdClient,
    id: string | number
): Promise<string | undefined> {
    if (id === 0 || id === "0" || id === "") {
        return undefined;
    }

    const response = await mediaClient.getById(id);
    if (response == null) {
        return undefined;
    }

    const first = asCollection(response)[0];
    return featuredImageFrom(first ?? response);
}

function untitledLabel(collection: CollectionSlug): string {
    if (collection === "media") {
        return "Untitled media";
    }

    return `Untitled ${collection.replace(/s$/, "") || collection}`;
}

function itemStatus(collection: CollectionSlug, value: unknown): ContentStatus {
    if (collection === "media" && String(value ?? "").toLowerCase() === "inherit") {
        return "published";
    }

    return mapStatus(value);
}

function assignDualText(
    meta: ContentRecordMeta,
    value: unknown,
    rawKey: "titleRaw" | "contentRaw" | "excerptRaw",
    renderedKey: "titleRendered" | "contentRendered" | "excerptRendered"
) {
    const parts = extractTextParts(value);
    if (parts.raw !== undefined) {
        meta[rawKey] = parts.raw;
    }
    if (parts.rendered !== undefined) {
        meta[renderedKey] = parts.rendered;
    }
}

function itemMeta(item: Record<string, unknown>): ContentRecordMeta {
    const meta: ContentRecordMeta = {
        email: item.email,
        name: item.name,
        count: item.count,
        parent: item.parent,
        post: item.post,
        featured_media: item.featured_media,
        source_url: item.source_url,
        alt_text: item.alt_text,
        mime_type: item.mime_type,
        media_type: item.media_type,
        raw: item
    };

    if ("title" in item) {
        assignDualText(meta, item.title, "titleRaw", "titleRendered");
    }
    if ("content" in item) {
        assignDualText(meta, item.content, "contentRaw", "contentRendered");
    }
    if ("excerpt" in item) {
        assignDualText(meta, item.excerpt, "excerptRaw", "excerptRendered");
    }

    const wpMeta = item.meta;
    if (wpMeta && typeof wpMeta === "object" && !Array.isArray(wpMeta)) {
        meta.wpMeta = wpMeta as Record<string, unknown>;
    }

    if ("acf" in item) {
        meta.acf = item.acf;
    }

    return meta;
}

export function normalizeWordPressItem(
    collection: CollectionSlug,
    value: unknown,
    sourceUrl?: string
): ContentRecord {
    const item = asRecord(value);
    const id = stringId(item.id) || stringId(item.ID);
    const title =
        extractTextValue(item.title) ||
        extractTextValue(item.name) ||
        extractTextValue(item.caption) ||
        extractTextValue(item.alt_text) ||
        extractTextValue(item.slug) ||
        untitledLabel(collection);
    const content =
        extractTextValue(item.content) ||
        extractTextValue(item.description) ||
        extractTextValue(item.caption) ||
        extractTextValue(item.excerpt);

    return {
        id: id || `${collection}:${title}`,
        collection,
        title,
        content,
        slug: typeof item.slug === "string" ? item.slug : "",
        status: itemStatus(collection, item.status),
        authorId: stringId(item.author) || stringId(item.author_id) || undefined,
        featuredImage: featuredImageFrom(item),
        createdAt: typeof item.date === "string" ? item.date : typeof item.date_gmt === "string" ? item.date_gmt : undefined,
        updatedAt: typeof item.modified === "string" ? item.modified : undefined,
        source: {
            cms: "wordpress",
            id: id || title,
            url: sourceUrl
        },
        meta: itemMeta(item)
    };
}

export function normalizeWordPressCollection(
    collection: CollectionSlug,
    value: unknown,
    sourceUrl?: string
): ContentRecord[] {
    return asCollection(value).map((item) => normalizeWordPressItem(collection, item, sourceUrl));
}

export function toNectarinePost(record: ContentRecord): NectarinePost {
    const rawStatus = String(record.status);
    const status =
        rawStatus === "published" || rawStatus === "archived" ? rawStatus : "draft";

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
