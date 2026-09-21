import type { Endpoint, Route } from "@citrusworx/seltzer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getAllTypes, getTypeBySlug } from "./routes.js";

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

describe("WordPress type routes", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("exposes read-only /types and /types/:slug routes", () => {
        expect(getAllTypes.method).toBe("GET");
        expect(getAllTypes.path).toBe("/types");
        expect(getTypeBySlug.method).toBe("GET");
        expect(getTypeBySlug.path).toBe("/types/:slug");
    });

    it("hits /wp/v2/types and /wp/v2/types/:slug", async () => {
        await expect(requestedUrl(getAllTypes, "/types")).resolves.toBe(
            "http://example.com/wp-json/wp/v2/types"
        );
        await expect(requestedUrl(getTypeBySlug, "/types/book")).resolves.toBe(
            "http://example.com/wp-json/wp/v2/types/book"
        );
    });
});
