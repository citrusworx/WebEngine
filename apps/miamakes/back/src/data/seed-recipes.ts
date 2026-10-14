import type { Recipe } from "../domain/recipe.js";

const created = "2026-10-01T15:00:00.000Z";

function sample(
  recipe: Omit<Recipe, "photo_url" | "author_id" | "cookbook_id" | "created_at" | "updated_at"> & {
    created_at?: string;
  },
): Recipe {
  const stamp = recipe.created_at ?? created;
  return {
    photo_url: null,
    author_id: null,
    cookbook_id: null,
    updated_at: stamp,
    ...recipe,
    created_at: stamp,
  };
}

/** A few recipes so the kitchen isn't empty the first time Mia opens it. */
export const SEED_RECIPES: Recipe[] = [
  sample({
    id: "rec_sunday_cinnamon_rolls",
    slug: "sunday-cinnamon-rolls",
    name: "Sunday Cinnamon Rolls",
    author: "Mia",
    description: "Soft rolls for a slow Sunday, with enough cinnamon to smell the kitchen before the coffee is poured.",
    nutrition: "A treat, not a weekday breakfast. Worth every sticky finger.",
    prep_minutes: 30,
    cook_minutes: 25,
    ingredients: [
      "3 cups all-purpose flour",
      "2 teaspoons instant yeast",
      "1 cup warm milk",
      "1/3 cup butter, softened",
      "1/2 cup brown sugar",
      "2 tablespoons cinnamon",
    ],
    steps: [
      "Stir the yeast into the warm milk and let it sit until it smells bready.",
      "Mix in the flour and half the butter until you have a soft dough, then let it rise until puffy.",
      "Roll the dough out, spread the rest of the butter, and sprinkle the sugar and cinnamon.",
      "Roll it up, slice into rounds, and bake until the tops are golden and the kitchen smells like Sunday.",
    ],
    created_at: "2026-10-01T15:00:00.000Z",
  }),
  sample({
    id: "rec_garden_tomato_soup",
    slug: "garden-tomato-soup",
    name: "Garden Tomato Soup",
    author: "Mia",
    description: "A pot of late-summer tomatoes, an onion, and a little cream if you have it.",
    nutrition: "Mostly tomatoes. The cream is optional and the basil is not.",
    prep_minutes: 15,
    cook_minutes: 40,
    ingredients: [
      "2 pounds ripe tomatoes, chopped",
      "1 yellow onion, sliced",
      "2 cloves garlic",
      "2 cups vegetable broth",
      "A handful of basil",
      "Salt and black pepper",
    ],
    steps: [
      "Soften the onion in a heavy pot.",
      "Add the garlic, then the tomatoes and broth.",
      "Simmer until the tomatoes slump, then blend until it is as smooth as you like.",
      "Stir in the basil, taste for salt, and serve with something to dip.",
    ],
    created_at: "2026-10-02T15:00:00.000Z",
  }),
  sample({
    id: "rec_lemon_rosemary_chicken",
    slug: "lemon-rosemary-chicken",
    name: "Lemon Rosemary Chicken",
    author: "Mia",
    description: "Weeknight chicken with lemon, rosemary from the pot by the door, and pan juices worth saving.",
    nutrition: "Protein and a bright lemon. Pair it with the tomato soup or a plain green salad.",
    prep_minutes: 15,
    cook_minutes: 45,
    ingredients: [
      "4 chicken thighs",
      "1 lemon, sliced",
      "3 sprigs rosemary",
      "2 tablespoons olive oil",
      "Salt and black pepper",
    ],
    steps: [
      "Heat the oven and pat the chicken dry.",
      "Toss the thighs with oil, salt, pepper, lemon, and rosemary.",
      "Roast until the skin is deep gold and the juices run clear.",
      "Rest a few minutes, then spoon the pan juices over the top.",
    ],
    created_at: "2026-10-03T15:00:00.000Z",
  }),
];

export function cloneSeedRecipes(): Recipe[] {
  return SEED_RECIPES.map((recipe) => ({
    ...recipe,
    ingredients: [...recipe.ingredients],
    steps: [...recipe.steps],
  }));
}
