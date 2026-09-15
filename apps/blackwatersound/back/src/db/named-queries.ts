import path from "node:path";
import { fileURLToPath } from "node:url";
import { compileResourceQuery } from "@citrusworx/webengine";

export { compileResourceQuery };

// src/db and dist/db both sit two levels below the package root.
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const schemaDir = path.join(packageRoot, "src/schemas");

function compileNamed(file: string, resource: string, method: string, name: string): string {
  return compileResourceQuery(path.join(schemaDir, file), resource, method, name);
}

/**
 * Compiler-assembled statements used by the special-cased product JSONB and
 * waitlist host-execute paths. Other resource reads and YAML writes compile on
 * demand via {@link compileResourceQuery}.
 */
export const namedSql = {
  allPayloads: compileNamed("product/productQueries.yml", "product", "read", "allPayloads"),
  payloadById: compileNamed("product/productQueries.yml", "product", "read", "payloadById"),
  seedPayload: compileNamed("product/productQueries.yml", "product", "create", "seedPayload"),
  insertPayload: compileNamed("product/productQueries.yml", "product", "create", "insertPayload"),
  updatePayload: compileNamed("product/productQueries.yml", "product", "update", "updatePayload"),
  deleteProduct: compileNamed("product/productQueries.yml", "product", "delete", "deleteProduct"),
  allEntries: compileNamed("waitlist/waitlistQueries.yml", "waitlist", "read", "allEntries"),
  entryByEmail: compileNamed("waitlist/waitlistQueries.yml", "waitlist", "read", "entryByEmail"),
  joinWaitlist: compileNamed("waitlist/waitlistQueries.yml", "waitlist", "create", "joinWaitlist"),
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
