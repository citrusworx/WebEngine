# @citrusworx/seltzer

Small Node HTTP runtime: object routes, `ResponseData` handlers, and a named request pipeline. Built on Node’s `http` module. No Express. WebEngine and Nectarine are optional, not required. What this package will not grow is [Non-goals](#non-goals).

Requires Node 18+. No runtime dependencies. The outbound client uses global `fetch` only.

## Install

```bash
npm install @citrusworx/seltzer@0.9.0
```

Documented version: `0.9.0`.

## Names this README checks

<!-- seltzer-docs-drift -->

| Name | Kind |
| --- | --- |
| `Seltzer` | export |
| `client` | export |
| `createClient` | export |
| `generateRoutes` | export |
| `validationError` | export |
| `response` | export |
| `HttpError` | export |
| `TimeoutError` | export |
| `AbortError` | export |
| `NetworkError` | export |
| `UrlError` | export |
| `UnboundOperationsError` | export |
| `host` | listen option |
| `bodyLimit` | listen option |
| `headersTimeout` | listen option |
| `requestTimeout` | listen option |
| `keepAliveTimeout` | listen option |
| `cors` | listen option |
| `logger` | listen option |
| `debug` | listen option |
| `locals` | listen option |
| `onListening` | listen option |
| `origin` | cors option |
| `methods` | cors option |
| `headers` | cors option |
| `credentials` | cors option |
| `maxAge` | cors option |
| `allowAbsoluteUrl` | client option |
| `timeout` | client option |
| `signal` | client option |
| `query` | client option |
| `handler` | app method |
| `DEFAULT_BODY_LIMIT_BYTES` | export |
| `DEFAULT_LISTEN_HOST` | export |
| `DEFAULT_HEADERS_TIMEOUT_MS` | export |
| `DEFAULT_REQUEST_TIMEOUT_MS` | export |
| `DEFAULT_KEEP_ALIVE_TIMEOUT_MS` | export |

<!-- /seltzer-docs-drift -->

## Usage

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

app.route({
    method: "POST",
    path: "/items",
    handler: (ctx): ResponseData => ({
        status: 201,
        headers: { "X-Created": "1" },
        body: { ok: true, path: ctx.path },
    }),
});

app.listen(3000);
```

Handlers return `ResponseData` (`{ status?, headers?, body? }`). The runtime writes the HTTP response. There is no `ctx.json` or `ctx.send` helper; calling either throws. Writing `ctx.res` (`writeHead`, `end`, `setHeader`, assignment) throws. Bare objects, arrays, and strings are not wrapped — return `{ body: ... }`. A wrong return is **500** and is logged with the route and the returned value.

`status` defaults to `200`. Objects, arrays, numbers, booleans, and `null` are JSON with `Content-Type: application/json`. Strings are `text/plain; charset=utf-8`. `Buffer` and `Uint8Array` are raw bytes with `Content-Type: application/octet-stream`. Set `headers["Content-Type"]` (any casing) to override. Status **204** and **304**, and **HEAD** requests, send no body. A thrown error is **500** `{ error: "Internal Server Error" }` with no message and no stack. The error is logged. Pass `listen(port, { debug: true })` to include the stack in that log only. `logger` defaults to `console.error`.

`listen` returns the Node `http.Server`. The default bind is `127.0.0.1`. Pass `host: "0.0.0.0"` (or `"::"`) to accept connections from other machines. Header, request, and keep-alive timeouts default to 20s, 30s, and 5s (`0` disables that timer). `server.close()` stops accepting; idle keep-alive sockets delay the callback until `keepAliveTimeout` unless you also call `server.closeIdleConnections()`.

`init` and `listen` accept `locals` (available on `ctx.locals`), `bodyLimit`, `cors`, `logger`, and `debug`. A field passed to `listen` replaces the `init` value for that server. An omitted field keeps the `init` value. `cors` is replaced as a whole object, not merged field by field. CORS is off unless `cors` is set. When it is set, CORS headers and an `OPTIONS` 204 preflight run before the pipeline. Request bodies default to 1 MB (`bodyLimit: 0` is unlimited). `credentials: true` with `origin: "*"` throws at `init` when you pass it there, and at `listen` when that call passes it. `host`, the port, and the three timeouts stay on `listen`. They are not `init` options.

## Bring your own server

`app.handler()` with no arguments returns a Node request listener, `(req, res) => void`. `listen` is that listener on an `http.Server` Seltzer creates, plus the loopback bind and the timeout defaults. Call `handler()` when the host already has a server, including TLS:

```ts
import https from "node:https";
import {
    Seltzer,
    DEFAULT_HEADERS_TIMEOUT_MS,
    DEFAULT_KEEP_ALIVE_TIMEOUT_MS,
    DEFAULT_REQUEST_TIMEOUT_MS,
} from "@citrusworx/seltzer";

const app = Seltzer.init({
    cors: { origin: "https://app.example" },
    bodyLimit: 1_048_576,
});

app.route({
    method: "GET",
    path: "/",
    handler: () => ({ body: { ok: true } }),
});

const server = https.createServer(tlsOptions, app.handler());
server.headersTimeout = DEFAULT_HEADERS_TIMEOUT_MS;
server.requestTimeout = DEFAULT_REQUEST_TIMEOUT_MS;
server.keepAliveTimeout = DEFAULT_KEEP_ALIVE_TIMEOUT_MS;
server.listen(443, "127.0.0.1");
```

The same listener works on `http.createServer(app.handler())`. It runs the same pipeline as `listen` (`parse` → `context` → `route` → `validate` → `handle` → `response` → `send`), including the body limit, CORS / `OPTIONS` 204, `logger`, `debug`, and strict `ResponseData` checks. Routes registered after `handler()` still run. The listener reads `bodyLimit`, `cors`, `logger`, `debug`, and `locals` from `init`. It does not read a later `listen` override, and it does not set timeouts.

A host-owned server owns its timeouts. Seltzer does not change them. Copy the defaults above when you want the same 20s / 30s / 5s timers `listen` applies. `0` disables that timer on `listen`; on your server, assign `0` yourself. `server.close()` is also yours.

`app.handler(config)` is a different call. It stores `{ adapter, options }` and returns the app. `options` is copied onto `ctx.options`. `adapter` is unused inbound. Passing a config object never returns a listener. The no-arg call never stores config. KiwiPress uses the config call to stash a base URL. It does not mount HTTP.

`handleRequest` stays private. There is no method that accepts an already-built `http.Server`. Pass the listener into `http.createServer` or `https.createServer` instead.

This listener is in source for the unreleased 0.10.0 minor. `package.json` and the install pin above stay at 0.9.0 until that publish. The published 0.9.0 tarball has no no-arg `handler()`.

## Pipeline

Each request runs through a named pipeline:

`parse` → `context` → `route` → `validate` → `handle` → `response` → `send`

| Stage | Responsibility |
| --- | --- |
| `parse` | Read the body (JSON or raw UTF-8 string). Invalid JSON → 400. Empty body → `undefined`. Over `bodyLimit` → 413. GET/HEAD skip the body. Non-JSON content types are not 415. |
| `context` | Set `method`, `path`, `query`, and `headers` on ctx. |
| `route` | Match a registered route and fill `params` (`decodeURIComponent`). No path match → 404. Known path, wrong method → 405 + `Allow`. Malformed `%` encoding in a param → 400. |
| `validate` | If `ctx.route.contract.body` has `.required` keys, they must be present and non-empty on `ctx.body`. That is presence only (a number counts). Failure → 400 `{ error: "Missing required field: …" }` or `{ error: "Request body must be an object" }`. No specs → no-op. Does not set `ctx.valid` and does not change `ctx.body`. |
| `handle` | Call the matched handler. Handlers must return `ResponseData`. |
| `response` | Reject non-`ResponseData` handler results with 500 and a log line. |
| `send` | Write the HTTP response via `send()`. Cannot be replaced. |

`before(name, stage)` inserts immediately before a named builtin. `replace(name, stage)` swaps that builtin. `replace("send")` throws: the runtime is the only writer. Returning `ResponseData` from a stage skips the rest of the pipeline and jumps to `send`. Any other returned value is 500. Stages mutate the shared context in place; return `void`/`undefined` to continue.

```ts
import { Seltzer } from "@citrusworx/seltzer";
import type { ResponseData, Stage } from "@citrusworx/seltzer";

const requireAuth: Stage = (ctx) => {
    if (!ctx.headers.authorization) {
        return { status: 401, body: { error: "Unauthorized" } };
    }
};

const app = Seltzer.init().before("handle", requireAuth);
// Optional: app.replace("validate", customValidate);

app.route({
    method: "GET",
    path: "/secret",
    handler: (): ResponseData => ({ body: { ok: true } }),
});
```

Hand-written routes can declare the same field specs the default validator understands (`email: string.required` means “present and non-empty”):

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

`init().route().listen()` is the supported shape. A route with `contract.body` `.required` keys turns on presence checks. `listen` binds `127.0.0.1`, applies the default timeouts and the 1 MB body limit, and leaves CORS off until you pass `cors`.

## Richer validation (`replace("validate")`)

Seltzer does not depend on Zod, or on any schema library. Install one in the app if you want it, then swap the builtin. `replace("validate", stage)` **removes** the `.required` checks. The replacement receives `ctx` after `parse`, `context`, and `route`.

- Return `undefined` to continue.
- Return `validationError(issues)` for the standard 400: `{ error: "Validation failed", issues: [{ path, message }] }`. `path` is `(string | number)[]` (`[]`, `["email"]`, `["items", 0, "qty"]`), the same shape as Zod's `issue.path`. A string is not a path.
- Put parsed values on `ctx.valid` (`{ body?, params?, query? }`). Leave `ctx.body`, `ctx.params`, and `ctx.query` as the raw pipeline input.
- Any other return is 500 and is logged. A throw is 500 `{ error: "Internal Server Error" }` with no message, and is logged (`debug: true` adds the stack to the log only).

`Route.contract` and `generateRoutes` carry YAML strings (`email: "string.required"`), not schemas. Dispatch inside the replacement on `` `${ctx.route.method} ${ctx.route.path}` `` (the pattern, not `ctx.path`) or on `ctx.route.contract.name`. A route with no schema should return `undefined`.

```ts
import { z } from "zod"; // application dependency — not a dependency of @citrusworx/seltzer
import { Seltzer, validationError, type ResponseData } from "@citrusworx/seltzer";

const JoinWaitlist = z.object({
    email: z.string().email(),
    name: z.string().optional(),
});

const app = Seltzer.init().replace("validate", (ctx) => {
    const parsed = JoinWaitlist.safeParse(ctx.body);
    if (!parsed.success) {
        return validationError(
            parsed.error.issues.map((issue) => ({
                path: issue.path.filter(
                    (part): part is string | number =>
                        typeof part === "string" || typeof part === "number",
                ),
                message: issue.message,
            })),
        );
    }

    ctx.valid = { body: parsed.data };
});

app.route({
    method: "POST",
    path: "/api/waitlist",
    handler: (ctx): ResponseData => ({
        status: 201,
        body: ctx.valid?.body,
    }),
});
```

`ctx.body` is still the raw parsed JSON. `ctx.valid.body` is the schema output. The default stage never fills `ctx.valid`.

## Outbound HTTP `client`

`client` is a small global-`fetch` wrapper. It does not retry, and it does not load `undici`. `createClient({ timeout, baseUrl, headers })` builds another client; `client` is `createClient()` with a 30s timeout (`DEFAULT_CLIENT_TIMEOUT_MS`, the same number as the server `requestTimeout`). `options.timeout` overrides that per call. `0` disables the timer.

```ts
import { client, createClient, HttpError, TimeoutError, AbortError, NetworkError } from "@citrusworx/seltzer";

const posts = await client.get({
    path: "/posts",
    endpoint: "/posts",
    options: {
        baseUrl: "https://example.com/wp-json/wp/v2",
        headers: { Authorization: "Bearer …" },
    },
});

await client.post(
    { path: "/posts", endpoint: "/posts", options: { baseUrl } },
    { title: "Hello" },
);

const api = createClient({ baseUrl: "http://127.0.0.1:3000/api/v1", timeout: 5_000 });
await api.get({ path: "users", endpoint: "users" });
```

- URL join keeps one slash at the boundary and keeps a base path (`/api/v1` + `users` → `/api/v1/users`).
- An absolute `path` throws `UrlError` unless `options.allowAbsoluteUrl` is set.
- `options.query` is encoded (`null` / `undefined` omitted, arrays repeat the key).
- Non-2xx throws `HttpError` (`status`, `headers`, parsed `body`).
- A deadline throws `TimeoutError`. The caller's `signal` throws `AbortError` (it wins if both fire). A dropped connection throws `NetworkError`.
- JSON (`application/json` and `+json`) is parsed. `text/*` is a string. Anything else is a `Uint8Array`. No Content-Type sniffs JSON, then a string. `204`, `205`, and `HEAD` are `undefined`.
- Objects are sent as JSON, strings as text, `Uint8Array` / `Buffer` as bytes.
- Put `Idempotency-Key` in `headers` if you need it. The client will not repeat the request, and Seltzer does not store idempotency keys.

## Generate routes from `ApiOperation[]`

`generateRoutes(operations, { execute })` maps a flat operation list onto object-based `Route`s. You can build that list by hand — no YAML compiler required.

```ts
import { Seltzer, generateRoutes, type ApiOperation, type ResponseData } from "@citrusworx/seltzer";

const operations: ApiOperation[] = [
    {
        resource: "product",
        crud: "read",
        name: "allProducts",
        method: "GET",
        path: "/api/products",
        query: "allProducts",
    },
    {
        resource: "product",
        crud: "read",
        name: "productById",
        method: "GET",
        path: "/api/products/:id",
        query: "productById",
    },
    {
        resource: "waitlist",
        crud: "create",
        name: "joinWaitlist",
        method: "POST",
        path: "/api/waitlist",
        query: "joinWaitlist",
        body: { name: "string", email: "string.required" },
    },
];

const app = Seltzer.init();
const products = [
    { id: "stinkrat", name: "StinkRat" },
    { id: "daw", name: "DAW" },
];

for (const route of generateRoutes(operations, {
    execute: ({ query, params, body }) => {
        if (query === "productById") {
            return products.find((item) => item.id === params.id) ?? null;
        }
        if (query === "joinWaitlist") {
            return { ok: true, email: (body as { email?: string }).email };
        }
        return products;
    },
    notFound: (): ResponseData => ({ status: 404, body: { error: "Not found" } }),
})) {
    app.route(route);
}
```

- `query` is a named-query key passed to `execute`, not the HTTP search string (`ctx.query`).
- `generateRoutes` copies `resource`, `name`, and `body` field specs onto `Route.contract`. The default `validate` stage enforces `.required` keys and still leaves `ctx.valid` unset; reads with no body specs stay a no-op. A replacement that dispatches on `contract.name` does not also run those presence checks.
- Handlers read `ctx.params` / `ctx.query` / `ctx.body`, call host `execute`, and return `ResponseData`.
- `execute` may return a payload (`{ body }`), `response({ status?, headers?, body? })` to send as-is, or `null`/`undefined` (default 404). Unbranded `{ body }` / `{}` objects are treated as payloads.
- Static-prefix paths (`/catalog/:catalog`, `/slug/:slug`) register before `:id`. `matchRoute` also prefers the most specific match, so `/items/new` wins over `/items/:id` regardless of registration order.

- `handlers[name]` binds that operation. `execute` binds every selected name the map does not set. A name with neither throws `UnboundOperationsError` at `generateRoutes` time (`name method path`, one per line). `unbound: "notImplemented"` registers those routes as 501 `{ error: "Not Implemented" }` instead. `filter` drops operations before that check. A named handler wins over `execute`.

### YAML → `listApiOperations` → `generateRoutes` → `listen`

Seltzer does not import Nectarine. Flatten elsewhere and pass the array. `listApiOperations` output is the same shape as `ApiOperation`.

```ts
import { listApiOperations, loadYaml } from "@citrusworx/nectarine/config";
import { Seltzer, generateRoutes, response, validationError } from "@citrusworx/seltzer";

const operations = listApiOperations("product", loadYaml("./productAPI.yml"));
const documents: Array<{ id: string; name: string; catalog?: string }> = [];

const app = Seltzer.init().replace("validate", (ctx) => {
    if (ctx.route?.contract?.name !== "newProduct") {
        return;
    }
    const body = ctx.body;
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
        return validationError([{ path: [], message: "Expected an object" }]);
    }
    const name = (body as { name?: unknown }).name;
    if (typeof name !== "string" || name.trim() === "") {
        return validationError([{ path: ["name"], message: "Required" }]);
    }
    ctx.valid = { body: { ...(body as object), name: name.trim() } };
});

for (const route of generateRoutes(operations, {
    filter: (operation) =>
        operation.name === "allProducts" ||
        operation.name === "productById" ||
        operation.name === "newProduct",
    handlers: {
        allProducts: () => documents,
        productById: ({ params }) => documents.find((item) => item.id === params.id) ?? null,
        newProduct: ({ ctx }) => {
            const created = ctx.valid?.body as { id: string; name: string };
            documents.push(created);
            return response({ status: 201, body: { id: created.id, payload: created } });
        },
    },
})) {
    app.route(route);
}

app.listen(3000); // 127.0.0.1
```

A handler payload is **200**. `response({ status: 201, body })` is the create status. `response({ status: 204 })` is a delete with no body. Replacing `validate` turns off `.required`; without `replace`, a missing `string.required` field is 400 `{ error: "Missing required field: …" }` and the handler does not run. Leave a name out of `handlers` and omit `execute` to throw, or pass `unbound: "notImplemented"` for 501.

YAML layout is `resource → crud → operationName → api: { method, endpoint, query?, body? }`. Nectarine maps `endpoint` to `ApiOperation.path`. `listApiOperations` lives in `@citrusworx/nectarine/config` (also `@citrusworx/nectarine/api`). Nectarine does not generate `Route`s. The worked fixture and HTTP test live in WebEngine, which already depends on both. Full notes: [Generate routes](../../docs/seltzer/seltzer-generate.md).

## Non-goals

Seltzer stays a small HTTP runtime. The list below is a decision, not a backlog. The maturity matrix links here from [Status](../../docs/seltzer/seltzer-status.md).

### No middleware chain

Order should stay visible. The extension model is the named pipeline (`parse` → `context` → `route` → `validate` → `handle` → `response` → `send`) with `before` and `replace`. An `app.use` chain would hide that order in registration and `next()`. Put auth, logging, and extra checks on a named stage. See [Pipeline](../../docs/seltzer/seltzer-pipeline.md) and [Design](../../docs/seltzer/seltzer-design.md#why-pipelines-were-chosen-over-middleware-and-hooks).

### No built-in HTTPS listen

`listen` always builds a Node `http.Server` with `http.createServer` and returns that server. It does not accept TLS options and it does not call `https.createServer`. Terminate TLS at a reverse proxy, or mount the no-arg listener yourself: `https.createServer(tlsOptions, app.handler())`. Timeouts on that server are yours. See [Bring your own server](#bring-your-own-server). `handleRequest` stays private.

### No form or multipart parsing

Non-JSON bodies arrive as a raw UTF-8 string ([release gate 2](../../docs/webengine/library-release-gates.md)). Read `application/x-www-form-urlencoded` in the handler with `URLSearchParams` (no dependency). The recipe is [Form urlencoded](../../docs/seltzer/seltzer-request-response.md#form-urlencoded), and `libraries/seltzer/src/core/form-urlencoded.recipe.test.ts` runs it against `listen` on `127.0.0.1`. Multipart and other binary inbound bytes are out of scope: this parser is text, and that string is not a file upload API.

### No templating, sessions, cookies, or static files

Those belong to the host app or to another CitrusWorx library. Juice and Sig own the browser. The host owns files, cookies, and any session store. A Seltzer handler returns `ResponseData` for an API response.

### No client retries

The caller owns retry policy. `client` makes one attempt: a 5xx, a timeout, and a dropped connection are not repeated ([release gate 6](../../docs/webengine/library-release-gates.md)). Call again yourself only when that is safe. A server-side idempotency stage is planned and is not in this package; `Idempotency-Key` is only a header you can send. See [Client](../../docs/seltzer/seltzer-client.md#what-is-not-here).

### No ORM or database layer

Queries and migrations belong to [Nectarine](../../docs/nectarine/README.md) and to the host that calls them from a handler or from `generateRoutes` `execute`. Seltzer does not open a database. See [Integration](../../docs/seltzer/seltzer-integration.md#nectarine).

### Not yet: streaming responses and WebSockets

Streaming responses and WebSockets are absent today. That absence is **Not yet**: a later design can add them. It is not a decision that they will never exist. A handler body is still a string, a JSON value, or a `Buffer` / `Uint8Array`. Returning a `Readable` does not stream, and there is no socket upgrade API. See [Roadmap](../../docs/seltzer/seltzer-roadmap.md) and the course note on [streaming](../../docs/seltzer/http-course/11-future-design.md#f-proposed-streaming-responses-and-better-protocol-edges).

### Zero external dependencies

Zero runtime dependencies is a design stance in the WebEngine split: a library owns one capability and does not pull another framework in with it ([why WebEngine exists](../../docs/webengine/README.md#why-it-exists)). `@citrusworx/seltzer` has no `dependencies`. Node `http` and global `fetch` are the platform. A schema library or a TLS helper stays in the app when that app wants one. `typescript` and `vitest` in this repo are dev dependencies, not part of the published runtime.

## Development

```bash
yarn workspace @citrusworx/seltzer build
yarn workspace @citrusworx/seltzer typecheck
yarn workspace @citrusworx/seltzer test
```
