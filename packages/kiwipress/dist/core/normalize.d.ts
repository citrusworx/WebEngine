import type { CmsCollection, ContentRecord, NectarinePost } from "../cms/types.js";
export declare function extractTextValue(value: unknown): string;
export declare function asCollection(value: unknown): unknown[];
export declare function normalizeWordPressItem(collection: CmsCollection, value: unknown, sourceUrl?: string): ContentRecord;
export declare function normalizeWordPressCollection(collection: CmsCollection, value: unknown, sourceUrl?: string): ContentRecord[];
export declare function toNectarinePost(record: ContentRecord): NectarinePost;
