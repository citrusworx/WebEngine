import type { CollectionSlug, ContentRecord, NectarinePost } from "../cms/types.js";
export declare function extractTextValue(value: unknown): string;
export declare function asCollection(value: unknown): unknown[];
export declare function normalizeWordPressItem(collection: CollectionSlug, value: unknown, sourceUrl?: string): ContentRecord;
export declare function normalizeWordPressCollection(collection: CollectionSlug, value: unknown, sourceUrl?: string): ContentRecord[];
export declare function toNectarinePost(record: ContentRecord): NectarinePost;
