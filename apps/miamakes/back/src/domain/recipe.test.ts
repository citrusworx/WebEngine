import { describe, expect, it } from "vitest";
import { parseRecipeWrite, RecipeInputError, slugify } from "./recipe.js";

describe("slugify", () => {
  it("turns a recipe name into a url slug", () => {
    expect(slugify("Sunday Cinnamon Rolls")).toBe("sunday-cinnamon-rolls");
    expect(slugify("  Lemon & Rosemary! ")).toBe("lemon-rosemary");
    expect(slugify("***")).toBe("recipe");
  });
});

describe("parseRecipeWrite", () => {
  it("keeps ingredients and steps as string lists and defaults empty times", () => {
    expect(
      parseRecipeWrite({
        name: " Peach cobbler ",
        ingredients: [" peaches ", "", " biscuit dough "],
        steps: [" Bake until bubbling "],
      }),
    ).toMatchObject({
      slug: "peach-cobbler",
      name: "Peach cobbler",
      author: "",
      prep_minutes: 0,
      cook_minutes: 0,
      ingredients: ["peaches", "biscuit dough"],
      steps: ["Bake until bubbling"],
      photo_url: null,
      author_id: null,
      cookbook_id: null,
    });
  });

  it("keeps omitted photo and cookbook seams from the saved recipe", () => {
    const parsed = parseRecipeWrite(
      { name: "Peach cobbler", prep_minutes: "20", cook_minutes: 45 },
      { photo_url: "photos/cobbler.jpg", author_id: "user_mia", cookbook_id: "sunday" },
    );

    expect(parsed.prep_minutes).toBe(20);
    expect(parsed.cook_minutes).toBe(45);
    expect(parsed.photo_url).toBe("photos/cobbler.jpg");
    expect(parsed.author_id).toBe("user_mia");
    expect(parsed.cookbook_id).toBe("sunday");
  });

  it("rejects a missing name, bad lists, and negative times", () => {
    expect(() => parseRecipeWrite({ name: "   " })).toThrow(RecipeInputError);
    expect(() => parseRecipeWrite({ name: "Soup", ingredients: "tomatoes" })).toThrow(
      /ingredients must be a list/,
    );
    expect(() => parseRecipeWrite({ name: "Soup", prep_minutes: -5 })).toThrow(/prep_minutes/);
    expect(() => parseRecipeWrite({ name: "Soup", steps: ["ok", 2] })).toThrow(/steps must be a list/);
  });
});
