import { Signal } from "@citrusworx/sigjs";
import type { Sig } from "../signal";
import { createRecipe, getRecipeBySlug, updateRecipe, type Recipe } from "../api/recipes";
import { CATEGORIES } from "../categories";
import { RecipePreview } from "../components/RecipePreview";
import { router } from "../router";
import { Render } from "../render";

type Unit = "min" | "hr";

function toMinutes(amount: string, unit: Unit): number | null {
  if (!amount.trim()) {
    return 0;
  }
  const value = Number(amount);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.round(unit === "hr" ? value * 60 : value);
}

function fromMinutes(total: number): { amount: string; unit: Unit } {
  if (total >= 60 && total % 60 === 0) {
    return { amount: String(total / 60), unit: "hr" };
  }
  return { amount: total ? String(total) : "", unit: "min" };
}

function LineEditor(props: {
  legend: string;
  placeholder: string;
  items: string[];
  tick: Sig<number>;
  onEdit: () => void;
}) {
  return (
    <fieldset>
      <legend>{props.legend}</legend>
      <div stack gap="snug">
        <Render>
          {() => {
            props.tick.get();
            return props.items.map((item, index) => (
              <div row gap="snug">
                <input
                  type="text"
                  value={item}
                  placeholder={props.placeholder}
                  aria-label={`${props.legend} ${index + 1}`}
                  oninput={(event: Event) => {
                    props.items[index] = (event.currentTarget as HTMLInputElement).value;
                    props.onEdit();
                  }}
                />
                <button
                  type="button"
                  btn="outline"
                  onclick={() => {
                    props.items.splice(index, 1);
                    if (props.items.length === 0) {
                      props.items.push("");
                    }
                    props.tick.set(props.tick.get() + 1);
                    props.onEdit();
                  }}
                >
                  Remove
                </button>
              </div>
            ));
          }}
        </Render>
        <p>
          <button
            type="button"
            onclick={() => {
              props.items.push("");
              props.tick.set(props.tick.get() + 1);
              props.onEdit();
            }}
          >
            Add {props.legend === "Ingredients" ? "ingredient" : "step"}
          </button>
        </p>
      </div>
    </fieldset>
  );
}

