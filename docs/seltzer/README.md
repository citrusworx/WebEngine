# Seltzer

A small Node `http` server and a `fetch` client.

Seltzer is the CitrusWorx HTTP surface: register exact-path routes, get a context with `req`, `res`, and `ctx.json()`, listen on a port. A sibling `client` object wraps GET/POST/PUT/PATCH/DELETE.

The current model is:

- **`Seltzer.init()`** builds an instance
- **`.route({ method, path, handler })`** stores an exact method + pathname match
- **`.listen(port)`** creates `http.createServer` and writes JSON 404s when nothing matches
- **`client.get/post/put/patch/delete`** call `fetch` with an `Endpoint` object

Seltzer is strongest as a readable, tiny runtime you can hold in your head. It is not Express, and it is not yet the pipeline described in the [design overview](./seltzer-design.md).

## Who it is for

- App authors who need a first HTTP process in this monorepo
- People wiring Nectarine YAML `method` / `endpoint` pairs to a listener by copy
- Sig.js / Juice pages that talk to a JSON API over `fetch` or `client.*`
- Contributors who will grow the pipeline — **after** they can run `Seltzer.init()`

It is not a middleware framework. Courses and exercises are **electives** for implementers, not the product path.

## Why it exists

CitrusWorx did not want the HTTP layer to be “whatever Express plugin we grabbed this week.” Juice already refused utility-class soup; Seltzer refuses middleware soup.

The design bet (see the [design doc](./seltzer-design.md)) is:

- Normalize the request into a structured context
- Run named pipeline stages instead of `next()`
- Let handlers return data; let the runtime write the socket
- Eventually share contracts with Nectarine

**What shipped first** is the thinnest honest slice of that: Node `http`, exact routes, `ctx.json`, and a fetch client. The rest is still a study-and-build project. That is deliberate — the [courses](./courses.md) exist so contributors implement the missing stages by hand.

If Seltzer were only a cleaner `createServer`, it would not be worth a package. The package exists so the ecosystem has one HTTP vocabulary (`Route`, `Endpoint`, `Seltzer`) to grow into.

The split across the stack:

- **Nectarine** names the data and (as YAML) the method/path pairs
- **Seltzer** listens and answers
- **Sig.js / Juice** consume the JSON
- **Grapevine** provisions the machine; it does not start `listen`

## Current setup shape

```ts
import { Seltzer } from "@citrusworx/seltzer";

const app = Seltzer.init();

app.route({
  method: "GET",
  path: "/",
  handler: (ctx) => ctx.json([{ message: "Hello World!" }]),
});

app.listen(3000);
```

That is `libraries/seltzer/src/example.ts`. Package version today: **0.2.0**.

## What it can do

The sections below are the capability showcase. Every snippet matches `libraries/seltzer/src`. If a pattern is not here, it is probably not in the library — check [Status](./seltzer-status.md) before assuming an Express-shaped API.

### 1. JSON GET on an exact path

`ctx.json(data, status?)` is `writeHead` + `JSON.stringify` + `end`. Default status is 200.

```ts
import { Seltzer } from "@citrusworx/seltzer";

const app = Seltzer.init();

app.route({
  method: "GET",
  path: "/health",
  handler: (ctx) => ctx.json({ ok: true, uptime: process.uptime() }),
});

app.listen(3000);
```

`curl http://127.0.0.1:3000/health` → `{"ok":true,"uptime":…}`.

The matcher uses `url.pathname` only. `/health?verbose=1` still hits `/health`. Read the query yourself if you need it — [Request and response](./seltzer-request-response.md).

### 2. JSON POST — you collect the body

There is **no** built-in body parser. The design doc assigns that to a `parse` stage; you collect the stream today.

```ts
async function readJson(req: import("node:http").IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
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
      return ctx.json({ id: "1", text: body.text }, 201);
    } catch {
      return ctx.json({ error: "invalid json" }, 400);
    }
  },
});
```

