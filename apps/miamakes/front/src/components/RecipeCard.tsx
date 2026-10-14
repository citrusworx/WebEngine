import type { Recipe } from "../api/recipes";
import { showsIngredientsButton } from "../categories";
import { armFocus } from "../focus";
import { router } from "../router";

export function RecipeCard(props: { recipe: Recipe }) {
  const recipe = props.recipe;
  const ingredients = showsIngredientsButton(recipe.category);

  return (
    <article surface="mm-card" class="mm-recipe-card">
      <h2 font="playfair-display" fontSize="lg">
        {recipe.name}
      </h2>
      <p font="poppins">{recipe.description}</p>
      <div class={ingredients ? "mm-card-actions mm-card-actions-split" : "mm-card-actions"}>
        {ingredients ? (
          <button
            type="button"
            surface="mm-purple"
            scale="sm"
            onclick={() => {
              armFocus("ingredients");
              router.navigate(`/recipes/${recipe.slug}`);
            }}
          >
            Get Ingreds
          </button>
        ) : null}
        <button
          type="button"
          surface="mm-coral"
          scale="sm"
          onclick={() => {
            router.navigate(`/recipes/${recipe.slug}`);
          }}
        >
          Read Recipe
        </button>
      </div>
    </article>
  );
}
