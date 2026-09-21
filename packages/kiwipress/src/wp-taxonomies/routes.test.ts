import type { Endpoint, Route } from "@citrusworx/seltzer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getAllTaxonomies, getTaxonomyBySlug } from "./routes.js";

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
        json: async () => ({})
    }));
    vi.stubGlobal("fetch", fetchMock);
    await route.handler(collectionEndpoint(path));
    return String(fetchMock.mock.calls[0]?.[0]);
}

describe("WordPress taxonomy catalog routes", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("exposes read-only /taxonomies and /taxonomies/:slug routes", () => {
        expect(getAllTaxonomies.method).toBe("GET");
        expect(getAllTaxonomies.path).toBe("/taxonomies");
        expect(getTaxonomyBySlug.method).toBe("GET");
        expect(getTaxonomyBySlug.path).toBe("/taxonomies/:slug");
    });

    it("hits /wp/v2/taxonomies and /wp/v2/taxonomies/:slug", async () => {
        await expect(requestedUrl(getAllTaxonomies, "/taxonomies")).resolves.toBe(
            "http://example.com/wp-json/wp/v2/taxonomies"
        );
        await expect(requestedUrl(getTaxonomyBySlug, "/taxonomies/genre")).resolves.toBe(
            "http://example.com/wp-json/wp/v2/taxonomies/genre"
        );
    });
});
