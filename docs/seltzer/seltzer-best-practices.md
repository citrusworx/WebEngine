# Seltzer Best Practices

This guide focuses on how to compose Seltzer well in real app code. The goal is not to list every export, but to show the patterns that keep the HTTP surface small, honest, and easy to finish.

## Core principle

Use Seltzer to express:

- which exact method + path is live
- JSON (or raw) bytes on the way out
- a `fetch` shape for callers in Node

Use the platform for:

- body streams
- query strings
- headers
- TLS, process management, CORS

Use Nectarine for:

- YAML method/path *names* you copy
- adapters you call **inside** handlers

Use Sig.js / Juice for:

- the page that consumes the JSON

Seltzer is strongest when it is the thin listener on top of Node `http` you could already read without a framework.

## End every request

A matched handler that never `end`s hangs the client. Unmatched routes are the only path Seltzer finishes for you.

Good:

```ts
handler: (ctx) => ctx.json({ ok: true }),
```

Good:

```ts
handler: (ctx) => {
  ctx.res.writeHead(200, { "Content-Type": "text/plain" });
  ctx.res.end("ok\n");
},
```

Less ideal:

```ts
handler: async (ctx) => {
  const body = await readJson(ctx.req);
  if (!body) return; // hung
},
```

Every branch — validation failure, not found, success — should `json` or `end`.

## Treat `ctx.json` as a write, not as a return protocol

`return ctx.json(data)` is a readable habit. The `return` is for you, not for Seltzer. Do not also `return { status: 200, body: data }` expecting a send stage.

Good:

```ts
if (!note) return ctx.json({ error: "Not Found" }, 404);
return ctx.json(note);
```

## Keep routes exact and boring

Register the pathname you will actually request. Prefer `/notes` + `/note?id=` over hoping `/notes/:id` works.

Good:

```ts
app.route({ method: "GET", path: "/notes", handler: listNotes });
app.route({ method: "GET", path: "/note", handler: getNote });
```

Avoid registering YAML parametric strings “for later.” They sit in the array matching nothing.

## Share a `readJson` helper

Body collection is application code. One helper is enough for the whole process.

Good: a module-level `readJson` used by POST/PUT/PATCH.

Less ideal: a new `for await` loop inlined in every handler, each with a slightly different error path.

## Catch async failures at the handler

`listen` does not await and does not map errors to 500.

Good:

```ts
handler: async (ctx) => {
  try {
    return ctx.json(await load());
  } catch (err) {
    console.error(err);
    return ctx.json({ error: "failed" }, 500);
  }
},
```

## Register GET and POST as two routes

Do not invent `app.use("/notes", notesRouter)`. Two `.route` calls are the public API.

Keep method strings uppercase to match Node.

## Copy Nectarine pairs; run adapters yourself

Good: `path: spec.endpoint` where `spec` is `{ method: "GET", endpoint: "/users" }`, then `PgSql` inside the handler.

Less ideal: assuming `parser.registerRoute` mounted something, or calling empty `buildSQL` and sending `undefined` to the driver.

Skip `:id` endpoints until matching exists.

## Give `client` a slash-safe `baseUrl`

Good: `baseUrl: "http://127.0.0.1:3000"` + `path: "/notes"`.

Bad: trailing slash on `baseUrl` plus leading slash on `path` (`//notes`).

Do not assume `client` throws on 404 JSON. Check `error` in the payload, or use `fetch`.

## Keep CORS and auth in the handler (or a function the handler calls)

There is no middleware pipeline. A function `jsonWithCors(ctx, data, status)` is a best practice. `app.use(cors())` is an anti-pattern because it is not an API.

Same for auth: check `ctx.req.headers.authorization` at the start of handlers that need it, or wrap those handlers:

```ts
function requireToken(handler: Route["handler"]): Route["handler"] {
  return (ctx) => {
    if (ctx.req.headers.authorization !== "Bearer demo") {
      return ctx.json({ error: "Unauthorized" }, 401);
    }
    return handler(ctx);
  };
}
```

That wrapper is yours. It is not `pipeline.insert`.

## Let Juice/Sig own the browser

Do not generate HTML in Seltzer unless you truly need a text route. The product split is JSON from Seltzer, structure from Juice, behavior from Sig.

## Do not start with the exercises

[Courses](./courses.md) and [exercises](./exercises/README.md) teach you to **implement** parse/route/pipeline stages. App authors should start at [Getting Started](./seltzer-getting-started.md) and the [tutorial](./seltzer-api-tutorial.md).

If you only need `listen(3000)`, exercise 06 is the wrong tab.

## Stay complementary to Nectarine

Seltzer should not grow a YAML compiler, a query DSL, or `generateRoutes`. If a pattern needs a contract, the answer is a Nectarine file you copy from plus adapter code in the handler.

## Related

- [Patterns](./seltzer-patterns.md)
- [Anti-patterns](./seltzer-anti-patterns.md)
- [Roadmap](./seltzer-roadmap.md)
