import { afterEach, describe, expect, it, vi } from "vitest";
import { NectarineStore } from "../cms/store.js";
import { createWordPressClients, WPSync } from "./WPSync.js";

function wordpressClients(url = "https://example.com") {
    return createWordPressClients({ url, apiBase: "wp-json/wp/v2" });
}

function wpPage(body: unknown, totalPages = 1) {
    return {
        ok: true,
        headers: {
            get(name: string) {
                if (name.toLowerCase() === "x-wp-totalpages") {
                    return String(totalPages);
                }

                return null;
            }
        },
        json: async () => body
    };
}

describe("WPSync", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("transfers WordPress posts into a Nectarine store", async () => {
        const fetchMock = vi.fn().mockResolvedValue(wpPage([
            {
                id: 7,
                slug: "entry",
                status: "publish",
                title: { rendered: "Entry" },
                content: { rendered: "<p>Hi</p>" }
            }
        ]));
        vi.stubGlobal("fetch", fetchMock);

        const store = new NectarineStore();
        const sync = new WPSync(wordpressClients(), store, "https://example.com");
        const result = await sync.transfer(["posts"]);

        expect(result.mode).toBe("nectarine");
        expect(result.counts.posts).toBe(1);
        expect(store.list("posts")[0]).toMatchObject({
            id: "7",
            title: "Entry",
            slug: "entry",
            status: "published",
            source: { cms: "nectarine" }
        });
        expect(String(fetchMock.mock.calls[0]?.[0])).toContain("status=any");
        expect(String(fetchMock.mock.calls[0]?.[0])).toContain("context=edit");
    });

    it("walks every WordPress page before promoting", async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(wpPage([{
                id: 1,
                slug: "one",
                status: "draft",
                title: { rendered: "One" },
                content: { rendered: "<p>1</p>" }
            }], 2))
            .mockResolvedValueOnce(wpPage([{
                id: 2,
                slug: "two",
                status: "private",
                title: { rendered: "Two" },
                content: { rendered: "<p>2</p>" }
            }], 2));
        vi.stubGlobal("fetch", fetchMock);

        const store = new NectarineStore();
        const sync = new WPSync(wordpressClients(), store, "https://example.com");
        const result = await sync.transfer(["posts"]);

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(String(fetchMock.mock.calls[0]?.[0])).toContain("page=1");
        expect(String(fetchMock.mock.calls[1]?.[0])).toContain("page=2");
        expect(result.counts.posts).toBe(2);
        expect(store.list("posts").map((record) => record.slug)).toEqual(["one", "two"]);
        expect(store.list("posts").map((record) => record.status)).toEqual(["draft", "archived"]);
    });

    it("flushes transferred records when the store has persistence", async () => {
        const fetchMock = vi.fn().mockResolvedValue(wpPage([
            {
                id: 3,
                slug: "saved",
                status: "publish",
                title: { rendered: "Saved" },
                content: { rendered: "<p>Keep me</p>" }
            }
        ]));
        vi.stubGlobal("fetch", fetchMock);

        let saved = 0;
        const store = new NectarineStore();
        store.usePersistence({
            async load() {
                return null;
            },
            async save() {
                saved += 1;
            }
        });
        const sync = new WPSync(wordpressClients(), store, "https://example.com");
        await sync.transfer(["posts"]);

        expect(saved).toBe(1);
        expect(store.list("posts")[0]?.slug).toBe("saved");
    });

    it("previews the default six collections without media or CPTs", async () => {
        const fetchMock = vi.fn().mockResolvedValue(wpPage([]));
        vi.stubGlobal("fetch", fetchMock);

        const store = new NectarineStore();
        const sync = new WPSync(wordpressClients(), store, "https://example.com");
        const preview = await sync.preview();

        expect(preview.collections).toEqual([
            "posts",
            "pages",
            "users",
            "categories",
            "tags",
            "comments"
        ]);
        expect(preview.cpts).toEqual([]);
        expect(preview.taxonomies).toEqual([]);
        expect(preview.counts.media).toBe(0);
        expect(fetchMock.mock.calls.map((call) => String(call[0]))).not.toEqual(
            expect.arrayContaining([expect.stringContaining("/media")])
        );
        expect(fetchMock.mock.calls.map((call) => String(call[0]))).not.toEqual(
            expect.arrayContaining([expect.stringContaining("/books")])
        );
        expect(fetchMock.mock.calls.map((call) => String(call[0]))).not.toEqual(
            expect.arrayContaining([expect.stringContaining("/genre")])
        );
    });

    it("transfers media when includeMedia is set or media is in collections", async () => {
        const fetchMock = vi.fn(async (url: string) => {
            if (String(url).includes("/media")) {
                return wpPage([{
                    id: 44,
                    slug: "hero",
                    status: "inherit",
                    title: { rendered: "Hero" },
                    source_url: "https://example.com/hero.png",
                    mime_type: "image/png",
                    media_type: "image",
                    alt_text: "Hero image"
                }]);
            }

            return wpPage([]);
        });
        vi.stubGlobal("fetch", fetchMock);

        const store = new NectarineStore();
        const sync = new WPSync(wordpressClients(), store, "https://example.com");
        const preview = await sync.preview({ collections: ["posts"], includeMedia: true });
        const result = await sync.transfer({ collections: ["media"] });

        expect(preview.collections).toEqual(["posts", "media"]);
        expect(preview.counts.media).toBe(1);
        expect(result.counts.media).toBe(1);
        expect(store.list("media")[0]).toMatchObject({
            id: "44",
            collection: "media",
            title: "Hero",
            featuredImage: "https://example.com/hero.png",
            meta: {
                source_url: "https://example.com/hero.png",
                mime_type: "image/png"
            }
        });
        expect(fetchMock.mock.calls.some((call) => String(call[0]).includes("/wp-json/wp/v2/media"))).toBe(true);
        expect(String(fetchMock.mock.calls.find((call) => String(call[0]).includes("/media"))?.[0])).toContain("status=any");
    });

    it("transfers named CPT rest bases into matching native collections", async () => {
        const fetchMock = vi.fn(async (url: string) => {
            const href = String(url);
            if (href.includes("/books")) {
                return wpPage([{
                    id: 9,
                    slug: "moby",
                    status: "publish",
                    title: { rendered: "Moby Dick" },
                    content: { rendered: "<p>Call me Ishmael.</p>" },
                    featured_media: 44
                }]);
            }

            if (href.includes("/product")) {
                return wpPage([{
                    id: 3,
                    slug: "mug",
                    status: "publish",
                    title: { rendered: "Mug" }
                }]);
            }

            return wpPage([]);
        });
        vi.stubGlobal("fetch", fetchMock);

        const store = new NectarineStore();
        const sync = new WPSync(wordpressClients(), store, "https://example.com");
        const preview = await sync.preview({ collections: ["posts"], cpts: ["books", "product"] });
        const result = await sync.transfer({ collections: ["posts"], cpts: ["books", "product"] });

        expect(preview.collections).toEqual(["posts"]);
        expect(preview.cpts).toEqual(["books", "product"]);
        expect(preview.counts.books).toBe(1);
        expect(preview.counts.product).toBe(1);
        expect(result.cpts).toEqual(["books", "product"]);
        expect(result.counts.books).toBe(1);
        expect(result.counts.product).toBe(1);
        expect(store.getType("books")).toMatchObject({ slug: "books" });
        expect(store.getType("product")).toMatchObject({ slug: "product" });
        expect(store.list("books")[0]).toMatchObject({
            id: "9",
            collection: "books",
            title: "Moby Dick",
            slug: "moby",
            featuredImage: "44"
        });
        expect(store.list("product")[0]).toMatchObject({
            id: "3",
            collection: "product",
            slug: "mug"
        });
        expect(String(fetchMock.mock.calls.find((call) => String(call[0]).includes("/books"))?.[0])).toContain("status=any");
        expect(fetchMock.mock.calls.some((call) => String(call[0]).includes("/wp-json/wp/v2/product"))).toBe(true);
    });

    it("rejects CPT rest bases that collide with built-in collections", async () => {
        const store = new NectarineStore();
        const sync = new WPSync(wordpressClients(), store, "https://example.com");

        await expect(sync.transfer({ collections: [], cpts: ["posts"] })).rejects.toThrow(
            /collides with a built-in WordPress collection/
        );
        await expect(sync.preview({ includeMedia: true, cpts: ["media"] })).rejects.toThrow(
            /collides with a built-in WordPress collection/
        );
    });

    it("transfers named taxonomy rest bases into matching native collections", async () => {
        const fetchMock = vi.fn(async (url: string) => {
            const href = String(url);
            if (href.includes("/genre")) {
                return wpPage([{
                    id: 4,
                    slug: "fiction",
                    name: "Fiction",
                    description: "Novels and stories",
                    taxonomy: "genre",
                    count: 3,
                    parent: 0
                }]);
            }

            if (href.includes("/product_cat")) {
                return wpPage([{
                    id: 8,
                    slug: "mugs",
                    name: "Mugs",
                    taxonomy: "product_cat"
                }]);
            }

            return wpPage([]);
        });
        vi.stubGlobal("fetch", fetchMock);

        const store = new NectarineStore();
        const sync = new WPSync(wordpressClients(), store, "https://example.com");
        const preview = await sync.preview({
            collections: ["posts"],
            taxonomies: ["genre", "product_cat"]
        });
        const result = await sync.transfer({
            collections: ["posts"],
            taxonomies: ["genre", "product_cat"]
        });

        expect(preview.collections).toEqual(["posts"]);
        expect(preview.cpts).toEqual([]);
        expect(preview.taxonomies).toEqual(["genre", "product_cat"]);
        expect(preview.counts.genre).toBe(1);
        expect(preview.counts.product_cat).toBe(1);
        expect(result.taxonomies).toEqual(["genre", "product_cat"]);
        expect(result.counts.genre).toBe(1);
        expect(result.counts.product_cat).toBe(1);
        expect(store.getType("genre")).toMatchObject({ slug: "genre" });
        expect(store.getType("product_cat")).toMatchObject({ slug: "product_cat" });
        expect(store.list("genre")[0]).toMatchObject({
            id: "4",
            collection: "genre",
            title: "Fiction",
            slug: "fiction",
            content: "Novels and stories"
        });
        expect(store.list("product_cat")[0]).toMatchObject({
            id: "8",
            collection: "product_cat",
            slug: "mugs"
        });
        expect(String(fetchMock.mock.calls.find((call) => String(call[0]).includes("/genre"))?.[0])).toContain(
            "hide_empty=false"
        );
        expect(fetchMock.mock.calls.some((call) => String(call[0]).includes("/wp-json/wp/v2/product_cat"))).toBe(
            true
        );
    });

    it("rejects taxonomy rest bases that collide with built-in collections", async () => {
        const store = new NectarineStore();
        const sync = new WPSync(wordpressClients(), store, "https://example.com");

        await expect(sync.transfer({ collections: [], taxonomies: ["categories"] })).rejects.toThrow(
            /collides with a built-in WordPress collection/
        );
        await expect(sync.preview({ taxonomies: ["tags"] })).rejects.toThrow(
            /collides with a built-in WordPress collection/
        );
        await expect(sync.preview({ taxonomies: ["posts"] })).rejects.toThrow(
            /collides with a built-in WordPress collection/
        );
    });
});
