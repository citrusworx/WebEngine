export function SiteNav() {
  return (
    <nav class="mm-nav">
      <div container row space="between">
        <a href="/">
          <strong>Mia Makes</strong>
        </a>
        <div row gap="cozy">
          <a href="/recipes">Recipes</a>
          <a href="/recipes/new">Add a recipe</a>
        </div>
      </div>
    </nav>
  );
}
