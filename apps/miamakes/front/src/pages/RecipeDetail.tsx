import { Signal } from "@citrusworx/sigjs";
import { router } from "../router";
import { deleteRecipe, getRecipeBySlug, type Recipe } from "../api/recipes";
import { formatMinutes } from "../format";
import { Render } from "../render";

export function RecipeDetail(props: { slug: string }) {
  const recipe = Signal<Recipe | null>(null);
  const error = Signal("");
  const pending = Signal(false);

  void getRecipeBySlug(props.slug)
    .then((row) => recipe.set(row))
    .catch((reason: unknown) => {
      error.set(reason instanceof Error ? reason.message : "That recipe isn't on the shelf.");
    });

  async function remove(current: Recipe) {
    if (!window.confirm(`Take “${current.name}” off the shelf?`)) {
      return;
    }
    pending.set(true);
    try {
      await deleteRecipe(current.id);
      router.navigate("/recipes");
    } catch (reason) {
      error.set(reason instanceof Error ? reason.message : "Could not delete that recipe.");
      pending.set(false);
    }
  }

  return (
    <main>
      <section paddingY="roomy">
        <div container>
          <Render>
            {() => {
              const message = error.get();
              const current = recipe.get();
              if (!current && message) {
                return (
                  <div stack gap="cozy">
                    <h1>Recipe not found</h1>
                    <p>{message}</p>
                    <a href="/recipes">Back to the recipes</a>
                  </div>
                );
              }
              if (!current) {
                return <p subtle>Setting a place at the table…</p>;
              }

              return (
                <article stack gap="cozy">
                  <header stack gap="snug">
                    <p subtle>{current.author || "Mia"}</p>
                    <h1>{current.name}</h1>
                    <p>{current.description}</p>
                    {current.nutrition ? <p subtle>{current.nutrition}</p> : null}
                    <p>
                      Prep {formatMinutes(current.prep_minutes)} · Cook {formatMinutes(current.cook_minutes)}
                    </p>
                  </header>

                  {current.photo_url ? (
                    <img src={current.photo_url} alt="" />
                  ) : null}

                  <section stack gap="snug">
                    <h2>Ingredients</h2>
                    {current.ingredients.length === 0 ? (
                      <p subtle>No ingredients written down.</p>
                    ) : (
                      <ul>
                        {current.ingredients.map((item) => (
                          <li>{item}</li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section stack gap="snug">
                    <h2>Steps</h2>
                    {current.steps.length === 0 ? (
                      <p subtle>No steps yet.</p>
                    ) : (
                      <ol>
                        {current.steps.map((item) => (
                          <li>{item}</li>
                        ))}
                      </ol>
                    )}
                  </section>

                  {message ? <p>{message}</p> : null}

                  <div row gap="cozy">
                    <a href={`/recipes/${current.slug}/edit`}>
                      <button type="button">Edit</button>
                    </a>
                    <button
                      type="button"
                      btn="outline"
                      disabled={() => (pending.get() ? true : undefined)}
                      onclick={() => {
                        void remove(current);
                      }}
                    >
                      {() => (pending.get() ? "Taking it off…" : "Delete")}
                    </button>
                    <a href="/recipes">All recipes</a>
                  </div>
                </article>
              );
            }}
          </Render>
        </div>
      </section>
    </main>
  );
}
