import { afterEach, describe, expect, it, vi } from "vitest";
import { NectarineStore } from "../cms/store.js";
import { Posts } from "../posts/posts.js";
import { Pages } from "../pages/pages.js";
import { Users } from "../users/users.js";
import { Categories } from "../categories/categories.js";
import { Tags } from "../tags/tags.js";
import { Comments } from "../comments/comments.js";
import { WPSync } from "./WPSync.js";

function wordpressClients(url = "https://example.com") {
    const config = { url, apiBase: "wp-json/wp/v2" };
    return {
        posts: new Posts(config),
        pages: new Pages(config),
        users: new Users(config),
        categories: new Categories(config),
        tags: new Tags(config),
        comments: new Comments(config)
    };
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
});
