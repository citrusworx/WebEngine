import { Categories } from "../categories/categories.js";
import { Comments } from "../comments/comments.js";
import { CustomPostType } from "../cpt/cpt.js";
import { sanitizeRestBase } from "../cpt/rest-base.js";
import { NectarineStore } from "../cms/store.js";
import { isCmsCollection } from "../cms/persistence.js";
import type {
    CmsCollection,
    CollectionSlug,
    ContentRecord,
    TransferCounts,
    TransferPreview,
    TransferRequest,
    TransferResult
} from "../cms/types.js";
import { isCustomTypeSlug } from "../cms/type-registry.js";
import { normalizeWordPressCollection } from "./normalize.js";
import type { WPCoreConfig } from "./WPCore.js";
import { Media } from "../media/media.js";
import { Pages } from "../pages/pages.js";
import { Posts } from "../posts/posts.js";
import { Tags } from "../tags/tags.js";
import { CustomTaxonomy } from "../taxonomy/taxonomy.js";
import { Users } from "../users/users.js";
import { WordPressTaxonomies } from "../wp-taxonomies/wp-taxonomies.js";
import { WordPressTypes } from "../wp-types/wp-types.js";

export type WordPressClients = {
    posts: Posts;
    pages: Pages;
    users: Users;
    categories: Categories;
    tags: Tags;
    comments: Comments;
    media: Media;
    types: WordPressTypes;
    taxonomies: WordPressTaxonomies;
    cpt(restBase: string): CustomPostType;
    taxonomy(restBase: string): CustomTaxonomy;
};

export function createWordPressClients(config: Partial<WPCoreConfig>): WordPressClients {
    return {
        posts: new Posts(config),
        pages: new Pages(config),
        users: new Users(config),
        categories: new Categories(config),
        tags: new Tags(config),
        comments: new Comments(config),
        media: new Media(config),
        types: new WordPressTypes(config),
        taxonomies: new WordPressTaxonomies(config),
        cpt(restBase: string) {
            return new CustomPostType(config, restBase);
        },
        taxonomy(restBase: string) {
            return new CustomTaxonomy(config, restBase);
        }
    };
}

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
        comments: 0,
        media: 0
    };
}

function uniqueCpts(cpts: string[]): string[] {
    return uniqueCustomRestBases(
        cpts,
        (entry) =>
            `CPT REST base "${entry}" collides with a built-in WordPress collection. Use collections or includeMedia instead.`
    );
}

function uniqueTaxonomies(taxonomies: string[]): string[] {
    return uniqueCustomRestBases(
        taxonomies,
        (entry) =>
            `Taxonomy REST base "${entry}" collides with a built-in WordPress collection. Use collections instead.`
    );
}

function uniqueCustomRestBases(entries: string[], collisionMessage: (entry: string) => string): string[] {
    const seen = new Set<string>();
    const restBases: string[] = [];

    for (const entry of entries) {
        const restBase = sanitizeRestBase(entry);
        const collection = restBase.toLowerCase();

        if (isCmsCollection(collection)) {
            throw new Error(collisionMessage(entry));
        }

        if (seen.has(collection)) {
            continue;
        }

        seen.add(collection);
        restBases.push(restBase);
    }

    return restBases;
}

function resolveTransferRequest(input?: TransferRequest): {
    collections: CmsCollection[];
    cpts: string[];
    taxonomies: string[];
} {
    if (input === undefined) {
        return { collections: [...DEFAULT_COLLECTIONS], cpts: [], taxonomies: [] };
    }

    if (Array.isArray(input)) {
        return { collections: [...input], cpts: [], taxonomies: [] };
    }

    const collections = [...(input.collections ?? DEFAULT_COLLECTIONS)];
    if (input.includeMedia && !collections.includes("media")) {
        collections.push("media");
    }

    return {
        collections,
        cpts: uniqueCpts(input.cpts ?? []),
        taxonomies: uniqueTaxonomies(input.taxonomies ?? [])
    };
}

export class WPSync {
    constructor(
        private readonly wordpress: WordPressClients,
        private readonly store: NectarineStore,
        private readonly sourceUrl?: string
    ) {}

    async preview(request: TransferRequest = DEFAULT_COLLECTIONS): Promise<TransferPreview> {
        const { collections, cpts, taxonomies } = resolveTransferRequest(request);
        const counts = emptyCounts();

        for (const collection of collections) {
            const records = await this.readCollection(collection);
            counts[collection] = records.length;
        }

        for (const restBase of cpts) {
            const records = await this.readCpt(restBase);
            counts[restBase.toLowerCase()] = records.length;
        }

        for (const restBase of taxonomies) {
            const records = await this.readTaxonomy(restBase);
            counts[restBase.toLowerCase()] = records.length;
        }

        return { collections, cpts, taxonomies, counts };
    }

    async transfer(request: TransferRequest = DEFAULT_COLLECTIONS): Promise<TransferResult> {
        await this.store.hydrate();
        const { collections, cpts, taxonomies } = resolveTransferRequest(request);
        const counts = emptyCounts();
        const records: ContentRecord[] = [];

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
            this.ensureNativeCollection(collection, "CPT");
            counts[collection] = items.length;

            for (const item of items) {
                records.push(this.store.upsert(item));
            }
        }

        for (const restBase of taxonomies) {
            const items = await this.readTaxonomy(restBase);
            const collection = restBase.toLowerCase();
            this.ensureNativeCollection(collection, "taxonomy");
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
            taxonomies,
            counts,
            records
        };
    }

    private ensureNativeCollection(collection: string, kind: "CPT" | "taxonomy") {
        if (this.store.isRegisteredCollection(collection)) {
            return;
        }

        if (!isCustomTypeSlug(collection)) {
            throw new Error(
                `${kind} REST base "${collection}" is not a valid native collection slug.`
            );
        }

        this.store.registerType({ slug: collection });
    }

    private async readCollection(collection: CmsCollection) {
        return this.readAndNormalize(collection, () => {
            const query = transferQuery(collection);
            return collection === "media"
                ? this.wordpress.media.listAll(collection, query)
                : this.wordpress.posts.listAll(collection, query);
        });
    }

    private async readCpt(restBase: string) {
        const client = this.wordpress.cpt(restBase);
        const collection = client.restBase.toLowerCase();

        return this.readAndNormalize(collection, () =>
            client.listAll(client.restBase, { status: "any", context: "edit" })
        );
    }

    private async readTaxonomy(restBase: string) {
        const client = this.wordpress.taxonomy(restBase);
        const collection = client.restBase.toLowerCase();

        return this.readAndNormalize(collection, () =>
            client.listAll(client.restBase, { hide_empty: "false" })
        );
    }

    private async readAndNormalize(
        collection: CollectionSlug,
        load: () => Promise<unknown>
    ) {
        try {
            const raw = await load();
            return normalizeWordPressCollection(collection, raw, this.sourceUrl);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`WPSync failed to read WordPress ${collection}: ${message}`);
        }
    }
}

function transferQuery(collection: CmsCollection): Record<string, string> {
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
