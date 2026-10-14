import path from "node:path";
import { fileURLToPath } from "node:url";
import { compileSchemasPlan, schemaPlanStatements } from "@citrusworx/nectarine/compiler";
import { loadNectarineConfig } from "@citrusworx/nectarine/config";
import { describe, expect, it } from "vitest";
import { namedDdl, SCHEMA_FILES } from "./db/named-ddl.js";
import { namedSql } from "./db/named-queries.js";

const configPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../nectarine.config.yaml",
);

describe("recipe named queries", () => {
  it("compiles list, id, slug, create, update, and delete from YAML", () => {
    const nectarine = loadNectarineConfig(configPath);
    const recipe = nectarine.getResource("recipe");

    expect(recipe.paths.queries.endsWith("recipeQueries.yml")).toBe(true);
    expect(namedSql.listRecipes).toBe("SELECT * FROM recipes ORDER BY created_at DESC");
    expect(namedSql.byId).toBe("SELECT * FROM recipes WHERE id = $1");
    expect(namedSql.bySlug).toBe("SELECT * FROM recipes WHERE slug = $1");
    expect(namedSql.listByCategory).toBe(
      "SELECT * FROM recipes WHERE category = $1 ORDER BY created_at DESC",
    );
    expect(namedSql.countRecipes).toBe("SELECT COUNT(*) FROM recipes");
    expect(namedSql.createRecipe).toBe(
      "INSERT INTO recipes (id, slug, name, author, description, nutrition, prep_minutes, cook_minutes, ingredients, steps, photo_url, author_id, cookbook_id, category, before_you_begin) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11, $12, $13, $14, $15) RETURNING *",
    );
    expect(namedSql.seedRecipe).toBe(
      "INSERT INTO recipes (id, slug, name, author, description, nutrition, prep_minutes, cook_minutes, ingredients, steps, photo_url, author_id, cookbook_id, category, before_you_begin) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11, $12, $13, $14, $15) ON CONFLICT (id) DO NOTHING",
    );
    expect(namedSql.updateRecipe).toBe(
      "UPDATE recipes SET slug = $1, name = $2, author = $3, description = $4, nutrition = $5, prep_minutes = $6, cook_minutes = $7, ingredients = $8::jsonb, steps = $9::jsonb, photo_url = $10, author_id = $11, cookbook_id = $12, category = $13, before_you_begin = $14, updated_at = NOW() WHERE id = $15 RETURNING *",
    );
    expect(namedSql.deleteRecipe).toBe("DELETE FROM recipes WHERE id = $1");
  });

  it("compiles ingredients and steps as JSONB from the schema", () => {
    const ddl = namedDdl("bootstrap");
    expect(ddl).toContain("CREATE TABLE IF NOT EXISTS recipes");
    expect(ddl).toContain("ingredients JSONB NOT NULL");
    expect(ddl).toContain("steps JSONB NOT NULL");
    expect(ddl).toContain("slug TEXT NOT NULL UNIQUE");
    expect(ddl).toContain("category TEXT NOT NULL DEFAULT 'entrees'");
    expect(ddl).toContain("before_you_begin TEXT NOT NULL DEFAULT ''");
    expect(ddl).toContain("recipes_category_idx");
  });

  it("emits additive columns for category and before_you_begin", () => {
    const schemaRoot = path.resolve(path.dirname(configPath), "src/schemas");
    const schemas = SCHEMA_FILES.map((file) => path.join(schemaRoot, file));
    const additive = schemaPlanStatements(compileSchemasPlan(schemas, "postgres"), "additive").join("\n");

    expect(additive).toContain(
      "ALTER TABLE recipes ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'entrees';",
    );
    expect(additive).toContain(
      "ALTER TABLE recipes ADD COLUMN IF NOT EXISTS before_you_begin TEXT NOT NULL DEFAULT '';",
    );
  });
});
