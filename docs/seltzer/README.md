# Seltzer

A structured Node HTTP runtime: object routes, `ResponseData` handlers, and a named request pipeline.

Seltzer is the CitrusWorx HTTP surface. Register `{ method, path, handler }` routes, return `{ status?, headers?, body? }`, and let the runtime parse, match, validate, and send. A sibling `client` wraps GET/POST/PUT/PATCH/DELETE. `generateRoutes` maps a flat `ApiOperation[]` list (from Nectarine YAML or by hand) onto those same object routes.

The current model is:

- **`Seltzer.init()`** builds an instance
- **`.route({ method, path, handler, contract? })`** registers an object route (static or `:param`)
- **`.before(name, stage)` / `.replace(name, stage)`** extend the named pipeline
- **`.listen(port, options?)`** runs Node `http`, CORS/`OPTIONS` 204, then the pipeline
- **`client.get/post/put/patch/delete`** call `fetch` with an `Endpoint` and throw `HttpError` on non-2xx

Seltzer is strongest as a readable request engine you can hold in your head. It is not Express, and it is not a middleware stack. The pipeline in [seltzer-design.md](./seltzer-design.md) is **shipped** in `@citrusworx/seltzer` **0.8.1**, not a future sketch.

These docs describe Seltzer **≥0.8** as it lives on `cursor/blackwater-phase0-backend`. They must not be merged onto `master` alone while master still ships 0.2.0 APIs (`ctx.json`, exact-path only, no pipeline).

## Who it is for

- App authors who need a first HTTP process in this monorepo
- Hosts that flatten Nectarine `*API.yml` with `listApiOperations` and call `generateRoutes`
- Sig.js / Juice pages that talk to a JSON API over `fetch` or `client.*`
- Contributors who want to *understand* the pipeline — after they can run `init().route().listen()`

It is not a middleware framework. Courses and exercises rebuild shipped internals by hand. They are not the product path.

## Why it exists

CitrusWorx did not want the HTTP layer to be “whatever Express plugin we grabbed this week.” Juice already refused utility-class soup; Seltzer refuses middleware soup.

The design bet that **shipped**:

- Normalize the request into a structured `RequestContext`
- Run named pipeline stages instead of `next()`
- Let handlers return `ResponseData`; let the runtime write the socket
- Share operation lists with Nectarine through `generateRoutes` and `Route.contract`

If Seltzer were only a cleaner `createServer`, it would not be worth a package. The package exists so the ecosystem has one HTTP vocabulary (`Route`, `RequestContext`, `ResponseData`, `Endpoint`) to grow into.

The split across the stack:

- **Nectarine** names data, YAML APIs, and `ApiOperation[]`
- **Seltzer** listens, matches, validates `.required` body fields, and answers
- **Sig.js / Juice** consume the JSON
- **Grapevine** provisions the machine; it does not start `listen`

## Current setup shape

```ts
import { Seltzer } from "@citrusworx/seltzer";
import type { ResponseData } from "@citrusworx/seltzer";

const app = Seltzer.init();

app.route({
  method: "GET",
  path: "/",
  handler: (): ResponseData => ({
    body: [{ message: "Hello World!" }],
  }),
});

app.listen(3000);
```

That is `libraries/seltzer/src/example.ts`. Package version today: **0.8.1**. Requires Node 18+.

Handlers return `ResponseData`. The runtime writes the HTTP response. There is no writing `ctx.json` helper. Bare objects, arrays, and strings are not wrapped — return `{ body: ... }`.

## What it can do

The sections below are the capability showcase. Every snippet matches `libraries/seltzer/src` at 0.8.1. If a pattern is not here, check [Status](./seltzer-status.md) before assuming an Express-shaped API.

### 1. JSON GET with `ResponseData`

`status` defaults to `200`. Object and array bodies are JSON with `Content-Type: application/json` unless you set that header yourself.

```ts
import { Seltzer } from "@citrusworx/seltzer";
import type { ResponseData } from "@citrusworx/seltzer";

const app = Seltzer.init();

app.route({
  method: "GET",
  path: "/health",
  handler: (): ResponseData => ({
    body: { ok: true, uptime: process.uptime() },
  }),
});

app.listen(3000);
```

`curl http://127.0.0.1:3000/health` → `{"ok":true,"uptime":…}`.

Matching uses `ctx.path` (the URL pathname). `/health?verbose=1` still hits `/health`; the search string is on `ctx.query`.

### 2. JSON POST — the `parse` stage owns the body

`parse` reads the stream for methods other than GET/HEAD. `Content-Type: application/json` is parsed; invalid JSON is **400** `{ error: "Invalid JSON body" }` and never reaches the handler. Other content types land as a UTF-8 string. Empty bodies are `undefined`.

```ts
app.route({
  method: "POST",
  path: "/notes",
  handler: (ctx): ResponseData => {
    const body = ctx.body as { text?: string } | undefined;
    if (!body?.text) {
      return { status: 400, body: { error: "text required" } };
    }
    return { status: 201, body: { id: "1", text: body.text } };
  },
});
```

