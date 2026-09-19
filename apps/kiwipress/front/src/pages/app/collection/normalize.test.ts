import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    displayStatus,
    draftPayload,
    extractTextValue,
    normalizeItem,
    readCollectionList,
    slugFromTitle
} from "./normalize.ts";

describe("collection normalize", () => {
    it("reads WordPress rendered/raw fields and native strings", () => {
        assert.equal(extractTextValue("Hello"), "Hello");
        assert.equal(extractTextValue({ raw: "Raw title" }), "Raw title");
        assert.equal(extractTextValue({ rendered: "<p>Hi</p>" }), "<p>Hi</p>");
        assert.equal(extractTextValue({ rendered: 12 }), "");
    });

    it("maps native published status to the editor's publish value", () => {
        assert.equal(displayStatus("published"), "publish");
        assert.equal(displayStatus("draft"), "draft");
    });

    it("normalizes mixed gateway records", () => {
        const native = normalizeItem("posts", {
            id: "abc",
            title: "Native post",
            slug: "native-post",
            status: "published",
            content: "<p>Body</p>",
            updatedAt: "2026-09-19T03:00:00.000Z"
        });
        assert.equal(native.status, "publish");
        assert.equal(native.title, "Native post");
        assert.equal(native.date, "2026-09-19T03:00:00.000Z");

        const wordpress = normalizeItem("pages", {
            id: 44,
            title: { rendered: "About", raw: "About" },
            slug: "about",
            status: "draft",
            content: { raw: "<p>About us</p>" },
            date: "2026-01-01T00:00:00"
        });
        assert.equal(wordpress.id, "44");
        assert.equal(wordpress.title, "About");
        assert.equal(wordpress.content, "<p>About us</p>");
    });

    it("ignores non-array list payloads", () => {
        assert.deepEqual(readCollectionList("posts", { error: "nope" }), []);
        assert.equal(readCollectionList("posts", [{ id: 1, title: "One" }]).length, 1);
    });

    it("builds a create/update payload and fills slug from title", () => {
        assert.equal(slugFromTitle("Hello World!"), "hello-world");
        const payload = draftPayload({
            title: "  Hello World!  ",
            slug: "",
            status: "publish",
            content: "<p>Hi</p>"
        });
        assert.equal(payload.title, "Hello World!");
        assert.equal(payload.slug, "hello-world");
        assert.equal(payload.status, "publish");
    });
});
