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

## Development

```bash
yarn workspace @citrusworx/seltzer build
yarn workspace @citrusworx/seltzer typecheck
yarn workspace @citrusworx/seltzer test
```
