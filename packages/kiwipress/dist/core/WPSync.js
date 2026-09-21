import { Categories } from "../categories/categories.js";
import { Comments } from "../comments/comments.js";
import { CustomPostType } from "../cpt/cpt.js";
import { normalizeWordPressCollection } from "./normalize.js";
import { Media } from "../media/media.js";
import { Pages } from "../pages/pages.js";
import { Posts } from "../posts/posts.js";
import { Tags } from "../tags/tags.js";
import { Users } from "../users/users.js";
export function createWordPressClients(config) {
    return {
        posts: new Posts(config),
        pages: new Pages(config),
        users: new Users(config),
        categories: new Categories(config),
        tags: new Tags(config),
        comments: new Comments(config),
        media: new Media(config),
        cpt(restBase) {
            return new CustomPostType(config, restBase);
        }
    };
}
const DEFAULT_COLLECTIONS = [
    "posts",
    "pages",
    "users",
    "categories",
    "tags",
    "comments"
];
function emptyCounts() {
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
    wordpress;
    store;
    sourceUrl;
    constructor(wordpress, store, sourceUrl) {
        this.wordpress = wordpress;
        this.store = store;
        this.sourceUrl = sourceUrl;
    }
    async preview(collections = DEFAULT_COLLECTIONS) {
        const counts = emptyCounts();
        for (const collection of collections) {
            const records = await this.readCollection(collection);
            counts[collection] = records.length;
        }
        return { collections, counts };
    }
    async transfer(collections = DEFAULT_COLLECTIONS) {
        await this.store.hydrate();
        const counts = emptyCounts();
        const records = [];
        for (const collection of collections) {
            const items = await this.readCollection(collection);
            counts[collection] = items.length;
            for (const item of items) {
                records.push(this.store.upsert(item));
            }
        }
        await this.store.flush();
        return {
            mode: "nectarine",
            counts,
            records
        };
    }
    async readCollection(collection) {
        try {
            const raw = await this.wordpress.posts.listAll(collection, transferQuery(collection));
            return normalizeWordPressCollection(collection, raw, this.sourceUrl);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`WPSync failed to read WordPress ${collection}: ${message}`);
        }
    }
}
function transferQuery(collection) {
    switch (collection) {
        case "posts":
        case "pages":
            return { status: "any", context: "edit" };
        case "comments":
            return { status: "any", context: "edit" };
        case "users":
            return { context: "edit" };
        case "categories":
        case "tags":
            return { hide_empty: "false" };
    }
}
//# sourceMappingURL=WPSync.js.map