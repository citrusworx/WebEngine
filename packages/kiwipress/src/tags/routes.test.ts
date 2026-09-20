import { afterEach, describe, expect, it, vi } from "vitest";
import { Tags } from "./tags.js";
import { createTag, deleteTag, getTagBySlug, updateTag } from "./routes.js";

const wordpressConfig = {
    url: "http://example.com",
    apiBase: "wp-json/wp/v2"
};

describe("tag routes", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("exposes WordPress tag write routes with PUT updates", () => {
        expect(createTag.method).toBe("POST");
        expect(createTag.path).toBe("/tags");
        expect(updateTag.method).toBe("PUT");
        expect(updateTag.path).toBe("/tags/:id");
        expect(deleteTag.method).toBe("DELETE");
        expect(deleteTag.path).toBe("/tags/:id");
    });

    it("maps slug lookups onto ?slug=", async () => {
        const fetchMock = vi.fn(async () => ({
            ok: true,
            json: async () => []
        }));
        vi.stubGlobal("fetch", fetchMock);

        expect(getTagBySlug.path).toBe("/tags/:slug");
        await new Tags(wordpressConfig).getBySlug("featured");

        expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
            "http://example.com/wp-json/wp/v2/tags?slug=featured"
        );
    });
});
