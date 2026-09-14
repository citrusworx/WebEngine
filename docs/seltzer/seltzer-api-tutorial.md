# Seltzer Tutorial — Building a Notes JSON API

This tutorial walks through building a small JSON API with Seltzer the way the library works today.

The goal is to show how Seltzer should be composed in real server code:

- `Seltzer.init` / `.route` / `.listen` own the process
- exact paths own matching
- `ctx.json` owns JSON responses
- **you** own the body stream, query strings, and validation
- `client.*` owns outbound calls
- Nectarine YAML owns method/path *names* you copy — it does not generate handlers

If you have already read [Getting Started](./seltzer-getting-started.md), this is the same kind of guided build as the [Juice page tutorial](../juice/juice-page-tutorial.md) and the [Sig.js operator desk](../sigjs/sig-page-tutorial.md) — except the artifact is an HTTP surface, not a page.

## What we are building

A **notes API**: a small in-memory JSON service with

1. a process that listens and answers `GET /health`
2. a collection `GET /notes`
3. `POST /notes` that reads the request stream
4. a lookup `GET /note?id=` (query, not `/notes/:id`)
5. a second collection whose `{ method, path }` is **copied** from Nectarine’s user YAML
6. a few `client.*` calls against that listener

By the end you will have used every public primitive that is worth teaching: `Seltzer.init`, `.route`, `.listen`, `ctx.json`, `ctx.req` / `ctx.res`, and `client.get` / `client.post`.

This is **not** the design-doc pipeline. There is no `parse` stage, no `:id` matcher, and no `return { status, body }`. Those live in [Design](./seltzer-design.md) and the [exercises](./exercises/README.md).

## Setup

```bash
yarn add @citrusworx/seltzer
```

A single TypeScript file is enough. In this workspace you can copy into `libraries/seltzer/src/example.ts` and run:

```bash
yarn workspace @citrusworx/seltzer dev
```

That script runs `ts-node src/index.ts`. Point the entry at your file if it is not already what starts.

Keep Node 20+ in mind. `listen` throws outside Node.

## Step 1: Listen with a health route

Start with a process that answers one GET. Nothing is stored yet.

```ts
import { Seltzer } from "@citrusworx/seltzer";

const app = Seltzer.init();

app.route({
  method: "GET",
  path: "/health",
  handler: (ctx) => ctx.json({ ok: true }),
});

app.listen(3000);
```

Why this works:

- `Seltzer.init()` is `new Seltzer()`. There is no config file.
- `.route` pushes `{ method, path, handler }` onto an array.
- `.listen(3000)` calls `http.createServer`. On each request it takes `url.pathname` and finds the first route where `route.method === req.method && route.path === pathname`.
- `ctx.json` writes `Content-Type: application/json` and ends the response.

Try it:

```bash
curl http://127.0.0.1:3000/health
# {"ok":true}

curl http://127.0.0.1:3000/missing
# {"error":"Not Found"}   (status 404)

curl -X POST http://127.0.0.1:3000/health
# {"error":"Not Found"}   (method must match too)
```

The health handler does not need the body. It also does not need query strings. `/health?ready=1` still matches `/health` because matching ignores the search string.

## Step 2: List an in-memory collection

A JSON API needs a resource. Put notes in a `Map`. Register **exact** `GET /notes`.

```ts
import { Seltzer } from "@citrusworx/seltzer";

type Note = { id: string; text: string };

const notes = new Map<string, Note>([
  ["1", { id: "1", text: "Review the deploy window" }],
]);

const app = Seltzer.init();

app.route({
  method: "GET",
  path: "/health",
  handler: (ctx) => ctx.json({ ok: true, notes: notes.size }),
});

app.route({
  method: "GET",
  path: "/notes",
  handler: (ctx) => ctx.json([...notes.values()]),
});

app.listen(3000);
```

Why this works:

- The collection lives in process memory. Seltzer does not persist anything.
- `[...notes.values()]` is a plain array. `ctx.json` stringifies it.
- `GET /notes/` is a **different** path. Trailing slashes are not normalized.
- `GET /notes/1` is also a different path. It will 404 until you register it, and `/notes/:id` would register the literal string `"/notes/:id"`, which no browser will request.

```bash
curl http://127.0.0.1:3000/notes
# [{"id":"1","text":"Review the deploy window"}]
```

## Step 3: Create with POST — read the stream

Seltzer does not parse JSON bodies. Collect chunks from `ctx.req`, then `JSON.parse`.

```ts
async function readJson(req: import("node:http").IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : null;
}

let nextId = 2;

app.route({
  method: "POST",
  path: "/notes",
  handler: async (ctx) => {
    try {
      const body = (await readJson(ctx.req)) as { text?: string };
      if (!body?.text?.trim()) {
        return ctx.json({ error: "text required" }, 400);
      }
      const note: Note = { id: String(nextId++), text: body.text.trim() };
      notes.set(note.id, note);
      return ctx.json(note, 201);
    } catch {
      return ctx.json({ error: "invalid json" }, 400);
    }
  },
});
```