Do not collect `ctx.req` yourself for JSON. Do not call `ctx.json` — it was removed in 0.4.0.

### 3. Parametric routes (`/notes/:id`)

`:param` segments compile to a regex. Captures land on `ctx.params`. Static prefixes win over `:id` even if the parametric route was registered first (`/items/new` beats `/items/:id`; `/api/products/catalog/:catalog` beats `/api/products/:id`).

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

Query strings remain available: `ctx.query.q` for `/notes/1?q=search`.

### 4. 404 for unmatched method + path

Unmatched requests get `{ error: "Not Found" }` with status 404 from the `route` stage. Method mismatch is also 404 (not 405). Trailing slashes are a different path: `/notes` ≠ `/notes/`.

### 5. Headers, text, and buffers without touching `res`

Return extra headers and a non-JSON body on `ResponseData`. The `send` stage encodes it.

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

`req` / `res` remain on ctx for escape hatches, but normal responses should not touch `res`. `send` is a no-op if headers were already sent.

### 6. CORS and `OPTIONS` 204

CORS runs **before** the pipeline. `OPTIONS` answers 204 and returns. Pass `cors` on `listen`:

```ts
app.listen(3000, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "OPTIONS"],
    headers: ["Content-Type"],
  },
  locals: { notes },
  onListening: (port) => console.log(`up on ${port}`),
});
```

If `origin` is omitted, Seltzer reflects the request `Origin` when present. No `Origin` header means no CORS headers. `ctx.locals` is the `locals` object from `listen`.

`listen` **returns** the `http.Server` (tests can `close()` it).

### 7. Named pipeline: `before` and `replace`

Each request runs:

`parse` → `context` → `route` → `validate` → `handle` → `response` → `send`

`before("handle", stage)` inserts immediately before that builtin. Returning `ResponseData` from a stage skips the rest and jumps to `send`. `replace("validate", stage)` swaps the builtin so Nectarine can hang richer contracts.

```ts
import type { Stage } from "@citrusworx/seltzer";

const requireAuth: Stage = (ctx) => {
  if (!ctx.headers.authorization) {
    return { status: 401, body: { error: "Unauthorized" } };
  }
};

const app = Seltzer.init().before("handle", requireAuth);
```

See [Pipeline](./seltzer-pipeline.md).

### 8. Default `validate` for `.required` body fields

`Route.contract.body` uses YAML-style specs. Keys whose spec contains `.required` must be present and non-empty on a JSON object body. Missing → 400 `{ error: "Missing required field(s): …" }`. No specs → no-op.

```ts
app.route({
  method: "POST",
  path: "/api/waitlist",
  contract: {
    resource: "waitlist",
    name: "joinWaitlist",
    body: { name: "string", email: "string.required" },
  },
  handler: (): ResponseData => ({ status: 201, body: { ok: true } }),
});
```

### 9. `generateRoutes` from `ApiOperation[]`

Nectarine does not generate `Route`s. Seltzer does. Flatten YAML with `listApiOperations`, or build the list by hand.

```ts
import { Seltzer, generateRoutes, type ApiOperation } from "@citrusworx/seltzer";

const operations: ApiOperation[] = [
  {
    resource: "product",
    crud: "read",
    name: "productById",
    method: "GET",
    path: "/api/products/:id",
    query: "productById",
  },
];

for (const route of generateRoutes(operations, {
  execute: ({ query, params }) => {
    if (query === "productById") {
      return products.find((item) => item.id === params.id) ?? null;
    }
    return products;
  },
})) {
  app.route(route);
}
```

`execute` may return a payload (`{ body }`), `response({ status?, headers?, body? })` to send as-is, or `null`/`undefined` (default 404). Unbranded `{ status, body }` objects are treated as payloads. See [Generate routes](./seltzer-generate.md).

### 10. Outbound `client` with `HttpError`

```ts
import { client, HttpError } from "@citrusworx/seltzer";

try {
  const list = await client.get({
    path: "/notes",
    endpoint: "/notes",
    options: { baseUrl: "http://127.0.0.1:3000" },
  });
} catch (err) {
  if (err instanceof HttpError) {
    console.error(err.status, err.body);
  }
}
```

Non-2xx throws `HttpError` (`status`, `statusText`, full `body`; the message includes a short snippet). Successful JSON is parsed; other content types come back as text. `204` / `205` and empty bodies resolve to `undefined`. `allowSelfSigned: true` on `https://` dynamically imports optional peer `undici`.

URL is still `baseUrl + path` (no slash-safe join). `Endpoint.endpoint` and `Endpoint.route` are typed and unused.

### 11. Optional `.handler()` config

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

`options` is copied onto `ctx.options`. Nothing in `listen` reads `adapter`. KiwiPress stores `baseUrl` this way for outbound WordPress calls — it does not make Seltzer speak WordPress.

### 12. Node-only listen

`listen` throws if `process.versions.node` is missing. Plain `http.createServer`, not HTTPS.

## Mental model

