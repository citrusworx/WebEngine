# @citrusworx/seltzer

Small Node HTTP runtime: object routes, `ResponseData` handlers, and a named request pipeline. Built on Node’s `http` module. No Express. WebEngine and Nectarine are optional, not required.

Requires Node 18+.

## Install

```bash
npm install @citrusworx/seltzer
```

`undici` is an optional peer dependency. Install it only if you set `allowSelfSigned: true` on an outbound `https://` `client` call. Everyday `init().route().listen()` does not need it.

```bash
# only for allowSelfSigned on https
npm install undici
```

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

`listen` also accepts `locals` (available on `ctx.locals`), `bodyLimit`, `cors`, `logger`, and `debug`. CORS is off unless `cors` is set. When it is set, CORS headers and an `OPTIONS` 204 preflight run before the pipeline. Request bodies default to 1 MB (`bodyLimit: 0` is unlimited).

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

`client` is a small `fetch` wrapper for host-to-host calls. Methods take an `Endpoint` (`path`, optional `options.baseUrl`, `options.headers`, `options.allowSelfSigned`):

```ts
import { client, HttpError } from "@citrusworx/seltzer";

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
```

`GET` / `POST` / `PUT` / `PATCH` / `DELETE` share one request path:

- URL is `baseUrl + path` when `baseUrl` is set, otherwise `path`.
- Non-2xx responses throw `HttpError` (`status`, `statusText`, full `body`; the message includes a short body snippet).
- Successful `application/json` (or `+json`) bodies are parsed. Other Content-Types are returned as text. No Content-Type still parses JSON when the body is JSON.
- `204` / `205` and empty bodies resolve to `undefined`.

`allowSelfSigned: true` on an `https://` URL dynamically imports `undici` and uses `Agent({ connect: { rejectUnauthorized: false } })`. That is the only path that needs the optional `undici` peer. HTTP URLs ignore the flag. Prefer a trusted certificate or `NODE_EXTRA_CA_CERTS` when you can.

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

## Development

```bash
yarn workspace @citrusworx/seltzer build
yarn workspace @citrusworx/seltzer typecheck
yarn workspace @citrusworx/seltzer test
```
