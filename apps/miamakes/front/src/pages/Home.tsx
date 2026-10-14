import { Signal } from "@citrusworx/sigjs";
import { listRecipes } from "../api/recipes";
import { Banner } from "../components/Banner";
import { CATEGORIES, categoryLabel, extraCategories } from "../categories";
import { Render } from "../render";

export function Home() {
  const extras = Signal<string[]>([]);

  void listRecipes()
    .then((rows) => extras.set(extraCategories(rows.map((recipe) => recipe.category))))
    .catch(() => extras.set([]));

  return (
    <main>
      <Render>
        {() => (
          <div class="mm-home-banners" grid="3x1">
            {CATEGORIES.map((category) => (
              <Banner
                title={category.label}
                surface={category.surface}
                href={`/categories/${category.id}`}
              />
            ))}
            {extras.get().map((id) => (
              <Banner title={categoryLabel(id)} surface="mm-photo-extra" href={`/categories/${id}`} />
            ))}
          </div>
        )}
      </Render>
    </main>
  );
}
