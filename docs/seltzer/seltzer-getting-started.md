# Getting Started With Seltzer

Build an HTTP surface with the API in `libraries/seltzer/src` — not the pipeline in the design doc.

## Install

```bash
yarn add @citrusworx/seltzer
```

Requires Node (20+ is a safe assumption for this monorepo). `listen` will throw outside Node.

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

There is no `ctx.body`, `ctx.params`, `ctx.query`, or `ctx.headers` map. Use `ctx.req` / `new URL(ctx.req.url, …)`.

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

## What to ignore on day one

- [Design overview](./seltzer-design.md) pipeline diagrams
- [Courses](./courses.md) and [exercises](./exercises/README.md) — those teach you to *write* the missing stages
- `:id` routes, `app.use`, hooks

## Where to go next

- [Examples](./seltzer-examples.md)
- [Integration](./seltzer-integration.md)
- [Status](./seltzer-status.md)