```text
HTTP request
  → CORS / OPTIONS 204 (if configured)
  → parse (JSON body or raw)
  → context (method, path, query, headers)
  → route (match + params; 404 if none)
  → validate (.required body keys)
  → handle (handler returns ResponseData)
  → response (reject bare values with 500)
  → send (writeHead + end)
```

| You want… | Today |
|---|---|
| JSON response | `return { body }` (status defaults to 200) |
| Extra headers / 201 | `return { status, headers, body }` |
| Request body | `ctx.body` (JSON parsed in `parse`) |
| Query string | `ctx.query` |
| `/users/:id` | `ctx.params.id` |
| Auth / logging | `before("handle", stage)` |
| Richer contracts | `replace("validate", …)` |
| YAML APIs | `listApiOperations` + `generateRoutes` |
| CORS | `listen(port, { cors })` |
| Outbound JSON | `client.*` — catch `HttpError` |

Functionally, a handler is “a function that returns `ResponseData`.” Seltzer finds the function, runs the pipeline, and owns the bytes.

## Product path vs contributor path

**Building an app HTTP surface** (start here)

1. [Getting Started](./seltzer-getting-started.md)
2. [JSON API tutorial](./seltzer-api-tutorial.md)
3. Topic pages: [request/response](./seltzer-request-response.md), [routing](./seltzer-routing.md), [pipeline](./seltzer-pipeline.md), [client](./seltzer-client.md), [generate routes](./seltzer-generate.md)
4. [Patterns](./seltzer-patterns.md) · [Best practices](./seltzer-best-practices.md) · [Anti-patterns](./seltzer-anti-patterns.md)
5. [Examples](./seltzer-examples.md) · [Integration](./seltzer-integration.md)

**Understanding the runtime** (elective)

1. [Design overview](./seltzer-design.md) — why pipelines, not middleware
2. [Study guide](./courses.md) — Node courses mapped to shipped stages
3. [Exercises](./exercises/README.md) — rebuild `parse` / `:id` / `send` / `before` from `node:http`

Do not start with exercise 06 if you only need `listen(3000)`. Do not paste `ctx.json` from 0.2.0 docs.

## Suggested reading order

1. This page
2. [Getting Started](./seltzer-getting-started.md) — install, hello world, context
3. [JSON API tutorial](./seltzer-api-tutorial.md) — health → collection → POST → `:id` → `generateRoutes` → client
4. [Request and response](./seltzer-request-response.md) — `RequestContext`, `ResponseData`, `send`
5. [Routing](./seltzer-routing.md) — params, static-prefix preference, 404
6. [Pipeline](./seltzer-pipeline.md) — stages, `before`, `replace`, short-circuit
7. [Client](./seltzer-client.md) — `Endpoint`, `HttpError`, `allowSelfSigned`
8. [Generate routes](./seltzer-generate.md) — `ApiOperation[]`, `execute`, `response()`
9. [Patterns](./seltzer-patterns.md) — cookbook for JSON APIs
10. [Best Practices](./seltzer-best-practices.md)
11. [Anti-Patterns](./seltzer-anti-patterns.md) — Express habits, leftover `ctx.json`
12. [Examples](./seltzer-examples.md)
13. [API Reference](./seltzer-api.md)
14. [Integration](./seltzer-integration.md) — Nectarine, Juice/Sig, Grapevine, KiwiPress ([dual-process FE + API](../webengine/dual-process.md))
15. [Troubleshooting](./seltzer-troubleshooting.md)
16. [Status](./seltzer-status.md) — 0.8.x maturity matrix
17. [Roadmap](./seltzer-roadmap.md) — what closed vs what is still open
18. [Design](./seltzer-design.md) — rationale; most of it is now source

## Status

**0.8.x** (`@citrusworx/seltzer` **0.8.1**). Packaging/DX hygiene on top of the 0.8.0 HTTP core (git-labeled 0.7.0). Versions 0.3–0.7 were never published.

Shipped: object routes, parametric matching, JSON `parse`, `ResponseData` + `send`, named pipeline, default `validate`, `generateRoutes`, CORS/`OPTIONS`, hardened `client`.

Not shipped: HTTPS listen, `app.use`, Zod/full contract validation, form-urlencoded parser, slash-safe client URL join, first-class file/stream responses.

See [Status](./seltzer-status.md) for the area-by-area matrix and [Roadmap](./seltzer-roadmap.md) for what is worth building next.

## Sibling packages

- [Nectarine](../nectarine/README.md) — YAML + `listApiOperations`; Seltzer hosts with `generateRoutes`
- [WebEngine](../webengine/README.md) — kernel + opt-in `startSeltzerFromKernel` ([dual-process FE + API](../webengine/dual-process.md))
- [Sig.js](../sigjs/README.md) / [Juice](../juice/README.md) — consume Seltzer over `fetch`
- [Grapevine](../grapevine/README.md) — provision the machine; does not start Seltzer
- [KiwiPress](../kiwipress/README.md) — WordPress client that stores Seltzer `handler` options
