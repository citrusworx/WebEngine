import { afterEach, describe, expect, it, vi } from "vitest";
import { KiwiPress } from "../cms/KiwiPress.js";
import { WPCreate } from "../core/WPCreate.js";
import { WPDelete } from "../core/WPDelete.js";
import { WPRead } from "../core/WPRead.js";
import { WPUpdate } from "../core/WPUpdate.js";
import { CustomTaxonomy } from "./taxonomy.js";
import { Categories } from "../categories/categories.js";
import { Tags } from "../tags/tags.js";

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

describe("CustomTaxonomy", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("reads a collection by restBase, id, and slug", async () => {
        const fetchMock = stubWordPress([{ id: 12, slug: "fiction" }]);
        const genres = new CustomTaxonomy(wordpressConfig, "genre");

        expect(genres.restBase).toBe("genre");
        await expect(genres.getAll()).resolves.toEqual([{ id: 12, slug: "fiction" }]);
        await expect(genres.getById(12)).resolves.toEqual([{ id: 12, slug: "fiction" }]);
        await expect(genres.getBySlug("fiction")).resolves.toEqual([{ id: 12, slug: "fiction" }]);

        expect(String(fetchMock.mock.calls[0]?.[0])).toBe("http://example.com/wp-json/wp/v2/genre");
        expect(String(fetchMock.mock.calls[1]?.[0])).toBe("http://example.com/wp-json/wp/v2/genre/12");
        expect(String(fetchMock.mock.calls[2]?.[0])).toBe(
            "http://example.com/wp-json/wp/v2/genre?slug=fiction"
        );
    });

    it("creates, updates, and deletes through WP collaborators, not WPRead.mutate", async () => {
        const fetchMock = stubWordPress();
        const createSpy = vi.spyOn(WPCreate.prototype as unknown as { create: (...args: unknown[]) => unknown }, "create");
        const updateSpy = vi.spyOn(WPUpdate.prototype as unknown as { update: (...args: unknown[]) => unknown }, "update");
        const deleteSpy = vi.spyOn(WPDelete.prototype as unknown as { delete: (...args: unknown[]) => unknown }, "delete");

        const genres = new CustomTaxonomy(wordpressConfig, "genre");
        const readMutate = vi.spyOn(genres as unknown as MutatingClient, "mutate");

        await expect(genres.create({ name: "Fiction" })).resolves.toEqual({ id: 1 });
        await expect(genres.update(1, { name: "Sci-Fi" })).resolves.toEqual({ id: 1 });
        await expect(genres.delete(1)).resolves.toEqual({ id: 1 });

        expect(createSpy).toHaveBeenCalledTimes(1);
        expect(createSpy.mock.calls[0]?.[1]).toEqual({ name: "Fiction" });
        expect(createSpy.mock.instances[0]).toBeInstanceOf(WPCreate);
        expect(createSpy.mock.instances[0]).not.toBeInstanceOf(WPRead);

        expect(updateSpy).toHaveBeenCalledTimes(1);
        expect(updateSpy.mock.calls[0]?.slice(1, 3)).toEqual([{ name: "Sci-Fi" }, { id: 1 }]);
        expect(updateSpy.mock.instances[0]).toBeInstanceOf(WPUpdate);
        expect(updateSpy.mock.instances[0]).not.toBeInstanceOf(WPRead);

        expect(deleteSpy).toHaveBeenCalledTimes(1);
        expect(deleteSpy.mock.calls[0]?.[1]).toEqual({ id: 1 });
        expect(deleteSpy.mock.instances[0]).toBeInstanceOf(WPDelete);
        expect(deleteSpy.mock.instances[0]).not.toBeInstanceOf(WPRead);

        expect(readMutate).not.toHaveBeenCalled();

        expect(String(fetchMock.mock.calls[0]?.[0])).toBe("http://example.com/wp-json/wp/v2/genre");
        expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
            method: "POST",
            body: JSON.stringify({ name: "Fiction" })
        });
        expect(String(fetchMock.mock.calls[1]?.[0])).toBe("http://example.com/wp-json/wp/v2/genre/1");
        expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
            method: "PUT",
            body: JSON.stringify({ name: "Sci-Fi" })
        });
        expect(String(fetchMock.mock.calls[2]?.[0])).toBe("http://example.com/wp-json/wp/v2/genre/1");
        expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({
            method: "DELETE"
        });
    });

    it("exposes taxonomy(restBase) on the WordPress facade without replacing Categories or Tags", async () => {
        const fetchMock = stubWordPress([]);
        const kiwi = KiwiPress.connect(wordpressConfig);
        const genres = kiwi.wordpress.taxonomy("genre");

        expect(genres).toBeInstanceOf(CustomTaxonomy);
        expect(genres.restBase).toBe("genre");
        expect(kiwi.wordpress.categories).toBeInstanceOf(Categories);
        expect(kiwi.wordpress.tags).toBeInstanceOf(Tags);
        await expect(genres.getAll()).resolves.toEqual([]);
        expect(String(fetchMock.mock.calls[0]?.[0])).toBe("http://example.com/wp-json/wp/v2/genre");
    });
});
