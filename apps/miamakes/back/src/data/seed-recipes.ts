import type { Recipe } from "../domain/recipe.js";

const created = "2026-10-01T15:00:00.000Z";

function sample(
  recipe: Omit<Recipe, "photo_url" | "author_id" | "cookbook_id" | "created_at" | "updated_at"> & {
    created_at?: string;
    photo_url?: string | null;
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

const saladNote =
  "Rinse the greens and let them dry. A wet salad dilutes the dressing, and this one is worth tasting as written.";

const entreeNote =
  "Take the meat out of the fridge before you start. Cold chicken seizes in a hot pan, and the lemon needs a minute to wake up.";

const appetizerNote =
  "Set the bowls out before you cook. These are meant to land on the table while everything else is still coming together.";

/** A few recipes on each shelf so the kitchen isn't empty the first time Mia opens it. */
export const SEED_RECIPES: Recipe[] = [
  sample({
    id: "rec_quinoa_salad",
    slug: "quinoa-salad",
    name: "Quinoa Salad",
    author: "Mia",
    category: "salads",
    description:
      "A bright bowl of quinoa, avocado, and crunchy vegetables, dressed while the quinoa is still a little warm so it takes the lemon in.",
    nutrition: "Fiber, greens, and enough avocado to make it a meal.",
    before_you_begin: saladNote,
    prep_minutes: 20,
    cook_minutes: 15,
    ingredients: [
      "1 cup quinoa, rinsed",
      "1 ripe avocado",
      "1 cup cherry tomatoes",
      "1/2 cup cooked chickpeas",
      "2 cups mixed greens",
      "Lemon and olive oil, to dress",
    ],
    steps: [
      "Simmer the quinoa until the tails unfurl, then spread it out so it stops steaming.",
      "Slice the avocado and tomatoes. Fold them through the quinoa with the chickpeas and greens.",
      "Dress with lemon and olive oil, taste for salt, and serve while the avocado is still bright.",
    ],
    created_at: "2026-10-04T15:00:00.000Z",
  }),
  sample({
    id: "rec_citrus_avocado_salad",
    slug: "citrus-avocado-salad",
    name: "Citrus Avocado Salad",
    author: "Mia",
    category: "salads",
    description:
      "Orange, avocado, and a handful of greens. It is the salad to make when the bowl needs to look like the market did that morning.",
    nutrition: "Vitamin C and a soft fat. Light enough to start a meal.",
    before_you_begin: saladNote,
    prep_minutes: 15,
    cook_minutes: 0,
    ingredients: [
      "2 oranges, peeled and sliced",
      "1 avocado",
      "3 cups salad greens",
      "A pinch of salt",
      "Olive oil",
    ],
    steps: [
      "Arrange the greens, then the orange and avocado.",
      "Dress lightly and serve right away.",
    ],
    created_at: "2026-10-05T15:00:00.000Z",
  }),
  sample({
    id: "rec_chopped_garden_salad",
    slug: "chopped-garden-salad",
    name: "Chopped Garden Salad",
    author: "Mia",
    category: "salads",
    description:
      "Everything from the crisper, cut small so every bite has cucumber, tomato, and a little onion.",
    nutrition: "Mostly vegetables. The olive oil is the whole indulgence.",
    before_you_begin: saladNote,
    prep_minutes: 15,
    cook_minutes: 0,
    ingredients: [
      "1 cucumber, chopped",
      "2 tomatoes, chopped",
      "1/4 red onion, minced",
      "A handful of parsley",
      "Olive oil and red wine vinegar",
    ],
    steps: [
      "Chop everything to about the same size.",
      "Toss with oil, vinegar, and salt. Let it sit five minutes, then taste again.",
    ],
    created_at: "2026-10-06T15:00:00.000Z",
  }),
  sample({
    id: "rec_lemon_rosemary_chicken",
    slug: "lemon-rosemary-chicken",
    name: "Lemon Rosemary Chicken",
    author: "Mia",
    category: "entrees",
    description:
      "Weeknight chicken with lemon, rosemary from the pot by the door, and pan juices worth saving.",
    nutrition: "Protein and a bright lemon. Pair it with a plain green salad.",
    before_you_begin: entreeNote,
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
  sample({
    id: "rec_backyard_burger",
    slug: "backyard-burger",
    name: "Backyard Burger",
    author: "Mia",
    category: "entrees",
    description:
      "A smashed burger with a soft bun and a pile of fries beside it. Salt the meat, not the pan, and leave it alone until it lets go.",
    nutrition: "A weekend plate. Add the salad if you want something green on the tray.",
    before_you_begin: entreeNote,
    prep_minutes: 15,
    cook_minutes: 20,
    ingredients: [
      "1 pound ground beef",
      "4 soft buns",
      "Salt and black pepper",
      "2 potatoes, cut for fries",
      "Oil for the fries",
    ],
    steps: [
      "Salt the beef and form loose balls. Heat a heavy pan until it is properly hot.",
      "Smash the balls thin and cook until the edges are dark, then flip once.",
      "Fry the potatoes until they are gold, salt them, and serve the burgers on the buns.",
    ],
    created_at: "2026-10-07T15:00:00.000Z",
  }),
  sample({
    id: "rec_sunday_cinnamon_rolls",
    slug: "sunday-cinnamon-rolls",
    name: "Sunday Cinnamon Rolls",
    author: "Mia",
    category: "entrees",
    description:
      "Soft rolls for a slow Sunday, with enough cinnamon to smell the kitchen before the coffee is poured.",
    nutrition: "A treat, not a weekday breakfast. Worth every sticky finger.",
    before_you_begin: entreeNote,
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
    id: "rec_marinated_olives",
    slug: "marinated-olives",
    name: "Marinated Olives",
    author: "Mia",
    category: "appetizers",
    description:
      "Olives warmed with orange peel, garlic, and a little oil. Put them out while the rest of dinner is still on the stove.",
    nutrition: "Salt and olive oil. A nibble, not a meal.",
    before_you_begin: appetizerNote,
    prep_minutes: 10,
    cook_minutes: 5,
    ingredients: [
      "2 cups mixed olives",
      "Peel of 1 orange",
      "1 clove garlic, smashed",
      "2 tablespoons olive oil",
      "A strip of lemon peel",
    ],
    steps: [
      "Warm the oil with the garlic and citrus peel until it smells fragrant.",
      "Stir in the olives and take the pan off the heat.",
      "Serve warm, with bread if you have it.",
    ],
    created_at: "2026-10-08T15:00:00.000Z",
  }),
  sample({
    id: "rec_garden_tomato_soup",
    slug: "garden-tomato-soup",
    name: "Garden Tomato Soup",
    author: "Mia",
    category: "appetizers",
    description:
      "A pot of late-summer tomatoes, an onion, and a little cream if you have it.",
    nutrition: "Mostly tomatoes. The cream is optional and the basil is not.",
    before_you_begin: appetizerNote,
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
    id: "rec_herbed_bread_and_dip",
    slug: "herbed-bread-and-dip",
    name: "Herbed Bread and Dip",
    author: "Mia",
    category: "appetizers",
    description:
      "Torn bread, a bowl of warm dip, and enough herbs that the table smells like dinner has already started.",
    nutrition: "Bread and olive oil. Share it.",
    before_you_begin: appetizerNote,
    prep_minutes: 10,
    cook_minutes: 10,
    ingredients: [
      "1 small loaf of bread",
      "3 tablespoons olive oil",
      "1 teaspoon dried herbs",
      "1/2 cup yogurt or sour cream",
      "Salt",
    ],
    steps: [
      "Tear the bread and toss it with oil, herbs, and salt.",
      "Warm it until the edges are just toasted.",
      "Stir a pinch of salt into the dip and set both on the table.",
    ],
    created_at: "2026-10-09T15:00:00.000Z",
  }),
];

export function cloneSeedRecipes(): Recipe[] {
  return SEED_RECIPES.map((recipe) => ({
    ...recipe,
    ingredients: [...recipe.ingredients],
    steps: [...recipe.steps],
  }));
}
