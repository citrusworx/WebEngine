import { afterEach, describe, expect, it, vi } from "vitest";
import { Pages } from "../pages/pages.js";
import { createPage } from "../pages/routes.js";
import { Posts } from "../posts/posts.js";
import { createPost } from "../posts/routes.js";
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
});