Why this works:

- Node gives you a readable stream, not `req.body`.
- `for await` of `IncomingMessage` is the supported way to collect it.
- `ctx.json(note, 201)` sets the status. The default is 200.
- Validation is your `if`. There is no schema stage.

`listen` does **not** await this handler. That is fine here: after `await readJson`, you still call `ctx.json`, which ends the socket. If you `throw` after the await, Node gets an unhandled rejection — there is no central 500 mapper.

Try it:

```bash
curl -X POST http://127.0.0.1:3000/notes \
  -H "Content-Type: application/json" \
  -d '{"text":"Ship the notes API"}'

# {"id":"2","text":"Ship the notes API"}
```

Invalid JSON:

```bash
curl -X POST http://127.0.0.1:3000/notes \
  -H "Content-Type: application/json" \
  -d '{oops'

# {"error":"invalid json"}   (status 400)
```

If you omit `ctx.json` after reading the body, curl will hang. Ending the response is the handler’s job.

## Step 4: Look up one note with a query string

Do not register `/notes/:id`. Use a second exact path and read `searchParams`.

```ts
app.route({
  method: "GET",
  path: "/note",
  handler: (ctx) => {
    const url = new URL(ctx.req.url || "/", `http://${ctx.req.headers.host}`);
    const id = url.searchParams.get("id");
    if (!id) return ctx.json({ error: "id required" }, 400);
    const note = notes.get(id);
    return note ? ctx.json(note) : ctx.json({ error: "Not Found" }, 404);
  },
});
```

Why this works:

- Matching already parsed a `URL` for `pathname`. Handlers that need the query parse it again. That duplication is the current API, not a bug in your app.
- `/note?id=1` matches path `/note`.
- A handler can send 404 for a missing *record*. That is different from Seltzer’s unmatched-route 404.

```bash
curl http://127.0.0.1:3000/note?id=1
# {"id":"1","text":"Review the deploy window"}

curl http://127.0.0.1:3000/note
# {"error":"id required"}
```

A concrete path is also honest, for fixtures:

```ts
app.route({
  method: "GET",
  path: "/notes/1",
  handler: (ctx) => {
    const note = notes.get("1");
    return note ? ctx.json(note) : ctx.json({ error: "Not Found" }, 404);
  },
});
```

That only ever serves id `"1"`. Prefer the query form for a real collection.

## Step 5: Copy a Nectarine method/path object

Nectarine’s checked-in user API file lists HTTP pairs. Seltzer does not import that file as routes. You copy the **exact** ones.

From `libraries/nectarine/models/user/userAPI.yml`:

```yaml
user:
  get:
    allUsers:
      api:
        method: GET
        endpoint: /users
  create:
    user:
      api:
        method: POST
        endpoint: /users
```

Those two are exact paths. The same file also has `GET /users/:id`. **Do not register that string** expecting `/users/42` to match. Skip parametric YAML until the matcher exists.

Copy by hand:

```ts
const allUsers = { method: "GET", endpoint: "/users" as const };
const createUser = { method: "POST", endpoint: "/users" as const };

type User = { id: string; email: string };
const users = new Map<string, User>();

app.route({
  method: allUsers.method,
  path: allUsers.endpoint,
  handler: (ctx) => ctx.json([...users.values()]),
});

app.route({
  method: createUser.method,
  path: createUser.endpoint,
  handler: async (ctx) => {
    try {
      const body = (await readJson(ctx.req)) as { email?: string };
      if (!body?.email) return ctx.json({ error: "email required" }, 400);
      const user = { id: String(users.size + 1), email: body.email };
      users.set(user.id, user);
      return ctx.json(user, 201);
    } catch {
      return ctx.json({ error: "invalid json" }, 400);
    }
  },
});
```

Or load the YAML and walk the object (still no codegen):

```ts
import { parser } from "@citrusworx/nectarine";

const spec = parser.yaml("libraries/nectarine/models/user/userAPI.yml");
const getAll = spec.user.get.allUsers.api as { method: string; endpoint: string };

app.route({
  method: getAll.method,
  path: getAll.endpoint,
  handler: (ctx) => ctx.json([...users.values()]),
});
```

`parser.registerRoute(file, "get", "allUsers")` looks up `doc.get.allUsers`, **not** `doc.user.get.allUsers`. The checked-in file will miss. Walk `parser.yaml` or copy the pair. Nectarine still does not run SQL for you — if you want rows, call a Nectarine adapter **inside** the handler. See [Integration](./seltzer-integration.md).

## Step 6: Call it with `client.*`

The Seltzer client is a thin `fetch` wrapper. It always parses JSON.

```ts
import { client, type Endpoint } from "@citrusworx/seltzer";

