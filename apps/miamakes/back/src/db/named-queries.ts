import path from "node:path";
import { fileURLToPath } from "node:url";
import { CCompiler, schemaJsonColumns } from "@citrusworx/nectarine/compiler";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const schemaDir = path.join(packageRoot, "src/schemas");
const compiler = new CCompiler();
const jsonColumns = schemaJsonColumns(path.join(schemaDir, "recipe/recipeSchema.yml"));

function compileNamed(file: string, resource: string, method: string, name: string): string {
  const parsed = compiler.parse_config(path.join(schemaDir, file));
  return compiler.buildQuery(compiler.clean_parse(parsed, resource, method), name, undefined, {
    jsonColumns,
  });
}

/**
 * Compiler-assembled statements. App code passes a name from this map.
 * Schema jsonb columns stamp ::jsonb onto bare binds. The host passes arrays.
 */
export const namedSql = {
  listRecipes: compileNamed("recipe/recipeQueries.yml", "recipe", "read", "listRecipes"),
  byId: compileNamed("recipe/recipeQueries.yml", "recipe", "read", "byId"),
  bySlug: compileNamed("recipe/recipeQueries.yml", "recipe", "read", "bySlug"),
  listByCategory: compileNamed("recipe/recipeQueries.yml", "recipe", "read", "listByCategory"),
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
