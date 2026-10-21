# 02 — Generate CRUD routes

[Previous](./01-model.md) · [Course](./README.md) · [Next](./03-seltzer.md)

**Goal:** turn the YAML into Seltzer route objects without writing a handler per verb.

## What you'll build

`apps/todo/back/src/db.ts` connects Postgres and applies the schema. `apps/todo/back/src/routes.ts` asks WebEngine for the CRUD routes and adds one hand-written health route.

## Steps

### 1. Connect and migrate

`apps/todo/back/src/db.ts`:

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

`applyMigrations` creates `nectarine_schema_migrations`, then `CREATE TABLE IF NOT EXISTS todos` from the schema document, then the index. Booting twice is safe.

### 2. Generate the routes

`apps/todo/back/src/routes.ts`:

```ts
import type { PgSql } from "@citrusworx/nectarine/adapters/pg";
import type { NectarineConfig } from "@citrusworx/nectarine/config";
import type { ResponseData, Route } from "@citrusworx/seltzer";
import { createNectarineRoutes } from "@citrusworx/webengine";

/** Hand-written. Generated CRUD does not include a health check. */
export function healthRoute(): Route {
  return {
    method: "GET",
    path: "/api/health",
    handler: (): ResponseData => ({ body: { ok: true } }),
  };
}

/**
 * Object routes. Todo CRUD comes from schemas/todo/todoAPI.yml.
 * `query` runs compiler SQL through the pg adapter.
 */
export function createRoutes(nectarine: NectarineConfig, adapter: PgSql): Route[] {
  return [
    healthRoute(),
    ...createNectarineRoutes(nectarine, {
      resources: ["todo"],
      query: (sql, params) => adapter.query(sql, params ?? []),
      connected: () => adapter.connected,
    }),
  ];
}
```

`resources: ["todo"]` selects that resource's operations. Omit `methods` and you get GET, POST, PATCH, and DELETE, because those are the verbs in the API file.

`query` is the adapter. The arrow function keeps `this` on the adapter. Passing `adapter.query` unbound would not.

There is no custom `execute`. The default compiles `operation.query` from the queries file and binds parameters. That is the path we want. A host `execute` is how Blackwater special-cases JSONB products and waitlist ids. ToDo does not need it, which is why the id stays a client value.

The health handler returns `ResponseData`: `{ body: { ok: true } }`. It does not call `ctx.json`. Seltzer 0.9.0 does not have that method.

## Checkpoint

You still have not listened. Read `createRoutes` and list the paths you expect. You should have:

- `GET /api/health`
- `GET /api/todos`
- `GET /api/todos/:id`
- `POST /api/todos`
- `PATCH /api/todos/:id`
- `DELETE /api/todos/:id`

[Answers](./answers.md#lesson-02).

## What's happening

`createNectarineRoutes` calls Nectarine `listApiOperations`, then Seltzer `generateRoutes`. Each operation becomes an object route. The generated handler calls the compiled execute and returns `{ body: result }`. Status stays 200 unless the result is `null` or `undefined`, which becomes 404.

A write with `rowCount > 0` and no returned rows becomes `{ ok: true, rowCount }`. That object is the `result`. It is not null, so the status is 200. Lesson 03 prints it.

`connected: () => adapter.connected` makes a query before `connect()` return an empty list or a 404 instead of throwing. We connect before `listen`, so this is true for the life of the process.

## Gap

**WebEngine the class is not involved.** `@citrusworx/webengine` exports `createNectarineRoutes`. The `WebEngine` class still stores a blueprint and leaves `init` / `build` / `deploy` as stubs. Do not call `engine.init()` to get these routes.

**Health is hand-written.** Generated routes only exist for operations in `*API.yml`. A probe path is application code.

## Next

[03 — Serve the API with Seltzer](./03-seltzer.md)
