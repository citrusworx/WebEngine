# Seltzer Request and Response

How a request becomes bytes on the wire in `@citrusworx/seltzer` **0.8.1**.

This page is the request/response mental model. Routing is [Routing](./seltzer-routing.md). Stages are [Pipeline](./seltzer-pipeline.md). Outbound calls are [Client](./seltzer-client.md).

Every behavior here is from `libraries/seltzer/src/core/seltzer.ts`, `core/response.ts`, and `pipeline/stages.ts`.

## What `listen` actually does

On each incoming request, `listen` applies CORS **only when `cors` was configured**. A configured `OPTIONS` preflight is 204 and returns. Every other request builds a `PipelineContext` and `await`s `pipeline.run(ctx)`.

```ts
if (cors) {
  applyCors(req, res, cors);
  if (req.method === "OPTIONS") {
    send(res, { status: 204 });
    return;
  }
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
  bodyLimit,
};

await this.pipeline.run(ctx);
```

Read that last line twice. The pipeline **awaits** stages and the handler. Thrown errors become a generic JSON 500. The handler’s return value is **not** discarded — `handle` assigns it to `ctx.response`, `response` checks the shape, `send` writes the socket.

There is no `ctx.json` and no `ctx.send`. Both were removed. Calling either throws. Writing `ctx.res` throws. `replace("send")` throws. The runtime is the only writer.

## The context object

`RequestContext` is exported from the package root.

| Field | What it is |
|---|---|
| `req` | Node `IncomingMessage`. Read the socket or raw headers. The body stream is already consumed. Not a response API |
| `res` | Node `ServerResponse`. Reads work. `writeHead`, `end`, `write`, `setHeader`, and assignment throw while a handler or hook runs |
| `method` | Set in `context` from `req.method` |
| `path` | URL pathname (`/notes/1`, no query) |
| `query` | `Record<string, string>` from `URLSearchParams` |
| `params` | Captured `:id` segments after `route` matches |
| `body` | Parsed JSON value, raw UTF-8 string, or `undefined` (GET/HEAD skip the body; empty bodies are `undefined`) |
| `headers` | Lowercased string map |
| `locals` | From `listen({ locals })` |
| `options` | From `.handler(config)` if set |

Pipeline-only fields on `PipelineContext`:

| Field | What it is |
|---|---|
| `route` | Matched `Route` (includes `contract`) |
| `response` | `ResponseData` accumulated toward `send` |
| `bodyLimit` | Byte cap from `listen`. `0` is unlimited. Handlers can ignore it |

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

`status` defaults to `200` in `send`. Headers you set are copied through.

| `body` | Wire | Default `Content-Type` |
|---|---|---|
| omitted / `undefined` | no body | none |
| string | the string, UTF-8 | `text/plain; charset=utf-8` |
| object, array, number, boolean, `null` | `JSON.stringify` | `application/json` |
| `Buffer` or `Uint8Array` | raw bytes | `application/octet-stream` |

An existing `Content-Type` header (any casing) wins. Other headers and `status` are written as given. Status **204** and **304** drop the body and do not invent a content type from it. **HEAD** uses the same headers a GET would, including `Content-Length` of the encoded body, and sends no bytes.

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

Applies defaults and `writeHead` + `end`. No-op if `res.headersSent`. Builtin 404/400/500 paths use the same function. `send(res, data, { head: true })` writes headers and no body.

## Request body (`parse`)

| Method | Body |
|---|---|
| GET / HEAD | skipped (`ctx.body` stays `undefined`) |
| others, empty | `undefined` (not a JSON parse error) |
| others, `Content-Type` includes `application/json` | `JSON.parse`; failure → 400 `{ error: "Invalid JSON body" }` |
| others, any other content type, or no content type | UTF-8 string. Not 415. Not parsed as a form |

`application/x-www-form-urlencoded` and multipart bodies stay strings. Parsing them into fields is still Draft. `+json` types that do not contain the substring `application/json` are strings too.

The default limit is 1 MB (`1048576` bytes, `DEFAULT_BODY_LIMIT_BYTES`). `listen({ bodyLimit })` overrides it. `0` means unlimited. A `Content-Length` over the limit, or chunks whose running total passes it, is **413** `{ error: "Payload Too Large" }`. Seltzer does not keep reading that body, and the handler does not run. A single socket chunk that already exceeds the limit is rejected without parsing, which is as early as the chunk can be seen.

## Async handlers

`handler` is `(ctx) => ResponseData | Promise<ResponseData>`. The pipeline awaits it.

- `throw new Error("boom")` becomes `{ error: "Internal Server Error" }` at 500. The body has no `message` and no stack. The log line includes `boom`. The stack is added to that line only when `listen` was passed `debug: true`.
- Returning a non-`ResponseData` value becomes 500 with a message that handlers must return `{ status?, headers?, body? }`. The same log line names the route and the returned value (`undefined`, a bare object, an array, a string, a wrong shape).

`listen({ logger })` receives those lines. The default is `console.error`. One argument, one string. A throwing logger does not change the HTTP response.

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

The pipeline always reaches builtin `send`. Handlers should return `ResponseData` on every branch. Returning `undefined` fails `isResponseData`, becomes 500, and is logged.

Do not `writeHead` yourself. That call throws, the handler’s return is discarded, and the client gets the generic 500. Put headers on `ResponseData`.

## 0.2.0 vs 0.8.1

| 0.2.0 (`master` docs) | 0.8.1 |
|---|---|
| `ctx.json(data, status?)` writes immediately | gone; calling it throws |
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
