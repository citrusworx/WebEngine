import type { Endpoint, Route } from "@citrusworx/seltzer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createTaxonomyRoutes } from "./routes.js";
import { sanitizeRestBase } from "../cpt/rest-base.js";

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

describe("taxonomy restBase sanitizing", () => {
    it("reuses CPT restBase sanitizing for taxonomy collections", () => {
        expect(sanitizeRestBase("genre")).toBe("genre");
        expect(sanitizeRestBase("product_cat")).toBe("product_cat");
        expect(() => sanitizeRestBase("genre/../tags")).toThrow(/Invalid WordPress restBase/);
    });
});

describe("taxonomy dynamic routes", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("builds WordPress collection routes from a fake restBase", () => {
        const routes = createTaxonomyRoutes("genre");

        expect(routes.getAll.method).toBe("GET");
        expect(routes.getAll.path).toBe("/genre");
        expect(routes.getById.method).toBe("GET");
        expect(routes.getById.path).toBe("/genre/:id");
        expect(routes.getBySlug.method).toBe("GET");
        expect(routes.getBySlug.path).toBe("/genre/:slug");
        expect(routes.create.method).toBe("POST");
        expect(routes.create.path).toBe("/genre");
        expect(routes.update.method).toBe("PUT");
        expect(routes.update.path).toBe("/genre/:id");
        expect(routes.delete.method).toBe("DELETE");
        expect(routes.delete.path).toBe("/genre/:id");
    });

    it("maps slug lookups onto ?slug= for the given restBase", async () => {
        const routes = createTaxonomyRoutes("genre");

        await expect(requestedUrl(routes.getBySlug, "/genre/fiction")).resolves.toBe(
            "http://example.com/wp-json/wp/v2/genre?slug=fiction"
        );
        await expect(requestedUrl(routes.getById, "/genre/12")).resolves.toBe(
            "http://example.com/wp-json/wp/v2/genre/12"
        );
        await expect(requestedUrl(routes.getAll, "/genre")).resolves.toBe(
            "http://example.com/wp-json/wp/v2/genre"
        );
    });

    it("does not share static paths across different rest bases", () => {
        expect(createTaxonomyRoutes("genre").getAll.path).toBe("/genre");
        expect(createTaxonomyRoutes("product_cat").getAll.path).toBe("/product_cat");
    });
});
