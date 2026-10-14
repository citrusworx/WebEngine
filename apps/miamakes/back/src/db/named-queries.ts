import path from "node:path";
import { fileURLToPath } from "node:url";
import { compileResourceQuery } from "@citrusworx/webengine";

export { compileResourceQuery };

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const schemaDir = path.join(packageRoot, "src/schemas");

function compileNamed(file: string, resource: string, method: string, name: string): string {
  return compileResourceQuery(path.join(schemaDir, file), resource, method, name);
}

/**
 * Compiler-assembled statements. App code passes a name from this map.
 * JSONB casts are emitted here by Nectarine from recipeQueries.yml.
 */
export const namedSql = {
  listRecipes: compileNamed("recipe/recipeQueries.yml", "recipe", "read", "listRecipes"),
  byId: compileNamed("recipe/recipeQueries.yml", "recipe", "read", "byId"),
  bySlug: compileNamed("recipe/recipeQueries.yml", "recipe", "read", "bySlug"),
  countRecipes: compileNamed("recipe/recipeQueries.yml", "recipe", "read", "countRecipes"),
  createRecipe: compileNamed("recipe/recipeQueries.yml", "recipe", "create", "createRecipe"),
  seedRecipe: compileNamed("recipe/recipeQueries.yml", "recipe", "create", "seedRecipe"),
  updateRecipe: compileNamed("recipe/recipeQueries.yml", "recipe", "update", "updateRecipe"),
  deleteRecipe: compileNamed("recipe/recipeQueries.yml", "recipe", "delete", "deleteRecipe"),
} as const;

export type NamedQuery = keyof typeof namedSql;

export function namedQuery(name: NamedQuery): string {
  return namedSql[name];
}
