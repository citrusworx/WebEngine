import type { CollectionSlug, ContentRecord, NectarinePost } from "../cms/types.js";
export type TextParts = {
    raw?: string;
    rendered?: string;
    text: string;
};
export type MediaByIdClient = {
    getById(id: string | number): Promise<unknown>;
};
/**
 * Split a WordPress rendered-object (`{ raw, rendered }`) or a plain string.
 * `text` is the best available value (raw, then rendered) for titles and compat.
 */
export declare function extractTextParts(value: unknown): TextParts;
export declare function extractRaw(value: unknown): string;
export declare function extractRendered(value: unknown): string;
/** Best available text: `raw`, then `rendered`, then a plain string. */
export declare function extractTextValue(value: unknown): string;
export declare function asCollection(value: unknown): unknown[];
/**
 * Featured image URL from a WordPress item.
 * Prefers `_embedded["wp:featuredmedia"][0].source_url`, then the previous
 * normalize fallbacks (`featured_image`, `source_url`, numeric `featured_media`).
 */
export declare function featuredImageFrom(value: unknown): string | undefined;
/**
 * Resolve a featured-media id through `Media.getById` and return `source_url`.
 * Returns undefined for empty/zero ids. Does not change `getAll()` behavior.
 */
export declare function resolveFeaturedImageUrl(mediaClient: MediaByIdClient, id: string | number): Promise<string | undefined>;
export declare function normalizeWordPressItem(collection: CollectionSlug, value: unknown, sourceUrl?: string): ContentRecord;
export declare function normalizeWordPressCollection(collection: CollectionSlug, value: unknown, sourceUrl?: string): ContentRecord[];
export declare function toNectarinePost(record: ContentRecord): NectarinePost;
