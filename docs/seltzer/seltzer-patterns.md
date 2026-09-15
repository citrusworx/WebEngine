# Seltzer Patterns

Reusable HTTP patterns built from current Seltzer primitives. These are not new APIs. They are recommended compositions you can copy and adapt.

Each pattern follows the same general rules:

- object `method` + `path` own matching (`:id` is real)
- handlers return `ResponseData`; the runtime `send`s
- `ctx.body` / `ctx.params` / `ctx.query` are filled by the pipeline
- app code owns data (memory, Nectarine adapters, files)

Related:

- [JSON API tutorial](./seltzer-api-tutorial.md)
- [Best practices](./seltzer-best-practices.md)
- [Examples](./seltzer-examples.md)

## Health check

```ts
app.route({
  method: "GET",
  path: "/health",
  handler: (): ResponseData => ({ body: { ok: true } }),
});
```

Include cheap process facts if you want (`uptime`, collection size). Do not block on a database ping unless you catch failures and still return `ResponseData`.

## Collection list

```ts
app.route({
  method: "GET",
  path: "/notes",
  handler: (): ResponseData => ({ body: [...notes.values()] }),
});
```

Return an array via `{ body: array }` or `{ body: { notes: [...] } }` — pick one and keep it. Seltzer has no envelope convention. Returning the array **bare** is a 500.

## Query filter on the same path

Matching ignores search, so filters live in the handler:

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

`GET /notes` and `GET /notes?q=deploy` hit this one route.

## Create with JSON body

```ts
app.route({
  method: "POST",
  path: "/notes",
  contract: { body: { text: "string.required" } },
  handler: (ctx): ResponseData => {
    const body = ctx.body as { text: string };
    const note = { id: crypto.randomUUID(), text: body.text };
    notes.set(note.id, note);
    return { status: 201, body: note };
  },
});
```

Invalid JSON is 400 from `parse`. Missing `text` is 400 from `validate`. Do not paste a stream loop in every route.

## Lookup by `:id`

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

Static siblings (`/notes/new`) win over this route regardless of registration order.

## Replace / patch / delete

```ts
app.route({
  method: "PUT",
  path: "/notes/:id",
  contract: { body: { text: "string.required" } },
  handler: (ctx): ResponseData => {
    if (!notes.has(ctx.params.id)) {
      return { status: 404, body: { error: "Not Found" } };
    }
    const body = ctx.body as { text: string };
    const note = { id: ctx.params.id, text: body.text };
    notes.set(note.id, note);
    return { body: note };
  },
});

app.route({
  method: "DELETE",
  path: "/notes/:id",
  handler: (ctx): ResponseData => {
    const ok = notes.delete(ctx.params.id);
    return ok
      ? { body: { deleted: ctx.params.id } }
      : { status: 404, body: { error: "Not Found" } };
  },
});
```

```ts
await client.delete({
  path: "/notes/1",
  endpoint: "/notes/:id",
  options: { baseUrl: "http://127.0.0.1:3000" },
});
```

`endpoint` is unused; put the concrete path on `path`.

## Error shape

Pick a small JSON error and reuse it:

```ts
function fail(status: number, error: string): ResponseData {
  return { status, body: { error } };
}
```

Seltzer’s unmatched route uses `{ error: "Not Found" }` at 404. Matching that key in handlers keeps clients boring.

Thrown errors become `{ error: "Internal Server Error", message }`. Domain 400s should return `ResponseData`, not throw, if you want a stable `error` string.

## Plain text / non-JSON

```ts
app.route({
  method: "GET",
  path: "/robots.txt",
  handler: (): ResponseData => ({
    headers: { "Content-Type": "text/plain" },
    body: "User-agent: *\nDisallow:\n",
  }),
});
```

Do not `writeHead` on `ctx.res` and then return `{ body }` — `send` will no-op.

## CORS on listen

```ts
app.listen(3000, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "OPTIONS"],
    headers: ["Content-Type"],
  },
});
```

Do not register a per-path `OPTIONS` handler unless you need behavior beyond the builtin 204. CORS only fires when the request has an `Origin` header.

## Auth as `before("handle")`

```ts
const requireAuth: Stage = (ctx) => {
  if (!ctx.headers.authorization) {
    return { status: 401, body: { error: "Unauthorized" } };
  }
};

app.before("handle", requireAuth);
```

404s still run first (`route` is earlier). Public routes on the same app will also see this stage — branch on `ctx.path` if you need exceptions, or mount public and private apps separately.

## Generate list + by-id

```ts
for (const route of generateRoutes(operations, {
  execute: ({ query, params }) => {
    if (query === "noteById") return notes.get(params.id) ?? null;
    return [...notes.values()];
  },
})) {
  app.route(route);
}
```

See [Generate routes](./seltzer-generate.md).

## Endpoint object per collection

```ts
import { type Endpoint } from "@citrusworx/seltzer";

const notesApi: Endpoint = {
  path: "/notes",
  endpoint: "/notes",
  options: { baseUrl: "http://127.0.0.1:3000" },
};
```

Reuse it for `get` and `post`. For by-id, a second object with `path: "/notes/1"` is clearer than mutating `path`.

## Mount helpers (still just `.route`)

```ts
function mountNotes(app: Seltzer, store: Map<string, Note>) {
  app.route({
    method: "GET",
    path: "/notes",
    handler: (): ResponseData => ({ body: [...store.values()] }),
  });
}
```

This is how you “group” routes without a Router class.

## Locals instead of module globals

```ts
app.listen(3000, { locals: { notes, db } });

app.route({
  method: "GET",
  path: "/notes",
  handler: (ctx): ResponseData => ({
    body: [...(ctx.locals as { notes: Map<string, Note> }).notes.values()],
  }),
});
```

## What is not a pattern (yet)

- `app.use(auth)`
- `return { ok: true }` without `{ body }`
- `ctx.json`
- Automatic OpenAPI from `.route` calls
- File uploads as first-class `ctx.file`
- HTTPS `listen`

Those would be new code.