If you never read `ctx.req` and never `end` the response, the connection hangs. Always `ctx.json` or `ctx.res.end`. `listen` does **not** await the handler or serialize a returned object.

### 3. Lookup without `:id` routes

`/notes/1` will not match `/notes/:id`. Parametric routes are an exercise, not an API. Use a query string, or register a concrete path.

```ts
app.route({
  method: "GET",
  path: "/note",
  handler: (ctx) => {
    const url = new URL(ctx.req.url || "/", `http://${ctx.req.headers.host}`);
    const id = url.searchParams.get("id");
    return id
      ? ctx.json({ id, text: "Ship the notes API" })
      : ctx.json({ error: "id required" }, 400);
  },
});
```

The [tutorial](./seltzer-api-tutorial.md) builds a small in-memory collection this way.

### 4. 404 for unknown method + path

Matching is `route.method === req.method && route.path === url.pathname`. First registration wins. Trailing slashes are a different path: `/notes` ≠ `/notes/`.

Unmatched requests get `{ error: "Not Found" }` with status 404. There is no custom 404 handler.

### 5. Raw socket when JSON is the wrong content type

`ctx.json` is a convenience, not a requirement. The Node `ServerResponse` is on `ctx.res`.

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

### 6. Optional handler config (stored, barely used)

```ts
app.handler({
  adapter: "node-http",
  options: {
    baseUrl: "https://api.example.com",
    headers: { "X-App": "demo" },
    allowSelfSigned: false,
  },
});
```

`options` is copied onto `ctx.options`. Nothing in `listen` reads `adapter` or `allowSelfSigned`. The client uses the same option shape when you pass an `Endpoint`. KiwiPress stores `baseUrl` this way for outbound WordPress calls — it does not make Seltzer speak WordPress.

### 7. Outbound fetch

```ts
import { client, type Endpoint } from "@citrusworx/seltzer";

const notes: Endpoint = {
  path: "/notes",
  endpoint: "/notes",
  options: { baseUrl: "http://127.0.0.1:3000" },
};

const list = await client.get(notes);
await client.post(notes, { text: "Review the deploy window" });
```

`client` methods always `res.json()`. Non-JSON responses throw. There is no status check. `allowSelfSigned` is a comment only — no custom HTTPS agent.

`Endpoint.route` and `Endpoint.endpoint` are typed but **not** read by the client. The URL is `options.baseUrl + path` or `path` alone.

### 8. Copy a Nectarine method/path object

Nectarine YAML can list `{ method, endpoint }`. Seltzer can register `{ method, path, handler }`. There is no importer and no codegen. Copy the exact-path pairs; skip `:id` entries until parametric routing exists.

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

```ts
import { Seltzer } from "@citrusworx/seltzer";

const allUsers = { method: "GET", endpoint: "/users" };
const createUser = { method: "POST", endpoint: "/users" };

const app = Seltzer.init();

app.route({
  method: allUsers.method,
  path: allUsers.endpoint,
  handler: (ctx) => ctx.json({ users: [] }),
});

app.route({
  method: createUser.method,
  path: createUser.endpoint,
  handler: (ctx) => ctx.json({ created: true }, 201),
});

app.listen(3000);
```

You can also `parser.yaml(…)` and walk `api.user.get.allUsers.api`. `parser.registerRoute` does **not** mount handlers, and it indexes the YAML file without a resource prefix — see [Integration](./seltzer-integration.md).

### 9. Node-only listen

`listen` throws if `process.versions.node` is missing. This is a server library, not a browser bundle. It uses `http.createServer`, not HTTPS. It does not return the `http.Server`, so there is no packaged `close()`.

## Mental model

```text
HTTP request
  → URL pathname + method
  → first exact route match
  → handler(ctx)     ctx = { req, res, options, json }
  → you write the body (usually ctx.json)
