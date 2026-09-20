import { afterEach, describe, expect, it, vi } from "vitest";
import { Categories } from "../categories/categories.js";
import { updateCategory } from "../categories/routes.js";
import { Comments } from "../comments/comments.js";
import { updateComment } from "../comments/routes.js";
import { Media } from "../media/media.js";
import { updateMedia } from "../media/routes.js";
import { Pages } from "../pages/pages.js";
import { updatePage } from "../pages/routes.js";
import { Posts } from "../posts/posts.js";
import { updatePost } from "../posts/routes.js";
import { Tags } from "../tags/tags.js";
import { updateTag } from "../tags/routes.js";
import { Users } from "../users/users.js";
import { updateUser } from "../users/routes.js";
import { WPUpdate } from "./WPUpdate.js";
import { WPRead } from "./WPRead.js";

const wordpressConfig = {
    url: "http://example.com",
    apiBase: "wp-json/wp/v2"
};

type MutatingClient = {
    mutate: (...args: unknown[]) => Promise<unknown>;
};

type UpdatingClient = {
    update: (...args: unknown[]) => Promise<unknown>;
};

function stubWordPressUpdate(body: unknown = { id: 1 }) {
    const fetchMock = vi.fn(async () => ({
        ok: true,
        json: async () => body
    }));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

describe("WPUpdate collaborators", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("updates posts, pages, and users through WPUpdate, not WPRead.mutate", async () => {
        const fetchMock = stubWordPressUpdate();
        const updateSpy = vi.spyOn(WPUpdate.prototype as unknown as UpdatingClient, "update");

        const posts = new Posts(wordpressConfig);
        const pages = new Pages(wordpressConfig);
        const users = new Users(wordpressConfig);

        const postMutate = vi.spyOn(posts as unknown as MutatingClient, "mutate");
        const pageMutate = vi.spyOn(pages as unknown as MutatingClient, "mutate");
        const userMutate = vi.spyOn(users as unknown as MutatingClient, "mutate");

        await expect(posts.update(1, { title: "Hello" })).resolves.toEqual({ id: 1 });
        await expect(pages.update(1, { title: "About" })).resolves.toEqual({ id: 1 });
        await expect(users.update(1, { username: "drew" })).resolves.toEqual({ id: 1 });

        expect(updateSpy).toHaveBeenCalledTimes(3);
        expect(updateSpy.mock.calls[0]?.slice(0, 3)).toEqual([updatePost, { title: "Hello" }, { id: 1 }]);
        expect(updateSpy.mock.calls[1]?.slice(0, 3)).toEqual([updatePage, { title: "About" }, { id: 1 }]);
        expect(updateSpy.mock.calls[2]?.slice(0, 3)).toEqual([updateUser, { username: "drew" }, { id: 1 }]);
        expect(updateSpy.mock.instances.every((instance) => instance instanceof WPUpdate)).toBe(true);
        expect(updateSpy.mock.instances.some((instance) => instance instanceof WPRead)).toBe(false);

        expect(postMutate).not.toHaveBeenCalled();
        expect(pageMutate).not.toHaveBeenCalled();
        expect(userMutate).not.toHaveBeenCalled();

        expect(String(fetchMock.mock.calls[0]?.[0])).toBe("http://example.com/wp-json/wp/v2/posts/1");
        expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
            method: "PUT",
            body: JSON.stringify({ title: "Hello" })
        });
        expect(String(fetchMock.mock.calls[1]?.[0])).toBe("http://example.com/wp-json/wp/v2/pages/1");
        expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
            method: "PUT",
            body: JSON.stringify({ title: "About" })
        });
        expect(String(fetchMock.mock.calls[2]?.[0])).toBe("http://example.com/wp-json/wp/v2/users/1");
        expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({
            method: "PUT",
            body: JSON.stringify({ username: "drew" })
        });
    });

    it("updates categories, tags, comments, and media through WPUpdate, not WPRead.mutate", async () => {
        const fetchMock = stubWordPressUpdate();
        const updateSpy = vi.spyOn(WPUpdate.prototype as unknown as UpdatingClient, "update");

        const categories = new Categories(wordpressConfig);
        const tags = new Tags(wordpressConfig);
        const comments = new Comments(wordpressConfig);
        const media = new Media(wordpressConfig);

        const categoryMutate = vi.spyOn(categories as unknown as MutatingClient, "mutate");
        const tagMutate = vi.spyOn(tags as unknown as MutatingClient, "mutate");
        const commentMutate = vi.spyOn(comments as unknown as MutatingClient, "mutate");
        const mediaMutate = vi.spyOn(media as unknown as MutatingClient, "mutate");

        await expect(categories.update(1, { name: "News" })).resolves.toEqual({ id: 1 });
        await expect(tags.update(1, { name: "featured" })).resolves.toEqual({ id: 1 });
        await expect(comments.update(1, { content: "Hi" })).resolves.toEqual({ id: 1 });
        await expect(media.update(1, { title: "Hero" })).resolves.toEqual({ id: 1 });

        expect(updateSpy).toHaveBeenCalledTimes(4);
        expect(updateSpy.mock.calls[0]?.slice(0, 3)).toEqual([updateCategory, { name: "News" }, { id: 1 }]);
        expect(updateSpy.mock.calls[1]?.slice(0, 3)).toEqual([updateTag, { name: "featured" }, { id: 1 }]);
        expect(updateSpy.mock.calls[2]?.slice(0, 3)).toEqual([updateComment, { content: "Hi" }, { id: 1 }]);
        expect(updateSpy.mock.calls[3]?.slice(0, 3)).toEqual([updateMedia, { title: "Hero" }, { id: 1 }]);
        expect(updateSpy.mock.instances.every((instance) => instance instanceof WPUpdate)).toBe(true);
        expect(updateSpy.mock.instances.some((instance) => instance instanceof WPRead)).toBe(false);

        expect(categoryMutate).not.toHaveBeenCalled();
        expect(tagMutate).not.toHaveBeenCalled();
        expect(commentMutate).not.toHaveBeenCalled();
        expect(mediaMutate).not.toHaveBeenCalled();

        expect(String(fetchMock.mock.calls[0]?.[0])).toBe("http://example.com/wp-json/wp/v2/categories/1");
        expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
            method: "PUT",
            body: JSON.stringify({ name: "News" })
        });
        expect(String(fetchMock.mock.calls[1]?.[0])).toBe("http://example.com/wp-json/wp/v2/tags/1");
        expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
            method: "PUT",
            body: JSON.stringify({ name: "featured" })
        });
        expect(String(fetchMock.mock.calls[2]?.[0])).toBe("http://example.com/wp-json/wp/v2/comments/1");
        expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({
            method: "PUT",
            body: JSON.stringify({ content: "Hi" })
        });
        expect(String(fetchMock.mock.calls[3]?.[0])).toBe("http://example.com/wp-json/wp/v2/media/1");
        expect(fetchMock.mock.calls[3]?.[1]).toMatchObject({
            method: "PUT",
            body: JSON.stringify({ title: "Hero" })
        });
    });
});