export function RecipeForm(props: { slug?: string }) {
  const editing = Boolean(props.slug);
  const name = Signal("");
  const author = Signal("Mia");
  const description = Signal("");
  const nutrition = Signal("");
  const category = Signal("entrees");
  const beforeYouBegin = Signal("");
  const prepMinutes = Signal("0");
  const cookMinutes = Signal("0");
  const status = Signal(editing ? "Bringing the recipe in from the kitchen…" : "");
  const saving = Signal(false);
  const ready = Signal(!editing);
  const previewTick = Signal(0);
  const ingredientTick = Signal(0);
  const stepTick = Signal(0);
  const ingredients = [""];
  const steps = [""];

  let recipeId = "";
  let nameInput: HTMLInputElement | null = null;
  let authorInput: HTMLInputElement | null = null;
  let descriptionInput: HTMLTextAreaElement | null = null;
  let nutritionInput: HTMLTextAreaElement | null = null;
  let categoryInput: HTMLInputElement | null = null;
  let beforeInput: HTMLTextAreaElement | null = null;
  let prepInput: HTMLInputElement | null = null;
  let cookInput: HTMLInputElement | null = null;
  let prepUnit: HTMLSelectElement | null = null;
  let cookUnit: HTMLSelectElement | null = null;

  function touch() {
    previewTick.set(previewTick.get() + 1);
  }

  function fill(recipe: Recipe) {
    recipeId = recipe.id;
    name.set(recipe.name);
    author.set(recipe.author || "Mia");
    description.set(recipe.description);
    nutrition.set(recipe.nutrition);
    category.set(recipe.category || "entrees");
    beforeYouBegin.set(recipe.before_you_begin || "");
    const prep = fromMinutes(recipe.prep_minutes);
    const cook = fromMinutes(recipe.cook_minutes);
    prepMinutes.set(String(recipe.prep_minutes));
    cookMinutes.set(String(recipe.cook_minutes));
    ingredients.splice(0, ingredients.length, ...(recipe.ingredients.length ? recipe.ingredients : [""]));
    steps.splice(0, steps.length, ...(recipe.steps.length ? recipe.steps : [""]));
    if (nameInput) nameInput.value = recipe.name;
    if (authorInput) authorInput.value = recipe.author || "Mia";
    if (descriptionInput) descriptionInput.value = recipe.description;
    if (nutritionInput) nutritionInput.value = recipe.nutrition;
    if (categoryInput) categoryInput.value = recipe.category || "entrees";
    if (beforeInput) beforeInput.value = recipe.before_you_begin || "";
    if (prepInput) prepInput.value = prep.amount;
    if (cookInput) cookInput.value = cook.amount;
    if (prepUnit) prepUnit.value = prep.unit;
    if (cookUnit) cookUnit.value = cook.unit;
    ingredientTick.set(ingredientTick.get() + 1);
    stepTick.set(stepTick.get() + 1);
    ready.set(true);
    status.set("");
    touch();
  }

  if (props.slug) {
    void getRecipeBySlug(props.slug)
      .then(fill)
      .catch((reason: unknown) => {
        status.set(reason instanceof Error ? reason.message : "Could not open that recipe.");
      });
  }

  function readUnit(select: HTMLSelectElement | null): Unit {
    return select?.value === "hr" ? "hr" : "min";
  }

  async function save(event: Event) {
    event.preventDefault();
    if (saving.get() || !ready.get()) {
      return;
    }

    const prep = toMinutes(prepInput?.value ?? "", readUnit(prepUnit));
    const cook = toMinutes(cookInput?.value ?? "", readUnit(cookUnit));
    if (prep === null || cook === null) {
      status.set("Times need to be numbers, like 15 min or 1 hr.");
      return;
    }

    const payload = {
      name: nameInput?.value ?? name.get(),
      author: authorInput?.value ?? author.get(),
      description: descriptionInput?.value ?? description.get(),
      nutrition: nutritionInput?.value ?? nutrition.get(),
      category: categoryInput?.value ?? category.get(),
      before_you_begin: beforeInput?.value ?? beforeYouBegin.get(),
      prep_minutes: prep,
      cook_minutes: cook,
      ingredients: ingredients.map((item) => item.trim()).filter(Boolean),
      steps: steps.map((item) => item.trim()).filter(Boolean),
    };

    saving.set(true);
    status.set("");
    try {
      const saved = recipeId ? await updateRecipe(recipeId, payload) : await createRecipe(payload);
      router.navigate(`/recipes/${saved.slug}`);
    } catch (reason) {
      status.set(reason instanceof Error ? reason.message : "Could not save that recipe.");
      saving.set(false);
    }
  }

  return (
    <main class="mm-form">
      <section paddingY="roomy">
        <div stack gap="cozy">
          <div section-header>
            <h1>{editing ? "Edit recipe" : "Add a recipe"}</h1>
            <p>Basic notes, times, ingredients, and steps. The card on the right updates as you type.</p>
          </div>

          <Render>
            {() => {
              if (!ready.get()) {
                return <p subtle>{status.get() || "One moment…"}</p>;
              }
              return null;
            }}
          </Render>

          <form hidden={() => !ready.get()} onsubmit={(event: Event) => void save(event)}>
            <div grid="2x1" gap="cozy">
              <div stack gap="cozy">
                <fieldset>
                  <legend>Basic</legend>
                  <div stack gap="snug">
                    <label>
                      Name of recipe
                      <input
                        type="text"
                        required
                        placeholder="Sunday cinnamon rolls"
                        ref={(node: HTMLInputElement) => {
                          nameInput = node;
                          node.value = name.get();
                        }}
                        oninput={(event: Event) => {
                          name.set((event.currentTarget as HTMLInputElement).value);
                        }}
                      />
                    </label>
                    <label>
                      Author
                      <input
                        type="text"
                        placeholder="Mia"
                        ref={(node: HTMLInputElement) => {
                          authorInput = node;
                          node.value = author.get();
                        }}
                        oninput={(event: Event) => {
                          author.set((event.currentTarget as HTMLInputElement).value);
                        }}
                      />
                    </label>
                    <label>
                      Description
                      <textarea
                        rows={4}
                        placeholder="What makes this one worth making?"
                        ref={(node: HTMLTextAreaElement) => {
                          descriptionInput = node;
                        }}
                        oninput={(event: Event) => {
                          description.set((event.currentTarget as HTMLTextAreaElement).value);
                        }}
                      />
                    </label>
                    <label>
                      Category
                      <input
                        type="text"
                        list="recipe-categories"
                        placeholder="salads"
                        ref={(node: HTMLInputElement) => {
                          categoryInput = node;
                          node.value = category.get();
                        }}
                        oninput={(event: Event) => {
                          category.set((event.currentTarget as HTMLInputElement).value);
                        }}
                      />
                      <datalist id="recipe-categories">
                        {CATEGORIES.map((shelf) => (
                          <option value={shelf.id}>{shelf.label}</option>
                        ))}
                      </datalist>
                    </label>
                    <p subtle>
                      Salads, entrees, and appetizers are the starter shelves. A new short name is
                      stored as-is. It does not need a schema change.
                    </p>
                    <label>
                      Before you begin
                      <textarea
                        rows={3}
                        placeholder="What should be true before the first step?"
                        ref={(node: HTMLTextAreaElement) => {
                          beforeInput = node;
                          node.value = beforeYouBegin.get();
                        }}
                        oninput={(event: Event) => {
                          beforeYouBegin.set((event.currentTarget as HTMLTextAreaElement).value);
                        }}
                      />
                    </label>
                    <label>
                      Nutrition notes
                      <textarea
                        rows={3}
                        placeholder="Optional. A sentence is plenty."
                        ref={(node: HTMLTextAreaElement) => {
                          nutritionInput = node;
                        }}
                        oninput={(event: Event) => {
                          nutrition.set((event.currentTarget as HTMLTextAreaElement).value);
                        }}
                      />
                    </label>
                  </div>
                </fieldset>

                <fieldset>
                  <legend>Times</legend>
                  <p subtle>Prep is the getting-ready. Cook is the time on the heat.</p>
                  <div row gap="cozy">
                    <label>
                      Prep
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="20"
                        ref={(node: HTMLInputElement) => {
                          prepInput = node;
                        }}
                        oninput={(event: Event) => {
                          const minutes = toMinutes(
                            (event.currentTarget as HTMLInputElement).value,
                            readUnit(prepUnit),
                          );
                          prepMinutes.set(minutes === null ? "" : String(minutes));
                        }}
                      />
                    </label>
                    <label>
                      Unit
                      <select
                        ref={(node: HTMLSelectElement) => {
                          prepUnit = node;
                        }}
                        onchange={(event: Event) => {
                          const minutes = toMinutes(prepInput?.value ?? "", readUnit(event.currentTarget as HTMLSelectElement));
                          prepMinutes.set(minutes === null ? "" : String(minutes));
                        }}
                      >
                        <option value="min">min</option>
                        <option value="hr">hr</option>
                      </select>
                    </label>
                    <label>
                      Cook
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="35"
                        ref={(node: HTMLInputElement) => {
                          cookInput = node;
                        }}
                        oninput={(event: Event) => {
                          const minutes = toMinutes(
                            (event.currentTarget as HTMLInputElement).value,
                            readUnit(cookUnit),
                          );
                          cookMinutes.set(minutes === null ? "" : String(minutes));
                        }}
                      />
                    </label>
                    <label>
                      Unit
                      <select
                        ref={(node: HTMLSelectElement) => {
                          cookUnit = node;
                        }}
                        onchange={(event: Event) => {
                          const minutes = toMinutes(cookInput?.value ?? "", readUnit(event.currentTarget as HTMLSelectElement));
                          cookMinutes.set(minutes === null ? "" : String(minutes));
                        }}
                      >
                        <option value="min">min</option>
                        <option value="hr">hr</option>
                      </select>
                    </label>
                  </div>
                </fieldset>

                <LineEditor
                  legend="Ingredients"
                  placeholder="1 cup flour"
                  items={ingredients}
                  tick={ingredientTick}
                  onEdit={touch}
                />
                <LineEditor
                  legend="Steps"
                  placeholder="Stir until it smells right"
                  items={steps}
                  tick={stepTick}
                  onEdit={touch}
                />

                <div row gap="cozy">
                  <button type="submit" disabled={() => (saving.get() ? true : undefined)}>
                    {() => (saving.get() ? "Saving…" : editing ? "Save changes" : "Save recipe")}
                  </button>
                  <a href="/recipes">Cancel</a>
                </div>
                <p>{() => status.get()}</p>
              </div>

              <RecipePreview
                name={name}
                author={author}
                description={description}
                nutrition={nutrition}
                category={category}
                beforeYouBegin={beforeYouBegin}
                prep={prepMinutes}
                cook={cookMinutes}
                ingredients={() => ingredients}
                steps={() => steps}
                tick={previewTick}
              />
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
