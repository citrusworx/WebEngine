export type CollectionKind = string;

export type ContentItem = {
    id: string;
    kind: CollectionKind;
    title: string;
    slug: string;
    status: string;
    date: string;
    content: string;
};

export type ContentPayload = {
    title: string;
    slug?: string;
    status: string;
    content: string;
};

export type CollectionWorkspaceCopy = {
    kind: CollectionKind;
    title: string;
    singular: string;
    lede: string;
    emptyTitle: string;
    emptyBody: string;
};
