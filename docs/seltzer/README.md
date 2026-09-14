# Seltzer

A small Node `http` server and a `fetch` client.

Seltzer is the CitrusWorx HTTP surface: register exact-path routes, get a context with `req`, `res`, and `ctx.json()`, listen on a port. A sibling `client` object wraps GET/POST/PUT/PATCH/DELETE.

The current model is:

- **`Seltzer.init()`** builds an instance
- **`.route({ method, path, handler })`** stores an exact method + pathname match
- **`.listen(port)`** creates `http.createServer` and writes JSON 404s when nothing matches
- **`client.get/post/…`** call `fetch` with an `Endpoint` object

Seltzer is strongest as a readable, tiny runtime you can hold in your head. It is not Express, and it is not yet the pipeline described in the [design overview](./seltzer-design.md).

## Who it is for

- App authors who need a first HTTP process in this monorepo
- People wiring Nectarine YAML `method` / `endpoint` pairs to a listener
- Contributors who will grow the pipeline — after they can run `Seltzer.init()`

It is not a middleware framework. Courses and exercises are **electives** for implementers, not the product path.

## Why it exists

CitrusWorx did not want the HTTP layer to be “whatever Express plugin we grabbed this week.” Juice already refused utility-class soup; Seltzer refuses middleware soup.

The design bet (see the [design doc](./seltzer-design.md)) is:

- Normalize the request into a structured context
- Run named pipeline stages instead of `next()`
- Let handlers return data; let the runtime write the socket
- Eventually share contracts with Nectarine

**What shipped first** is the thinnest honest slice of that: Node `http`, exact routes, `ctx.json`, and a fetch client. The rest is still a study-and-build project. That is deliberate — the [courses](./courses.md) exist so contributors implement the missing stages by hand.

If Seltzer were only a cleaner `createServer`, it would not be worth a package. The package exists so the ecosystem has one HTTP vocabulary (`Route`, `Endpoint`, `Seltzer`) to grow into.

## Current setup shape

```ts
import { Seltzer } from "@citrusworx/seltzer";

const app = Seltzer.init();

app.route({
  method: "GET",
  path: "/",
  handler: (ctx) => ctx.json({ message: "Hello World!" }),
});

app.listen(3000);
```

That is `libraries/seltzer/src/example.ts`.

## What it can do

### 1. JSON GET / POST on exact paths

```ts
import { Seltzer } from "@citrusworx/seltzer";

const app = Seltzer.init();

app.route({
  method: "GET",
  path: "/health",
  handler: (ctx) => ctx.json({ ok: true }),
});

app.route({
  method: "POST",
  path: "/echo",
  handler: async (ctx) => {
    const chunks: Buffer[] = [];
    for await (const chunk of ctx.req) {
      chunks.push(chunk as Buffer);
    }
    const raw = Buffer.concat(chunks).toString("utf8");
    let body: unknown = raw;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      return ctx.json({ error: "invalid json" }, 400);
    }
    return ctx.json({ body });
  },
});

app.listen(3000);
```

There is **no** built-in body parser. The design doc assigns that to a `parse` stage; you collect the stream today.

`ctx.json(data, status?)` is `writeHead` + `JSON.stringify` + `end`. Default status is 200.

### 2. 404 for unknown method + path

Matching is `route.method === req.method && route.path === url.pathname`. Query strings are ignored for matching (`new URL` is used only to get `pathname`).

Unmatched requests get `{ error: "Not Found" }` with status 404.

`/users/1` will not match `/users/:id`. Parametric routes are an exercise, not an API.

### 3. Optional handler config (stored, barely used)

```ts
app.handler({
  adapter: "node-http",
  options: {
    baseUrl: "https://api.example.com",
    headers: { "X-App": "demo" },
    allowSelfSigned: false,
  },
});
```

`options` is copied onto `ctx.options`. Nothing in `listen` reads `adapter` or `allowSelfSigned`. The client uses the same option shape when you pass an `Endpoint`.

### 4. Outbound fetch

```ts
import { client, type Endpoint } from "@citrusworx/seltzer";

const users: Endpoint = {
  path: "/users",
  endpoint: "/users",
  options: { baseUrl: "http://127.0.0.1:3000" },
};

const list = await client.get(users);
await client.post(users, { email: "dev@citrusworx.com" });
```

`client` methods always `res.json()`. Non-JSON responses will throw. There is no status check. `allowSelfSigned` is documented in a comment only — no custom HTTPS agent.

`Endpoint.route` and `Endpoint.endpoint` are typed but **not** read by the client. The URL is `options.baseUrl + path` or `path` alone.

### 5. Node-only listen

`listen` throws if `process.versions.node` is missing. This is a server library, not a browser bundle.

## Mental model

```text
HTTP request
  → URL pathname + method
  → first exact route match
  → handler(ctx)     ctx = { req, res, options, json }
  → you write the body (usually ctx.json)
```

| You want… | Today |
|---|---|
| JSON response | `ctx.json(value, status?)` |
| Raw socket | `ctx.res.writeHead` / `ctx.res.end` |
| Request body | Read `ctx.req` yourself |
| `/users/:id` | Not implemented — parse `pathname` or wait for the pipeline |
| Middleware | Not a thing — add code in the handler |
| Named pipeline insert | Design only |

## Product path vs contributor path

**Building an app HTTP surface**

1. [Getting Started](./seltzer-getting-started.md)
2. [Examples](./seltzer-examples.md)
3. [Status](./seltzer-status.md)
4. [Integration](./seltzer-integration.md) — Nectarine, Juice/Sig, Grapevine

**Implementing the runtime**

1. [Design overview](./seltzer-design.md) — the pipeline Seltzer is *becoming*
2. [Study guide](./courses.md) — Node courses mapped to stages
3. [Exercises](./exercises/README.md) — echo server through fetch client

Do not start with exercise 06 if you only need `listen(3000)`.

## Suggested reading order

1. This page
2. [Getting Started](./seltzer-getting-started.md)
3. [Examples](./seltzer-examples.md)
4. [Status](./seltzer-status.md)
5. [Integration](./seltzer-integration.md)
6. [Design](./seltzer-design.md) — only if you need the long-term shape

## Status

**Early implementation** (`@citrusworx/seltzer` 0.2.0). Matches the workspace index.

Shipped: `Seltzer.init/route/handler/listen`, exact match, `ctx.json`, `client.*`.

Not shipped: body parser, parametric routes, pipeline stages, structured handler return values (the server does not send `{ status, headers, body }` for you), contracts, streaming helpers.

## Sibling packages

- [Nectarine](../nectarine/README.md) — YAML method/path objects you can copy into `.route()`
- [Sig.js](../sigjs/README.md) / [Juice](../juice/README.md) — consume Seltzer over `fetch`
- [Grapevine](../grapevine/README.md) — provision the machine; does not start Seltzer
