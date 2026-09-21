import { afterEach, describe, expect, it, vi } from "vitest";
import { KiwiPress } from "../cms/KiwiPress.js";
import { WPRead } from "../core/WPRead.js";
import { createWordPressClients } from "../core/WPSync.js";
import {
    restBasesFromTaxonomies,
    WordPressTaxonomies,
    normalizeWordPressTaxonomy,
    normalizeWordPressTaxonomies
} from "./wp-taxonomies.js";

const wordpressConfig = {
    url: "http://example.com",
    apiBase: "wp-json/wp/v2"
};

function stubWordPress(body: unknown) {
    const fetchMock = vi.fn(async () => ({
        ok: true,
        json: async () => body
    }));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

const taxonomyCatalog = {
    category: {
        name: "Categories",
        slug: "category",
        rest_base: "categories",
        rest_namespace: "wp/v2",
        hierarchical: true,
        description: "",
        types: ["post"]
    },
    post_tag: {
        name: "Tags",
        slug: "post_tag",
        rest_base: "tags",
        hierarchical: false,
        types: ["post"]
    },
    genre: {
        name: "Genres",
        slug: "genre",
        rest_base: "genre",
        hierarchical: true,
        types: ["book"]
    },
    product_cat: {
        name: "Product categories",
        slug: "product_cat",
        rest_base: "product_cat",
        hierarchical: true,
        types: ["product"]
    }
};

describe("WordPressTaxonomies", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("reads /wp/v2/taxonomies and /wp/v2/taxonomies/:slug as a WPRead client", async () => {
        const fetchMock = stubWordPress(taxonomyCatalog);
        const taxonomies = new WordPressTaxonomies(wordpressConfig);

        expect(taxonomies).toBeInstanceOf(WPRead);
        await expect(taxonomies.getAll()).resolves.toEqual(taxonomyCatalog);
        await expect(taxonomies.getBySlug("genre")).resolves.toEqual(taxonomyCatalog);

        expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
            "http://example.com/wp-json/wp/v2/taxonomies"
        );
        expect(String(fetchMock.mock.calls[1]?.[0])).toBe(
            "http://example.com/wp-json/wp/v2/taxonomies/genre"
        );
        expect(taxonomies).not.toHaveProperty("create");
        expect(taxonomies).not.toHaveProperty("update");
        expect(taxonomies).not.toHaveProperty("delete");
    });

    it("exposes taxonomies on the WordPress facade", async () => {
        const fetchMock = stubWordPress(taxonomyCatalog);
        const kiwi = KiwiPress.connect(wordpressConfig);
        const clients = createWordPressClients(wordpressConfig);

        expect(kiwi.wordpress.taxonomies).toBeInstanceOf(WordPressTaxonomies);
        expect(clients.taxonomies).toBeInstanceOf(WordPressTaxonomies);
        await expect(kiwi.wordpress.taxonomies.getAll()).resolves.toEqual(taxonomyCatalog);
        expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
            "http://example.com/wp-json/wp/v2/taxonomies"
        );
    });
});

describe("WordPress taxonomy helpers", () => {
    it("normalizes a taxonomy registration and a catalog object", () => {
        expect(normalizeWordPressTaxonomy(taxonomyCatalog.genre)).toMatchObject({
            name: "Genres",
            slug: "genre",
            rest_base: "genre",
            hierarchical: true,
            types: ["book"]
        });

        expect(normalizeWordPressTaxonomies(taxonomyCatalog).map((taxonomy) => taxonomy.slug)).toEqual([
            "category",
            "post_tag",
            "genre",
            "product_cat"
        ]);
    });

    it("maps discovered taxonomies onto rest bases, skipping categories and tags by default", () => {
        expect(restBasesFromTaxonomies(taxonomyCatalog)).toEqual(["genre", "product_cat"]);
        expect(restBasesFromTaxonomies([taxonomyCatalog.genre, taxonomyCatalog.category])).toEqual([
            "genre"
        ]);
        expect(restBasesFromTaxonomies(taxonomyCatalog, { includeBuiltins: true })).toEqual([
            "categories",
            "tags",
            "genre",
            "product_cat"
        ]);
    });
});
