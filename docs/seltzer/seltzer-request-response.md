# Seltzer Request and Response

How a request becomes bytes on the wire in `@citrusworx/seltzer` **0.2.0**.

This page is the request/response mental model. Routing is [Routing](./seltzer-routing.md). Outbound calls are [Client](./seltzer-client.md).

Every behavior here is from `libraries/seltzer/src/core/seltzer.ts` (`listen`). There is no separate context module.

## What `listen` actually does

On each incoming request, `listen` builds a `URL`, finds a route, builds `ctx`, and either 404s or calls the handler.

```ts
const url = new URL(req.url || "/", `http://${req.headers.host}`);
const match = this.routes.find(
  (route) => route.method === req.method && route.path === url.pathname,
);
const ctx = {
  req,
  res,
  options: this.config?.options,
  json(data: unknown, status = 200) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  },
};

if (!match) {
  return ctx.json({ error: "Not Found" }, 404);
}
return match?.handler(ctx);
```

Read that last line twice. The handler’s **return value is discarded**. `return ctx.json(…)` works because `json` writes as a side effect, not because Seltzer inspects the return.

## The context object

`ctx` is not an exported type. `Route<TContext>` is generic and defaults to `any`. In practice `listen` always passes:

| Field | What it is |
|---|---|
| `req` | Node `IncomingMessage` — method, url, headers, readable body |
| `res` | Node `ServerResponse` — `writeHead`, `end`, `write` |
| `options` | `this.config?.options` from `.handler()`, or `undefined` |
| `json` | helper: JSON `writeHead` + `end` |

There is no `ctx.body`, `ctx.params`, `ctx.query`, `ctx.headers` map, `ctx.state`, or `ctx.send`.

The design doc describes a normalized context built by a `context` stage. That stage is not in source. Today the “structured” part is `json`. The rest is Node.

## `ctx.json`

```ts
json(data: unknown, status = 200): void
```

- Always `Content-Type: application/json`
- Always `JSON.stringify(data)`
- Always `res.end`
- Default status `200`

```ts
ctx.json({ ok: true });
ctx.json({ error: "email required" }, 400);
ctx.json({ id: "1" }, 201);
ctx.json(null);           // body is the four characters `null`
ctx.json(undefined);      // body is empty: JSON.stringify(undefined) is undefined
```

`JSON.stringify` throws on circular structures. That throw is not caught by `listen`.

Headers besides content type: not a `json` feature. Set them on `ctx.res` before you write, or skip `json` and write yourself. You cannot both `writeHead` extra headers and then call `json`, which also `writeHead`s.

## Raw `ctx.res`

When JSON is the wrong answer:

```ts
app.route({
  method: "GET",
  path: "/robots.txt",
  handler: (ctx) => {
    ctx.res.writeHead(200, { "Content-Type": "text/plain" });
    ctx.res.end("User-agent: *\nDisallow:\n");
  },
});
```

Streaming a file, SSE, or a redirect is the same idea: you own `ServerResponse`. Seltzer will not format `{ status, headers, body }` for you. That is [exercise 5](./exercises/05-structured-response.md), a design target.

## Request URL, query, and headers

`req.url` is the path + search (`/note?id=1`). Matching already constructed a `URL` for `pathname`, but that object is **not** passed to the handler.

```ts
app.route({
  method: "GET",
  path: "/note",
  handler: (ctx) => {
    const url = new URL(ctx.req.url || "/", `http://${ctx.req.headers.host}`);
    const id = url.searchParams.get("id");
    const host = ctx.req.headers.host;
    const accept = ctx.req.headers.accept;
    return ctx.json({ id, host, accept });
  },
});
```

Headers are Node’s `IncomingHttpHeaders` (lowercase keys, `string | string[] | undefined`). There is no helper to pick the first value.

## Request body

Bodies are streams. They are not ready when the handler starts.

Collect:

```ts
async function readText(req: import("node:http").IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}
```

Then parse:

```ts
const raw = await readText(ctx.req);
let body: unknown = null;
try {
  body = raw ? JSON.parse(raw) : null;
} catch {
  return ctx.json({ error: "invalid json" }, 400);
}
```

GET handlers usually should not read the body. POST/PUT/PATCH handlers that never read it and never `end` will hang if a client is still sending, and will hang if you forget `ctx.json` even after the client finishes.

There is no size limit, no `Content-Type` check, and no `application/x-www-form-urlencoded` parser. Add those in the handler if you need them.

## Async handlers

`handler` is typed `(ctx) => any`. Async functions return a Promise. `listen` does not `await` it and does not `.catch` it.

What that means:

- Calling `ctx.json` after `await` still sends the response. The socket does not care that `listen` moved on.
- `throw new Error("boom")` inside an async handler is an unhandled rejection, not `{ error: "Internal" }` with status 500.
- Returning a Promise of `{ status, body }` is still discarded.

Wrap work you care about:

```ts
handler: async (ctx) => {
  try {
    const row = await lookup();
    return ctx.json(row);
  } catch (err) {
    console.error(err);
    return ctx.json({ error: "failed" }, 500);
  }
};
```

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

`ctx.options` is that `options` object. `adapter` is stored on the instance and never read by `listen`. `allowSelfSigned` is never applied to the server (the server is plain `http`).

KiwiPress uses `.handler()` to remember a WordPress `baseUrl` for **outbound** calls. Inbound handlers still see the same `options` blob if you set it.

## What must happen before the request is done

Someone has to:

1. `writeHead` (or rely on `json` to do it)
2. `end` the response

Seltzer does step 1–2 for unmatched routes. For matched routes, **only your handler** does. Double-`end` throws. `json` after you already ended throws.

## Design-doc context vs this page

| Design (`seltzer-design.md`) | Shipped |
|---|---|
| `ctx.method`, `ctx.path`, `ctx.query`, `ctx.headers` | `ctx.req.*` |
| `ctx.body` after a parse stage | You read the stream |
| `ctx.params` from `/users/:id` | Not implemented |
| Handler returns `{ status, headers, body }` | Handler writes |
| Format + send stages | `ctx.json` writes immediately |

Keep this page open while you write handlers. Open the design doc when you implement stages.

## Related

- [Routing](./seltzer-routing.md)
- [JSON API tutorial](./seltzer-api-tutorial.md)
- [Troubleshooting](./seltzer-troubleshooting.md) — hangs and double-writes
