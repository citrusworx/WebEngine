import { afterEach, describe, expect, it, vi } from "vitest";
import { KiwiPress } from "../cms/KiwiPress.js";
import { WPRead } from "../core/WPRead.js";
import { createWordPressClients } from "../core/WPSync.js";
import {
    WordPressSearch,
    normalizeSearchHit,
    normalizeSearchHits,
    type SearchHit
} from "./search.js";

const wordpressConfig = {
    url: "http://example.com",
    apiBase: "wp-json/wp/v2"
};

const searchHits = [
    {
        id: 12,
        title: "Kiwi Press",
        url: "http://example.com/kiwi-press/",
        type: "post",
        subtype: "post"
    },
    {
        id: 4,
        title: { rendered: "Kiwi Page" },
        url: "http://example.com/kiwi-page/",
        type: "post",
        subtype: "page"
    }
];

function stubWordPress(body: unknown) {
    const fetchMock = vi.fn(async () => ({
        ok: true,
        json: async () => body
    }));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

function requestedSearch(url: string) {
    const parsed = new URL(url);
    return {
        href: parsed.href,
        path: parsed.pathname,
        params: parsed.searchParams
    };
}

describe("WordPressSearch", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("reads /wp/v2/search as a WPRead client and normalizes hits", async () => {
        const fetchMock = stubWordPress(searchHits);
        const search = new WordPressSearch(wordpressConfig);

        expect(search).toBeInstanceOf(WPRead);
        const hits = await search.query("kiwi");

        expect(hits).toEqual<SearchHit[]>([
            {
                id: 12,
                title: "Kiwi Press",
                url: "http://example.com/kiwi-press/",
                type: "post",
                subtype: "post"
            },
            {
                id: 4,
                title: "Kiwi Page",
                url: "http://example.com/kiwi-page/",
                type: "post",
                subtype: "page"
            }
        ]);

        const requested = requestedSearch(String(fetchMock.mock.calls[0]?.[0]));
        expect(requested.path).toBe("/wp-json/wp/v2/search");
        expect(requested.params.get("search")).toBe("kiwi");
        expect(search).not.toHaveProperty("create");
        expect(search).not.toHaveProperty("update");
        expect(search).not.toHaveProperty("delete");
    });

    it("maps options onto the /wp/v2/search query string", async () => {
        const fetchMock = stubWordPress(searchHits);
        const search = new WordPressSearch(wordpressConfig);

        await search.query("kiwi", {
            type: "post",
            subtype: "page",
            page: 2,
            per_page: 10,
            exclude: [9],
            include: [12, 4]
        });

        const requested = requestedSearch(String(fetchMock.mock.calls[0]?.[0]));
        expect(requested.path).toBe("/wp-json/wp/v2/search");
        expect(requested.params.get("search")).toBe("kiwi");
        expect(requested.params.get("type")).toBe("post");
        expect(requested.params.get("subtype")).toBe("page");
        expect(requested.params.get("page")).toBe("2");
        expect(requested.params.get("per_page")).toBe("10");
        expect(requested.params.get("exclude")).toBe("9");
        expect(requested.params.get("include")).toBe("12,4");
    });

    it("exposes search on the WordPress facade", async () => {
        const fetchMock = stubWordPress(searchHits);
        const kiwi = KiwiPress.connect(wordpressConfig);
        const clients = createWordPressClients(wordpressConfig);

        expect(kiwi.wordpress.search).toBeInstanceOf(WordPressSearch);
        expect(clients.search).toBeInstanceOf(WordPressSearch);
        await expect(kiwi.wordpress.search.query("kiwi", { type: "post", per_page: 10 })).resolves.toHaveLength(
            2
        );

        const requested = requestedSearch(String(fetchMock.mock.calls[0]?.[0]));
        expect(requested.path).toBe("/wp-json/wp/v2/search");
        expect(requested.params.get("search")).toBe("kiwi");
        expect(requested.params.get("type")).toBe("post");
        expect(requested.params.get("per_page")).toBe("10");
    });
});

describe("search hit helpers", () => {
    it("normalizes a hit, including rendered titles and numeric string ids", () => {
        expect(
            normalizeSearchHit({
                id: "18",
                title: { rendered: "Hello" },
                url: "http://example.com/hello/",
                type: "post",
                subtype: "post"
            })
        ).toEqual({
            id: 18,
            title: "Hello",
            url: "http://example.com/hello/",
            type: "post",
            subtype: "post"
        });
    });

    it("drops hits without an id and flattens a single object", () => {
        expect(normalizeSearchHits({ id: 1, title: "One", url: "/one", type: "term", subtype: "category" })).toEqual([
            {
                id: 1,
                title: "One",
                url: "/one",
                type: "term",
                subtype: "category"
            }
        ]);
        expect(normalizeSearchHits([{ title: "missing id" }, { id: 2, title: "Two" }])).toEqual([
            {
                id: 2,
                title: "Two",
                url: "",
                type: "",
                subtype: ""
            }
        ]);
    });
});
