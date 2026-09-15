import path from "node:path";
import { fileURLToPath } from "node:url";
import { CCompiler } from "@citrusworx/nectarine/compiler";

// src/db and dist/db both sit two levels below the package root.
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const schemaDir = path.join(packageRoot, "src/schemas");

const compiler = new CCompiler();

const compileCache = new Map<string, string>();

function isQueryDocument(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Compile a named query from a `*Queries.yml` file path or an already-loaded
 * document (`NectarineConfig.getResource(...).queries`).
 *
 * This is the generic path: CCompiler + resource Queries.yml + query name.
 * Hosts should call this from execute callbacks instead of adding every
 * `namedSql` key by hand.
 */
export function compileResourceQuery(
  source: string | Record<string, unknown>,
  resource: string,
  method: string,
  name: string,
): string {
  const cacheKey =
    typeof source === "string"
      ? `${source}::${resource}::${method}::${name}`
      : `loaded::${resource}::${method}::${name}`;

  const cached = compileCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const parsed = typeof source === "string" ? compiler.parse_config(source) : source;
  if (!isQueryDocument(parsed)) {
    throw new Error(`Nectarine queries for "${resource}" must be an object`);
  }

  const sql = compiler.buildQuery(compiler.clean_parse(parsed, resource, method), name);
  compileCache.set(cacheKey, sql);
  return sql;
}

function compileNamed(file: string, resource: string, method: string, name: string): string {
  return compileResourceQuery(path.join(schemaDir, file), resource, method, name);
}

/**
 * Compiler-assembled statements used by the special-cased product JSONB and
 * waitlist write paths. Other resource reads compile on demand via
 * {@link compileResourceQuery}.
 */
export const namedSql = {
  allPayloads: compileNamed("product/productQueries.yml", "product", "read", "allPayloads"),
  payloadById: compileNamed("product/productQueries.yml", "product", "read", "payloadById"),
  seedPayload: compileNamed("product/productQueries.yml", "product", "create", "seedPayload"),
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
