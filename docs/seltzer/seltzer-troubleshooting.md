# Seltzer Troubleshooting

The usual “why didn’t it answer?” cases against `libraries/seltzer/src` at **0.8.1**.

Related: [Anti-patterns](./seltzer-anti-patterns.md), [Request and response](./seltzer-request-response.md), [Routing](./seltzer-routing.md), [Pipeline](./seltzer-pipeline.md).

## `{ "error": "Internal Server Error", "message": "Handler must return ResponseData…" }`

You returned a bare object, array, or string. Wrap it: `{ body: value }`. Extra keys (`{ ok: true }`) also fail `isResponseData`.

This is **not** a hang. 0.2.0 hung when you returned `{ status, body }`; 0.8.x sends 500 instead if the shape is wrong, and sends the body if the shape is right.

## `{ "error": "Not Found" }` when the handler exists

Matching is method + compiled path, case-sensitive.

| You registered | Request | Result |
|---|---|---|
| `GET` `/notes` | `POST /notes` | 404 |
| `/notes` | `/notes/` | 404 |
| `get` `/health` | `GET /health` | 404 (`req.method` is `"GET"`) |
| `/notes/:id` | `/notes/1` | **match** — `{ id: "1" }` |

Duplicate routes with the same rank: earlier registration wins.

## `{ "error": "Invalid JSON body" }`

`Content-Type` included `application/json` but the bytes were not JSON. The handler never ran. Fix the client, or omit that content type if you meant to send raw text (`ctx.body` will be a string).

## `{ "error": "Missing required field: email" }`

`Route.contract.body` (or generated `ApiOperation.body`) marks `email` as `.required`. Empty string and whitespace count as missing. `execute` / the handler did not run.

## POST `ctx.body` is `undefined`

GET/HEAD skip the body. Other methods with an empty body are `undefined`. Non-JSON content types are a string, not an object — default `validate` then says “Request body must be an object” if `.required` keys exist.

Do not read `ctx.req` again; `parse` already consumed the stream.

## `client` throws `HttpError`

Non-2xx. Read `err.status` and `err.body`. This is expected for Seltzer’s own 404 JSON. 0.2.0 parsed that JSON as success.

## Client throws `SyntaxError` on success

The success `Content-Type` was JSON but the body was not. Or you pointed `baseUrl` at HTML. Text successes return a string when Content-Type is not JSON.

## `http://host:3000//notes`

`baseUrl` had a trailing slash and `path` had a leading slash. Concatenation does not join paths.

## `listen` throws about Node

You imported Seltzer in a browser (or edge) runtime without `process.versions.node`. Use `fetch` on the frontend; run `listen` in Node.

## CORS errors in the Sig app

Pass `cors` to `listen` (or `startSeltzerFromKernel({ cors })` when the kernel hosts HTTP). CORS headers are skipped when the request has no `Origin`. A mismatched `cors.origin` also skips headers. `OPTIONS` is 204 from `listen`, not from your routes. Two-process Vite + API: [Dual-process frontend + API](../webengine/dual-process.md).

## Extra CORS headers on `ResponseData` plus `listen({ cors })`

Usually redundant. If you `writeHead` yourself, `send` no-ops and the body may vanish.

## Port already in use

`listen` does not handle `EADDRINUSE`. Nothing in the library retries or picks a free port. Tests should `listen(0)` and `server.close()`.

## Cannot close the server in tests

`listen` **returns** `http.Server`. Hold the return value and `close()`. 0.2.0 returned `void`; that myth is closed.

## Generated catalog route returns a product by id

Register both `/api/products/catalog/:catalog` and `/api/products/:id`. `generateRoutes` sorts the static prefix first; `matchRoute` prefers it even if you did not. If you only registered `:id`, `catalog` is captured as an id.

## `execute` status 418 comes back as 200

Return `response({ status: 418, body })` from `execute`. Unbranded `{ status, body }` is wrapped as a payload.

## Nectarine route did not appear

Nectarine does not call `.route`. You must `generateRoutes` (or copy by hand) and register. Flatten with `listApiOperations`, do not invent a second YAML walker.

## Changes to `server.ts` did nothing

`src/core/server/server.ts` is not used by `Seltzer.listen`. Edit `core/seltzer.ts` / `pipeline/` / `generate/`.

## `allowSelfSigned` throws about undici

Install the optional peer `undici`, or use a trusted certificate. HTTP URLs ignore the flag.

## Suggested reading

- [Getting Started](./seltzer-getting-started.md)
- [JSON API tutorial](./seltzer-api-tutorial.md)
- [Status](./seltzer-status.md)
