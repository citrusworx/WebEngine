export type CmsMode = "wordpress" | "nectarine";

export const CMS_COLLECTIONS = [
    "posts",
    "pages",
    "users",
    "categories",
    "tags",
    "comments"
] as const;

export type CmsCollection = (typeof CMS_COLLECTIONS)[number];

export type ContentStatus =
    | "draft"
    | "published"
    | "archived"
    | "pending"
    | "approved"
    | "spam";

export type ContentSource = {
    cms: CmsMode;
    id: string;
    url?: string;
};

export type ContentRecord = {
    id: string;
    collection: CmsCollection;
    title: string;
    content: string;
    slug: string;
    status: ContentStatus;
    authorId?: string;
    featuredImage?: string;
    createdAt?: string;
    updatedAt?: string;
    source: ContentSource;
    meta: Record<string, unknown>;
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

export type CmsSnapshot = Record<CmsCollection, ContentRecord[]>;

export type TransferCounts = Record<CmsCollection, number>;

export type TransferPreview = {
    collections: CmsCollection[];
    counts: TransferCounts;
};

export type TransferResult = {
    mode: "nectarine";
    counts: TransferCounts;
    records: ContentRecord[];
};
