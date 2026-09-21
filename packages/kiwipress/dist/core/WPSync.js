import { Categories } from "../categories/categories.js";
import { Comments } from "../comments/comments.js";
import { CustomPostType } from "../cpt/cpt.js";
import { sanitizeRestBase } from "../cpt/rest-base.js";
import { isCmsCollection } from "../cms/persistence.js";
import { isCustomTypeSlug } from "../cms/type-registry.js";
import { normalizeWordPressCollection } from "./normalize.js";
import { Media } from "../media/media.js";
import { Pages } from "../pages/pages.js";
import { Posts } from "../posts/posts.js";
import { Tags } from "../tags/tags.js";
import { Users } from "../users/users.js";
import { WordPressTypes } from "../wp-types/wp-types.js";
export function createWordPressClients(config) {
    return {
        posts: new Posts(config),
        pages: new Pages(config),
        users: new Users(config),
        categories: new Categories(config),
        tags: new Tags(config),
        comments: new Comments(config),
        media: new Media(config),
        types: new WordPressTypes(config),
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
        comments: 0,
        media: 0
    };
}
function uniqueCpts(cpts) {
    const seen = new Set();
    const restBases = [];
    for (const entry of cpts) {
        const restBase = sanitizeRestBase(entry);
        const collection = restBase.toLowerCase();
        if (isCmsCollection(collection)) {
            throw new Error(`CPT REST base "${entry}" collides with a built-in WordPress collection. Use collections or includeMedia instead.`);
        }
        if (seen.has(collection)) {
            continue;
        }
        seen.add(collection);
        restBases.push(restBase);
    }
    return restBases;
}
function resolveTransferRequest(input) {
    if (input === undefined) {
        return { collections: [...DEFAULT_COLLECTIONS], cpts: [] };
    }
    if (Array.isArray(input)) {
        return { collections: [...input], cpts: [] };
    }
    const collections = [...(input.collections ?? DEFAULT_COLLECTIONS)];
    if (input.includeMedia && !collections.includes("media")) {
        collections.push("media");
    }
    return {
        collections,
        cpts: uniqueCpts(input.cpts ?? [])
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
    async preview(request = DEFAULT_COLLECTIONS) {
        const { collections, cpts } = resolveTransferRequest(request);
        const counts = emptyCounts();
        for (const collection of collections) {
            const records = await this.readCollection(collection);
            counts[collection] = records.length;
        }
        for (const restBase of cpts) {
            const records = await this.readCpt(restBase);
            counts[restBase.toLowerCase()] = records.length;
        }
        return { collections, cpts, counts };
    }
    async transfer(request = DEFAULT_COLLECTIONS) {
        await this.store.hydrate();
        const { collections, cpts } = resolveTransferRequest(request);
        const counts = emptyCounts();
        const records = [];
        for (const collection of collections) {
            const items = await this.readCollection(collection);
            counts[collection] = items.length;
            for (const item of items) {
                records.push(this.store.upsert(item));
            }
        }
        for (const restBase of cpts) {
            const items = await this.readCpt(restBase);
            const collection = restBase.toLowerCase();
            this.ensureCptCollection(collection);
            counts[collection] = items.length;
            for (const item of items) {
                records.push(this.store.upsert(item));
            }
        }
        await this.store.flush();
        return {
            mode: "nectarine",
            collections,
            cpts,
            counts,
            records
        };
    }
    ensureCptCollection(collection) {
        if (this.store.isRegisteredCollection(collection)) {
            return;
        }
        if (!isCustomTypeSlug(collection)) {
            throw new Error(`CPT REST base "${collection}" is not a valid native collection slug.`);
        }
        this.store.registerType({ slug: collection });
    }
    async readCollection(collection) {
        return this.readAndNormalize(collection, () => {
            const query = transferQuery(collection);
            return collection === "media"
                ? this.wordpress.media.listAll(collection, query)
                : this.wordpress.posts.listAll(collection, query);
        });
    }
    async readCpt(restBase) {
        const client = this.wordpress.cpt(restBase);
        const collection = client.restBase.toLowerCase();
        return this.readAndNormalize(collection, () => client.listAll(client.restBase, { status: "any", context: "edit" }));
    }
    async readAndNormalize(collection, load) {
        try {
            const raw = await load();
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
        case "media":
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