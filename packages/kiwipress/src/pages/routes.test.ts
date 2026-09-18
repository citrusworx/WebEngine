import type { Endpoint, Route } from "@citrusworx/seltzer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getPostsByCategory, getPostsByTag } from "../posts/routes.js";
import { getPageByCategory, getPageByTag } from "./routes.js";

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

describe("page taxonomy query aliases", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("maps page tag lookups onto the same tags query key posts use", async () => {
        await expect(requestedUrl(getPageByTag, "/pages/4")).resolves.toBe(
            "http://example.com/wp-json/wp/v2/pages?tags=4"
        );
        await expect(requestedUrl(getPostsByTag, "/posts/4")).resolves.toBe(
            "http://example.com/wp-json/wp/v2/posts?tags=4"
        );
    });

    it("maps page category lookups onto the same categories query key posts use", async () => {
        await expect(requestedUrl(getPageByCategory, "/pages/3")).resolves.toBe(
            "http://example.com/wp-json/wp/v2/pages?categories=3"
        );
        await expect(requestedUrl(getPostsByCategory, "/posts/3")).resolves.toBe(
            "http://example.com/wp-json/wp/v2/posts?categories=3"
        );
    });
});
