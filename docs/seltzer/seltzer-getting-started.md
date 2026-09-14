# Getting Started With Seltzer

This is the best starting point if you want to use Seltzer the way the library works today.

After this page, the [JSON API tutorial](./seltzer-api-tutorial.md) is the guided build — health, collection, POST body, query lookup, a copied Nectarine path, and `client.*` — analogous to [Sig’s page tutorial](../sigjs/sig-page-tutorial.md) and [Juice’s page tutorial](../juice/juice-page-tutorial.md).

Build against the API in `libraries/seltzer/src`, not the pipeline in the [design doc](./seltzer-design.md).

## What Seltzer is

Seltzer is a small Node `http` listener plus a `fetch` client.

It gives you:

- `Seltzer.init()` — construct an instance
- `.route({ method, path, handler })` — store an exact method + pathname
- `.handler(config)` — stash options copied onto `ctx.options`
- `.listen(port)` — `http.createServer`, first-match dispatch, JSON 404
- `ctx.json(data, status?)` — write JSON and end
- `client.get/post/put/patch/delete` — `fetch` + `res.json()`

It is not Express. There is no `app.use`, no `:id` matcher, no body parser, and no pipeline insert API.

## Install

```bash
yarn add @citrusworx/seltzer
```

Requires Node (20+ is a safe assumption for this monorepo). `listen` will throw outside Node.

Package version today: **0.2.0**.

## Hello World

```ts
import { Seltzer } from "@citrusworx/seltzer";

const app = Seltzer.init();

app.route({
  method: "GET",
  path: "/",
  handler: (ctx) => {
    return ctx.json([{ message: "Hello World!" }]);
  },
});

app.listen(3000);
```

In this workspace:

```bash
yarn workspace @citrusworx/seltzer dev
```

That runs `ts-node src/index.ts` per `package.json` — wire `src/example.ts` or your own entry if you want this file to be what starts.

`curl http://127.0.0.1:3000/` → `[{"message":"Hello World!"}]`.

`curl http://127.0.0.1:3000/missing` → `{"error":"Not Found"}` and 404.

## The mental model

1. Register **exact** `{ method, path }` pairs. First match wins.
2. On each request, Seltzer builds `ctx = { req, res, options, json }`.
3. Your handler **must write the response**. Usually `ctx.json`.
4. Returning `{ status, body }` does nothing. `listen` ignores the return value.
5. POST bodies are a Node stream. Read them yourself.

```text
request → pathname + method → first exact route → handler(ctx) → you end the response
```

## The context object

Handlers receive:

```ts
{
  req: IncomingMessage;
  res: ServerResponse;
  options?: { baseUrl?: string; headers?: Record<string, string>; allowSelfSigned?: boolean };
  json(data: unknown, status?: number): void;
}
```

There is no `ctx.body`, `ctx.params`, `ctx.query`, or `ctx.headers` map. Use `ctx.req` / `new URL(ctx.req.url, …)`. The type is inline in `listen`; it is not a named export.

## Query strings

The matcher uses `pathname` only. `/search` matches `/search?q=kiwi`. Read the query yourself:

```ts
app.route({
  method: "GET",
  path: "/search",
  handler: (ctx) => {
    const url = new URL(ctx.req.url || "/", `http://${ctx.req.headers.host}`);
    return ctx.json({ q: url.searchParams.get("q") });
  },
});
```

## POST body

Seltzer does not parse bodies. Collect the stream:

```ts
async function readJson(req: import("node:http").IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : null;
}

app.route({
  method: "POST",
  path: "/users",
  handler: async (ctx) => {
    try {
      const body = await readJson(ctx.req);
      return ctx.json({ created: body }, 201);
    } catch {
      return ctx.json({ error: "invalid json" }, 400);
    }
  },
});
```

If you never read `ctx.req` and never `end` the response, the connection hangs. Always `ctx.json` or `ctx.res.end`.

`listen` does not `await` the handler. An async handler still works if it calls `ctx.json` after the `await` — the response is written when that happens. An uncaught rejection is not mapped to 500.

## Call it from the Seltzer client

```ts
import { client } from "@citrusworx/seltzer";

const created = await client.post(
  {
    path: "/users",
    endpoint: "/users",
    options: { baseUrl: "http://127.0.0.1:3000" },
  },
  { email: "dev@citrusworx.com" },
);
```

`endpoint` is required by the type and ignored by the client. The URL is `baseUrl + path`.

## What to ignore on day one

- [Design overview](./seltzer-design.md) pipeline diagrams
- [Courses](./courses.md) and [exercises](./exercises/README.md) — those teach you to *write* the missing stages
- `:id` routes, `app.use`, `pipeline.insert`, `ctx.params`, `ctx.body`
- Returning `{ status, headers, body }` and expecting Seltzer to send it

## Where to go next

- [JSON API tutorial](./seltzer-api-tutorial.md) — the guided product build
- [Request and response](./seltzer-request-response.md)
- [Routing](./seltzer-routing.md)
- [Client](./seltzer-client.md)
- [Examples](./seltzer-examples.md)
- [Status](./seltzer-status.md)
