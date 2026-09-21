import { describe, expect, it } from "vitest";
import {
    extractTextValue,
    normalizeWordPressCollection,
    normalizeWordPressItem,
    toNectarinePost
} from "./normalize.js";

describe("normalize WordPress payloads", () => {
    it("unwraps rendered HTML fields", () => {
        expect(extractTextValue({ rendered: "<p>Hello</p>", raw: "Hello" })).toBe("Hello");
        expect(extractTextValue("plain")).toBe("plain");
    });

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
});
