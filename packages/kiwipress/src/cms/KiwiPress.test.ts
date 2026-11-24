import { describe, expect, it, vi } from "vitest";
import { KiwiPress } from "./KiwiPress.js";
import { NectarineStore } from "./store.js";

describe("KiwiPress CMS modes", () => {
    it.each(["posts", "pages", "users", "categories", "tags", "comments"] as const)(
        "reads %s collections and items through the WordPress facade",
        async (collection) => {
            const record = { id: 7 };
            const baseUrl = `https://example.com/wp-json/wp/v2/${collection}`;
            const fetchMock = vi.fn()
                .mockResolvedValueOnce(Response.json([record]))
                .mockResolvedValueOnce(Response.json(record));
            vi.stubGlobal("fetch", fetchMock);

            try {
                const client = KiwiPress.connect({ url: "https://example.com", apiBase: "wp-json/wp/v2" })
                    .wordpress[collection];

                await expect(client.getAll()).resolves.toEqual([record]);
                await expect(client.getById(7)).resolves.toEqual(record);
                expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([baseUrl, `${baseUrl}/7`]);
            } finally {
                vi.unstubAllGlobals();
            }
        }
    );

    it("starts on WordPress and promotes transferred records into Nectarine", async () => {
        const kiwi = KiwiPress.connect({
            url: "https://example.com",
            apiBase: "wp-json/wp/v2"
        });

        expect(kiwi.mode).toBe("wordpress");
        kiwi.store.upsert({
            id: "12",
            collection: "posts",
            title: "Hello",
            content: "<p>Hi</p>",
            slug: "hello",
            status: "published",
            source: { cms: "wordpress", id: "12" },
            meta: {}
        });

        const native = kiwi.toNectarine();
        expect(native.mode).toBe("nectarine");
        kiwi.promote();
        expect(kiwi.mode).toBe("nectarine");

        const posts = await native.native.posts.getAll();
        expect(posts).toHaveLength(1);
        expect(posts[0]?.slug).toBe("hello");
        expect(await native.native.posts.getBySlug("hello")).toMatchObject({ title: "Hello" });
    });

    it("can run as a native CMS without WordPress", async () => {
        const kiwi = KiwiPress.connect({
            mode: "nectarine",
            store: new NectarineStore()
        });

        const created = await kiwi.native.posts.create({
            title: "Native post",
            content: "<p>Written in Nectarine.</p>",
            status: "published"
        });

        expect(created.source.cms).toBe("nectarine");
        expect(await kiwi.native.posts.getBySlug(created.slug)).toMatchObject({
            title: "Native post",
            status: "published"
        });
    });

    it("copies native create fields and only patches the documented update fields", async () => {
        const posts = KiwiPress.connect({ mode: "nectarine" }).native.posts;
        const created = await posts.create({
            id: 12,
            title: "Native post",
            content: "<p>Original</p>",
            slug: "native-post",
            status: "publish",
            authorId: "author-1",
            featuredImage: "cover.png",
            meta: { keep: true, settings: { featured: true, color: "red" } },
            collection: "pages",
            source: { cms: "wordpress", id: "99" },
            extra: "ignored"
        });
        expect(created).toMatchObject({
            id: "12",
            collection: "posts",
            title: "Native post",
            content: "<p>Original</p>",
            slug: "native-post",
            status: "published",
            authorId: "author-1",
            featuredImage: "cover.png",
            source: { cms: "nectarine", id: "12" }
        });
        expect(created.meta).toEqual({ keep: true, settings: { featured: true, color: "red" } });
        expect(created).not.toHaveProperty("extra");

        const updated = await posts.update(12, {
            title: "Revised post",
            content: "<p>Revised</p>",
            slug: "revised-post",
            status: " archived ",
            authorId: "author-2",
            featuredImage: "new-cover.png",
            meta: { settings: { featured: false } }
        });
        expect(updated).toMatchObject({
            id: "12",
            title: "Revised post",
            content: "<p>Revised</p>",
            slug: "revised-post",
            status: "archived",
            authorId: "author-1",
            featuredImage: "cover.png"
        });
        expect(updated.meta).toEqual({ keep: true, settings: { featured: false } });
        expect(await posts.getBySlug("revised-post")).toEqual(updated);
    });

    it("uses native fallbacks for WordPress REST text objects", async () => {
        const posts = KiwiPress.connect({ mode: "nectarine" }).native.posts;
        const wordPressPayload = {
            title: { rendered: "Imported title" },
            content: { rendered: "<p>Imported content</p>" },
            author: 8,
            featured_media: 35
        };

        const created = await posts.create(wordPressPayload);
        expect(created).toMatchObject({ title: "Untitled", content: "", slug: "untitled", status: "draft" });
        expect(created.authorId).toBeUndefined();
        expect(created.featuredImage).toBeUndefined();

        const existing = await posts.create({ title: "Existing", content: "Original", status: "published" });
        expect(await posts.update(existing.id, wordPressPayload)).toMatchObject({
            title: "Existing",
            content: "Original",
            status: "published"
        });
    });

    it("hydrates persisted native records on ready()", async () => {
        const store = new NectarineStore();
        let snapshot: ReturnType<NectarineStore["document"]> | ReturnType<NectarineStore["snapshot"]> = store.snapshot();
        store.usePersistence({
            kind: "custom",
            async load() {
                return snapshot;
            },
            async save(next) {
                snapshot = next;
            }
        });
        store.upsert({
            id: "kept",
            collection: "posts",
            title: "Kept",
            content: "",
            slug: "kept",
            status: "published",
            source: { cms: "nectarine", id: "kept" },
            meta: {}
        });
        await store.flush();

        const kiwi = KiwiPress.connect({
            mode: "nectarine",
            store: new NectarineStore(),
            persistence: {
                kind: "custom",
                async load() {
                    return snapshot;
                },
                async save(next) {
                    snapshot = next;
                }
            }
        });

        await kiwi.ready();
        expect(await kiwi.native.posts.getBySlug("kept")).toMatchObject({ title: "Kept" });
    });

    it("creates native records on a registered custom type", async () => {
        const kiwi = KiwiPress.connect({
            mode: "nectarine",
            store: new NectarineStore()
        });

        kiwi.store.registerType({ slug: "recipe", label: "Recipes" });
        const created = await kiwi.native.collection("recipe").create({
            title: "Soup",
            status: "draft"
        });

        expect(created.collection).toBe("recipe");
        expect(await kiwi.native.collection("recipe").getBySlug(created.slug)).toMatchObject({
            title: "Soup"
        });
        await expect(kiwi.native.collection("unknown").create({ title: "Nope" })).rejects.toThrow(
            /Unknown KiwiPress collection/
        );
    });
});
