# 03 — Serve the API with Seltzer

[Previous](./02-routes.md) · [Course](./README.md) · [Next](./04-shell.md)

**Goal:** listen on a port, send CORS headers, and watch a create/list/delete round trip with curl.

## What you'll build

`api/src/server.ts` boots the database, registers the routes, and listens. `scripts/smoke.sh` is the checkpoint.

## Steps

### 1. Load config, then env, then listen

The server resolves `nectarine.config.yaml` next to `api/`, fills any unset `PG_*` from `.env` and `.env.example`, connects, and listens.

The whole file:

```ts
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PgSql } from "@citrusworx/nectarine/adapters/pg";
import { loadNectarineConfig } from "@citrusworx/nectarine/config";
import { Seltzer } from "@citrusworx/seltzer";
import { connectTodoDatabase } from "./db.js";
import { createRoutes } from "./routes.js";

/** Fill unset keys from a local env file. Process env wins. No dotenv package. */
function loadLocalEnv(file: string) {
  if (!existsSync(file)) {
    return;
  }

  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const here = path.dirname(fileURLToPath(import.meta.url));
const configPath =
  process.env.NECTARINE_CONFIG?.trim() ||
  path.resolve(here, "../nectarine.config.yaml");
const apiRoot = path.dirname(configPath);

loadLocalEnv(path.join(apiRoot, ".env"));
loadLocalEnv(path.join(apiRoot, ".env.example"));

const port = Number(process.env.PORT ?? 3001);
const corsOrigin = process.env.CORS_ORIGIN?.trim();
const nectarine = loadNectarineConfig(configPath);

let adapter: PgSql;
try {
  adapter = await connectTodoDatabase(nectarine);
} catch (error) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`ToDo API boot failed: ${message}`);
  process.exit(1);
}

const app = Seltzer.init();

for (const route of createRoutes(nectarine, adapter)) {
  app.route(route);
}

const server = app.listen(port, {
  // Seltzer defaults to 127.0.0.1. The droplet must accept other hosts.
  host: "0.0.0.0",
  cors: {
    ...(corsOrigin ? { origin: corsOrigin } : {}),
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    headers: ["Content-Type"],
  },
  onListening: (listeningPort) => {
    console.log(`ToDo API listening on http://localhost:${listeningPort}`);
  },
});

function shutdown(signal: string) {
  console.log(`${signal}: shutting down ToDo API`);
  server.close(() => {
    void adapter.disconnect().finally(() => {
      process.exit(0);
    });
  });

  setTimeout(() => {
    console.error("Shutdown timed out; exiting");
    process.exit(1);
  }, 10_000).unref();
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
```

`init` creates the pipeline. `route` stores a description. `listen` starts Node's HTTP server and returns it so the process can close it on `SIGINT`.

`port` comes from `PORT`, default `3001`.

CORS: if `CORS_ORIGIN` is set, that origin is the only one allowed. If it is unset, Seltzer reflects the request `Origin`. Dev does not need CORS, because Vite proxies `/api` and the browser sees one origin. Lesson 09 sets `CORS_ORIGIN` when the static site and the API are different hosts.

Handlers still return `ResponseData`. Nothing in this file writes `ctx.res`.

### 2. Start it

From the app folder, with Postgres up:

```bash
npm run dev:api
```

You should see `ToDo API listening on http://localhost:3001`. The first boot creates `todos`.

### 3. Run the smoke script

In another terminal, from the app folder:

```bash
bash scripts/smoke.sh
```

The script posts a todo without an id. SERIAL assigns one. The body is the row, and the status on the next line is `200`:

```bash

echo "create"
CREATE="$(curl -sS -w '\n%{http_code}' -X POST "$API/api/todos" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Ship the course","notes":"Write the lessons","done":false}')"
printf '%s\n' "$CREATE"
```

Health is `{ "ok": true }`. Create includes `id`, `title`, `notes`, `done`, and `created_at`. The script then lists, patches, and deletes that id.

Read the rest of `scripts/smoke.sh` before you call the lesson done. The PATCH sections belong to lesson 06. They already work, because the routes exist.

## Checkpoint

With the API running, `bash scripts/smoke.sh` prints `smoke ok`.

Then answer:

- Why is create status 200 and not 201?
- Why does the JSON include the title you sent?

[Answers](./answers.md#lesson-03).

## What's happening

Seltzer's pipeline reads the body, matches the path, runs validate, runs the handler, and sends. The host execute compiles SQL, calls `adapter.query`, and returns either a row or an ack.

`pg` returns `{ rows, rowCount }`. For an `INSERT` with `RETURNING *`, `rows` has the new row. `generateRoutes` returns `{ body: result }`. Omitted `status` means 200.

`GET /api/todos` returns a JSON array. `created_at` is an ISO string. The host turns a JavaScript `Date` from `pg` into that string before the body is sent. `done` is a JSON boolean. `id` is a JSON number.

`GET /api/todos/:id` for an unknown id is 404, because the singular read returns null when the row is missing, and null becomes the default not-found response.

## Gap

**No static files.** Nothing in `server.ts` reads `web/dist`. A request for `/` is 404 on the API. The browser has its own server. That split is lesson 09 and lesson 10.

**Listen host.** Seltzer's default host is `127.0.0.1`. `"0.0.0.0"` is an explicit choice so the same file can run on a droplet. On your laptop it also accepts other interfaces. That is the file we ship.

## Next

[04 — Front-end shell](./04-shell.md)
