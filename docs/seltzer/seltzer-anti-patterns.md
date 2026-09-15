# Seltzer Anti-Patterns

## Purpose

This document collects the most common ways to fight Seltzer instead of working with it.

These are useful because most 500s, surprise 404s, and leftover 0.2.0 habits come from a few repeated mistakes — usually Express, Koa, or **master-branch docs** brought into a 0.8.x listener.

## 1. Treating Seltzer like Express

Bad:

```ts
app.use(express.json());
app.get("/notes", list);
app.post("/notes/:id", update);
```

Why it is bad:

- `use` and `get` are not in `@citrusworx/seltzer`
- there is no middleware stack

Better:

```ts
const app = Seltzer.init();
app.route({ method: "GET", path: "/notes", handler: list });
app.route({ method: "POST", path: "/notes", handler: create });
app.route({ method: "GET", path: "/notes/:id", handler: getOne });
app.listen(3000);
```

`.route` + the named pipeline is the inbound API. `:id` **is** valid.

## 2. Calling `ctx.json`

Bad:

```ts
handler: (ctx) => ctx.json({ ok: true }),
```

Why it is bad:

- `ctx.json` was removed in 0.4.0
- TypeScript will not see it on `RequestContext`

Better:

```ts
handler: (): ResponseData => ({ body: { ok: true } }),
```

## 3. Returning a bare payload

Bad:

```ts
handler: () => ({ ok: true }),
handler: () => [...notes.values()],
handler: () => "ok",
```

Why it is bad:

- `isResponseData` requires a plain object whose keys are only `status` / `headers` / `body`
- the `response` stage turns anything else into 500 `{ error: "Internal Server Error", message: "Handler must return ResponseData…" }`

Better:

```ts
handler: (): ResponseData => ({ body: { ok: true } }),
```

This is the opposite of the 0.2.0 anti-pattern (returning `ResponseData` and hanging). **Returns are required now.** Hanging because the return was ignored is closed.

## 4. Collecting the JSON body by hand

Bad:

```ts
handler: async (ctx) => {
  const chunks: Buffer[] = [];
  for await (const chunk of ctx.req) chunks.push(chunk as Buffer);
  const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  return { body };
},
```

Why it is bad:

- `parse` already ran. `ctx.req` is consumed.
- Invalid JSON is already a 400 from the runtime.

Better: read `ctx.body`. Declare `.required` keys on `contract`.

## 5. Using query-string ids because “`:id` is not shipped”

Bad:

```ts
app.route({
  method: "GET",
  path: "/note",
  handler: (ctx) => {
    const id = new URL(ctx.req.url || "/", "http://localhost").searchParams.get("id");
    return { body: { id } };
  },
});
```

Why it is bad:

- 0.2.0 docs taught this as the product path
- `/notes/:id` and `ctx.params.id` exist
- `ctx.query` exists when you actually want a query

Better:

```ts
app.route({
  method: "GET",
  path: "/notes/:id",
  handler: (ctx): ResponseData => ({ body: { id: ctx.params.id } }),
});
```

Query filters (`?q=`) still belong on `ctx.query`.

## 6. Writing `res` and then returning `ResponseData`

Bad:

```ts
handler: (ctx) => {
  ctx.res.writeHead(200, { "X-Note": "a" });
  return { body: { ok: true } };
},
```

Why it is bad:

- `send` no-ops when headers are already sent
- the JSON body never goes out

Better: put headers on `ResponseData.headers`.

## 7. Assuming `client` still succeeds on 404 JSON

Bad:

```ts
const note = await client.get({
  path: "/missing",
  endpoint: "/missing",
  options: { baseUrl: "http://127.0.0.1:3000" },
});
console.log((note as { error?: string }).error);
```

Why it is bad:

- 0.8.x throws `HttpError` on non-2xx
- the 0.2.0 “always `res.json()`, never throw” story is closed

Better: `try/catch` and `instanceof HttpError`.

## 8. Double slashes and ignored `endpoint`

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
- `endpoint` is never read (KiwiPress may read it in *its* helper, not here)

Better: `baseUrl` without a trailing slash, or put the full URL in `path` and omit `baseUrl`.

## 9. Starting with pipeline exercises as an app author

Bad: open [exercise 6](./exercises/06-pipeline-runner.md) because you wanted `POST /notes`.

Why it is bad:

- exercises rebuild internals you already import
- `ctx.body` is on the package

Better: [Getting Started](./seltzer-getting-started.md) → [tutorial](./seltzer-api-tutorial.md) → [pipeline](./seltzer-pipeline.md) as a product topic.

## 10. Skipping `:id` YAML because 0.2.0 said to

Bad: copy only exact `/users` pairs and rewrite lookups as `?id=` “until parametric routing exists.”

Why it is bad: parametric routing exists. `generateRoutes` sorts static prefixes so `/catalog/:catalog` is not stolen by `/products/:id`.

Better: flatten with `listApiOperations` and generate.

## 11. Calling `pipeline.insert` / `app.hook`

Bad:

```ts
app.pipeline.insert("auth").before("handle");
```

Why it is bad:

- there is no `pipeline` property on the instance
- the method is `app.before("handle", stage)`

Better: [Pipeline](./seltzer-pipeline.md).

## 12. Expecting Grapevine or a config file to start `listen`

Bad: `grape apply` as the way a Seltzer process appears.

Better: run a Node entry that calls `app.listen`. Provision the VM separately. WebEngine hosts that already wire Nectarine→Seltzer are a different (engine) path — see [Integration](./seltzer-integration.md).

## 13. Using leftover `server.ts` as the runtime

`libraries/seltzer/src/core/server/server.ts` is a hello-world `createServer`. It is **not** imported by `Seltzer.listen`. Building apps on that file is a different program.

## 14. Treating `execute`’s `{ status, body }` as a transport result

Bad:

```ts
execute: () => ({ status: 418, body: { error: "teapot" } }),
```

Why it is bad:

- unbranded objects are wrapped as `{ body: { status, body } }`
- HTTP status stays 200

Better: `return response({ status: 418, body: { error: "teapot" } })`.

## Related

- [Troubleshooting](./seltzer-troubleshooting.md)
- [Routing](./seltzer-routing.md)
- [Request and response](./seltzer-request-response.md)
