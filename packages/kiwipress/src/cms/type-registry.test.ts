import { describe, expect, it } from "vitest";
import { KiwiPress } from "./KiwiPress.js";
import {
    isCollectionSlug,
    isCustomTypeSlug,
    isEditableGatewayCollection,
    normalizeTypeDefinition
} from "./type-registry.js";

describe("custom type registry", () => {
    it("accepts custom slugs and rejects built-in or reserved names", () => {
        expect(isCustomTypeSlug("recipe")).toBe(true);
        expect(isCustomTypeSlug("wp_block")).toBe(true);
        expect(isCustomTypeSlug("posts")).toBe(false);
        expect(isCustomTypeSlug("media")).toBe(false);
        expect(isCustomTypeSlug("types")).toBe(false);
        expect(isCustomTypeSlug("Recipe")).toBe(false);
        expect(isCollectionSlug("posts")).toBe(true);
        expect(isCollectionSlug("media")).toBe(true);
        expect(isCollectionSlug("recipe")).toBe(true);
        expect(isEditableGatewayCollection("pages")).toBe(true);
        expect(isEditableGatewayCollection("recipe")).toBe(true);
        expect(isEditableGatewayCollection("users")).toBe(false);
    });

    it("fills labels, statuses, and fields when creating a type", () => {
        const definition = normalizeTypeDefinition({ slug: "recipe" });
        expect(definition).toMatchObject({
            slug: "recipe",
            label: "Recipes",
            singular: "Recipe",
            statuses: ["draft", "published", "archived"],
            fields: ["title", "slug", "status", "content", "meta"]
        });
    });

    it("refuses reserved slugs and slug changes", () => {
        expect(() => normalizeTypeDefinition({ slug: "posts" })).toThrow(/lowercase letter/);
        const existing = normalizeTypeDefinition({ slug: "recipe", label: "Recipes" });
        expect(() => normalizeTypeDefinition({ slug: "meal" }, existing)).toThrow(/cannot be changed/);
    });

    it("uses registry fields and statuses as metadata and removes items with their type", async () => {
        const kiwi = KiwiPress.connect({ mode: "nectarine" });
        const { slug } = kiwi.store.registerType({ slug: "Recipe", fields: ["title"], statuses: ["draft"] });
        const recipes = kiwi.native.collection(slug);
        const recipe = await recipes.create({
            id: "pie",
            title: "Apple pie",
            content: "Bake until golden.",
            status: "review",
            servings: 4,
            meta: { servings: 8 }
        });

        expect(slug).toBe("recipe");
        expect(recipe).toMatchObject({ content: "Bake until golden.", status: "review", meta: { servings: 8 } });
        expect(recipe).not.toHaveProperty("servings");
        expect(kiwi.store.removeType(slug)).toBe(true);
        expect(kiwi.store.getType(slug)).toBeUndefined();
        expect(await recipes.getById("pie")).toBeUndefined();
    });
});
