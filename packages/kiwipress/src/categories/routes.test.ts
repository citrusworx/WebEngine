import { afterEach, describe, expect, it, vi } from "vitest";
import { Categories } from "./categories.js";
import {
    createCategory,
    deleteCategory,
    getCategoryBySlug,
    updateCategory
} from "./routes.js";

const wordpressConfig = {
    url: "http://example.com",
    apiBase: "wp-json/wp/v2"
};

describe("category routes", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("exposes WordPress category write routes with PUT updates", () => {
        expect(createCategory.method).toBe("POST");
        expect(createCategory.path).toBe("/categories");
        expect(updateCategory.method).toBe("PUT");
        expect(updateCategory.path).toBe("/categories/:id");
        expect(deleteCategory.method).toBe("DELETE");
        expect(deleteCategory.path).toBe("/categories/:id");
    });

    it("maps slug lookups onto ?slug=", async () => {
        const fetchMock = vi.fn(async () => ({
            ok: true,
            json: async () => []
        }));
        vi.stubGlobal("fetch", fetchMock);

        expect(getCategoryBySlug.path).toBe("/categories/:slug");
        await new Categories(wordpressConfig).getBySlug("news");

        expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
            "http://example.com/wp-json/wp/v2/categories?slug=news"
        );
    });
});
