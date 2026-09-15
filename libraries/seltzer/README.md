# @citrusworx/seltzer

An execution environment library for the CitrusWorx ecosystem.

Handlers return `ResponseData`. The runtime writes the HTTP response — there is no writing `ctx.json` helper. Bare objects, arrays, and strings are not wrapped; return `{ body: ... }`.

Each request runs through a named pipeline:

`parse` → `context` → `route` → `validate` → `handle` → `response` → `send`

`validate` enforces `.required` keys from `Route.contract.body` (YAML `email: string.required`) on `ctx.body`. Routes without body specs are unchanged. Insert custom stages with `before(name, stage)`. Swap a builtin — including `validate` for Nectarine contracts — with `replace(name, stage)`. Returning `ResponseData` from a stage skips the rest of the pipeline and jumps to `send`.

Apps that only use `init().route().listen()` keep the same behavior as 0.4.0 unless a route declares `contract.body`.

## Install

```bash
npm install @citrusworx/seltzer
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

`status` defaults to `200`. Object and array bodies are JSON-serialized with `Content-Type: application/json` unless you set that header yourself.

## Outbound HTTP `client`

Hosts (KiwiPress-style outbound calls) can use `client` instead of raw `fetch`. Methods take an `Endpoint` (`path`, optional `options.baseUrl`, `options.headers`, `options.allowSelfSigned`):

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
- Non-2xx responses throw `HttpError` (`status`, `statusText`, full `body`, message includes a short body snippet) instead of calling `.json()` on the error payload.
- Successful `application/json` (or `+json`) bodies are parsed. Other Content-Types are returned as text. No Content-Type still parses JSON when the body is JSON.
- `204` / `205` and empty bodies resolve to `undefined`.

`allowSelfSigned: true` on an `https://` URL uses the same Node pattern as KiwiPress `requestWordPress`: a dynamic `undici` `Agent({ connect: { rejectUnauthorized: false } })`. Install `undici` in the host if you need that path. HTTP URLs ignore the flag. Prefer a trusted certificate or `NODE_EXTRA_CA_CERTS` when you can.

## Pipeline stages

| Stage | Responsibility |
| --- | --- |
| `parse` | Read the body (JSON or raw). Invalid JSON → 400. GET/HEAD skip the body. |
| `context` | Set `method`, `path`, `query`, and `headers` on ctx. |
| `route` | Match a registered route and fill `params`. No match → 404. |
| `validate` | If `ctx.route.contract.body` has `.required` keys, they must be present and non-empty on `ctx.body`. Failure → 400. No specs → no-op. |
| `handle` | Call the matched handler. Handlers must return `ResponseData`. |
| `response` | Reject non-`ResponseData` handler results with 500. |
| `send` | Write the HTTP response via `send()`. |

CORS headers and `OPTIONS` 204 are applied before the pipeline, same as 0.4.0.

### Inserting or replacing a stage

`before(name, stage)` inserts immediately before the named builtin stage. `replace(name, stage)` swaps that builtin (Nectarine hangs full contract checks with `replace("validate", …)`). Auth-style early exits return `ResponseData`:

```ts
import { Seltzer } from "@citrusworx/seltzer";
import type { ResponseData, Stage } from "@citrusworx/seltzer";

const requireAuth: Stage = (ctx) => {
    if (!ctx.headers.authorization) {
        return { status: 401, body: { error: "Unauthorized" } };
    }
};

const app = Seltzer.init().before("handle", requireAuth);
// Nectarine: app.replace("validate", nectarineValidate);

app.route({
    method: "GET",
    path: "/secret",
    handler: (): ResponseData => ({ body: { ok: true } }),
});
```

Hand routes can declare the same YAML field specs the default validator understands:

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

Stages mutate the shared context in place. Return `void`/`undefined` to continue.

## Generate routes from Nectarine `*API.yml`

Seltzer maps flattened operations onto object-based `Route`s. Flatten with Nectarine — do not duplicate `listApiOperations` here.

```ts
import { listApiOperations } from "@citrusworx/nectarine/config";
import { generateRoutes, type ResponseData } from "@citrusworx/seltzer";

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
    notFound: (): ResponseData => ({ status: 404, body: { error: "Product not found" } }),
});
```

- YAML layout: `resource → crud → operationName → api: { method, endpoint, query?, body? }`. Nectarine maps `endpoint` to `ApiOperation.path`.
- `query` is the named-query key, not the HTTP search string (`ctx.query`).
- `generateRoutes` copies `resource`, `name`, and `body` field specs onto `Route.contract`. The default `validate` stage enforces `.required` keys; GET reads with no body specs stay no-op.
- Handlers read `ctx.params` / `ctx.query` / `ctx.body`, call host `execute`, and return `ResponseData`. There is no writing `ctx.json`.
- `execute` may return a payload (`{ body }`), `response({ status?, headers?, body? })` to send as-is, or `null`/`undefined` (default 404). Unbranded `{ body }` / `{}` objects are treated as payloads.
- `generateRoutes` registers static-prefix paths (`/catalog/:catalog`, `/slug/:slug`) before `:id`. `matchRoute` also prefers the most specific match, so `/items/new` wins over `/items/:id` regardless of registration order.
- Uses the default pipeline (`parse` → `…` → `send`) and `ResponseData`. Hosts/Nectarine swap builtin `validate` with `replace("validate", …)`; `before()` still inserts ahead of it.
- Nectarine does not generate `Route`s. `listApiOperations` lives in `@citrusworx/nectarine/config` (also `@citrusworx/nectarine/api`).

Blackwater registers generated product and waitlist **read** routes this way and keeps health, waitlist POST, and KiwiPress content hand-written.

## Development

```bash
yarn workspace @citrusworx/seltzer build
yarn workspace @citrusworx/seltzer typecheck
yarn workspace @citrusworx/seltzer test
```
