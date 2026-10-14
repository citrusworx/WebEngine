import { createPgAdapter, type PgSql } from "@citrusworx/nectarine/adapters/pg";
import type { DatabaseCredentials } from "@citrusworx/nectarine/config";
import type { QueryResultRow } from "pg";
import type { Recipe, RecipeWrite } from "../domain/recipe.js";
import { recipeFromRow } from "../domain/recipe.js";
import { bindJsonb, namedQuery, type NamedQuery } from "./named-queries.js";
import { applyNamedMigrations } from "./named-ddl.js";

let adapter: PgSql | null = null;

export function configureDatabase(creds: DatabaseCredentials | null) {
  if (!creds) {
    adapter = null;
    return null;
  }

  if (!adapter) {
    adapter = createPgAdapter(creds);
  }

  return adapter;
}

export function getAdapter() {
  return adapter;
}

export function isDatabaseConnected() {
  return adapter?.connected === true;
}

export async function connectDatabase() {
  const db = getAdapter();
  if (!db) {
    return null;
  }

  await db.connect();
  return db;
}

export async function closeDatabase() {
  const db = adapter;
  adapter = null;
  if (!db) {
    return;
  }

  await db.disconnect().catch(() => undefined);
}

export async function migrate() {
  const db = getAdapter();
  if (!db) {
    return null;
  }

  return applyNamedMigrations(db);
}

export async function runCompiledQuery<T extends QueryResultRow>(
  sql: string,
  params: readonly unknown[] = [],
) {
  const db = getAdapter();
  if (!db) {
    return null;
  }

  return db.query<T>(sql, params);
}

async function runNamed<T extends QueryResultRow>(name: NamedQuery, params: readonly unknown[] = []) {
  return runCompiledQuery<T>(namedQuery(name), params);
}

function rowsAffected(result: { rowCount?: number | null } | null): number {
  return result?.rowCount ?? 0;
}

function readCount(result: { rows: Record<string, unknown>[] } | null): number {
  const raw = result?.rows[0]?.count;
  const count = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(count) ? count : 0;
}

function writeParams(id: string, recipe: RecipeWrite): unknown[] {
  return [
    id,
    recipe.slug,
    recipe.name,
    recipe.author,
    recipe.description,
    recipe.nutrition,
    recipe.prep_minutes,
    recipe.cook_minutes,
    bindJsonb(recipe.ingredients),
    bindJsonb(recipe.steps),
    recipe.photo_url,
    recipe.author_id,
    recipe.cookbook_id,
    recipe.category,
    recipe.before_you_begin,
  ];
}

function updateParams(id: string, recipe: RecipeWrite): unknown[] {
  return [
    recipe.slug,
    recipe.name,
    recipe.author,
    recipe.description,
    recipe.nutrition,
    recipe.prep_minutes,
    recipe.cook_minutes,
    bindJsonb(recipe.ingredients),
    bindJsonb(recipe.steps),
    recipe.photo_url,
    recipe.author_id,
    recipe.cookbook_id,
    recipe.category,
    recipe.before_you_begin,
    id,
  ];
}

export async function countRecipesFromDb(): Promise<number> {
  return readCount(await runNamed("countRecipes"));
}

export async function loadRecipesFromDb(): Promise<Recipe[]> {
  const result = await runNamed<Record<string, unknown>>("listRecipes");
  return (result?.rows ?? []).map((row) => recipeFromRow(row));
}

export async function loadRecipeByIdFromDb(id: string): Promise<Recipe | null> {
  const result = await runNamed<Record<string, unknown>>("byId", [id]);
  const row = result?.rows[0];
  return row ? recipeFromRow(row) : null;
}

export async function loadRecipesByCategoryFromDb(category: string): Promise<Recipe[]> {
  const result = await runNamed<Record<string, unknown>>("listByCategory", [category]);
  return (result?.rows ?? []).map((row) => recipeFromRow(row));
}

export async function loadRecipeBySlugFromDb(slug: string): Promise<Recipe | null> {
  const result = await runNamed<Record<string, unknown>>("bySlug", [slug]);
  const row = result?.rows[0];
  return row ? recipeFromRow(row) : null;
}

export async function seedRecipesIfEmpty(recipes: Recipe[]) {
  if (!isDatabaseConnected() || recipes.length === 0) {
    return;
  }

  if ((await countRecipesFromDb()) > 0) {
    return;
  }

  for (const recipe of recipes) {
    await runNamed("seedRecipe", writeParams(recipe.id, recipe));
  }
}

export async function insertRecipe(id: string, recipe: RecipeWrite): Promise<Recipe> {
  const result = await runNamed<Record<string, unknown>>("createRecipe", writeParams(id, recipe));
  if (!result) {
    throw new Error("Database is not configured");
  }

  const row = result.rows[0];
  if (!row) {
    throw new Error("Create did not return a recipe");
  }

  return recipeFromRow(row);
}

/**
 * Named update has no RETURNING (the compiler does not emit it), so a
 * successful write is read back with byId.
 */
export async function updateRecipe(id: string, recipe: RecipeWrite): Promise<Recipe | null> {
  const result = await runNamed("updateRecipe", updateParams(id, recipe));
  if (!result) {
    throw new Error("Database is not configured");
  }
  if (rowsAffected(result) < 1) {
    return null;
  }

  return loadRecipeByIdFromDb(id);
}

export async function deleteRecipeFromDb(id: string): Promise<boolean> {
  const result = await runNamed("deleteRecipe", [id]);
  if (!result) {
    throw new Error("Database is not configured");
  }

  return rowsAffected(result) > 0;
}
