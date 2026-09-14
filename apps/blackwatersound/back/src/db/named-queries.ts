import path from "node:path";
import { fileURLToPath } from "node:url";
import { CCompiler } from "@citrusworx/nectarine/compiler";

// src/db and dist/db both sit two levels below the package root.
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const schemaDir = path.join(packageRoot, "src/schemas");

const compiler = new CCompiler();

function compileNamed(file: string, resource: string, method: string, name: string): string {
  const parsed = compiler.parse_config(path.join(schemaDir, file));
  return compiler.buildQuery(compiler.clean_parse(parsed, resource, method), name);
}

/**
 * Compiler-assembled statements. App code passes bind values only.
 */
export const namedSql = {
  allPayloads: compileNamed("product/productQueries.yml", "product", "read", "allPayloads"),
  payloadById: compileNamed("product/productQueries.yml", "product", "read", "payloadById"),
  seedPayload: compileNamed("product/productQueries.yml", "product", "create", "seedPayload"),
  allEntries: compileNamed("waitlist/waitlistQueries.yml", "waitlist", "read", "allEntries"),
  entryByEmail: compileNamed("waitlist/waitlistQueries.yml", "waitlist", "read", "entryByEmail"),
  insertEntry: compileNamed("waitlist/waitlistQueries.yml", "waitlist", "create", "insertEntry"),
} as const;

export type NamedQuery = keyof typeof namedSql;

export function namedQuery(name: NamedQuery): string {
  return namedSql[name];
}

/** Validate a document-store bind before `$N::jsonb`. */
export function bindJsonbDocument(value: unknown): string {
  if (value === null || typeof value !== "object") {
    throw new Error("JSONB bind value must be a JSON object");
  }

  try {
    return JSON.stringify(value);
  } catch {
    throw new Error("JSONB bind value is not JSON-serializable");
  }
}
