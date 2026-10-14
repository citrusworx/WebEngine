import "@citrusworx/juiceui/styles";
import "./generated/miamakes-theme.css";
import { mount } from "@citrusworx/sigjs";
import { App } from "./App";
import { CategoryList } from "./pages/CategoryList";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { RecipeDetail } from "./pages/RecipeDetail";
import { RecipeForm } from "./pages/RecipeForm";
import { RecipeList } from "./pages/RecipeList";
import { Stub } from "./pages/Stub";
import { router } from "./router";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("MiaMakes root element was not found.");
}

mount(<App />, root);

router
  .set("/", () => <Home />)
  .set("/categories/:category", (params) => <CategoryList category={params.category ?? ""} />)
  .set("/login", () => <Login />)
  .set("/profile", () => (
    <Stub
      title="Profile"
      body="Welcome, User. Accounts arrive in a later week."
      actionHref="/login"
      actionLabel="Log in"
    />
  ))
  .set("/mail", () => (
    <Stub title="Mail" body="The mailbox is empty for now. Messages are a later week." />
  ))
  .set("/settings", () => (
    <Stub
      title="Settings"
      body="Nothing to tune yet."
      actionHref="/recipes/new"
      actionLabel="Add a recipe"
    />
  ))
  .set("/forgot-username", () => (
    <Stub title="Forgot username?" body="Username recovery waits on accounts. That is a later week." actionHref="/login" actionLabel="Back to login" />
  ))
  .set("/forgot-password", () => (
    <Stub title="Forgot password?" body="Password reset waits on accounts. That is a later week." actionHref="/login" actionLabel="Back to login" />
  ))
  .set("/recipes", () => <RecipeList />)
  .set("/recipes/new", () => <RecipeForm />)
  .set("/recipes/:slug/edit", (params) => <RecipeForm slug={params.slug} />)
  .set("/recipes/:slug", (params) => <RecipeDetail slug={params.slug ?? ""} />)
  .set("*", () => (
    <main class="mm-stub">
      <h1 font="playfair-display">That page isn't in the kitchen</h1>
      <p>
        <a href="/">Back home</a>
      </p>
    </main>
  ));

router.start();
