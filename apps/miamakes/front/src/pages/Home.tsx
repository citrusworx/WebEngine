import { Signal } from "@citrusworx/sigjs";
import { listRecipes, type Recipe } from "../api/recipes";
import { formatPair } from "../format";
import { Render } from "../render";

function RecipeCard(props: { recipe: Recipe }) {
  const recipe = props.recipe;
  return (
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
  );
}

export function Home() {
  const recipes = Signal<Recipe[] | null>(null);
  const error = Signal("");

  void listRecipes()
    .then((rows) => recipes.set(rows.slice(0, 3)))
    .catch((reason: unknown) => {
      error.set(reason instanceof Error ? reason.message : "The kitchen didn't answer.");
    });

  return (
    <main>
      <section hero>
        <div container stack gap="cozy">
          <p hero-eyebrow>
            <span badge warm>From Mia's kitchen</span>
          </p>
          <h1 hero-title>Mia Makes</h1>
          <p hero-subtitle>
            A warm place for the recipes she loves to share. Gardening notes and little
            crafts will join the shelf later — the kitchen comes first, in time for Christmas.
          </p>
          <div hero-actions>
            <a href="/recipes">
              <button type="button" scale="lg">
                See the recipes
              </button>
            </a>
            <a href="/recipes/new">
              <button type="button" btn="outline" scale="lg">
                Add a recipe
              </button>
            </a>
          </div>
        </div>
      </section>

      <section paddingY="roomy">
        <div container stack gap="cozy">
          <div section-header>
            <h2>On the counter</h2>
            <p>A few to start. The whole list is one click away.</p>
          </div>
          <Render>
            {() => {
              const message = error.get();
              if (message) {
                return <p>{message}</p>;
              }
              const rows = recipes.get();
              if (!rows) {
                return <p subtle>Warming the kitchen…</p>;
              }
              if (rows.length === 0) {
                return (
                  <p>
                    No recipes yet. <a href="/recipes/new">Add the first one.</a>
                  </p>
                );
              }
              return (
                <div grid="3x1" gap="cozy">
                  {rows.map((recipe) => (
                    <RecipeCard recipe={recipe} />
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
