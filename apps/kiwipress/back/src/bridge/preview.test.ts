import { describe, expect, it } from "vitest";
import { autosaveFields, restBaseForPostType } from "./preview.js";

describe("autosaveFields", () => {
    it("keeps editor text and never copies a status that would publish", () => {
        const fields = autosaveFields(
            { title: "Draft title", content: "<p>Draft</p>", status: "publish", excerpt: "Line" },
            { title: "Saved", content: "Saved body", excerpt: "Saved excerpt" }
        );

        expect(fields).toEqual({
            title: "Draft title",
            content: "<p>Draft</p>",
            excerpt: "Line"
        });
        expect(fields).not.toHaveProperty("status");
    });

    it("fills gaps from the current post", () => {
        expect(autosaveFields(
            { title: "Only title" },
            { title: "Saved", content: "<p>Body</p>", excerpt: "" }
        )).toEqual({
            title: "Only title",
            content: "<p>Body</p>",
            excerpt: ""
        });
    });
});

describe("restBaseForPostType", () => {
    it("maps core types and rejects a path", () => {
        expect(restBaseForPostType("post")).toBe("posts");
        expect(restBaseForPostType("pages")).toBe("pages");
        expect(restBaseForPostType("kiwi-fruit")).toBe("kiwi-fruit");
        expect(() => restBaseForPostType("../posts")).toThrow(/restBase/);
    });
});