```

| You want… | Today |
|---|---|
| JSON response | `ctx.json(value, status?)` |
| Raw socket | `ctx.res.writeHead` / `ctx.res.end` |
| Request body | Read `ctx.req` yourself |
| Query string | `new URL(ctx.req.url, …).searchParams` |
| `/users/:id` | Not implemented — query `?id=` or a concrete path |
| Middleware | Not a thing — add code in the handler |
| Handler `return { status, body }` | Discarded — `listen` does not send it |
| Named pipeline insert | Design only |
| CORS / HTTPS / timeouts | Platform / your handler |

Functionally, a handler is “a function that must finish the Node response.” Seltzer finds the function. You own the bytes.

## Product path vs contributor path

**Building an app HTTP surface** (start here)

1. [Getting Started](./seltzer-getting-started.md)
2. [JSON API tutorial](./seltzer-api-tutorial.md)
3. Topic pages: [request/response](./seltzer-request-response.md), [routing](./seltzer-routing.md), [client](./seltzer-client.md)
4. [Patterns](./seltzer-patterns.md) · [Best practices](./seltzer-best-practices.md) · [Anti-patterns](./seltzer-anti-patterns.md)
5. [Examples](./seltzer-examples.md) · [Integration](./seltzer-integration.md)

**Implementing the runtime** (elective)

1. [Design overview](./seltzer-design.md) — the pipeline Seltzer is *becoming*
2. [Study guide](./courses.md) — Node courses mapped to stages
3. [Exercises](./exercises/README.md) — echo server through fetch client

Do not start with exercise 06 if you only need `listen(3000)`. Do not present parametric routes, a body parser, or pipeline insert as if they shipped.

## Suggested reading order

1. This page
2. [Getting Started](./seltzer-getting-started.md) — install, hello world, context
3. [JSON API tutorial](./seltzer-api-tutorial.md) — guided build: health → collection → POST → query lookup → Nectarine copy → client
4. [Request and response](./seltzer-request-response.md) — `ctx`, `json`, body, query, raw `res`
5. [Routing](./seltzer-routing.md) — exact match, first-wins, 404
6. [Client](./seltzer-client.md) — `Endpoint`, `client.*`, what is ignored
7. [Patterns](./seltzer-patterns.md) — truthful cookbook for small JSON APIs
8. [Best Practices](./seltzer-best-practices.md) — how to compose Seltzer so it stays small
9. [Anti-Patterns](./seltzer-anti-patterns.md) — Express habits, design-doc APIs, unended responses
10. [Examples](./seltzer-examples.md) — longer showcases
11. [API Reference](./seltzer-api.md) — the public surface, one page
12. [Integration](./seltzer-integration.md) — Nectarine, Juice/Sig, Grapevine, KiwiPress
13. [Troubleshooting](./seltzer-troubleshooting.md) — hangs, 404s, client throws
14. [Status](./seltzer-status.md) — Early implementation matrix
15. [Roadmap](./seltzer-roadmap.md) — shipped vs design-doc future
16. [Design](./seltzer-design.md) — only if you need the long-term shape

## Status

**Early implementation** (`@citrusworx/seltzer` 0.2.0). Matches the workspace index.

Shipped: `Seltzer.init/route/handler/listen`, exact match, `ctx.json`, `client.*`.

Not shipped: body parser, parametric routes, pipeline stages, structured handler return values, CORS, HTTPS listen, contracts, streaming helpers.

Early here means the kernel is real and small enough to teach in depth, not that the HTTP story is finished. See [Status](./seltzer-status.md) for the area-by-area matrix and [Roadmap](./seltzer-roadmap.md) for what is worth building next.

## Sibling packages

- [Nectarine](../nectarine/README.md) — YAML method/path objects you can copy into `.route()`
- [Sig.js](../sigjs/README.md) / [Juice](../juice/README.md) — consume Seltzer over `fetch`
- [Grapevine](../grapevine/README.md) — provision the machine; does not start Seltzer
- [KiwiPress](../kiwipress/README.md) — WordPress client that stores Seltzer `handler` options and uses its own `fetch`
