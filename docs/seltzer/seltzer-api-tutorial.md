# Seltzer Tutorial — Building a Notes JSON API

This tutorial walks through building a small JSON API with Seltzer **0.8.1**.

The goal is to show how Seltzer should be composed in real server code:

- `Seltzer.init` / `.route` / `.listen` own the process
- handlers **return `ResponseData`**; the runtime `send`s
- `ctx.body` / `ctx.params` / `ctx.query` are filled by the pipeline
- `before` / `contract` own cross-cutting checks
- `generateRoutes` owns YAML-shaped operation lists
- `client.*` owns outbound calls and throws `HttpError` on non-2xx

If you have already read [Getting Started](./seltzer-getting-started.md), this is the same kind of guided build as the [Juice page tutorial](../juice/juice-page-tutorial.md) — except the artifact is an HTTP surface, not a page.

## What we are building

A **notes API**: a small in-memory JSON service with

1. a process that listens and answers `GET /health`
2. a collection `GET /notes`
3. `POST /notes` that uses `ctx.body` (and optional `.required` validation)
4. a lookup `GET /notes/:id`
5. routes **generated** from an `ApiOperation[]` list (the Nectarine shape)
6. a few `client.*` calls against that listener

By the end you will have used the public primitives worth teaching: `Seltzer.init`, `.route`, `.listen`, `ResponseData`, `ctx.body` / `ctx.params`, `generateRoutes`, and `client.get` / `client.post`.

This **is** the shipped pipeline. There is no `ctx.json`. `/notes/:id` is a real matcher.

## Setup

```bash
yarn add @citrusworx/seltzer
```

A single TypeScript file is enough. In this workspace you can copy into `libraries/seltzer/src/example.ts` and run:

```bash
yarn workspace @citrusworx/seltzer dev
```

Keep Node 18+ in mind. `listen` throws outside Node.

## Step 1: Listen with a health route

Start with a process that answers one GET. Nothing is stored yet.

```ts
import { Seltzer } from "@citrusworx/seltzer";
import type { ResponseData } from "@citrusworx/seltzer";

const app = Seltzer.init();

app.route({
  method: "GET",
  path: "/health",
  handler: (): ResponseData => ({ body: { ok: true } }),
});

app.listen(3000);
```

Why this works:

- `Seltzer.init()` is `new Seltzer()`. There is no config file.
- `.route` compiles `{ method, path, handler }` (parametric regex included).
- `.listen(3000)` calls `http.createServer`. Each request runs the pipeline.
- `{ body: { ok: true } }` is `ResponseData`. `send` JSON-encodes it at status 200.

Try it:

```bash
curl http://127.0.0.1:3000/health
# {"ok":true}

curl http://127.0.0.1:3000/missing
# {"error":"Not Found"}   (status 404)

curl -X POST http://127.0.0.1:3000/health
# {"error":"Not Found"}   (method must match too)
```

`/health?ready=1` still matches `/health` because matching uses pathname. The search string is on `ctx.query`.

`listen` returns the `http.Server`. Hold it if you need `close()` in tests.

## Step 2: List an in-memory collection

A JSON API needs a resource. Put notes in a `Map`. Register `GET /notes`.

```ts
import { Seltzer } from "@citrusworx/seltzer";
import type { ResponseData } from "@citrusworx/seltzer";

type Note = { id: string; text: string };

const notes = new Map<string, Note>([
  ["1", { id: "1", text: "Review the deploy window" }],
]);

const app = Seltzer.init();

app.route({
  method: "GET",
  path: "/health",
  handler: (): ResponseData => ({ body: { ok: true, notes: notes.size } }),
});

app.route({
  method: "GET",
  path: "/notes",
  handler: (): ResponseData => ({ body: [...notes.values()] }),
});

app.listen(3000, { locals: { notes } });
```

Why this works:

- The collection lives in process memory. Seltzer does not persist anything.
- `[...notes.values()]` is an array. Returning `{ body: array }` JSON-encodes that array.
- Returning the array **bare** (`handler: () => [...notes.values()]`) is a 500. Bare values are not wrapped.
- `GET /notes/` is a **different** path. Trailing slashes are not normalized.

```bash
curl http://127.0.0.1:3000/notes
# [{"id":"1","text":"Review the deploy window"}]
```

`listen({ locals })` puts that object on `ctx.locals` for every handler. The Map above is closed over instead; both are valid.

