import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { blockTagFor, isHeadingTag } from "./types.ts";

describe("wysiwyg engine helpers", () => {
    it("maps block commands to tags", () => {
        assert.equal(blockTagFor("paragraph"), "p");
        assert.equal(blockTagFor("heading", 2), "h2");
        assert.equal(blockTagFor("heading", 9), "h6");
        assert.equal(blockTagFor("blockquote"), "blockquote");
        assert.equal(blockTagFor("pre"), "pre");
        assert.equal(isHeadingTag("h3"), true);
        assert.equal(isHeadingTag("p"), false);
    });
});
