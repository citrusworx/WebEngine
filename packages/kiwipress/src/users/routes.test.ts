import type { Endpoint, Route } from "@citrusworx/seltzer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Users } from "./users.js";
import { getUsersByCity, getUsersByCityState } from "./routes.js";

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

const wordpressConfig = {
    url: "http://example.com",
    apiBase: "wp-json/wp/v2"
};

describe("user city and state query aliases", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("maps city lookups onto ?city=", async () => {
        expect(getUsersByCity.path).toBe("/users/:city");
        await expect(requestedUrl(getUsersByCity, "/users/Austin")).resolves.toBe(
            "http://example.com/wp-json/wp/v2/users?city=Austin"
        );

        const fetchMock = vi.fn(async () => ({
            ok: true,
            json: async () => []
        }));
        vi.stubGlobal("fetch", fetchMock);
        await new Users(wordpressConfig).getByCity("Austin");

        const url = String(fetchMock.mock.calls[0]?.[0]);
        expect(url).toContain("?city=");
        expect(url).toBe("http://example.com/wp-json/wp/v2/users?city=Austin");
    });

    it("maps city and state lookups onto state= and city=", async () => {
        expect(getUsersByCityState.path).toBe("/users/:state/:city");

        const aliased = await requestedUrl(getUsersByCityState, "/users/TX/Austin");
        expect(aliased).toContain("state=TX");
        expect(aliased).toContain("city=Austin");
        expect(aliased).not.toContain("/users/TX/Austin");

        const fetchMock = vi.fn(async () => ({
            ok: true,
            json: async () => []
        }));
        vi.stubGlobal("fetch", fetchMock);
        await new Users(wordpressConfig).getByCityState("TX", "Austin");

        const url = String(fetchMock.mock.calls[0]?.[0]);
        expect(url).toContain("state=TX");
        expect(url).toContain("city=Austin");
        expect(url).not.toContain("/users/TX/Austin");
        expect(url).not.toContain("search=");
        expect(url).not.toContain("meta_query");
    });
});
