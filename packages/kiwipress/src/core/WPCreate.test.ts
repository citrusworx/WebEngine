import { afterEach, describe, expect, it, vi } from "vitest";
import { Categories } from "../categories/categories.js";
import { createCategory } from "../categories/routes.js";
import { Comments } from "../comments/comments.js";
import { createComment } from "../comments/routes.js";
import { Media } from "../media/media.js";
import { createMedia } from "../media/routes.js";
import { Pages } from "../pages/pages.js";
import { createPage } from "../pages/routes.js";
import { Posts } from "../posts/posts.js";
import { createPost } from "../posts/routes.js";
import { Tags } from "../tags/tags.js";
import { createTag } from "../tags/routes.js";
import { Users } from "../users/users.js";
import { createUser } from "../users/routes.js";
import { WPCreate } from "./WPCreate.js";
import { WPRead } from "./WPRead.js";

const wordpressConfig = {
    url: "http://example.com",
    apiBase: "wp-json/wp/v2"
};

type MutatingClient = {
    mutate: (...args: unknown[]) => Promise<unknown>;
};

type CreatingClient = {
    create: (...args: unknown[]) => Promise<unknown>;
};

function stubWordPressCreate(body: unknown = { id: 1 }) {
    const fetchMock = vi.fn(async () => ({
        ok: true,
        json: async () => body
    }));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

describe("WPCreate collaborators", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("creates posts, pages, and users through WPCreate, not WPRead.mutate", async () => {
        const fetchMock = stubWordPressCreate();
        const createSpy = vi.spyOn(WPCreate.prototype as unknown as CreatingClient, "create");

        const posts = new Posts(wordpressConfig);
        const pages = new Pages(wordpressConfig);
        const users = new Users(wordpressConfig);

        const postMutate = vi.spyOn(posts as unknown as MutatingClient, "mutate");
        const pageMutate = vi.spyOn(pages as unknown as MutatingClient, "mutate");
        const userMutate = vi.spyOn(users as unknown as MutatingClient, "mutate");

        await expect(posts.create({ title: "Hello" })).resolves.toEqual({ id: 1 });
        await expect(pages.create({ title: "About" })).resolves.toEqual({ id: 1 });
        await expect(users.create({ username: "drew" })).resolves.toEqual({ id: 1 });

        expect(createSpy).toHaveBeenCalledTimes(3);
        expect(createSpy.mock.calls[0]?.slice(0, 2)).toEqual([createPost, { title: "Hello" }]);
        expect(createSpy.mock.calls[1]?.slice(0, 2)).toEqual([createPage, { title: "About" }]);
        expect(createSpy.mock.calls[2]?.slice(0, 2)).toEqual([createUser, { username: "drew" }]);
        expect(createSpy.mock.instances.every((instance) => instance instanceof WPCreate)).toBe(true);
        expect(createSpy.mock.instances.some((instance) => instance instanceof WPRead)).toBe(false);

        expect(postMutate).not.toHaveBeenCalled();
        expect(pageMutate).not.toHaveBeenCalled();
        expect(userMutate).not.toHaveBeenCalled();

        expect(String(fetchMock.mock.calls[0]?.[0])).toBe("http://example.com/wp-json/wp/v2/posts");
        expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
            method: "POST",
            body: JSON.stringify({ title: "Hello" })
        });
        expect(String(fetchMock.mock.calls[1]?.[0])).toBe("http://example.com/wp-json/wp/v2/pages");
        expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
            method: "POST",
            body: JSON.stringify({ title: "About" })
        });
        expect(String(fetchMock.mock.calls[2]?.[0])).toBe("http://example.com/wp-json/wp/v2/users");
        expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({
            method: "POST",
            body: JSON.stringify({ username: "drew" })
        });
    });

    it("creates categories, tags, comments, and media through WPCreate, not WPRead.mutate", async () => {
        const fetchMock = stubWordPressCreate();
        const createSpy = vi.spyOn(WPCreate.prototype as unknown as CreatingClient, "create");

        const categories = new Categories(wordpressConfig);
        const tags = new Tags(wordpressConfig);
        const comments = new Comments(wordpressConfig);
        const media = new Media(wordpressConfig);

        const categoryMutate = vi.spyOn(categories as unknown as MutatingClient, "mutate");
        const tagMutate = vi.spyOn(tags as unknown as MutatingClient, "mutate");
        const commentMutate = vi.spyOn(comments as unknown as MutatingClient, "mutate");
        const mediaMutate = vi.spyOn(media as unknown as MutatingClient, "mutate");

        await expect(categories.create({ name: "News" })).resolves.toEqual({ id: 1 });
        await expect(tags.create({ name: "featured" })).resolves.toEqual({ id: 1 });
        await expect(comments.create({ post: 4, content: "Hi" })).resolves.toEqual({ id: 1 });
        await expect(media.create({ title: "Hero" })).resolves.toEqual({ id: 1 });

        expect(createSpy).toHaveBeenCalledTimes(4);
        expect(createSpy.mock.calls[0]?.slice(0, 2)).toEqual([createCategory, { name: "News" }]);
        expect(createSpy.mock.calls[1]?.slice(0, 2)).toEqual([createTag, { name: "featured" }]);
        expect(createSpy.mock.calls[2]?.slice(0, 2)).toEqual([createComment, { post: 4, content: "Hi" }]);
        expect(createSpy.mock.calls[3]?.slice(0, 2)).toEqual([createMedia, { title: "Hero" }]);
        expect(createSpy.mock.instances.every((instance) => instance instanceof WPCreate)).toBe(true);
        expect(createSpy.mock.instances.some((instance) => instance instanceof WPRead)).toBe(false);

        expect(categoryMutate).not.toHaveBeenCalled();
        expect(tagMutate).not.toHaveBeenCalled();
        expect(commentMutate).not.toHaveBeenCalled();
        expect(mediaMutate).not.toHaveBeenCalled();

        expect(String(fetchMock.mock.calls[0]?.[0])).toBe("http://example.com/wp-json/wp/v2/categories");
        expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
            method: "POST",
            body: JSON.stringify({ name: "News" })
        });
        expect(String(fetchMock.mock.calls[1]?.[0])).toBe("http://example.com/wp-json/wp/v2/tags");
        expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
            method: "POST",
            body: JSON.stringify({ name: "featured" })
        });
        expect(String(fetchMock.mock.calls[2]?.[0])).toBe("http://example.com/wp-json/wp/v2/comments");
        expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({
            method: "POST",
            body: JSON.stringify({ post: 4, content: "Hi" })
        });
        expect(String(fetchMock.mock.calls[3]?.[0])).toBe("http://example.com/wp-json/wp/v2/media");
        expect(fetchMock.mock.calls[3]?.[1]).toMatchObject({
            method: "POST",
            body: JSON.stringify({ title: "Hero" })
        });
    });
});
