import type { CmsCollection, ContentRecord } from "./types.js";

const COLLECTIONS: CmsCollection[] = [
    "posts",
    "pages",
    "users",
    "categories",
    "tags",
    "comments"
];

function emptyBuckets(): Record<CmsCollection, ContentRecord[]> {
    return {
        posts: [],
        pages: [],
        users: [],
        categories: [],
        tags: [],
        comments: []
    };
}

export class NectarineStore {
    private records: Record<CmsCollection, ContentRecord[]> = emptyBuckets();

    list(collection: CmsCollection): ContentRecord[] {
        return [...this.records[collection]];
    }

    get(collection: CmsCollection, id: string | number): ContentRecord | undefined {
        const needle = String(id);
        return this.records[collection].find((record) => record.id === needle);
    }

    findBySlug(collection: CmsCollection, slug: string): ContentRecord | undefined {
        return this.records[collection].find((record) => record.slug === slug);
    }

    upsert(record: ContentRecord): ContentRecord {
        const native: ContentRecord = {
            ...record,
            source: {
                ...record.source,
                cms: "nectarine"
            }
        };
        const bucket = this.records[native.collection];
        const index = bucket.findIndex((entry) => entry.id === native.id);

        if (index >= 0) {
            bucket[index] = native;
        } else {
            bucket.push(native);
        }

        return native;
    }

    remove(collection: CmsCollection, id: string | number): boolean {
        const needle = String(id);
        const before = this.records[collection].length;
        this.records[collection] = this.records[collection].filter((record) => record.id !== needle);
        return this.records[collection].length !== before;
    }

    snapshot(): Record<CmsCollection, ContentRecord[]> {
        return {
            posts: this.list("posts"),
            pages: this.list("pages"),
            users: this.list("users"),
            categories: this.list("categories"),
            tags: this.list("tags"),
            comments: this.list("comments")
        };
    }

    replace(snapshot: Partial<Record<CmsCollection, ContentRecord[]>>): void {
        for (const collection of COLLECTIONS) {
            this.records[collection] = [...(snapshot[collection] ?? [])];
        }
    }

    clear(): void {
        this.records = emptyBuckets();
    }
}
