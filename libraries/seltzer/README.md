# @citrusworx/seltzer

An execution environment library for the CitrusWorx ecosystem.

Handlers return `ResponseData`. The runtime writes the HTTP response — there is no writing `ctx.json` helper. Bare objects, arrays, and strings are not wrapped; return `{ body: ... }`.

Each request runs through a named pipeline:

`parse` → `context` → `route` → `validate` → `handle` → `response` → `send`

`validate` is a no-op stub (reserved for Nectarine contracts). Insert custom stages with `before(name, stage)`. Returning `ResponseData` from a stage skips the rest of the pipeline and jumps to `send`.

Apps that only use `init().route().listen()` keep the same behavior as 0.4.0.

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

## Pipeline stages

| Stage | Responsibility |
| --- | --- |
| `parse` | Read the body (JSON or raw). Invalid JSON → 400. GET/HEAD skip the body. |
| `context` | Set `method`, `path`, `query`, and `headers` on ctx. |
| `route` | Match a registered route and fill `params`. No match → 404. |
| `validate` | No-op stub. |
| `handle` | Call the matched handler. Handlers must return `ResponseData`. |
| `response` | Reject non-`ResponseData` handler results with 500. |
| `send` | Write the HTTP response via `send()`. |

CORS headers and `OPTIONS` 204 are applied before the pipeline, same as 0.4.0.

### Inserting a stage

`before(name, stage)` inserts immediately before the named builtin stage. Auth-style early exits return `ResponseData`:

```ts
import { Seltzer } from "@citrusworx/seltzer";
import type { ResponseData, Stage } from "@citrusworx/seltzer";

const requireAuth: Stage = (ctx) => {
    if (!ctx.headers.authorization) {
        return { status: 401, body: { error: "Unauthorized" } };
    }
};

const app = Seltzer.init().before("handle", requireAuth);

app.route({
    method: "GET",
    path: "/secret",
    handler: (): ResponseData => ({ body: { ok: true } }),
});
```

Stages mutate the shared context in place. Return `void`/`undefined` to continue.

## Generate routes from Nectarine `*API.yml`

Seltzer owns the HTTP wiring. Flatten loaded YAML with `listApiOperations`, then `generateRoutes(operations, { execute })`.

```ts
import {
    generateRoutes,
    listApiOperations,
    type ResponseData,
} from "@citrusworx/seltzer";

const operations = listApiOperations(product.api).filter(
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

- YAML layout: `resource → crud → operationName → api: { method, endpoint, query?, body? }`.
- `query` is the named-query key, not the HTTP search string (`ctx.query`).
- Handlers read `ctx.params` / `ctx.query` / `ctx.body`, call host `execute`, and return `ResponseData`. There is no writing `ctx.json`.
- `execute` may return a payload (`{ body }`), `ResponseData` (sent as-is), or `null`/`undefined` (default 404).
- `generateRoutes` registers static-prefix paths (`/catalog/:catalog`, `/slug/:slug`) before `:id`. `matchRoute` also prefers the most specific match, so `/items/new` wins over `/items/:id` regardless of registration order.
- Uses the Seltzer 0.5 default pipeline (`parse` → `…` → `send`) and `ResponseData`. It does not replace `before()`.
- `listApiOperations` sits next to this helper so Nectarine can absorb the flatten later without rewriting `generateRoutes`.

Blackwater registers generated product **read** routes this way and keeps health, waitlist, and KiwiPress content hand-written.

## Development

```bash
yarn workspace @citrusworx/seltzer build
yarn workspace @citrusworx/seltzer typecheck
yarn workspace @citrusworx/seltzer test
```
