export type CmsMode = "wordpress" | "nectarine";
export declare const CMS_COLLECTIONS: readonly ["posts", "pages", "users", "categories", "tags", "comments", "media"];
export type CmsCollection = (typeof CMS_COLLECTIONS)[number];
/** Built-in WordPress-oriented collection, or a registered custom type slug. */
export type CollectionSlug = CmsCollection | (string & {});
export declare const DEFAULT_TYPE_STATUSES: readonly ["draft", "published", "archived"];
export declare const DEFAULT_TYPE_FIELDS: readonly ["title", "slug", "status", "content", "meta"];
export type CollectionFieldId = (typeof DEFAULT_TYPE_FIELDS)[number];
export type CollectionTypeDefinition = {
    slug: string;
    label: string;
    singular: string;
    statuses: string[];
    fields: CollectionFieldId[];
    createdAt: string;
    updatedAt: string;
};
export type ContentStatus = "draft" | "published" | "archived" | "pending" | "approved" | "spam";
export type ContentSource = {
    cms: CmsMode;
    id: string;
    url?: string;
};
/**
 * Extra WordPress fields kept off the top-level `ContentRecord` shape.
 * Dual text (`*Raw` / `*Rendered`) needs `context=edit` plus authentication.
 * `wpMeta` is the WordPress REST `meta` object; `acf` is passed through when present.
 */
export type ContentRecordMeta = {
    titleRaw?: string;
    titleRendered?: string;
    contentRaw?: string;
    contentRendered?: string;
    excerptRaw?: string;
    excerptRendered?: string;
    wpMeta?: Record<string, unknown>;
    acf?: unknown;
    email?: unknown;
    name?: unknown;
    count?: unknown;
    parent?: unknown;
    post?: unknown;
    featured_media?: unknown;
    source_url?: unknown;
    alt_text?: unknown;
    mime_type?: unknown;
    media_type?: unknown;
    raw?: Record<string, unknown>;
    [key: string]: unknown;
};
export type ContentRecord = {
    id: string;
    collection: CollectionSlug;
    title: string;
    content: string;
    slug: string;
    status: ContentStatus | (string & {});
    authorId?: string;
    featuredImage?: string;
    createdAt?: string;
    updatedAt?: string;
    source: ContentSource;
    meta: ContentRecordMeta;
};
export type NectarinePost = {
    id: string;
    title: string;
    content: string;
    slug: string;
    status: "draft" | "published" | "archived";
    featured_image?: string;
    author_id?: string;
    created_at?: string;
    updated_at?: string;
};
export type CmsSnapshot = Record<CmsCollection, ContentRecord[]> & {
    [collection: string]: ContentRecord[];
};
export type CmsDocument = {
    collections: CmsSnapshot;
    types: CollectionTypeDefinition[];
};
export type TransferCounts = Record<CmsCollection, number> & {
    [collection: string]: number;
};
export type TransferOptions = {
    collections?: CmsCollection[];
    includeMedia?: boolean;
    cpts?: string[];
    taxonomies?: string[];
};
export type TransferRequest = CmsCollection[] | TransferOptions;
export type TransferPreview = {
    collections: CmsCollection[];
    cpts: string[];
    taxonomies: string[];
    counts: TransferCounts;
};
export type TransferResult = {
    mode: "nectarine";
    collections: CmsCollection[];
    cpts: string[];
    taxonomies: string[];
    counts: TransferCounts;
    records: ContentRecord[];
};
