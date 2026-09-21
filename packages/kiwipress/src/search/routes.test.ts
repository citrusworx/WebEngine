import type { Endpoint, Route } from "@citrusworx/seltzer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildSearchQuery, searchByQuery, searchByTerm } from "./routes.js";

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

describe("WordPress search routes", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("exposes read-only /search/:term aliased onto ?search=", () => {
        expect(searchByTerm.method).toBe("GET");
        expect(searchByTerm.path).toBe("/search/:term");
        expect(searchByQuery.method).toBe("GET");
        expect(searchByQuery.path).toBe("/search/:query");
    });

    it("hits /wp/v2/search?search= from the aliased term route", async () => {
        await expect(requestedUrl(searchByTerm, "/search/kiwi")).resolves.toBe(
            "http://example.com/wp-json/wp/v2/search?search=kiwi"
        );
    });

    it("hits /wp/v2/search with a pre-built query string", async () => {
        await expect(
            requestedUrl(searchByQuery, "/search/search=kiwi&type=post&per_page=10")
        ).resolves.toBe("http://example.com/wp-json/wp/v2/search?search=kiwi&type=post&per_page=10");
    });
});

describe("buildSearchQuery", () => {
    it("always sets the search term", () => {
        expect(buildSearchQuery("kiwi")).toBe("search=kiwi");
    });

    it("maps WP REST options onto the query string", () => {
        const query = new URLSearchParams(
            buildSearchQuery("kiwi", {
                type: "post",
                subtype: "page",
                page: 2,
                per_page: 10,
                exclude: [3, 4],
                include: 7
            })
        );

        expect(query.get("search")).toBe("kiwi");
        expect(query.get("type")).toBe("post");
        expect(query.get("subtype")).toBe("page");
        expect(query.get("page")).toBe("2");
        expect(query.get("per_page")).toBe("10");
        expect(query.get("exclude")).toBe("3,4");
        expect(query.get("include")).toBe("7");
    });

    it("joins subtype arrays and skips empty include/exclude lists", () => {
        const query = new URLSearchParams(
            buildSearchQuery("term hits", {
                type: "term",
                subtype: ["category", "post_tag"],
                exclude: [],
                include: []
            })
        );

        expect(query.get("search")).toBe("term hits");
        expect(query.get("type")).toBe("term");
        expect(query.get("subtype")).toBe("category,post_tag");
        expect(query.has("exclude")).toBe(false);
        expect(query.has("include")).toBe(false);
    });
});
