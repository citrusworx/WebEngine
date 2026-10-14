import { Signal } from "@citrusworx/sigjs";
import { listRecipes, type Recipe } from "../api/recipes";
import { formatPair } from "../format";
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
      <section paddingY="roomy">
        <div container stack gap="cozy">
          <div section-header>
            <h1>Recipes</h1>
            <p>Everything Mia has written down so far.</p>
          </div>
          <p>
            <a href="/recipes/new">
              <button type="button">Add a recipe</button>
            </a>
          </p>
          <Render>
            {() => {
              const message = error.get();
              if (message) {
                return <p>{message}</p>;
              }
              const rows = recipes.get();
              if (!rows) {
                return <p subtle>Looking through the recipe box…</p>;
              }
              if (rows.length === 0) {
                return <p>The box is empty. Add a recipe and it will wait here.</p>;
              }
              return (
                <div grid="3x1" gap="cozy">
                  {rows.map((recipe) => (
                    <a class="mm-card-link" href={`/recipes/${recipe.slug}`} aria-label={recipe.name}>
                      <article card>
                        <div header stack gap="snug">
                          <h2>{recipe.name}</h2>
                          <p subtle>{recipe.author || "Mia"}</p>
                        </div>
                        <div body stack gap="snug">
                          <p>{recipe.description}</p>
                          <p subtle>{formatPair(recipe.prep_minutes, recipe.cook_minutes)}</p>
                        </div>
                      </article>
                    </a>
                  ))}
                </div>
              );
            }}
          </Render>
        </div>
      </section>
    </main>
  );
}
