import { describe, expect, it, vi } from "vitest";
import {
    extractRaw,
    extractRendered,
    extractTextParts,
    extractTextValue,
    featuredImageFrom,
    normalizeWordPressCollection,
    normalizeWordPressItem,
    resolveFeaturedImageUrl,
    toNectarinePost
} from "./normalize.js";

describe("extract text helpers", () => {
    it("unwraps rendered HTML fields, preferring raw as the best-available text", () => {
        expect(extractTextValue({ rendered: "<p>Hello</p>", raw: "Hello" })).toBe("Hello");
        expect(extractTextValue("plain")).toBe("plain");
        expect(extractTextValue({ rendered: "<p>Only</p>" })).toBe("<p>Only</p>");
        expect(extractTextValue(null)).toBe("");
    });

    it("splits raw and rendered without changing extractTextValue compat", () => {
        const dual = { rendered: "<p>Hello</p>", raw: "<!-- wp:paragraph --><p>Hello</p>" };
        expect(extractRaw(dual)).toBe("<!-- wp:paragraph --><p>Hello</p>");
        expect(extractRendered(dual)).toBe("<p>Hello</p>");
        expect(extractTextParts(dual)).toEqual({
            raw: "<!-- wp:paragraph --><p>Hello</p>",
            rendered: "<p>Hello</p>",
            text: "<!-- wp:paragraph --><p>Hello</p>"
        });
        expect(extractTextValue(dual)).toBe(extractTextParts(dual).text);
    });

    it("treats a plain string as text only, not raw or rendered", () => {
        expect(extractTextParts("plain")).toEqual({ text: "plain" });
        expect(extractRaw("plain")).toBe("");
        expect(extractRendered("plain")).toBe("");
    });

    it("keeps an empty raw string as the best-available value", () => {
        expect(extractTextValue({ raw: "", rendered: "<p>Hi</p>" })).toBe("");
        expect(extractTextParts({ raw: "", rendered: "<p>Hi</p>" })).toEqual({
            raw: "",
            rendered: "<p>Hi</p>",
            text: ""
        });
    });
});

