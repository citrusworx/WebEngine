# Seltzer Patterns

Reusable HTTP patterns built from current Seltzer primitives. These are not new APIs. They are recommended compositions you can copy and adapt.

Each pattern follows the same general rules:

- exact `method` + `path` own matching
- `ctx.json` owns JSON responses
- handlers own body parsing, query strings, and status codes
- app code owns data (memory, Nectarine adapters, files)

Related:

- [JSON API tutorial](./seltzer-api-tutorial.md) — these patterns composed into one notes service
- [Best practices](./seltzer-best-practices.md)
- [Examples](./seltzer-examples.md) — longer showcases of the same ideas

## Health check

Use this as the first route you register. It proves `listen` is alive without touching storage.

```ts
app.route({
  method: "GET",
  path: "/health",
  handler: (ctx) => ctx.json({ ok: true }),
});
```

Include cheap process facts if you want (`uptime`, collection size). Do not block on a database ping unless you catch failures and still `end` the response.

## Collection list

```ts
app.route({
  method: "GET",
  path: "/notes",
  handler: (ctx) => ctx.json([...notes.values()]),
});
```

Return an array at the top level or `{ notes: [...] }` — pick one and keep it. Seltzer has no envelope convention.

## Query filter on the same path

Matching ignores search, so filters live in the handler:

```ts
app.route({
  method: "GET",
  path: "/notes",
  handler: (ctx) => {
    const url = new URL(ctx.req.url || "/", `http://${ctx.req.headers.host}`);
    const q = url.searchParams.get("q")?.toLowerCase();
    const all = [...notes.values()];
    const items = q ? all.filter((n) => n.text.toLowerCase().includes(q)) : all;
    return ctx.json(items);
  },
});
```

`GET /notes` and `GET /notes?q=deploy` hit this one route.

## Create with stream JSON

```ts
async function readJson(req: import("node:http").IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : null;
}

app.route({
  method: "POST",
  path: "/notes",
  handler: async (ctx) => {
    try {
      const body = (await readJson(ctx.req)) as { text?: string };
      if (!body?.text) return ctx.json({ error: "text required" }, 400);
      const note = { id: crypto.randomUUID(), text: body.text };
      notes.set(note.id, note);
      return ctx.json(note, 201);
    } catch {
      return ctx.json({ error: "invalid json" }, 400);
    }
  },
});
```

Share `readJson` across POST/PUT/PATCH handlers. Do not paste a new stream loop in every route.

## Lookup by query id

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

This is the product-path stand-in for `/notes/:id`.

## Replace / patch on an exact collection path

PUT/PATCH still need an identifier. Carry it in the body or a query string.

```ts
app.route({
  method: "PUT",
  path: "/note",
  handler: async (ctx) => {
    const url = new URL(ctx.req.url || "/", `http://${ctx.req.headers.host}`);
    const id = url.searchParams.get("id");
    if (!id) return ctx.json({ error: "id required" }, 400);
    if (!notes.has(id)) return ctx.json({ error: "Not Found" }, 404);
    try {
      const body = (await readJson(ctx.req)) as { text?: string };
      if (!body?.text) return ctx.json({ error: "text required" }, 400);
      const note = { id, text: body.text };
      notes.set(id, note);
      return ctx.json(note);
    } catch {
      return ctx.json({ error: "invalid json" }, 400);
    }
  },
});
```

```ts
app.route({
  method: "DELETE",
  path: "/note",
  handler: (ctx) => {
    const url = new URL(ctx.req.url || "/", `http://${ctx.req.headers.host}`);
    const id = url.searchParams.get("id");
    if (!id) return ctx.json({ error: "id required" }, 400);
    const ok = notes.delete(id);
    return ok ? ctx.json({ deleted: id }) : ctx.json({ error: "Not Found" }, 404);
  },
});
```

`client.put` / `client.patch` / `client.delete` use the same `Endpoint` shape. Put `?id=` on `path`:

```ts
await client.delete({
  path: "/note?id=1",
  endpoint: "/note",
  options: { baseUrl: "http://127.0.0.1:3000" },
});
```

## Error shape

Pick a small JSON error and reuse it:

```ts
function fail(ctx: { json: (data: unknown, status?: number) => void }, status: number, error: string) {
  return ctx.json({ error }, status);
}
```

Seltzer’s unmatched route already uses `{ error: "Not Found" }` at 404. Matching that key in handlers keeps clients boring.

There is no problem+json helper, no stack in production responses unless you add it.

## Plain text / non-JSON

```ts
app.route({
  method: "GET",
  path: "/robots.txt",
  handler: (ctx) => {
    ctx.res.writeHead(200, { "Content-Type": "text/plain" });
    ctx.res.end("User-agent: *\nDisallow:\n");
  },
});
```

Do not call `ctx.json` afterwards.

## CORS headers on a known origin

`ctx.json` cannot add headers. Write the head yourself for browser apps on another origin:

```ts
function jsonWithCors(ctx: { res: import("node:http").ServerResponse }, data: unknown, status = 200) {
  ctx.res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "http://localhost:5173",
  });
  ctx.res.end(JSON.stringify(data));
}

app.route({
  method: "OPTIONS",
  path: "/notes",
  handler: (ctx) => {
    ctx.res.writeHead(204, {
      "Access-Control-Allow-Origin": "http://localhost:5173",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    ctx.res.end();
  },
});
```

Register `OPTIONS` for each path the browser preflights. There is no global middleware slot.

## Nectarine path copy

```ts
const allUsers = { method: "GET", endpoint: "/users" };

app.route({
  method: allUsers.method,
  path: allUsers.endpoint,
  handler: (ctx) => ctx.json({ users: [] }),
});
```

Keep the YAML as the named contract. Keep the handler as yours. Skip `:id` keys.

## Endpoint object per collection

```ts
import { type Endpoint } from "@citrusworx/seltzer";

const notesApi: Endpoint = {
  path: "/notes",
  endpoint: "/notes",
  options: { baseUrl: "http://127.0.0.1:3000" },
};
```

Reuse it for `get` and `post`. For query lookups, a second object with `path: "/note"` (and `?id=` at the call site) is clearer than mutating `path`.

## Mount helpers (still just `.route`)

```ts
function mountNotes(app: Seltzer, store: Map<string, Note>) {
  app.route({
    method: "GET",
    path: "/notes",
    handler: (ctx) => ctx.json([...store.values()]),
  });
  // POST, etc.
}
```

This is how you “group” routes without a Router class.

## Try/catch around async work

```ts
app.route({
  method: "GET",
  path: "/users",
  handler: async (ctx) => {
    try {
      return ctx.json(await loadUsers());
    } catch (err) {
      console.error(err);
      return ctx.json({ error: "failed" }, 500);
    }
  },
});
```

`listen` will not do this for you.

## What is not a pattern (yet)

- `app.use(auth)`
- `router.param("id", …)`
- `return { status, body }`
- Automatic OpenAPI from `.route` calls
- File uploads as first-class `ctx.file`

Those would be new code. Until they exist, keep patterns on `ctx.json` and Node.
