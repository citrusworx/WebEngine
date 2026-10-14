import { Signal } from "@citrusworx/sigjs";
import { listRecipesByCategory, type Recipe } from "../api/recipes";
import { Banner } from "../components/Banner";
import { RecipeCard } from "../components/RecipeCard";
import { categoryLabel, categorySurface } from "../categories";
import { Render } from "../render";

export function CategoryList(props: { category: string }) {
  const recipes = Signal<Recipe[] | null>(null);
  const error = Signal("");
  const shelf = props.category;

  void listRecipesByCategory(shelf)
    .then((rows) => recipes.set(rows))
    .catch((reason: unknown) => {
      error.set(reason instanceof Error ? reason.message : "Could not open that shelf.");
    });

  return (
    <main>
      <Banner title={categoryLabel(shelf)} surface={categorySurface(shelf)} heading="h1" />
      <div class="mm-sheet">
        <Render>
          {() => {
            const message = error.get();
            if (message) {
              return <p font="poppins">{message}</p>;
            }
            const rows = recipes.get();
            if (!rows) {
              return <p font="poppins">Looking through the recipe box…</p>;
            }
            if (rows.length === 0) {
              return (
                <p font="poppins">
                  Nothing on this shelf yet. <a href="/recipes/new">Add a recipe.</a>
                </p>
              );
            }
            return (
              <div grid="2x1" gap="cozy">
                {rows.map((recipe) => (
                  <RecipeCard recipe={recipe} />
                ))}
              </div>
            );
          }}
        </Render>
      </div>
    </main>
  );
}
