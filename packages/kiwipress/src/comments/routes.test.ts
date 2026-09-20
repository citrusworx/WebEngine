import { afterEach, describe, expect, it, vi } from "vitest";
import { Comments } from "./comments.js";
import {
    createComment,
    deleteComment,
    getCommentsByPost,
    updateComment
} from "./routes.js";

const wordpressConfig = {
    url: "http://example.com",
    apiBase: "wp-json/wp/v2"
};

describe("comment routes", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("exposes WordPress comment write routes with PUT updates", () => {
        expect(createComment.method).toBe("POST");
        expect(createComment.path).toBe("/comments");
        expect(updateComment.method).toBe("PUT");
        expect(updateComment.path).toBe("/comments/:id");
        expect(deleteComment.method).toBe("DELETE");
        expect(deleteComment.path).toBe("/comments/:id");
    });

    it("maps post lookups onto ?post=", async () => {
        const fetchMock = vi.fn(async () => ({
            ok: true,
            json: async () => []
        }));
        vi.stubGlobal("fetch", fetchMock);

        expect(getCommentsByPost.path).toBe("/comments/:post");
        await new Comments(wordpressConfig).getByPost(12);

        expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
            "http://example.com/wp-json/wp/v2/comments?post=12"
        );
    });
});
