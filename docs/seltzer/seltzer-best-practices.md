# Seltzer Best Practices

This guide focuses on how to compose Seltzer well in real app code. The goal is not to list every export, but to show the patterns that keep the HTTP surface small, honest, and easy to finish.

## Core principle

Use Seltzer to express:

- which method + path is live (including `:id`)
- `ResponseData` on the way out
- named pipeline stages for parse / match / validate / send
- a `fetch` shape for callers in Node (`client.*` + `HttpError`)

Use `before` / `replace` for:

- auth, logging, tracing
- richer contract checks than `.required`

Use Nectarine for:

- YAML `ApiOperation` lists you flatten
- adapters you call **inside** `execute` or a hand-written handler

Use Sig.js / Juice for:

- the page that consumes the JSON

Seltzer is strongest when handlers describe *what* happened and the runtime owns *how* that becomes HTTP.

## Return `ResponseData` on every branch

A matched handler that returns a bare object is a 500, not a hang. Still: every success and failure path should be explicit `{ status?, headers?, body? }`.

Good:

```ts
handler: (ctx): ResponseData => {
  const note = notes.get(ctx.params.id);
  if (!note) return { status: 404, body: { error: "Not Found" } };
  return { body: note };
},
```

Less ideal:

```ts
handler: () => ({ ok: true }), // 500 — extra key, not ResponseData
```

## Do not touch `res` for JSON

`req` / `res` remain on ctx. Normal JSON should not `writeHead`. Extra headers belong on `ResponseData.headers` so `send` owns the socket.

Good:

```ts
return { status: 201, headers: { "X-Created": "1" }, body: note };
```

## Keep routes honest

Register the pathname you will actually request. `/notes/:id` matches `/notes/42`. Prefer that over leftover 0.2.0 query-string stand-ins unless the query *is* the API.

Register static siblings (`/notes/new`) when they would otherwise be eaten by `:id` — the matcher prefers them, but only if they exist.

Keep method strings uppercase to match Node.

## Let `parse` and `validate` work

Send `Content-Type: application/json` for JSON POSTs. Declare `.required` keys on `contract.body` (or on `ApiOperation.body` for generated routes) instead of repeating `if (!body?.email)` in every write handler.

Type/format checks still belong in `replace("validate", …)` or the handler — default validate is presence-only.

## Put auth on the pipeline, not in every handler

Good: `app.before("handle", requireAuth)` with a `ResponseData` 401.

Less ideal: copy-pasted `Authorization` checks that miss a new route.

If some routes are public, branch in the stage on `ctx.path` / `ctx.route`, or use two `Seltzer` instances.

## Flatten with Nectarine; generate with Seltzer

Good: `listApiOperations` → `generateRoutes` → `app.route`.

Less ideal: assuming Nectarine mounted handlers, or copying `{ method, endpoint }` by hand for every `:id` path now that parametric matching exists.

Keep `execute` as data access. Use `response()` only for explicit transport results (non-200 that is not the default wrap).

## Give `client` a slash-safe `baseUrl`

Good: `baseUrl: "http://127.0.0.1:3000"` + `path: "/notes"`.

Bad: trailing slash on `baseUrl` plus leading slash on `path` (`//notes`).

Catch `HttpError` for 4xx/5xx. Do not treat `{ error: "Not Found" }` as a successful `get` result — that was 0.2.0.

## Use `listen` options instead of reinventing CORS

Good: `listen(port, { cors, locals, onListening })`.

Less ideal: per-route `OPTIONS` handlers and manual `Access-Control-*` headers on every `ResponseData`.

## Let Juice/Sig own the browser

Do not generate HTML in Seltzer unless you truly need a text route. The product split is JSON from Seltzer, structure from Juice, behavior from Sig.

## Do not start with the exercises

[Courses](./courses.md) and [exercises](./exercises/README.md) rebuild shipped stages from `node:http`. App authors should start at [Getting Started](./seltzer-getting-started.md) and the [tutorial](./seltzer-api-tutorial.md).

If you only need `listen(3000)`, exercise 06 is the wrong tab.

## Stay complementary to Nectarine

Seltzer should not grow a YAML compiler or a query DSL. `generateRoutes` is the join. If a pattern needs a richer contract, `replace("validate", …)` — do not fold Zod into every handler.

## Related

- [Patterns](./seltzer-patterns.md)
- [Anti-patterns](./seltzer-anti-patterns.md)
- [Pipeline](./seltzer-pipeline.md)
- [Roadmap](./seltzer-roadmap.md)
