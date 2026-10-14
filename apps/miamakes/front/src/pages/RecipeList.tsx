import { Signal } from "@citrusworx/sigjs";
import { listRecipes, type Recipe } from "../api/recipes";
import { RecipeCard } from "../components/RecipeCard";
import { Render } from "../render";

export function RecipeList() {
  const recipes = Signal<Recipe[] | null>(null);
  const error = Signal("");

  void listRecipes()
    .then((rows) => recipes.set(rows))
    .catch((reason: unknown) => {
      error.set(reason instanceof Error ? reason.message : "Could not load recipes.");
    });

  return (
    <main>
      <div class="mm-sheet" stack gap="cozy">
        <h1 font="playfair-display">Recipes</h1>
        <p font="poppins">
          <a href="/recipes/new">Add a recipe</a>
        </p>
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
              return <p font="poppins">The box is empty. Add a recipe and it will wait here.</p>;
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
