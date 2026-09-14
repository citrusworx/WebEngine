import path from "node:path";
import { fileURLToPath } from "node:url";
import { CCompiler, compileSchemas, schemaFieldEnumValues } from "@citrusworx/nectarine/compiler";

// src/db and dist/db both sit two levels below the package root.
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const schemaDir = path.join(packageRoot, "src/schemas");

const compiler = new CCompiler();

/**
 * Intentional Phase 3 scope: every Blackwater `*Schema.yml`, not only the
 * live product + waitlist pair. `migrate()` creates the full domain (course,
 * order, booking, …) in FK order so named queries have tables. Product and
 * waitlist remain the only live DML paths.
 *
 * Additive `{ additive: true }` is NOT a migrator: it emits
 * `ADD COLUMN IF NOT EXISTS` only. No DROP, rename, or type change (not Flyway).
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

function compileFiles(files: readonly string[], additive = false): string {
  const docs = files.map((file) => compiler.parse_config(path.join(schemaDir, file)));
  return compileSchemas(docs, "postgres", { additive });
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
 * `liveBootstrap` = product + waitlist CREATE TABLE only (Docker init.sql lockstep).
 */
export const namedDdlSql = {
  bootstrap: compileFiles(SCHEMA_FILES, true),
  liveBootstrap: compileFiles(LIVE_BOOTSTRAP_FILES),
} as const;

export function namedDdl(name: NamedDdl): string {
  return namedDdlSql[name];
}