## Step 3: Create with POST — `ctx.body`

The `parse` stage reads JSON when `Content-Type` includes `application/json`. Invalid JSON is 400 `{ error: "Invalid JSON body" }` and the handler never runs.

```ts
let nextId = 2;

app.route({
  method: "POST",
  path: "/notes",
  contract: {
    body: { text: "string.required" },
  },
  handler: (ctx): ResponseData => {
    const body = ctx.body as { text: string };
    const note: Note = { id: String(nextId++), text: body.text.trim() };
    notes.set(note.id, note);
    return { status: 201, body: note };
  },
});
```

Why this works:

- `ctx.body` is already an object. No stream loop in the handler.
- `contract.body.text: "string.required"` is presence-only: missing, `null`, or whitespace → 400 `{ error: "Missing required field: text" }` before `handle`.
- `{ status: 201, body: note }` is `ResponseData`. Extra headers go on `headers`.
- Type checks (string vs number) are **not** in default `validate`. Use `replace("validate", …)` for Zod later.

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

# {"error":"Invalid JSON body"}   (status 400)
```

Missing field:

```bash
curl -X POST http://127.0.0.1:3000/notes \
  -H "Content-Type: application/json" \
  -d '{"text":""}'

# {"error":"Missing required field: text"}
```

## Step 4: Look up one note with `/notes/:id`

Parametric matching is shipped. Static `/notes` and parametric `/notes/:id` coexist. `/notes/new` would need its own static route if you add one — static siblings win over `:id`.

```ts
app.route({
  method: "GET",
  path: "/notes/:id",
  handler: (ctx): ResponseData => {
    const note = notes.get(ctx.params.id);
    return note
      ? { body: note }
      : { status: 404, body: { error: "Not Found" } };
  },
});
```

Why this works:

- `ctx.params.id` is the captured segment (percent-decoded).
- A handler can send 404 for a missing *record*. That is different from the unmatched-route 404 `{ error: "Not Found" }` (capital N in “Found” on the builtin).

```bash
curl http://127.0.0.1:3000/notes/1
# {"id":"1","text":"Review the deploy window"}

curl http://127.0.0.1:3000/notes/missing
# {"error":"Not Found"}
```

Query filters stay on the collection route via `ctx.query`:

```ts
app.route({
  method: "GET",
  path: "/notes",
  handler: (ctx): ResponseData => {
    const q = ctx.query.q?.toLowerCase();
    const all = [...notes.values()];
    const items = q ? all.filter((n) => n.text.toLowerCase().includes(q)) : all;
    return { body: items };
  },
});
```

## Step 5: Generate routes from `ApiOperation[]`

Nectarine YAML lists operations. Nectarine **does not** emit `Route`s. Seltzer `generateRoutes` does. You can build the same list by hand — no YAML required.

```ts
import { generateRoutes, type ApiOperation } from "@citrusworx/seltzer";

const operations: ApiOperation[] = [
  {
    resource: "note",
    crud: "read",
    name: "allNotes",
    method: "GET",
    path: "/api/notes",
    query: "allNotes",
  },
  {
    resource: "note",
    crud: "read",
    name: "noteById",
    method: "GET",
    path: "/api/notes/:id",
    query: "noteById",
  },
];

for (const route of generateRoutes(operations, {
  execute: ({ query, params }) => {
    if (query === "noteById") {
      return notes.get(params.id) ?? null;
    }
    return [...notes.values()];
  },
})) {
  app.route(route);
}
```

Why this works:

- `query` on `ApiOperation` is a **named-query key** passed to `execute`, not `ctx.query`.
- `null` / `undefined` from `execute` becomes 404 `{ error: "Not found" }` (customize with `notFound`).
- Payloads are wrapped as `{ body: result }`. To send a custom status, return `response({ status: 418, body: … })` from `execute`.
- `generateRoutes` copies `resource` / `name` / `body` onto `Route.contract`. Writes with `.required` keys get default `validate`.

If you already load Nectarine YAML:

```ts
import { listApiOperations } from "@citrusworx/nectarine/config";
import { generateRoutes } from "@citrusworx/seltzer";

