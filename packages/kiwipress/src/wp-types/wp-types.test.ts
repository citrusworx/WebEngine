import { afterEach, describe, expect, it, vi } from "vitest";
import { KiwiPress } from "../cms/KiwiPress.js";
import { WPRead } from "../core/WPRead.js";
import { createWordPressClients } from "../core/WPSync.js";
import {
    restBasesFromTypes,
    WordPressTypes,
    normalizeWordPressType,
    normalizeWordPressTypes
} from "./wp-types.js";

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

const typeCatalog = {
    post: {
        name: "Posts",
        slug: "post",
        rest_base: "posts",
        rest_namespace: "wp/v2",
        hierarchical: false,
        description: "",
        taxonomies: ["category", "post_tag"]
    },
    page: {
        name: "Pages",
        slug: "page",
        rest_base: "pages",
        hierarchical: true
    },
    attachment: {
        name: "Media",
        slug: "attachment",
        rest_base: "media",
        hierarchical: false
    },
    book: {
        name: "Books",
        slug: "book",
        rest_base: "books",
        hierarchical: false,
        taxonomies: ["genre"]
    },
    product: {
        name: "Products",
        slug: "product",
        rest_base: "product",
        hierarchical: false
    }
};

describe("WordPressTypes", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("reads /wp/v2/types and /wp/v2/types/:slug as a WPRead client", async () => {
        const fetchMock = stubWordPress(typeCatalog);
        const types = new WordPressTypes(wordpressConfig);

        expect(types).toBeInstanceOf(WPRead);
        await expect(types.getAll()).resolves.toEqual(typeCatalog);
        await expect(types.getBySlug("book")).resolves.toEqual(typeCatalog);

        expect(String(fetchMock.mock.calls[0]?.[0])).toBe("http://example.com/wp-json/wp/v2/types");
        expect(String(fetchMock.mock.calls[1]?.[0])).toBe("http://example.com/wp-json/wp/v2/types/book");
        expect(types).not.toHaveProperty("create");
        expect(types).not.toHaveProperty("update");
        expect(types).not.toHaveProperty("delete");
    });

    it("exposes types on the WordPress facade", async () => {
        const fetchMock = stubWordPress(typeCatalog);
        const kiwi = KiwiPress.connect(wordpressConfig);
        const clients = createWordPressClients(wordpressConfig);

        expect(kiwi.wordpress.types).toBeInstanceOf(WordPressTypes);
        expect(clients.types).toBeInstanceOf(WordPressTypes);
        await expect(kiwi.wordpress.types.getAll()).resolves.toEqual(typeCatalog);
        expect(String(fetchMock.mock.calls[0]?.[0])).toBe("http://example.com/wp-json/wp/v2/types");
    });
});

describe("WordPress type helpers", () => {
    it("normalizes a type registration and a catalog object", () => {
        expect(normalizeWordPressType(typeCatalog.book)).toMatchObject({
            name: "Books",
            slug: "book",
            rest_base: "books",
            hierarchical: false,
            taxonomies: ["genre"]
        });

        expect(normalizeWordPressTypes(typeCatalog).map((type) => type.slug)).toEqual([
            "post",
            "page",
            "attachment",
            "book",
            "product"
        ]);
    });

    it("maps discovered types onto CPT rest bases, skipping built-in collections", () => {
        expect(restBasesFromTypes(typeCatalog)).toEqual(["books", "product"]);
        expect(restBasesFromTypes([typeCatalog.book, typeCatalog.attachment])).toEqual(["books"]);
    });
});
