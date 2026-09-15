import path from "node:path";
import { fileURLToPath } from "node:url";
import { CCompiler, compileSchemas, schemaFieldEnumValues } from "@citrusworx/nectarine/compiler";
import {
  applyMigrations,
  loadMigrationDocuments,
  type MigrationExecutor,
} from "@citrusworx/nectarine/migrate";

// src/db and dist/db both sit two levels below the package root.
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const schemaDir = path.join(packageRoot, "src/schemas");
const migrationsDir = path.join(packageRoot, "src/db/migrations");

const compiler = new CCompiler();

/**
 * Whole-domain `*Schema.yml` plus optional versioned YAML in `db/migrations`.
 * `migrate()` uses {@link applyNamedMigrations}: CREATE TABLE / INDEX, then
 * pending rename / drop / type-change migrations, then additive ADD COLUMN.
 *
 * Product and waitlist keep special-cased live DML (JSONB catalog, waitlist
 * insert). Other resources use compiled GET reads when Postgres is connected.
 * `products.payload` JSONB is protected. Destructive ops are never inferred
 * from schema-diff; they must be explicit migration YAML with confirm gates.
 */
export const SCHEMA_FILES = [
  "client/clientSchema.yml",
  "coach/coachSchema.yml",
  "product/productSchema.yml",
  "waitlist/waitlistSchema.yml",
  "course/courseSchema.yml",
  "order/orderSchema.yml",
  "session/sessionSchema.yml",
  "lesson/lessonSchema.yml",
  "enrollment/enrollmentSchema.yml",
  "booking/bookingSchema.yml",
  "mix_review/mixReviewSchema.yml",
] as const;

/** Docker first-boot tables only (CREATE TABLE / INDEX, not additive ALTER). */
export const LIVE_BOOTSTRAP_FILES = [
  "product/productSchema.yml",
  "waitlist/waitlistSchema.yml",
] as const;

export type NamedDdl = "bootstrap" | "liveBootstrap";

function schemaDocs(files: readonly string[]) {
  return files.map((file) => compiler.parse_config(path.join(schemaDir, file)));
}

function compileFiles(files: readonly string[], additive = false): string {
  return compileSchemas(schemaDocs(files), "postgres", { additive });
}

function waitlistSchema() {
  return compiler.parse_config(path.join(schemaDir, "waitlist/waitlistSchema.yml"));
}

/** Schema-owned waitlist `source_app` tokens. Empty means omit the column. */
export const waitlistSourceApps = schemaFieldEnumValues(
  waitlistSchema(),
  "WaitlistEntry",
  "source_app",
);

/**
 * Compiler-assembled DDL. App helpers pass a name, never a SQL literal.
 *
 * `bootstrap` = whole-domain SCHEMA_FILES + additive ADD COLUMN (existing volumes).
 * Prefer {@link applyNamedMigrations} at boot — it also applies versioned YAML.
 * `liveBootstrap` = product + waitlist CREATE TABLE only (Docker init.sql lockstep).
 */
export const namedDdlSql = {
  bootstrap: compileFiles(SCHEMA_FILES, true),
  liveBootstrap: compileFiles(LIVE_BOOTSTRAP_FILES),
} as const;

export function namedDdl(name: NamedDdl): string {
  return namedDdlSql[name];
}

const PROTECTED_COLUMNS = [{ table: "products", column: "payload" }] as const;

/**
 * Library migrator: ledger + current schemas + pending `src/db/migrations/*.yml`.
 * Adapter only executes compiler SQL.
 */
export async function applyNamedMigrations(execute: MigrationExecutor) {
  return applyMigrations({
    execute,
    vendor: "postgres",
    schemas: schemaDocs(SCHEMA_FILES),
    migrations: loadMigrationDocuments(migrationsDir),
    protectedColumns: PROTECTED_COLUMNS,
  });
}