import { describe, expect, it } from "vitest";
import { KiwiPress } from "./KiwiPress.js";
import { NectarineStore } from "./store.js";

describe("KiwiPress CMS modes", () => {
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

    it("hydrates persisted native records on ready()", async () => {
        const store = new NectarineStore();
        let snapshot = store.snapshot();
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
});
