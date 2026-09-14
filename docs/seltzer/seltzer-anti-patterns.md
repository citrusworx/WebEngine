# Seltzer Anti-Patterns

## Purpose

This document collects the most common ways to fight Seltzer instead of working with it.

These are useful because most hangs, surprise 404s, and “I returned JSON but curl got nothing” failures come from a few repeated mistakes — usually Express, Koa, or design-doc habits brought into a tiny `listen` callback.

## 1. Treating Seltzer like Express

Bad:

```ts
app.use(express.json());
app.get("/notes", list);
app.post("/notes/:id", update);
```

Why it is bad:

- `use`, `get`, and `:id` are not in `@citrusworx/seltzer`
- there is no middleware stack and no parametric compiler

Better:

```ts
const app = Seltzer.init();
app.route({ method: "GET", path: "/notes", handler: list });
app.route({ method: "POST", path: "/notes", handler: create });
app.listen(3000);
```

`.route` + exact path is the whole inbound API.

## 2. Expecting `/users/:id` to match `/users/42`

Bad:

```ts
app.route({
  method: "GET",
  path: "/users/:id",
  handler: (ctx) => ctx.json({ id: ctx.params.id }),
});
```

Why it is bad:

- the matcher is `path === url.pathname`
- `/users/:id` only matches the literal pathname `/users/:id`
- `ctx.params` does not exist

Better — query:

```ts
app.route({
  method: "GET",
  path: "/user",
  handler: (ctx) => {
    const url = new URL(ctx.req.url || "/", `http://${ctx.req.headers.host}`);
    const id = url.searchParams.get("id");
    return ctx.json({ id });
  },
});
```

Parametric routing is [exercise 4](./exercises/04-parametric-router.md), a contributor elective.

## 3. Returning `{ status, body }` and not writing

Bad:

```ts
handler: () => ({ status: 200, body: { ok: true } }),
```

Why it is bad:

- `listen` does `return match.handler(ctx)` and ignores the value
- the socket never gets `end`
- curl hangs

Better:

```ts
handler: (ctx) => ctx.json({ ok: true }),
```

Structured returns are [exercise 5](./exercises/05-structured-response.md) / the design doc, not 0.2.0.

## 4. Assuming a body parser

Bad:

```ts
handler: (ctx) => ctx.json({ email: ctx.body.email }),
```

Why it is bad:

- there is no `ctx.body`
- the design-doc `parse` stage is not in `seltzer.ts`

Better: `for await` of `ctx.req`, then `JSON.parse`, then validate. See the [tutorial](./seltzer-api-tutorial.md) step 3.

## 5. Leaving a branch without `end`

Bad:

```ts
handler: async (ctx) => {
  const body = await readJson(ctx.req);
  if (!body?.text) return;
  return ctx.json({ ok: true });
},
```

Why it is bad:

- the `if` returns `undefined`
- Seltzer will not send 400 for you

Better: `return ctx.json({ error: "text required" }, 400)` on every failure path.

## 6. Relying on `listen` to catch async errors

Bad:

```ts
handler: async (ctx) => {
  const rows = await db.query("not-sql");
  return ctx.json(rows);
},
```

Why it is bad:

- the Promise is not awaited by the server
- a rejection is unhandled, not status 500

Better: `try/catch` in the handler and `ctx.json({ error: "failed" }, 500)`.

## 7. Double `writeHead`

Bad:

```ts
handler: (ctx) => {
  ctx.res.writeHead(200, { "X-Note": "a" });
  ctx.json({ ok: true });
},
```

Why it is bad:

- `json` also calls `writeHead`
- Node throws; the client may see a broken response

Better: either extra headers on `res.writeHead` + `res.end(JSON.stringify(…))`, or `ctx.json` alone.

## 8. Assuming `client` throws on 404

Bad:

```ts
const note = await client.get({
  path: "/missing",
  endpoint: "/missing",
  options: { baseUrl: "http://127.0.0.1:3000" },
});
console.log(note.id);
```

Why it is bad:

- Seltzer’s 404 body is JSON `{ error: "Not Found" }`
- `client.get` always `res.json()`
- `note.id` is `undefined`; no throw

Better: inspect the payload, or use `fetch` and check `response.ok`. Status-throwing clients are [exercise 8](./exercises/08-fetch-client.md), not `client.*`.

## 9. Double slashes and ignored `endpoint`

Bad:

```ts
client.get({
  path: "/notes",
  endpoint: "http://127.0.0.1:3000/notes",
  options: { baseUrl: "http://127.0.0.1:3000/" },
});
```

Why it is bad:

- the client concatenates `baseUrl + path` → `http://127.0.0.1:3000//notes`
- `endpoint` is never read (KiwiPress reads it in *its* helper, not here)

Better: `baseUrl` without a trailing slash, or put the full URL in `path` and omit `baseUrl`.

## 10. Starting with pipeline exercises as an app author

Bad: open [exercise 6](./exercises/06-pipeline-runner.md) because you wanted `POST /notes`.

Why it is bad:

- exercises 4–7 describe the **future** pipeline
- they are labeled contributor electives for a reason
- you will implement APIs that are not in the package you import

Better: [Getting Started](./seltzer-getting-started.md) → [tutorial](./seltzer-api-tutorial.md) → [patterns](./seltzer-patterns.md). Use the design doc when you intend to change `libraries/seltzer/src`.

## 11. Registering every Nectarine endpoint blindly

Bad:

```ts
for (const node of Object.values(api.user.get)) {
  app.route({
    method: node.api.method,
    path: node.api.endpoint,
    handler: stub,
  });
}
```

Why it is bad:

- `usersById` is `/users/:id`
- that route never matches `/users/42`
- you think Nectarine “generated” a REST API

Better: copy exact paths (`/users` GET/POST). Rewrite lookups as query routes. Call adapters inside handlers.

## 12. Calling `pipeline.insert` / `app.hook`

Bad:

```ts
app.pipeline.insert("auth").before("handle");
```

Why it is bad:

- there is no `pipeline` property
- named stages are a design target

Better: a wrapper function around `handler` (see [Best practices](./seltzer-best-practices.md)) or inlined header checks.

## 13. Expecting Grapevine or WebEngine to start `listen`

Bad: `grape apply` or `webengine.toml` as the way a Seltzer process appears.

Why it is bad:

- Grapevine `services:` is warning-only
- WebEngine does not read Seltzer config

Better: run a Node entry that calls `app.listen`. Provision the VM separately.

## 14. Using leftover `server.ts` as the runtime

`libraries/seltzer/src/core/server/server.ts` is a hello-world `createServer`. It is **not** imported by `Seltzer.listen`. Building apps on that file is a different program.

## Related

- [Troubleshooting](./seltzer-troubleshooting.md)
- [Routing](./seltzer-routing.md)
- [Request and response](./seltzer-request-response.md)
