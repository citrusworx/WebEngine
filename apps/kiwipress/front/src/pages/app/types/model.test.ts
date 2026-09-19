import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    asTypeDefinition,
    draftTypePayload,
    parseStatuses,
    readTypeList,
    slugFromLabel,
    typeItemPath
} from "./model.ts";

describe("type definition helpers", () => {
    it("reads a gateway list payload and a bare array", () => {
        const fromObject = readTypeList({
            types: [{ slug: "recipe", label: "Recipes", singular: "Recipe" }]
        });
        assert.equal(fromObject[0]?.slug, "recipe");
        assert.equal(readTypeList([{ slug: "review" }])[0]?.label, "review");
        assert.deepEqual(readTypeList({ error: "nope" }), []);
    });

    it("normalizes statuses and draft payloads", () => {
        assert.deepEqual(parseStatuses("draft, published, draft"), ["draft", "published"]);
        assert.deepEqual(parseStatuses(""), ["draft", "published", "archived"]);
        assert.equal(slugFromLabel("Kitchen Recipes!"), "kitchen-recipes");

        const payload = draftTypePayload({
            slug: "",
            label: "  Kitchen Recipes  ",
            singular: "",
            statuses: "draft, published"
        });
        assert.equal(payload.slug, "kitchen-recipes");
        assert.equal(payload.singular, "Kitchen Recipes");
        assert.deepEqual(payload.statuses, ["draft", "published"]);
        assert.equal(typeItemPath("recipe"), "/app/c/recipe");
    });

    it("requires a slug on a single definition", () => {
        assert.equal(asTypeDefinition({ label: "Recipes" }), null);
        assert.equal(asTypeDefinition({ slug: "recipe" })?.singular, "recipe");
    });
});
