import type { Endpoint, Route } from "@citrusworx/seltzer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createCptRoutes } from "./routes.js";
import { sanitizeRestBase } from "./rest-base.js";

function collectionEndpoint(path: string): Endpoint {
    return {
        path,
        endpoint: `http://example.com/wp-json/wp/v2${path}`,
        options: {
            baseUrl: "http://example.com/wp-json/wp/v2"
        }
    };
}

async function requestedUrl(route: Route<Endpoint>, path: string) {
    const fetchMock = vi.fn(async () => ({
        ok: true,
        json: async () => []
    }));
    vi.stubGlobal("fetch", fetchMock);
    await route.handler(collectionEndpoint(path));
    return String(fetchMock.mock.calls[0]?.[0]);
}

describe("CPT restBase sanitizing", () => {
    it("accepts WordPress collection slugs and trims whitespace", () => {
        expect(sanitizeRestBase("books")).toBe("books");
        expect(sanitizeRestBase("product")).toBe("product");
        expect(sanitizeRestBase("wp_block")).toBe("wp_block");
        expect(sanitizeRestBase("  books  ")).toBe("books");
    });

    it("rejects empty, traversal, and multi-segment values", () => {
        expect(() => sanitizeRestBase("")).toThrow(/non-empty collection slug/);
        expect(() => sanitizeRestBase("   ")).toThrow(/non-empty collection slug/);
        expect(() => sanitizeRestBase("../posts")).toThrow(/Invalid WordPress restBase/);
        expect(() => sanitizeRestBase("books/../posts")).toThrow(/Invalid WordPress restBase/);
        expect(() => sanitizeRestBase("books/chapters")).toThrow(/Invalid WordPress restBase/);
        expect(() => sanitizeRestBase("books\\chapters")).toThrow(/Invalid WordPress restBase/);
        expect(() => sanitizeRestBase("books?foo=1")).toThrow(/Invalid WordPress restBase/);
        expect(() => sanitizeRestBase("%2e%2e")).toThrow(/Invalid WordPress restBase/);
        expect(() => sanitizeRestBase(".")).toThrow(/Invalid WordPress restBase/);
    });
});

describe("CPT dynamic routes", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("builds WordPress collection routes from a fake restBase", () => {
        const routes = createCptRoutes("books");

        expect(routes.getAll.method).toBe("GET");
        expect(routes.getAll.path).toBe("/books");
        expect(routes.getById.method).toBe("GET");
        expect(routes.getById.path).toBe("/books/:id");
        expect(routes.getBySlug.method).toBe("GET");
        expect(routes.getBySlug.path).toBe("/books/:slug");
        expect(routes.create.method).toBe("POST");
        expect(routes.create.path).toBe("/books");
        expect(routes.update.method).toBe("PUT");
        expect(routes.update.path).toBe("/books/:id");
        expect(routes.delete.method).toBe("DELETE");
        expect(routes.delete.path).toBe("/books/:id");
    });

    it("maps slug lookups onto ?slug= for the given restBase", async () => {
        const routes = createCptRoutes("books");

        await expect(requestedUrl(routes.getBySlug, "/books/moby-dick")).resolves.toBe(
            "http://example.com/wp-json/wp/v2/books?slug=moby-dick"
        );
        await expect(requestedUrl(routes.getById, "/books/12")).resolves.toBe(
            "http://example.com/wp-json/wp/v2/books/12"
        );
        await expect(requestedUrl(routes.getAll, "/books")).resolves.toBe(
            "http://example.com/wp-json/wp/v2/books"
        );
    });

    it("does not share static paths across different rest bases", () => {
        expect(createCptRoutes("books").getAll.path).toBe("/books");
        expect(createCptRoutes("product").getAll.path).toBe("/product");
    });
});
