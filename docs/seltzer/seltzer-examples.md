# Seltzer Examples

Copy these against `Seltzer` and `client` as exported today.

## Health + static JSON

```ts
import { Seltzer } from "@citrusworx/seltzer";

const app = Seltzer.init();

app.route({
  method: "GET",
  path: "/health",
  handler: (ctx) => ctx.json({ ok: true, uptime: process.uptime() }),
});

app.listen(3000);
```

## In-memory resource (exact paths)

```ts
import { Seltzer } from "@citrusworx/seltzer";

type User = { id: string; email: string };
const users = new Map<string, User>();

async function readJson(req: import("node:http").IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : null;
}

const app = Seltzer.init();

app.route({
  method: "GET",
  path: "/users",
  handler: (ctx) => ctx.json([...users.values()]),
});

app.route({
  method: "POST",
  path: "/users",
  handler: async (ctx) => {
    const body = (await readJson(ctx.req)) as { email?: string };
    if (!body?.email) return ctx.json({ error: "email required" }, 400);
    const user = { id: String(users.size + 1), email: body.email };
    users.set(user.id, user);
    return ctx.json(user, 201);
  },
});

// /users/:id is not a matcher. Register a concrete path or parse:
app.route({
  method: "GET",
  path: "/users/1",
  handler: (ctx) => {
    const user = users.get("1");
    return user ? ctx.json(user) : ctx.json({ error: "Not Found" }, 404);
  },
});

app.listen(3000);
```

Manual prefix parse if you insist on one handler (still one registered path — this pattern only works if you change the matcher, which you should not pretend exists):

Better: wait for parametric routing, or use a single `/users` collection + query `?id=`.

```ts
app.route({
  method: "GET",
  path: "/user",
  handler: (ctx) => {
    const url = new URL(ctx.req.url || "/", `http://${ctx.req.headers.host}`);
    const id = url.searchParams.get("id");
    const user = id ? users.get(id) : undefined;
    return user ? ctx.json(user) : ctx.json({ error: "Not Found" }, 404);
  },
});
```

## Text response (bypass `ctx.json`)

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

## Client against that server

```ts
import { client, type Endpoint } from "@citrusworx/seltzer";

const usersApi: Endpoint = {
  path: "/users",
  endpoint: "/users",
  options: {
    baseUrl: "http://127.0.0.1:3000",
    headers: { Accept: "application/json" },
  },
};

await client.post(usersApi, { email: "dev@citrusworx.com" });
const all = await client.get(usersApi);
console.log(all);
```

`put` / `patch` / `delete` follow the same `Endpoint` shape. `delete` and `get` send no body.

## Nectarine-shaped registration

```ts
import { parser } from "@citrusworx/nectarine";
import { Seltzer } from "@citrusworx/seltzer";

const api = parser.yaml("./userAPI.yml");
const spec = api.user.get.allUsers.api as { method: string; endpoint: string };

const app = Seltzer.init();
app.route({
  method: spec.method,
  path: spec.endpoint,
  handler: (ctx) => ctx.json({ users: [] }),
});
app.listen(3000);
```

The YAML does not create the handler. You do.

## What not to paste from the design doc

```ts
// Not APIs
app.pipeline.insert("auth").before("handle");
ctx.params.id;
ctx.body;
return { status: 200, body: { ok: true } }; // listen will not serialize this
```
