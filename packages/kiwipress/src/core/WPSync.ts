import { Categories } from "../categories/categories.js";
import { Comments } from "../comments/comments.js";
import { NectarineStore } from "../cms/store.js";
import type { CmsCollection, TransferCounts, TransferPreview, TransferResult } from "../cms/types.js";
import { normalizeWordPressCollection } from "./normalize.js";
import { Pages } from "../pages/pages.js";
import { Posts } from "../posts/posts.js";
import { Tags } from "../tags/tags.js";
import { Users } from "../users/users.js";

export type WordPressClients = {
    posts: Posts;
    pages: Pages;
    users: Users;
    categories: Categories;
    tags: Tags;
    comments: Comments;
};

const DEFAULT_COLLECTIONS: CmsCollection[] = [
    "posts",
    "pages",
    "users",
    "categories",
    "tags",
    "comments"
];

function emptyCounts(): TransferCounts {
    return {
        posts: 0,
        pages: 0,
        users: 0,
        categories: 0,
        tags: 0,
        comments: 0
    };
}

export class WPSync {
    constructor(
        private readonly wordpress: WordPressClients,
        private readonly store: NectarineStore,
        private readonly sourceUrl?: string
    ) {}

    async preview(collections: CmsCollection[] = DEFAULT_COLLECTIONS): Promise<TransferPreview> {
        const counts = emptyCounts();

        for (const collection of collections) {
            const records = await this.readCollection(collection);
            counts[collection] = records.length;
        }

        return { collections, counts };
    }

    async transfer(collections: CmsCollection[] = DEFAULT_COLLECTIONS): Promise<TransferResult> {
        const counts = emptyCounts();
        const records = [];

        for (const collection of collections) {
            const items = await this.readCollection(collection);
            counts[collection] = items.length;

            for (const item of items) {
                records.push(this.store.upsert(item));
            }
        }

        return {
            mode: "nectarine",
            counts,
            records
        };
    }

    private async readCollection(collection: CmsCollection) {
        try {
            const raw = await this.loadRaw(collection);
            return normalizeWordPressCollection(collection, raw, this.sourceUrl);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`WPSync failed to read WordPress ${collection}: ${message}`);
        }
    }

    private loadRaw(collection: CmsCollection) {
        switch (collection) {
            case "posts":
                return this.wordpress.posts.getAll();
            case "pages":
                return this.wordpress.pages.getAll();
            case "users":
                return this.wordpress.users.getAll();
            case "categories":
                return this.wordpress.categories.getAll();
            case "tags":
                return this.wordpress.tags.getAll();
            case "comments":
                return this.wordpress.comments.getAll();
        }
    }
}
