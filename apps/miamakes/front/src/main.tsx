import "@citrusworx/juiceui/styles";
import "@citrusworx/juiceui/styles/themes/retro-orchard-club";
import { mount } from "@citrusworx/sigjs";
import { App } from "./App";
import { Home } from "./pages/Home";
import { RecipeDetail } from "./pages/RecipeDetail";
import { RecipeForm } from "./pages/RecipeForm";
import { RecipeList } from "./pages/RecipeList";
import { router } from "./router";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("MiaMakes root element was not found.");
}

mount(<App />, root);

router
  .set("/", () => <Home />)
  .set("/recipes", () => <RecipeList />)
  .set("/recipes/new", () => <RecipeForm />)
  .set("/recipes/:slug/edit", (params) => <RecipeForm slug={params.slug} />)
  .set("/recipes/:slug", (params) => <RecipeDetail slug={params.slug ?? ""} />)
  .set("*", () => (
    <main>
      <section paddingY="roomy">
        <div container stack gap="cozy">
          <h1>That page isn't in the kitchen</h1>
          <p>
            <a href="/">Back home</a>
          </p>
        </div>
      </section>
    </main>
  ));

router.start();
