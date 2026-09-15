import {
  listApiOperations,
  type ApiOperation,
  type NectarineConfig,
} from "@citrusworx/nectarine/config";
import {
  generateRoutes,
  type ExecuteArgs,
  type ResponseData,
  type Route,
} from "@citrusworx/seltzer";
import { compileResourceQuery } from "../db/named-queries.js";
import { isDatabaseConnected, runCompiledQuery } from "../db/postgres.js";
import type { BlackwaterContext } from "../types/context.js";

export type ReadRouteExclude =
  | ((operation: ApiOperation) => boolean)
  | ReadonlyArray<{ resource: string; name: string }>;

export type CreateNectarineReadRoutesOptions<TContext extends BlackwaterContext = BlackwaterContext> = {
  resources: readonly string[];
  execute: (args: ExecuteArgs<TContext>) => unknown | Promise<unknown>;
  exclude?: ReadRouteExclude;
  /** Extra ops beyond GET reads (waitlist `joinWaitlist` POST). */
  include?: (operation: ApiOperation) => boolean;
  notFound?: (args: ExecuteArgs<TContext>) => ResponseData;
};

const PATH_PARAM = /:([A-Za-z_][A-Za-z0-9_]*)/g;

/** Unique lookups return one row (404 on miss). Collection reads return `[]`. */
export function isSingularRead(name: string): boolean {
  return /((^by|By)(Id|Slug|Email))$/.test(name);
}

export function pathBindValues(
  path: string,
  params: Record<string, string>,
): string[] | null {
  const names = [...path.matchAll(PATH_PARAM)].map((match) => match[1]);
  const values: string[] = [];

  for (const name of names) {
    const value = params[name]?.trim();
    if (!value) {
      return null;
    }
    values.push(value);
  }

  return values;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function matchesExclude(operation: ApiOperation, exclude?: ReadRouteExclude): boolean {
  if (!exclude) {
    return false;
  }

  if (typeof exclude === "function") {
    return exclude(operation);
  }

  return exclude.some((entry) => entry.resource === operation.resource && entry.name === operation.name);
}

function isGetRead(operation: ApiOperation): boolean {
  return operation.method === "GET" && (operation.crud === "read" || operation.crud === "get");
}

/**
 * Flatten operations from one or more `*API.yml` documents (`listApiOperations`).
 *
 * Includes create/update when present (waitlist `joinWaitlist`). Sibling keys
 * in the same file (e.g. `order_item` inside `orderAPI.yml`) resolve through
 * the loaded parent resource. Callers filter to GET reads unless they `include`.
 */
export function listResourceReadOperations(
  nectarine: NectarineConfig,
  resourceName: string,
): ApiOperation[] {
  if (nectarine.resources.has(resourceName)) {
    return listApiOperations(resourceName, nectarine.getResource(resourceName).api);
  }

  for (const loaded of nectarine.resources.values()) {
    const operations = listApiOperations(resourceName, loaded.api);
    if (operations.length > 0) {
      return operations;
    }
  }

  return [];
}

export function resolveResourceQueries(
  nectarine: NectarineConfig,
  resourceName: string,
): Record<string, unknown> {
  if (nectarine.resources.has(resourceName)) {
    return nectarine.getResource(resourceName).queries;
  }

  for (const loaded of nectarine.resources.values()) {
    if (isRecord(loaded.queries) && resourceName in loaded.queries) {
      return loaded.queries;
    }
  }

  throw new Error(`Nectarine Queries.yml not loaded for resource "${resourceName}"`);
}

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = value instanceof Date ? value.toISOString() : value;
  }
  return out;
}

/**
 * Execute a GET using CCompiler + the resource `*Queries.yml` + `operation.query`.
 *
 * Connected Postgres: bind path params in path order (`$1`, `$2`, …).
 * No database: collections return `[]`, unique lookups return `null` (404).
 * Seed fallback stays in the product / waitlist execute callbacks.
 */
export async function executeCompiledRead({
  resource,
  query,
  params,
  operation,
  ctx,
}: ExecuteArgs<BlackwaterContext>): Promise<Record<string, unknown> | Record<string, unknown>[] | null> {
  if (!query) {
    return isSingularRead(operation.name) ? null : [];
  }

  const binds = pathBindValues(operation.path, params);
  if (binds === null) {
    return isSingularRead(operation.name) ? null : [];
  }

  if (!isDatabaseConnected()) {
    return isSingularRead(operation.name) ? null : [];
  }

  const sql = compileResourceQuery(
    resolveResourceQueries(ctx.locals.nectarine, resource),
    resource,
    "read",
    query,
  );
  const result = await runCompiledQuery<Record<string, unknown>>(sql, binds);
  const rows = (result?.rows ?? []).map((row) => normalizeRow(row));

  if (isSingularRead(operation.name)) {
    return rows[0] ?? null;
  }

  return rows;
}

/**
 * Register routes from `listApiOperations` → Seltzer `generateRoutes`.
 *
 * Default filter is GET reads. Product and waitlist keep specialized execute
 * (JSONB catalog / JSON waitlist + join). Other resources use
 * {@link executeCompiledRead}. Exclude colliding hand routes (lesson `byId`
 * vs KiwiPress `GET /api/lessons/:id`). Pass `include` for a create op such
 * as waitlist `joinWaitlist`.
 */
export function createNectarineReadRoutes<TContext extends BlackwaterContext = BlackwaterContext>(
  nectarine: NectarineConfig,
  options: CreateNectarineReadRoutesOptions<TContext>,
): Route<TContext>[] {
  const operations = options.resources.flatMap((resourceName) =>
    listResourceReadOperations(nectarine, resourceName),
  );

  return generateRoutes(operations, {
    execute: options.execute,
    notFound: options.notFound,
    filter: (operation) =>
      (isGetRead(operation) || Boolean(options.include?.(operation))) &&
      !matchesExclude(operation, options.exclude),
  });
}

/** Thin wrapper for one resource. */
export function createResourceReadRoutes<TContext extends BlackwaterContext = BlackwaterContext>(
  nectarine: NectarineConfig,
  resourceName: string,
  execute: CreateNectarineReadRoutesOptions<TContext>["execute"],
  options: Omit<CreateNectarineReadRoutesOptions<TContext>, "resources" | "execute"> = {},
): Route<TContext>[] {
  return createNectarineReadRoutes(nectarine, {
    ...options,
    resources: [resourceName],
    execute,
  });
}
