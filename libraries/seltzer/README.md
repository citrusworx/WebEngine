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

Handlers return `ResponseData` (`{ status?, headers?, body? }`). The runtime writes the HTTP response. There is no writing `ctx.json` helper. Bare objects, arrays, and strings are not wrapped — return `{ body: ... }`.

`status` defaults to `200`. Object and array bodies are JSON-serialized with `Content-Type: application/json` unless you set that header yourself.

`listen` accepts optional `locals` (available on `ctx.locals`) and `cors`. CORS headers and `OPTIONS` 204 run before the pipeline.

## Pipeline

Each request runs through a named pipeline:

`parse` → `context` → `route` → `validate` → `handle` → `response` → `send`

| Stage | Responsibility |
| --- | --- |
| `parse` | Read the body (JSON or raw). Invalid JSON → 400. GET/HEAD skip the body. |
| `context` | Set `method`, `path`, `query`, and `headers` on ctx. |
| `route` | Match a registered route and fill `params`. No match → 404. |
| `validate` | If `ctx.route.contract.body` has `.required` keys, they must be present and non-empty on `ctx.body`. Failure → 400. No specs → no-op. |
| `handle` | Call the matched handler. Handlers must return `ResponseData`. |
| `response` | Reject non-`ResponseData` handler results with 500. |
| `send` | Write the HTTP response via `send()`. |

`before(name, stage)` inserts immediately before a named builtin. `replace(name, stage)` swaps that builtin. Returning `ResponseData` from a stage skips the rest of the pipeline and jumps to `send`. Stages mutate the shared context in place; return `void`/`undefined` to continue.

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

`init().route().listen()` matches 0.4.0 behavior unless a route declares `contract.body` with `.required` keys.

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
- `generateRoutes` copies `resource`, `name`, and `body` field specs onto `Route.contract`. The default `validate` stage enforces `.required` keys; reads with no body specs stay a no-op.
- Handlers read `ctx.params` / `ctx.query` / `ctx.body`, call host `execute`, and return `ResponseData`.
- `execute` may return a payload (`{ body }`), `response({ status?, headers?, body? })` to send as-is, or `null`/`undefined` (default 404). Unbranded `{ body }` / `{}` objects are treated as payloads.
- Static-prefix paths (`/catalog/:catalog`, `/slug/:slug`) register before `:id`. `matchRoute` also prefers the most specific match, so `/items/new` wins over `/items/:id` regardless of registration order.

### Optional: flatten from Nectarine YAML

If you already use Nectarine `*API.yml`, flatten with `listApiOperations` and pass the same `ApiOperation[]` into `generateRoutes`. Do not duplicate that flatten here.

```ts
import { listApiOperations } from "@citrusworx/nectarine/config";
import { generateRoutes } from "@citrusworx/seltzer";

const operations = listApiOperations("product", product.api).filter(
    (operation) => operation.crud === "read" && operation.method === "GET",
);

const routes = generateRoutes(operations, {
    execute: ({ query, params, ctx }) => {
        if (query === "productById") {
            return ctx.locals.products.find((item) => item.id === params.id) ?? null;
        }
        return ctx.locals.products;
    },
});
```

YAML layout is `resource → crud → operationName → api: { method, endpoint, query?, body? }`. Nectarine maps `endpoint` to `ApiOperation.path`. `listApiOperations` lives in `@citrusworx/nectarine/config` (also `@citrusworx/nectarine/api`). Nectarine does not generate `Route`s; hosts that want richer contracts can `replace("validate", …)`.

## Development

```bash
yarn workspace @citrusworx/seltzer build
yarn workspace @citrusworx/seltzer typecheck
yarn workspace @citrusworx/seltzer test
```
