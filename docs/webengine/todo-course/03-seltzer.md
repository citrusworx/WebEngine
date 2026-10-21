# 03 — Serve the API with Seltzer

[Previous](./02-routes.md) · [Course](./README.md) · [Next](./04-shell.md)

**Goal:** listen on a port, send CORS headers, and watch a create/list/delete round trip with curl.

## What you'll build

`apps/todo/back/src/server.ts` boots the database, registers the routes, and listens. `apps/todo/scripts/smoke.sh` is the checkpoint.

## Steps

### 1. Load config, then env, then listen

The server resolves `nectarine.config.yaml` next to the package, fills any unset `PG_*` from `.env` and `.env.example`, connects, and listens.

The listen call is the Seltzer part:

```ts
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
```

`init` creates the pipeline. `route` stores a description. `listen` starts Node's HTTP server and returns it so the process can close it on `SIGINT`.

`port` comes from `PORT`, default `3001`.

CORS: if `CORS_ORIGIN` is set, that origin is the only one allowed. If it is unset, Seltzer reflects the request `Origin`. Dev does not need CORS, because Vite proxies `/api` and the browser sees one origin. Lesson 09 sets `CORS_ORIGIN` when the static site and the API are different hosts.

Handlers still return `ResponseData`. Nothing in this file writes `ctx.res`.

### 2. Start it

From the repository root, with Postgres up:

```bash
yarn workspace @citrusworx/todo-back dev
```

You should see `ToDo API listening on http://localhost:3001`. The first boot creates `todos`.

### 3. Run the smoke script

In another terminal, from the repository root:

```bash
bash apps/todo/scripts/smoke.sh
```

The script generates an id with `crypto.randomUUID()`, then:

```bash
echo "health"
curl -sf "$API/api/health"
echo
```

```bash
echo "create $ID"
CREATE="$(curl -sS -w '\n%{http_code}' -X POST "$API/api/todos" \
  -H 'Content-Type: application/json' \
  -d "{\"id\":\"$ID\",\"title\":\"Ship the course\",\"notes\":\"Write the lessons\",\"done\":false}")"
printf '%s\n' "$CREATE"
```

Health is `{ "ok": true }`. Create is `{ "ok": true, "rowCount": 1 }` and the HTTP status on the next line is `200`. The body does not contain `title`. The script then lists, patches, and deletes that id.

Read the rest of `apps/todo/scripts/smoke.sh` before you call the lesson done. The PATCH sections belong to lesson 06. They already work, because the routes exist.

## Checkpoint

With the API running, `bash apps/todo/scripts/smoke.sh` prints `smoke ok`.

Then answer:

- Why is create status 200 and not 201?
- Why does the JSON not include the title you sent?

[Answers](./answers.md#lesson-03).

## What's happening

Seltzer's pipeline reads the body, matches the path, runs validate, runs the handler, and sends. The generated handler's execute compiles SQL, calls `adapter.query`, and wraps the driver result.

`pg` returns `{ rows, rowCount }`. For an `INSERT` without `RETURNING`, `rows` is empty and `rowCount` is 1. WebEngine's `mutationResult` turns that into `{ ok: true, rowCount: 1 }`. `generateRoutes` returns `{ body: result }`. Omitted `status` means 200.

`GET /api/todos` returns a JSON array. `created_at` is an ISO string. The route normalizer converts a JavaScript `Date` from `pg` before the body is sent. `done` is a JSON boolean.

`GET /api/todos/:id` for an unknown id is 404, because a singular read named `byId` returns null when the row is missing, and null becomes the default not-found response.

## Gap

**No static files.** Nothing in `server.ts` reads `front/dist`. A request for `/` is 404 on the API. The browser has its own server. That split is lesson 09 and lesson 10.

**Listen host.** Seltzer's default host is `127.0.0.1`. `"0.0.0.0"` is an explicit choice so the same file can run on a droplet. On your laptop it also accepts other interfaces. That is the file we ship, not a second production entrypoint.

## Next

[04 — Front-end shell](./04-shell.md)
