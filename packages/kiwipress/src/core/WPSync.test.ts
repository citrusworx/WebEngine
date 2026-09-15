import { describe, expect, it, vi } from "vitest";
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

describe("WPSync", () => {
    it("transfers WordPress posts into a Nectarine store", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => [
                {
                    id: 7,
                    slug: "entry",
                    status: "publish",
                    title: { rendered: "Entry" },
                    content: { rendered: "<p>Hi</p>" }
                }
            ]
        });
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
        expect(fetchMock).toHaveBeenCalled();

        vi.unstubAllGlobals();
    });
});