describe("normalize WordPress payloads", () => {
    it("maps a WordPress post onto a Nectarine-shaped content record", () => {
        const record = normalizeWordPressItem("posts", {
            id: 12,
            slug: "hello-world",
            status: "publish",
            date: "2026-01-01T00:00:00",
            modified: "2026-01-02T00:00:00",
            author: 3,
            featured_media: 44,
            title: { rendered: "Hello World" },
            content: { rendered: "<p>Body</p>" }
        }, "https://example.com");

        expect(record).toMatchObject({
            id: "12",
            collection: "posts",
            title: "Hello World",
            content: "<p>Body</p>",
            slug: "hello-world",
            status: "published",
            authorId: "3",
            featuredImage: "44",
            source: { cms: "wordpress", id: "12", url: "https://example.com" }
        });

        expect(toNectarinePost(record)).toMatchObject({
            id: "12",
            title: "Hello World",
            slug: "hello-world",
            status: "published",
            author_id: "3",
            featured_image: "44"
        });
    });

    it("stores dual title/content/excerpt on meta without changing top-level best-available strings", () => {
        const record = normalizeWordPressItem("posts", {
            id: 12,
            slug: "hello-world",
            status: "publish",
            title: { raw: "Hello World", rendered: "Hello World" },
            content: {
                raw: "<!-- wp:paragraph --><p>Body</p><!-- /wp:paragraph -->",
                rendered: "<p>Body</p>"
            },
            excerpt: { raw: "Teaser", rendered: "<p>Teaser</p>" }
        });

        expect(record.title).toBe("Hello World");
        expect(record.content).toBe("<!-- wp:paragraph --><p>Body</p><!-- /wp:paragraph -->");
        expect(record.meta).toMatchObject({
            titleRaw: "Hello World",
            titleRendered: "Hello World",
            contentRaw: "<!-- wp:paragraph --><p>Body</p><!-- /wp:paragraph -->",
            contentRendered: "<p>Body</p>",
            excerptRaw: "Teaser",
            excerptRendered: "<p>Teaser</p>"
        });
        expect(record.meta.raw).toMatchObject({ id: 12, slug: "hello-world" });
    });

    it("omits excerpt dual-text keys when excerpt is absent", () => {
        const record = normalizeWordPressItem("posts", {
            id: 1,
            title: { rendered: "Hi" },
            content: { rendered: "<p>Body</p>" }
        });

        expect(record.meta.excerptRaw).toBeUndefined();
        expect(record.meta.excerptRendered).toBeUndefined();
        expect(record.meta.titleRendered).toBe("Hi");
        expect(record.meta.titleRaw).toBeUndefined();
    });

    it("lifts WordPress meta and ACF onto first-class meta keys when present", () => {
        const wpMeta = { _thumbnail_id: 44, custom_field: "yes" };
        const acf = { hero: "https://example.com/hero.jpg", show_toc: true };
        const record = normalizeWordPressItem("posts", {
            id: 8,
            title: { rendered: "Fields" },
            content: { rendered: "<p>x</p>" },
            meta: wpMeta,
            acf
        });

        expect(record.meta.wpMeta).toEqual(wpMeta);
        expect(record.meta.acf).toEqual(acf);
        expect(record.meta.raw).toMatchObject({ meta: wpMeta, acf });
    });

    it("does not invent wpMeta or acf when those keys are missing", () => {
        const record = normalizeWordPressItem("posts", {
            id: 2,
            title: { rendered: "Plain" }
        });

        expect(record.meta.wpMeta).toBeUndefined();
        expect(record.meta.acf).toBeUndefined();
        expect("acf" in record.meta).toBe(false);
    });

    it("passes through an acf key even when the value is empty", () => {
        const record = normalizeWordPressItem("posts", {
            id: 3,
            title: { rendered: "Empty ACF" },
            acf: {}
        });

        expect(record.meta.acf).toEqual({});
    });

    it("normalizes a collection and treats a single object as one record", () => {
        const records = normalizeWordPressCollection("users", {
            id: 1,
            name: "Drew",
            slug: "drew",
            email: "drew@example.com"
        });

        expect(records).toHaveLength(1);
        expect(records[0]?.title).toBe("Drew");
        expect(records[0]?.meta.email).toBe("drew@example.com");
    });

    it("maps media source_url onto featuredImage and keeps featured_media fields", () => {
        const record = normalizeWordPressItem("media", {
            id: 44,
            slug: "hero",
            status: "inherit",
            title: { rendered: "Hero" },
            alt_text: "A hero image",
            mime_type: "image/png",
            media_type: "image",
            source_url: "https://example.com/wp-content/uploads/hero.png",
            featured_media: 0
        }, "https://example.com");

        expect(record).toMatchObject({
            id: "44",
            collection: "media",
            title: "Hero",
            slug: "hero",
            status: "published",
            featuredImage: "https://example.com/wp-content/uploads/hero.png",
            meta: {
                source_url: "https://example.com/wp-content/uploads/hero.png",
                alt_text: "A hero image",
                mime_type: "image/png",
                media_type: "image"
            }
        });
    });

    it("prefers an embedded featured-media URL over the numeric id", () => {
        const record = normalizeWordPressItem("books", {
            id: 9,
            slug: "moby",
            status: "publish",
            title: { rendered: "Moby Dick" },
            featured_media: 44,
            _embedded: {
                "wp:featuredmedia": [{ source_url: "https://example.com/cover.jpg" }]
            }
        });

        expect(record.collection).toBe("books");
        expect(record.featuredImage).toBe("https://example.com/cover.jpg");
        expect(record.meta.featured_media).toBe(44);
    });

    it("prefers embedded source_url over a featured_image string", () => {
        expect(featuredImageFrom({
            featured_image: "https://example.com/old.jpg",
            featured_media: 44,
            _embedded: {
                "wp:featuredmedia": [{ source_url: "https://example.com/cover.jpg" }]
            }
        })).toBe("https://example.com/cover.jpg");
    });
});

describe("resolveFeaturedImageUrl", () => {
    it("loads Media.getById and returns source_url", async () => {
        const getById = vi.fn().mockResolvedValue({
            id: 44,
            source_url: "https://example.com/cover.jpg"
        });

        await expect(resolveFeaturedImageUrl({ getById }, 44)).resolves.toBe(
            "https://example.com/cover.jpg"
        );
        expect(getById).toHaveBeenCalledWith(44);
    });

    it("skips empty featured-media ids without calling the client", async () => {
        const getById = vi.fn();

        await expect(resolveFeaturedImageUrl({ getById }, 0)).resolves.toBeUndefined();
        await expect(resolveFeaturedImageUrl({ getById }, "")).resolves.toBeUndefined();
        expect(getById).not.toHaveBeenCalled();
    });

    it("unwraps an array response from getById", async () => {
        const getById = vi.fn().mockResolvedValue([
            { source_url: "https://example.com/from-array.jpg" }
        ]);

        await expect(resolveFeaturedImageUrl({ getById }, "9")).resolves.toBe(
            "https://example.com/from-array.jpg"
        );
    });
});
