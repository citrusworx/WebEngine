import assert from "node:assert/strict";
import { it } from "vitest";
import { Posts } from "../posts/posts.js";

const wordpress = { url: "https://example.com", apiBase: "wp-json/wp/v2" };

it("caps reported WordPress pagination at page 1000", async () => {
    const originalFetch = globalThis.fetch;
    const pages: number[] = [];
    globalThis.fetch = async (input) => {
        const url = new URL(String(input));
        assert.equal(url.pathname, "/wp-json/wp/v2/posts");
        assert.equal(url.searchParams.get("per_page"), "2");
        assert.equal(url.searchParams.get("context"), "edit");
        const page = Number(url.searchParams.get("page"));
        pages.push(page);
        return Response.json([{ id: page }], { headers: { "X-WP-TotalPages": "1001" } });
    };

    try {
        const records = await new Posts(wordpress).listAll("posts", { per_page: "2", context: "edit", page: "5" });
        const expectedPages = Array.from({ length: 1000 }, (_, index) => index + 1);
        assert.deepEqual(pages, expectedPages);
        assert.deepEqual(records, expectedPages.map((id) => ({ id })));
    } finally {
        globalThis.fetch = originalFetch;
    }
});

it("uses one page when WordPress omits or returns an unusable page count", async () => {
    const originalFetch = globalThis.fetch;
    try {
        for (const totalPages of [undefined, "0", "unknown"]) {
            const pages: string[] = [];
            globalThis.fetch = async (input) => {
                const url = new URL(String(input));
                assert.equal(url.searchParams.get("per_page"), "100");
                pages.push(url.searchParams.get("page") ?? "");
                const headers = new Headers({ "X-WP-Total": "300" });
                if (totalPages !== undefined) headers.set("X-WP-TotalPages", totalPages);
                return Response.json([{ id: 1 }], { headers });
            };

            assert.deepEqual(await new Posts(wordpress).listAll("posts"), [{ id: 1 }]);
            assert.deepEqual(pages, ["1"]);
        }
    } finally {
        globalThis.fetch = originalFetch;
    }
});
