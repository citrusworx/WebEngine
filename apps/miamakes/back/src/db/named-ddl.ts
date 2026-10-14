import path from "node:path";
import { fileURLToPath } from "node:url";
import { CCompiler, compileSchemas } from "@citrusworx/nectarine/compiler";
import {
  applyMigrations,
  loadMigrationDocuments,
  type MigrationExecutor,
} from "@citrusworx/nectarine/migrate";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const schemaDir = path.join(packageRoot, "src/schemas");
const migrationsDir = path.join(packageRoot, "src/db/migrations");

const compiler = new CCompiler();

/**
 * Recipe DDL comes from recipeSchema.yml via Nectarine `applyMigrations`.
 * Later renames, drops, and type changes belong in src/db/migrations/*.yml.
 * ingredients and steps are protected so a migration cannot drop the JSONB
 * lists by accident.
 */
export const SCHEMA_FILES = ["recipe/recipeSchema.yml"] as const;

function schemaDocs(files: readonly string[]) {
  return files.map((file) => compiler.parse_config(path.join(schemaDir, file)));
}

export const namedDdlSql = {
  bootstrap: compileSchemas(schemaDocs(SCHEMA_FILES), "postgres"),
} as const;

export function namedDdl(name: keyof typeof namedDdlSql): string {
  return namedDdlSql[name];
}

const PROTECTED_COLUMNS = [
  { table: "recipes", column: "ingredients" },
  { table: "recipes", column: "steps" },
] as const;

export async function applyNamedMigrations(execute: MigrationExecutor) {
  return applyMigrations({
    execute,
    vendor: "postgres",
    schemas: schemaDocs(SCHEMA_FILES),
    migrations: loadMigrationDocuments(migrationsDir),
    protectedColumns: PROTECTED_COLUMNS,
  });
}
