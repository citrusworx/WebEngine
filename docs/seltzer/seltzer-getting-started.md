# Getting Started With Seltzer

This is the best starting point if you want to use Seltzer the way the library works in **0.10.0**.

After this page, the [JSON API tutorial](./seltzer-api-tutorial.md) is the guided build — health, collection, JSON POST, `/notes/:id`, a generated Nectarine-shaped route, and `client.*` — analogous to [Juice’s page tutorial](../juice/juice-page-tutorial.md).

Build against the API in `libraries/seltzer/src` at 0.10.0, not the 0.2.0 `ctx.json` story.

## What Seltzer is

Seltzer is a small Node `http` listener plus a `fetch` client, with a named request pipeline in between.

It gives you:

- `Seltzer.init()` — construct an instance
- `.route({ method, path, handler, contract? })` — object route, static or `:param`
- `.before(name, stage)` / `.replace(name, stage)` — named pipeline
- `.adapter(config)` — stash options copied onto `ctx.options`. This is not a request listener. Released in 0.10.0 (0.9.0 called this `handler(config)`)
- `.handler()` — Node `(req, res) => void` listener for a host-owned `http.Server` or `https.Server`. Same pipeline as `listen`. Released in 0.10.0. `handler(config)` is a deprecated alias of `adapter(config)`, removed in the next minor after 0.10.0
- `.listen(port, options?)` — `http.createServer(app.handler())` on `127.0.0.1` (pass `host` for any other interface), plus timeout defaults. CORS/`OPTIONS` only when `cors` is set on `init` or `listen`. A field passed to `listen` replaces the `init` value for that server. Returns `http.Server`
- `ResponseData` — `{ status?, headers?, body? }`; the runtime `send`s
- `generateRoutes(operations, { execute })` — `ApiOperation[]` → `Route[]`
- `client.get/post/put/patch/delete` — `fetch` + `HttpError` on non-2xx

It is not Express. There is no `app.use` (that chain is a [non-goal](../../libraries/seltzer/README.md#no-middleware-chain)) and no writing `ctx.json`.

## Install

```bash
yarn add @citrusworx/seltzer@0.10.0
# or
npm install @citrusworx/seltzer@0.10.0
```

Requires Node 18+. The package has no runtime dependencies. `client` uses global `fetch`.

Package version today: **0.10.0** (published 2026-10-21). No-arg `app.handler()` and `app.adapter(config)` shipped in this release. The hardened client (slash-safe join, 30s timeout, no `undici`) shipped in 0.9.0.

## Hello World

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

const server = app.listen(3000);
```

`listen(3000)` binds **127.0.0.1:3000**, not every interface. `curl http://127.0.0.1:3000/` reaches it. A public bind is explicit:

```ts
app.listen(3000, { host: "0.0.0.0" });
```

Timeouts are on: 20s for headers, 30s for the whole request, 5s for idle keep-alive. Override with `headersTimeout`, `requestTimeout`, and `keepAliveTimeout` (`0` disables that timer). `server.close()` stops accepting new connections.

To mount Seltzer on a server you created, including TLS, use `app.handler()` and set those three timeout constants yourself. `listen` does not speak HTTPS. The recipe is [Bring your own server](../../libraries/seltzer/README.md#bring-your-own-server). `app.adapter({ adapter, options })` only stores `ctx.options`. `app.handler(config)` is a deprecated alias of that stash.

In this workspace:

```bash
yarn workspace @citrusworx/seltzer dev
```

That runs `ts-node src/index.ts` per `package.json` — wire `src/example.ts` or your own entry if you want this file to be what starts.

```bash
yarn workspace @citrusworx/seltzer test
```

`curl http://127.0.0.1:3000/` → `[{"message":"Hello World!"}]`.

`curl http://127.0.0.1:3000/missing` → `{"error":"Not Found"}` and 404.

## The mental model

1. Register `{ method, path, handler }` objects. `:id` segments fill `ctx.params`. Static prefixes beat params.
2. On each request, Seltzer runs `parse` → `context` → `route` → `validate` → `idempotency` → `handle` → `response` → `send`.
3. Your handler **returns `ResponseData`**. The runtime writes the socket.
4. Returning a bare `{ ok: true }` is a **500** — wrap it as `{ body: { ok: true } }`.
5. JSON bodies are already on `ctx.body`. Invalid JSON is 400 before the handler.

```text
request → pipeline → handler returns ResponseData → send
```

## The context object

Handlers receive a named `RequestContext` (exported):

```ts
{
  req: IncomingMessage;
  res: ServerResponse;
  method: string;
  path: string;
  query: Record<string, string>;
  params: Record<string, string>;
  body: unknown;
  headers: Record<string, string>;  // lowercased keys
  locals: unknown;                  // from listen({ locals })
  options?: { baseUrl?: string; headers?: Record<string, string> };
}
```

Pipeline stages also see `ctx.route` and `ctx.response`. Handlers should not write `res` for normal JSON.

There is **no** `ctx.json`.

## Query strings and params

```ts
app.route({
  method: "GET",
  path: "/search/:kind",
  handler: (ctx): ResponseData => ({
    body: { kind: ctx.params.kind, q: ctx.query.q ?? null },
  }),
});
```

`GET /search/notes?q=kiwi` → `{ "kind": "notes", "q": "kiwi" }`.

## POST body

```ts
app.route({
  method: "POST",
  path: "/users",
  handler: (ctx): ResponseData => {
    const body = ctx.body as { email?: string } | undefined;
    if (!body?.email) {
      return { status: 400, body: { error: "email required" } };
    }
    return { status: 201, body: { created: body } };
  },
});
```

Send `Content-Type: application/json`. Bad JSON never reaches this handler.

Optional presence check via `contract`:

```ts
app.route({
  method: "POST",
  path: "/users",
  contract: { body: { email: "string.required" } },
  handler: (ctx): ResponseData => ({
    status: 201,
    body: { created: ctx.body },
  }),
});
```

## CORS and locals

```ts
app.listen(3000, {
  locals: { service: "notes" },
  cors: { origin: "http://localhost:5173" },
});
```

`ctx.locals` is that object. With `cors` set, a browser preflight `OPTIONS` is 204 with CORS headers. Omit `cors` and those headers are absent.

## Call it from the Seltzer client

```ts
import { client, HttpError } from "@citrusworx/seltzer";

try {
  const created = await client.post(
    {
      path: "/users",
      endpoint: "/users",
      options: { baseUrl: "http://127.0.0.1:3000" },
    },
    { email: "dev@citrusworx.com" },
  );
} catch (err) {
  if (err instanceof HttpError) {
    // 400 / 404 / 500 from the server
  }
}
```

`endpoint` is required by the type and ignored by the client. The URL joins `baseUrl` and `path` with one slash and keeps a base path. The default deadline is 30 seconds. The client does not retry.

## What to ignore on day one

- [Design overview](./seltzer-design.md) as if it were unimplemented — most of it is source now
- [Courses](./courses.md) and [exercises](./exercises/README.md) — those rebuild internals
- `ctx.json`, manual `for await` JSON parsers, query-string stand-ins for `:id`
- Express `app.use` / `app.get`

## Where to go next

- [JSON API tutorial](./seltzer-api-tutorial.md) — the guided product build
- [Request and response](./seltzer-request-response.md)
- [Routing](./seltzer-routing.md)
- [Pipeline](./seltzer-pipeline.md)
- [Generate routes](./seltzer-generate.md)
- [Client](./seltzer-client.md)
- [Examples](./seltzer-examples.md)
- [Status](./seltzer-status.md)
