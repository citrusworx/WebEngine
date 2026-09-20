import { afterEach, describe, expect, it, vi } from "vitest";
import { Categories } from "../categories/categories.js";
import { deleteCategory } from "../categories/routes.js";
import { Comments } from "../comments/comments.js";
import { deleteComment } from "../comments/routes.js";
import { Media } from "../media/media.js";
import { deleteMedia } from "../media/routes.js";
import { Pages } from "../pages/pages.js";
import { deletePage } from "../pages/routes.js";
import { Posts } from "../posts/posts.js";
import { deletePost } from "../posts/routes.js";
import { Tags } from "../tags/tags.js";
import { deleteTag } from "../tags/routes.js";
import { Users } from "../users/users.js";
import { deleteUser } from "../users/routes.js";
import { WPDelete } from "./WPDelete.js";
import { WPRead } from "./WPRead.js";

const wordpressConfig = {
    url: "http://example.com",
    apiBase: "wp-json/wp/v2"
};

type MutatingClient = {
    mutate: (...args: unknown[]) => Promise<unknown>;
};

type DeletingClient = {
    delete: (...args: unknown[]) => Promise<unknown>;
};

function stubWordPressDelete(body: unknown = { id: 1 }) {
    const fetchMock = vi.fn(async () => ({
        ok: true,
        json: async () => body
    }));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

describe("WPDelete collaborators", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("deletes posts, pages, and users through WPDelete, not WPRead.mutate", async () => {
        const fetchMock = stubWordPressDelete();
        const deleteSpy = vi.spyOn(WPDelete.prototype as unknown as DeletingClient, "delete");

        const posts = new Posts(wordpressConfig);
        const pages = new Pages(wordpressConfig);
        const users = new Users(wordpressConfig);

        const postMutate = vi.spyOn(posts as unknown as MutatingClient, "mutate");
        const pageMutate = vi.spyOn(pages as unknown as MutatingClient, "mutate");
        const userMutate = vi.spyOn(users as unknown as MutatingClient, "mutate");

        await expect(posts.delete(1)).resolves.toEqual({ id: 1 });
        await expect(pages.delete(1)).resolves.toEqual({ id: 1 });
        await expect(users.delete(1)).resolves.toEqual({ id: 1 });

        expect(deleteSpy).toHaveBeenCalledTimes(3);
        expect(deleteSpy.mock.calls[0]?.slice(0, 2)).toEqual([deletePost, { id: 1 }]);
        expect(deleteSpy.mock.calls[1]?.slice(0, 2)).toEqual([deletePage, { id: 1 }]);
        expect(deleteSpy.mock.calls[2]?.slice(0, 2)).toEqual([deleteUser, { id: 1 }]);
        expect(deleteSpy.mock.instances.every((instance) => instance instanceof WPDelete)).toBe(true);
        expect(deleteSpy.mock.instances.some((instance) => instance instanceof WPRead)).toBe(false);

        expect(postMutate).not.toHaveBeenCalled();
        expect(pageMutate).not.toHaveBeenCalled();
        expect(userMutate).not.toHaveBeenCalled();

        expect(String(fetchMock.mock.calls[0]?.[0])).toBe("http://example.com/wp-json/wp/v2/posts/1");
        expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
            method: "DELETE"
        });
        expect(String(fetchMock.mock.calls[1]?.[0])).toBe("http://example.com/wp-json/wp/v2/pages/1");
        expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
            method: "DELETE"
        });
        expect(String(fetchMock.mock.calls[2]?.[0])).toBe("http://example.com/wp-json/wp/v2/users/1");
        expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({
            method: "DELETE"
        });
    });

    it("deletes categories, tags, comments, and media through WPDelete, not WPRead.mutate", async () => {
        const fetchMock = stubWordPressDelete();
        const deleteSpy = vi.spyOn(WPDelete.prototype as unknown as DeletingClient, "delete");

        const categories = new Categories(wordpressConfig);
        const tags = new Tags(wordpressConfig);
        const comments = new Comments(wordpressConfig);
        const media = new Media(wordpressConfig);

        const categoryMutate = vi.spyOn(categories as unknown as MutatingClient, "mutate");
        const tagMutate = vi.spyOn(tags as unknown as MutatingClient, "mutate");
        const commentMutate = vi.spyOn(comments as unknown as MutatingClient, "mutate");
        const mediaMutate = vi.spyOn(media as unknown as MutatingClient, "mutate");

        await expect(categories.delete(1)).resolves.toEqual({ id: 1 });
        await expect(tags.delete(1)).resolves.toEqual({ id: 1 });
        await expect(comments.delete(1)).resolves.toEqual({ id: 1 });
        await expect(media.delete(1)).resolves.toEqual({ id: 1 });

        expect(deleteSpy).toHaveBeenCalledTimes(4);
        expect(deleteSpy.mock.calls[0]?.slice(0, 2)).toEqual([deleteCategory, { id: 1 }]);
        expect(deleteSpy.mock.calls[1]?.slice(0, 2)).toEqual([deleteTag, { id: 1 }]);
        expect(deleteSpy.mock.calls[2]?.slice(0, 2)).toEqual([deleteComment, { id: 1 }]);
        expect(deleteSpy.mock.calls[3]?.slice(0, 2)).toEqual([deleteMedia, { id: 1 }]);
        expect(deleteSpy.mock.instances.every((instance) => instance instanceof WPDelete)).toBe(true);
        expect(deleteSpy.mock.instances.some((instance) => instance instanceof WPRead)).toBe(false);

        expect(categoryMutate).not.toHaveBeenCalled();
        expect(tagMutate).not.toHaveBeenCalled();
        expect(commentMutate).not.toHaveBeenCalled();
        expect(mediaMutate).not.toHaveBeenCalled();

        expect(String(fetchMock.mock.calls[0]?.[0])).toBe("http://example.com/wp-json/wp/v2/categories/1");
        expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
            method: "DELETE"
        });
        expect(String(fetchMock.mock.calls[1]?.[0])).toBe("http://example.com/wp-json/wp/v2/tags/1");
        expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
            method: "DELETE"
        });
        expect(String(fetchMock.mock.calls[2]?.[0])).toBe("http://example.com/wp-json/wp/v2/comments/1");
        expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({
            method: "DELETE"
        });
        expect(String(fetchMock.mock.calls[3]?.[0])).toBe("http://example.com/wp-json/wp/v2/media/1");
        expect(fetchMock.mock.calls[3]?.[1]).toMatchObject({
            method: "DELETE"
        });
    });
});
