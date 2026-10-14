import type { Sig } from "../signal";
import { formatPair } from "../format";
import { Render } from "../render";

export type PreviewDraft = {
  name: Sig<string>;
  author: Sig<string>;
  description: Sig<string>;
  nutrition: Sig<string>;
  prep: Sig<string>;
  cook: Sig<string>;
  ingredients: () => string[];
  steps: () => string[];
  tick: Sig<number>;
};

function lines(read: () => string[], tick: Sig<number>) {
  return (
    <Render>
      {() => {
        tick.get();
        const items = read()
          .map((item) => item.trim())
          .filter(Boolean);
        if (items.length === 0) {
          return <p subtle>Add a line and it will show up here.</p>;
        }
        return (
          <ol>
            {items.map((item) => (
              <li>{item}</li>
            ))}
          </ol>
        );
      }}
    </Render>
  );
}

export function RecipePreview(props: PreviewDraft) {
  return (
    <article card class="mm-preview">
      <div header stack gap="snug">
        <p subtle>Live preview</p>
        <h2>{() => props.name.get().trim() || "Your recipe"}</h2>
        <p>{() => props.author.get().trim() || "Mia"}</p>
      </div>
      <div body stack gap="cozy">
        <p>{() => props.description.get().trim() || "A short note about the dish will land here."}</p>
        <p subtle>{() => props.nutrition.get().trim() || "Nutrition notes are optional."}</p>
        <p>
          {() => formatPair(Number(props.prep.get()) || 0, Number(props.cook.get()) || 0)}
        </p>
        <div stack gap="snug">
          <h3>Ingredients</h3>
          {lines(props.ingredients, props.tick)}
        </div>
        <div stack gap="snug">
          <h3>Steps</h3>
          {lines(props.steps, props.tick)}
        </div>
      </div>
    </article>
  );
}
