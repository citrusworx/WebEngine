# @citrusworx/seltzer

An execution environment library for the CitrusWorx ecosystem.

Handlers return `ResponseData`. The runtime writes the HTTP response — there is no writing `ctx.json` helper. Bare objects, arrays, and strings are not wrapped; return `{ body: ... }`.

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

## Development

```bash
yarn workspace @citrusworx/seltzer build
yarn workspace @citrusworx/seltzer typecheck
```
