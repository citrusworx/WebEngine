import path from "node:path";
import { fileURLToPath } from "node:url";
import { CCompiler, compileSchemas } from "@citrusworx/nectarine/compiler";

// src/db and dist/db both sit two levels below the package root.
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const schemaDir = path.join(packageRoot, "src/schemas");

const compiler = new CCompiler();

/**
 * Every Blackwater `*Schema.yml`. Compiled together so foreign keys
 * order table bootstrap correctly. App code does not own the SQL text.
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

/** Docker first-boot tables only. Same compiler as migrate(). */
export const LIVE_BOOTSTRAP_FILES = [
  "product/productSchema.yml",
  "waitlist/waitlistSchema.yml",
] as const;

export type NamedDdl = "bootstrap" | "liveBootstrap";

function compileFiles(files: readonly string[]): string {
  const docs = files.map((file) => compiler.parse_config(path.join(schemaDir, file)));
  return compileSchemas(docs, "postgres");
}

/**
 * Compiler-assembled DDL. App helpers pass a name, never a SQL literal.
 */
export const namedDdlSql = {
  bootstrap: compileFiles(SCHEMA_FILES),
  liveBootstrap: compileFiles(LIVE_BOOTSTRAP_FILES),
} as const;

export function namedDdl(name: NamedDdl): string {
  return namedDdlSql[name];
}
