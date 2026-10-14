import { Signal } from "@citrusworx/sigjs";
import { deleteRecipe, getRecipeBySlug, type Recipe } from "../api/recipes";
import { Banner } from "../components/Banner";
import { categorySurface } from "../categories";
import { takeFocus } from "../focus";
import { Render } from "../render";
import { router } from "../router";

export function RecipeDetail(props: { slug: string }) {
  const recipe = Signal<Recipe | null>(null);
  const error = Signal("");
  const pending = Signal(false);
  let didFocus = false;

  void getRecipeBySlug(props.slug)
    .then((row) => recipe.set(row))
    .catch((reason: unknown) => {
      error.set(reason instanceof Error ? reason.message : "That recipe isn't on the shelf.");
    });

  function maybeFocus() {
    if (didFocus) {
      return;
    }
    const target = takeFocus();
    didFocus = true;
    if (!target) {
      return;
    }
    requestAnimationFrame(() => {
      document.getElementById(target)?.scrollIntoView({ block: "start" });
    });
  }

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
    <main class="mm-detail">
      <Render>
        {() => {
          const message = error.get();
          const current = recipe.get();
          if (!current && message) {
            return (
              <div class="mm-sheet" stack gap="cozy">
                <h1 font="playfair-display">Recipe not found</h1>
                <p font="poppins">{message}</p>
                <a href="/">Back home</a>
              </div>
            );
          }
          if (!current) {
            return (
              <p class="mm-sheet" font="poppins">
                Setting a place at the table…
              </p>
            );
          }

          maybeFocus();

          return (
            <article>
              <Banner
                title={current.name}
                surface={categorySurface(current.category)}
                photoUrl={current.photo_url}
                heading="h1"
              />

              <div id="ingredients">
                <div surface="mm-section" class="mm-section-bar">
                  <h2 font="playfair-display" fontColor="white-100" fontSize="lg">
                    What You Will Need
                  </h2>
                  <button
                    type="button"
                    surface="mm-green"
                    scale="sm"
                    onclick={() => {
                      document.getElementById("steps")?.scrollIntoView({ block: "start" });
                    }}
                  >
                    Go To Steps
                  </button>
                </div>
                {current.ingredients.length === 0 ? (
                  <p class="mm-notes" font="poppins">
                    No ingredients written down.
                  </p>
                ) : (
                  <ul class="mm-ingredients">
                    {current.ingredients.map((item) => (
                      <li font="poppins">{item}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div id="before">
                <div surface="mm-section" class="mm-section-bar">
                  <h2 font="playfair-display" fontColor="white-100" fontSize="lg">
                    Before You Begin
                  </h2>
                </div>
                <p class="mm-notes" font="poppins">
                  {current.before_you_begin || "No notes for this one yet."}
                </p>
              </div>

              <div id="steps">
                <div surface="mm-section" class="mm-section-bar">
                  <h2 font="playfair-display" fontColor="white-100" fontSize="lg">
                    Steps
                  </h2>
                </div>
                {current.steps.length === 0 ? (
                  <p class="mm-notes" font="poppins">
                    No steps yet.
                  </p>
                ) : (
                  <ol class="mm-steps">
                    {current.steps.map((item) => (
                      <li font="poppins">{item}</li>
                    ))}
                  </ol>
                )}
              </div>

              {message ? <p class="mm-sheet">{message}</p> : null}

              <div class="mm-manage">
                <a href={`/recipes/${current.slug}/edit`}>Edit</a>
                <button
                  type="button"
                  disabled={() => (pending.get() ? true : undefined)}
                  onclick={() => {
                    void remove(current);
                  }}
                >
                  {() => (pending.get() ? "Taking it off…" : "Delete")}
                </button>
              </div>
            </article>
          );
        }}
      </Render>
    </main>
  );
}
