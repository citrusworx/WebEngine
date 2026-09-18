import { afterEach, describe, expect, it, vi } from "vitest";
import { Pages } from "../pages/pages.js";
import { updatePage } from "../pages/routes.js";
import { Posts } from "../posts/posts.js";
import { updatePost } from "../posts/routes.js";
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
});
