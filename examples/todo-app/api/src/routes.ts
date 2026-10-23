import type { PgSql } from "@citrusworx/nectarine/adapters/pg";
import { listApiOperations, type ApiOperation } from "@citrusworx/nectarine/api";
import { CCompiler } from "@citrusworx/nectarine/compiler";
import type { NectarineConfig } from "@citrusworx/nectarine/config";
import {
  generateRoutes,
  type ExecuteArgs,
  type ResponseData,
  type Route,
} from "@citrusworx/seltzer";

const compiler = new CCompiler();

/** Hand-written. Generated CRUD does not include a health check. */
export function healthRoute(): Route {
  return {
    method: "GET",
    path: "/api/health",
    handler: (): ResponseData => ({ body: { ok: true } }),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Column name, then the camelCase form (`created_at` / `createdAt`).
 * A missing key is null. That null is a SQL parameter, not "leave the column".
 */
function lookupColumn(
  column: string,
  params: Record<string, string>,
  body: Record<string, unknown> | undefined,
): unknown {
  if (body && Object.prototype.hasOwnProperty.call(body, column)) {
    return body[column];
  }
  const camel = column.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
  if (camel !== column && body && Object.prototype.hasOwnProperty.call(body, camel)) {
    return body[camel];
  }
  if (Object.prototype.hasOwnProperty.call(params, column)) {
    return params[column];
  }
  return null;
}

/**
 * Path segments arrive as strings. A SERIAL id compared with text fails
 * in Postgres (`integer = text`). An all-digit segment is passed as a number.
 */
function pathValue(raw: string | undefined): unknown {
  if (raw === undefined) {
    return null;
  }
  if (/^[0-9]+$/.test(raw)) {
    return Number(raw);
  }
  return raw;
}

function pathBinds(routePath: string, params: Record<string, string>): unknown[] {
  return [...routePath.matchAll(/:([A-Za-z_][A-Za-z0-9_]*)/g)].map((match) =>
    pathValue(match[1] ? params[match[1]] : undefined),
  );
}

function stringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return undefined;
  }
  return value;
}

function querySpec(
  queries: Record<string, unknown>,
  resource: string,
  crud: string,
  name: string,
): Record<string, unknown> | undefined {
  const resourceBlock = queries[resource];
  if (!isRecord(resourceBlock)) {
    return undefined;
  }
  const aliases = crud === "read" || crud === "get" ? ["read", "get"] : [crud];
  for (const alias of aliases) {
    const block = resourceBlock[alias];
    if (isRecord(block) && isRecord(block[name])) {
      return block[name];
    }
  }
  return undefined;
}

/** YAML `fields` order. That order is the `$1`, `$2`, … order. */
function writeColumns(spec: Record<string, unknown> | undefined, operation: ApiOperation): string[] {
  const fromSpec = spec ? stringList(spec.fields) ?? stringList(spec.columns) : undefined;
  if (fromSpec) {
    return fromSpec;
  }
  return operation.body ? Object.keys(operation.body) : [];
}

function isWrite(operation: ApiOperation): boolean {
  return (
    operation.method === "POST" ||
    operation.method === "PUT" ||
    operation.method === "PATCH" ||
    operation.method === "DELETE"
  );
}

/** `GET /api/todos/:id` is one row. `GET /api/todos` is the list. */
function isSingular(operation: ApiOperation): boolean {
  return operation.method === "GET" && operation.path.includes("/:");
}

function rowsFrom(result: unknown): Record<string, unknown>[] {
  if (!isRecord(result) || !Array.isArray(result.rows)) {
    return [];
  }
  return result.rows.filter(isRecord).map((row) => {
    const copy: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      copy[key] = value instanceof Date ? value.toISOString() : value;
    }
    return copy;
  });
}

function rowCountFrom(result: unknown): number | undefined {
  if (isRecord(result) && typeof result.rowCount === "number") {
    return result.rowCount;
  }
  return undefined;
}

function bindsFor(
  operation: ApiOperation,
  params: Record<string, string>,
  body: unknown,
  spec: Record<string, unknown> | undefined,
): unknown[] {
  const bodyRecord = isRecord(body) ? body : undefined;
  const update =
    operation.method === "PATCH" || operation.method === "PUT" || operation.crud === "update";
  const insert = operation.method === "POST" || operation.crud === "create";
  if (update) {
    return [
      ...writeColumns(spec, operation).map((column) => lookupColumn(column, {}, bodyRecord)),
      ...pathBinds(operation.path, params),
    ];
  }
  if (insert) {
    return writeColumns(spec, operation).map((column) => lookupColumn(column, params, bodyRecord));
  }
  // GET and DELETE bind path segments only. A list path has none.
  return pathBinds(operation.path, params);
}

/**
 * Object routes. Todo CRUD comes from schemas/todo/todoAPI.yml.
 * `@citrusworx/webengine` 0.2.1 exports `WebEngine` and no route helper.
 * This function is the host: list the operations, compile the named query,
 * bind parameters, and hand the array to `generateRoutes`.
 */
export function createRoutes(nectarine: NectarineConfig, adapter: PgSql): Route[] {
  const loaded = nectarine.getResource("todo");
  const operations = listApiOperations("todo", loaded.api);

  const generated = generateRoutes(operations, {
    execute: async ({ resource, query, params, body, operation }: ExecuteArgs) => {
      const write = isWrite(operation);
      const singular = isSingular(operation);
      if (!query || !adapter.connected) {
        return write || singular ? null : [];
      }

      const spec = querySpec(loaded.queries, resource, operation.crud, query);
      const sql = compiler.buildQuery(
        compiler.clean_parse(loaded.queries, resource, operation.crud),
        query,
      );
      const result = await adapter.query(sql, bindsFor(operation, params, body, spec));

      if (write) {
        const rows = rowsFrom(result);
        if (rows.length === 1) {
          return rows[0];
        }
        if (rows.length > 1) {
          return rows;
        }
        const rowCount = rowCountFrom(result);
        if (rowCount !== undefined && rowCount > 0) {
          return { ok: true, rowCount };
        }
        return null;
      }

      const rows = rowsFrom(result);
      if (singular) {
        return rows[0] ?? null;
      }
      return rows;
    },
  });

  return [healthRoute(), ...generated];
}
