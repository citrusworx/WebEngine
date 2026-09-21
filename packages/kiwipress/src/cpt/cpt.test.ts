import { afterEach, describe, expect, it, vi } from "vitest";
import { KiwiPress } from "../cms/KiwiPress.js";
import { WPCreate } from "../core/WPCreate.js";
import { WPDelete } from "../core/WPDelete.js";
import { WPRead } from "../core/WPRead.js";
import { WPUpdate } from "../core/WPUpdate.js";
import { CustomPostType } from "./cpt.js";

const wordpressConfig = {
    url: "http://example.com",
    apiBase: "wp-json/wp/v2"
};

type MutatingClient = {
    mutate: (...args: unknown[]) => Promise<unknown>;
};

function stubWordPress(body: unknown = { id: 1 }) {
    const fetchMock = vi.fn(async () => ({
        ok: true,
        json: async () => body
    }));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

describe("CustomPostType", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("reads a collection by restBase, id, and slug", async () => {
        const fetchMock = stubWordPress([{ id: 12, slug: "moby-dick" }]);
        const books = new CustomPostType(wordpressConfig, "books");

        expect(books.restBase).toBe("books");
        await expect(books.getAll()).resolves.toEqual([{ id: 12, slug: "moby-dick" }]);
        await expect(books.getById(12)).resolves.toEqual([{ id: 12, slug: "moby-dick" }]);
        await expect(books.getBySlug("moby-dick")).resolves.toEqual([{ id: 12, slug: "moby-dick" }]);

        expect(String(fetchMock.mock.calls[0]?.[0])).toBe("http://example.com/wp-json/wp/v2/books");
        expect(String(fetchMock.mock.calls[1]?.[0])).toBe("http://example.com/wp-json/wp/v2/books/12");
        expect(String(fetchMock.mock.calls[2]?.[0])).toBe(
            "http://example.com/wp-json/wp/v2/books?slug=moby-dick"
        );
    });

    it("creates, updates, and deletes through WP collaborators, not WPRead.mutate", async () => {
        const fetchMock = stubWordPress();
        const createSpy = vi.spyOn(WPCreate.prototype as unknown as { create: (...args: unknown[]) => unknown }, "create");
        const updateSpy = vi.spyOn(WPUpdate.prototype as unknown as { update: (...args: unknown[]) => unknown }, "update");
        const deleteSpy = vi.spyOn(WPDelete.prototype as unknown as { delete: (...args: unknown[]) => unknown }, "delete");

        const books = new CustomPostType(wordpressConfig, "books");
        const readMutate = vi.spyOn(books as unknown as MutatingClient, "mutate");

        await expect(books.create({ title: "Moby Dick" })).resolves.toEqual({ id: 1 });
        await expect(books.update(1, { title: "Moby-Dick" })).resolves.toEqual({ id: 1 });
        await expect(books.delete(1)).resolves.toEqual({ id: 1 });

        expect(createSpy).toHaveBeenCalledTimes(1);
        expect(createSpy.mock.calls[0]?.[1]).toEqual({ title: "Moby Dick" });
        expect(createSpy.mock.instances[0]).toBeInstanceOf(WPCreate);
        expect(createSpy.mock.instances[0]).not.toBeInstanceOf(WPRead);

        expect(updateSpy).toHaveBeenCalledTimes(1);
        expect(updateSpy.mock.calls[0]?.slice(1, 3)).toEqual([{ title: "Moby-Dick" }, { id: 1 }]);
        expect(updateSpy.mock.instances[0]).toBeInstanceOf(WPUpdate);
        expect(updateSpy.mock.instances[0]).not.toBeInstanceOf(WPRead);

        expect(deleteSpy).toHaveBeenCalledTimes(1);
        expect(deleteSpy.mock.calls[0]?.[1]).toEqual({ id: 1 });
        expect(deleteSpy.mock.instances[0]).toBeInstanceOf(WPDelete);
        expect(deleteSpy.mock.instances[0]).not.toBeInstanceOf(WPRead);

        expect(readMutate).not.toHaveBeenCalled();

        expect(String(fetchMock.mock.calls[0]?.[0])).toBe("http://example.com/wp-json/wp/v2/books");
        expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
            method: "POST",
            body: JSON.stringify({ title: "Moby Dick" })
        });
        expect(String(fetchMock.mock.calls[1]?.[0])).toBe("http://example.com/wp-json/wp/v2/books/1");
        expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
            method: "PUT",
            body: JSON.stringify({ title: "Moby-Dick" })
        });
        expect(String(fetchMock.mock.calls[2]?.[0])).toBe("http://example.com/wp-json/wp/v2/books/1");
        expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({
            method: "DELETE"
        });
    });

    it("exposes cpt(restBase) on the WordPress facade", async () => {
        const fetchMock = stubWordPress([]);
        const kiwi = KiwiPress.connect(wordpressConfig);
        const books = kiwi.wordpress.cpt("books");

        expect(books).toBeInstanceOf(CustomPostType);
        expect(books.restBase).toBe("books");
        await expect(books.getAll()).resolves.toEqual([]);
        expect(String(fetchMock.mock.calls[0]?.[0])).toBe("http://example.com/wp-json/wp/v2/books");
    });
});
