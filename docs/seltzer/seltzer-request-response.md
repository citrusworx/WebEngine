# Seltzer Request and Response

How a request becomes bytes on the wire in `@citrusworx/seltzer` **0.8.1**.

This page is the request/response mental model. Routing is [Routing](./seltzer-routing.md). Stages are [Pipeline](./seltzer-pipeline.md). Outbound calls are [Client](./seltzer-client.md).

Every behavior here is from `libraries/seltzer/src/core/seltzer.ts`, `core/response.ts`, and `pipeline/stages.ts`.

## What `listen` actually does

On each incoming request, `listen` applies CORS, answers `OPTIONS` with 204, builds a `PipelineContext`, and `await`s `pipeline.run(ctx)`.

```ts
applyCors(req, res, cors);

if (req.method === "OPTIONS") {
  send(res, { status: 204 });
  return;
}

const ctx: PipelineContext = {
  req,
  res,
  method: req.method ?? "GET",
  path: "",
  query: {},
  params: {},
  body: undefined,
  headers: {},
  locals,
  options: this.config?.options,
};

await this.pipeline.run(ctx);
```

Read that last line twice. The pipeline **awaits** stages and the handler. Thrown errors become JSON 500. The handler’s return value is **not** discarded — `handle` assigns it to `ctx.response`, `response` checks the shape, `send` writes the socket.

There is no `ctx.json`. That helper was removed in 0.4.0 (breaking).

## The context object

`RequestContext` is exported from the package root.

| Field | What it is |
|---|---|
| `req` | Node `IncomingMessage` — escape hatch |
| `res` | Node `ServerResponse` — escape hatch; normal responses should not touch it |
| `method` | Set in `context` from `req.method` |
| `path` | URL pathname (`/notes/1`, no query) |
| `query` | `Record<string, string>` from `URLSearchParams` |
| `params` | Captured `:id` segments after `route` matches |
| `body` | Parsed JSON object, raw string, or `undefined` (GET/HEAD skip the body) |
| `headers` | Lowercased string map |
| `locals` | From `listen({ locals })` |
| `options` | From `.handler(config)` if set |

Pipeline-only fields on `PipelineContext`:

| Field | What it is |
|---|---|
| `route` | Matched `Route` (includes `contract`) |
| `response` | `ResponseData` accumulated toward `send` |

## `ResponseData`

```ts
type ResponseData = {
  status?: number;
  headers?: Record<string, string>;
  body?: unknown;
};
```

Handlers must return this shape (or a Promise of it). `isResponseData` is true only for **plain objects whose keys are a subset of** `status`, `headers`, and `body`. Extra keys fail. Arrays, strings, and `{ ok: true }` fail.

```ts
return { body: { ok: true } };
return { status: 201, headers: { "X-Created": "1" }, body: note };
return { status: 204 }; // no body
```

`status` defaults to `200` in `send`. Object, array, `null`, number, and boolean bodies are `JSON.stringify`d with `Content-Type: application/json` unless you already set that header (any casing). Strings are written as-is (no automatic content type). `Buffer` / `Uint8Array` are written as-is.

## `response()` branding

`generateRoutes` treats `execute` results as payloads unless they were produced by `response()`:

```ts
import { response } from "@citrusworx/seltzer";

execute: ({ params }) => {
  if (params.id === "teapot") {
    return response({ status: 418, body: { error: "teapot" } });
  }
  return products.find((item) => item.id === params.id) ?? null;
};
```

An unbranded `{ body: "copy" }` from `execute` is wrapped again as `{ body: { body: "copy" } }`. Hand-written handlers do **not** need `response()` — they already return `ResponseData`.

## `send`

```ts
function send(res: ServerResponse, data: ResponseData): void
```

Applies defaults and `writeHead` + `end`. No-op if `res.headersSent`. Builtin 404/400/500 paths use the same function.

## Request body (`parse`)

| Method | Body |
|---|---|
| GET / HEAD | skipped (`ctx.body` stays `undefined`) |
| others, empty | `undefined` |
| others, `Content-Type` includes `application/json` | `JSON.parse`; failure → 400 `{ error: "Invalid JSON body" }` |
| others, other content types | UTF-8 string |

There is no size limit and no `application/x-www-form-urlencoded` parser. Add those with `before("validate", …)` or in the handler if you need them.

## Async handlers

`handler` is `(ctx) => ResponseData | Promise<ResponseData>`. The pipeline awaits it.

- `throw new Error("boom")` becomes `{ error: "Internal Server Error", message: "boom" }` at 500.
- Returning a non-`ResponseData` value becomes 500 with a message that handlers must return `{ status?, headers?, body? }`.

You can still `try/catch` in the handler to send a domain-specific 400 instead of a 500.

## `.handler()` options on `ctx`

```ts
app.handler({
  adapter: "node-http",
  options: {
    baseUrl: "http://127.0.0.1:3000",
    headers: { "X-App": "notes" },
    allowSelfSigned: false,
  },
});
```

`ctx.options` is that `options` object. `adapter` is stored on the instance and never read by `listen`. `allowSelfSigned` is never applied to the **inbound** server (plain `http`). The outbound `client` reads the same option shape when you pass an `Endpoint`.

## What must happen before the request is done

The pipeline always reaches builtin `send` unless a previous `send` already wrote headers. Handlers should return `ResponseData` on every branch. Returning `undefined` fails `isResponseData` and becomes 500.

Do not `writeHead` yourself and then return `{ body }` — `send` is a no-op once headers are sent, and the JSON never goes out.

## 0.2.0 vs 0.8.1

| 0.2.0 (`master` docs) | 0.8.1 |
|---|---|
| `ctx.json(data, status?)` writes immediately | gone |
| Handler return discarded; curl hangs | return `ResponseData`; runtime sends |
| You read the body stream | `ctx.body` |
| `ctx.req.url` for query | `ctx.query` |
| Async throw is unhandled | JSON 500 |
| `listen` returns `void` | returns `http.Server` |

## Related

- [Pipeline](./seltzer-pipeline.md)
- [Routing](./seltzer-routing.md)
- [JSON API tutorial](./seltzer-api-tutorial.md)
- [Troubleshooting](./seltzer-troubleshooting.md)
