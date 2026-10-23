# 02 — Generate CRUD routes

[Previous](./01-model.md) · [Course](./README.md) · [Next](./03-seltzer.md)

**Goal:** turn the YAML into Seltzer route objects without writing a handler per verb.

## What you'll build

`api/src/db.ts` connects Postgres and applies the schema. `api/src/routes.ts` lists the API operations, compiles each named query, and asks Seltzer for the routes. One health route is hand-written.

## Steps

### 1. See what WebEngine actually exports

`scripts/webengine-exports.mjs`:

```js
import * as webengine from "@citrusworx/webengine";

const names = Object.keys(webengine).sort();
console.log(names.join("\n"));

if (names.includes("createNectarineRoutes")) {
  console.error("createNectarineRoutes is exported; this course expected it to be absent");
  process.exit(1);
}

if (!names.includes("WebEngine")) {
  console.error("WebEngine class export is missing");
  process.exit(1);
}
```

From the app folder:

```bash
node scripts/webengine-exports.mjs
```

The line you should see is `WebEngine`. `createNectarineRoutes` is not in `@citrusworx/webengine` 0.2.1. The class methods do not read `nectarine.config.yaml`.

### 2. Connect and migrate

`api/src/db.ts`:

```ts
import { createPgAdapterFromConfig, type PgSql } from "@citrusworx/nectarine/adapters/pg";
import type { NectarineConfig } from "@citrusworx/nectarine/config";
import { applyMigrations } from "@citrusworx/nectarine/migrate";

/** Connect the pg adapter and create the todo table from schema YAML. */
export async function connectTodoDatabase(nectarine: NectarineConfig): Promise<PgSql> {
  const adapter = createPgAdapterFromConfig(nectarine);
  if (!adapter) {
    const status = nectarine.credentialStatus();
    throw new Error(
      `Postgres env is incomplete. Missing: ${status.missing.join(", ")}. Set the names in nectarine.config.yaml.`,
    );
  }

  await adapter.connect();
  await applyMigrations({
    execute: adapter,
    vendor: "postgres",
    schemas: [nectarine.getResource("todo").schema],
  });
  return adapter;
}
```

`createPgAdapterFromConfig` returns null when `PG_USER`, `PG_PASS`, `PG_HOST`, `PG_PORT`, or `PG_DB` is missing. It does not read env itself. The config names the keys. The adapter receives the values.

`applyMigrations` creates `nectarine_schema_migrations`, then `CREATE TABLE IF NOT EXISTS todos` from the schema document, then the index. Booting twice is safe. On Postgres the id column is `SERIAL`.

### 3. Generate the routes

`api/src/routes.ts` is the host that 0.2.1 does not ship. Read it as four jobs: health, bind values, compile, register.

```ts
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
```

`listApiOperations("todo", loaded.api)` flattens `todoAPI.yml`. Omit nothing and you get GET, POST, PATCH, and DELETE, because those are the verbs in the API file.

`generateRoutes` copies each operation's `body` onto `Route.contract` and calls `execute`. A returned object or array becomes `{ body }` at status 200. `null` becomes 404. The host never writes `ctx.json`. Seltzer 0.10.1 does not have that method.

Reads and deletes bind path segments only. A list path has no segment, so the parameter list is empty, which matches `SELECT * FROM todos` with no `$1`.

Inserts bind `fields` in YAML order: `title`, `notes`, `done`. Updates bind those three and then the path id. The compiler rewrites the update `WHERE` from `$1` to `$4` because the `SET` clause consumed `$1` through `$3`.

A missing body key is `null`. That is the PATCH gap. The client in lesson 06 sends every update column so the null does not happen from the form.

An all-digit path segment is passed as a number. `SERIAL` compared with a text parameter is a Postgres error (`integer = text`).

When the write's `rows` array is empty and `rowCount` is greater than 0, execute returns `{ ok: true, rowCount }`. INSERT with `returning: '*'` has a row, so POST returns that row instead. PATCH and DELETE take the ack path.

The health handler returns `ResponseData`: `{ body: { ok: true } }`.

## Checkpoint

You still have not listened. Read `createRoutes` and list the paths you expect. You should have:

- `GET /api/health`
- `GET /api/todos`
- `GET /api/todos/:id`
- `POST /api/todos`
- `PATCH /api/todos/:id`
- `DELETE /api/todos/:id`

[Answers](./answers.md#lesson-02).

Run the export script from step 1 if you have not. The only name is `WebEngine`.

## What's happening

`generateRoutes` does not import Nectarine and does not read YAML. `CCompiler.buildQuery` is the SQL. `adapter.query` is the driver. The host in this file is the glue `createNectarineRoutes` used to be.

A singular GET whose path contains `/:` returns one row or `null`. `null` is the default 404 from `generateRoutes`. A list GET returns the array, including an empty array, which is 200.

`connected` is the adapter flag. We connect before `listen`, so this is true for the life of the process. A query before connect returns an empty list or `null` instead of throwing.

## Gap

**WebEngine the class is not involved.** Do not call `engine.init()` to get these routes. The export list is the checkpoint.

**Health is hand-written.** Generated routes only exist for operations in `*API.yml`. A probe path is application code.

**Digit path segments.** The number coercion is host code. The compiler does not add a cast.

## Next

[03 — Serve the API with Seltzer](./03-seltzer.md)