const operations = listApiOperations("product", product.api).filter(
  (operation) => operation.crud === "read" && operation.method === "GET",
);
```

Do not duplicate that flatten in Seltzer. See [Generate routes](./seltzer-generate.md) and [Integration](./seltzer-integration.md).

## Step 6: Call it with `client.*`

The Seltzer client is a thin `fetch` wrapper. Non-2xx throws `HttpError`.

```ts
import { client, HttpError, type Endpoint } from "@citrusworx/seltzer";

const notesApi: Endpoint = {
  path: "/notes",
  endpoint: "/notes",
  options: { baseUrl: "http://127.0.0.1:3000" },
};

try {
  const created = await client.post(notesApi, { text: "Operator desk queue" });
  const list = await client.get(notesApi);
  console.log(created, list);
} catch (err) {
  if (err instanceof HttpError) {
    console.error(err.status, err.body);
  }
}
```

Why this works:

- URL = `options.baseUrl` + `path` → `http://127.0.0.1:3000/notes`.
- `endpoint` is required by the type and unused by the client.
- `POST` sets `Content-Type: application/json` and `JSON.stringify`s the body.
- A 400 `{ error: "Missing required field: text" }` **throws** (`HttpError`), unlike 0.2.0 which parsed it as success JSON.

Caveats:

- Concatenate carefully: `baseUrl` with a trailing slash plus `path` with a leading slash becomes `//notes`.
- Successful `text/plain` comes back as a string, not JSON.
- `allowSelfSigned` only applies to `https://` and needs the optional `undici` peer.

A Sig.js page would call the same URL with `fetch` inside an `effect`. Juice styles that page. Neither library starts this Node process. CORS is `listen({ cors })`:

```ts
app.listen(3000, {
  cors: { origin: "http://localhost:5173" },
});
```

## The finished server

Hand-written notes half (skip the optional `/api/notes` generated pair):

```ts
import { Seltzer } from "@citrusworx/seltzer";
import type { ResponseData } from "@citrusworx/seltzer";

type Note = { id: string; text: string };

const notes = new Map<string, Note>([
  ["1", { id: "1", text: "Review the deploy window" }],
]);
let nextId = 2;

const app = Seltzer.init();

app.route({
  method: "GET",
  path: "/health",
  handler: (): ResponseData => ({ body: { ok: true, notes: notes.size } }),
});

app.route({
  method: "GET",
  path: "/notes",
  handler: (ctx): ResponseData => {
    const q = ctx.query.q?.toLowerCase();
    const all = [...notes.values()];
    const items = q ? all.filter((n) => n.text.toLowerCase().includes(q)) : all;
    return { body: items };
  },
});

app.route({
  method: "POST",
  path: "/notes",
  contract: { body: { text: "string.required" } },
  handler: (ctx): ResponseData => {
    const body = ctx.body as { text: string };
    const note: Note = { id: String(nextId++), text: body.text.trim() };
    notes.set(note.id, note);
    return { status: 201, body: note };
  },
});

app.route({
  method: "GET",
  path: "/notes/:id",
  handler: (ctx): ResponseData => {
    const note = notes.get(ctx.params.id);
    return note ? { body: note } : { status: 404, body: { error: "Not Found" } };
  },
});

app.listen(3000, {
  cors: { origin: "http://localhost:5173" },
});
```

## What you practiced

| Step | Primitive |
|---|---|
| Health | `init` + `route` + `listen` + `{ body }` |
| List | exact `GET` path, `ctx.query` |
| Create | `ctx.body`, `contract.body`, status `201` / `400` |
| Lookup | `/notes/:id` → `ctx.params` |
| Generate | `ApiOperation[]` + `execute` |
| Client | `Endpoint` + `client.get/post` + `HttpError` |

## What this tutorial refused to invent

```ts
// Not APIs
app.use(json());
ctx.json({ ok: true });
handler: () => ({ ok: true });           // 500 — not ResponseData
app.pipeline.insert("auth").before("handle"); // the method is app.before("handle", fn)
```

`before("handle", fn)` **is** shipped. `ctx.json` is gone.

## Where to go next

- [Request and response](./seltzer-request-response.md) — `ResponseData` in detail
- [Routing](./seltzer-routing.md) — static-prefix preference, trailing slashes
- [Pipeline](./seltzer-pipeline.md) — stages, `before`, `replace`
- [Generate routes](./seltzer-generate.md)
- [Client](./seltzer-client.md)
- [Patterns](./seltzer-patterns.md)
- [Anti-patterns](./seltzer-anti-patterns.md)
- [Integration](./seltzer-integration.md)