const notesApi: Endpoint = {
  path: "/notes",
  endpoint: "/notes",
  options: { baseUrl: "http://127.0.0.1:3000" },
};

const created = await client.post(notesApi, { text: "Operator desk queue" });
const list = await client.get(notesApi);
console.log(created, list);
```

Why this works:

- URL = `options.baseUrl` + `path` → `http://127.0.0.1:3000/notes`.
- `endpoint` is required by the type and unused by the client.
- `POST` sets `Content-Type: application/json` and `JSON.stringify`s the body.
- `GET` sends no body.

Caveats that bite in this tutorial:

- `client` does not check `response.ok`. A 400 `{ error: "text required" }` still returns as JSON.
- Empty or non-JSON bodies throw (`res.json()`).
- Concatenate carefully: `baseUrl: "http://127.0.0.1:3000/"` + `path: "/notes"` becomes `http://127.0.0.1:3000//notes`. Prefer no trailing slash on `baseUrl`.

A Sig.js page would call the same URL with `fetch` or `client.get` inside an `effect`. Juice styles that page. Neither library starts this Node process. A minimal fetch from the operator desk:

```ts
import { Signal, effect } from "@citrusworx/sigjs";
import { client } from "@citrusworx/seltzer";

const label = Signal("…");

effect(() => {
  client
    .get({
      path: "/health",
      endpoint: "/health",
      options: { baseUrl: "http://127.0.0.1:3000" },
    })
    .then((data: { ok?: boolean }) => label.set(data.ok ? "up" : "down"))
    .catch((err: unknown) => label.set(String(err)));
});
```

CORS is not configured by Seltzer. A page on another origin needs you to set headers on `ctx.res` yourself.

## The finished server

Putting the notes half together (skip the optional `/notes/1` fixture):

```ts
import { Seltzer } from "@citrusworx/seltzer";

type Note = { id: string; text: string };

const notes = new Map<string, Note>([
  ["1", { id: "1", text: "Review the deploy window" }],
]);
let nextId = 2;

async function readJson(req: import("node:http").IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : null;
}

const app = Seltzer.init();

app.route({
  method: "GET",
  path: "/health",
  handler: (ctx) => ctx.json({ ok: true, notes: notes.size }),
});

app.route({
  method: "GET",
  path: "/notes",
  handler: (ctx) => ctx.json([...notes.values()]),
});

app.route({
  method: "POST",
  path: "/notes",
  handler: async (ctx) => {
    try {
      const body = (await readJson(ctx.req)) as { text?: string };
      if (!body?.text?.trim()) {
        return ctx.json({ error: "text required" }, 400);
      }
      const note: Note = { id: String(nextId++), text: body.text.trim() };
      notes.set(note.id, note);
      return ctx.json(note, 201);
    } catch {
      return ctx.json({ error: "invalid json" }, 400);
    }
  },
});

app.route({
  method: "GET",
  path: "/note",
  handler: (ctx) => {
    const url = new URL(ctx.req.url || "/", `http://${ctx.req.headers.host}`);
    const id = url.searchParams.get("id");
    if (!id) return ctx.json({ error: "id required" }, 400);
    const note = notes.get(id);
    return note ? ctx.json(note) : ctx.json({ error: "Not Found" }, 404);
  },
});

app.listen(3000);
```

## What you practiced

| Step | Primitive |
|---|---|
| Health | `init` + `route` + `listen` + `ctx.json` |
| List | exact `GET` path, in-memory data |
| Create | stream body, status `201` / `400` |
| Lookup | `searchParams`, not `:id` |
| Nectarine | copy `{ method, endpoint }` for `/users` |
| Client | `Endpoint` + `client.get/post` |

## What this tutorial refused to invent

```ts
// Not APIs
app.use(json());
app.route({ path: "/notes/:id", … });
ctx.params.id;
ctx.body;
ctx.query.id;
return { status: 200, body: notes };
app.pipeline.insert("auth").before("handle");
```

If you want those, you are on the [contributor path](./seltzer-design.md), not the product path.

## Where to go next

- [Request and response](./seltzer-request-response.md) — `ctx` in detail
- [Routing](./seltzer-routing.md) — first-wins, trailing slashes, method mismatch
- [Client](./seltzer-client.md) — PUT/PATCH/DELETE, ignored fields
- [Patterns](./seltzer-patterns.md) — health, collections, errors, CORS headers
- [Anti-patterns](./seltzer-anti-patterns.md) — Express habits that hang or 404
- [Integration](./seltzer-integration.md) — Nectarine adapters inside handlers, Sig fetch
