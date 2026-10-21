# Seltzer Troubleshooting

The usual “why didn’t it answer?” cases against `libraries/seltzer/src` at **0.8.1**.

Related: [Anti-patterns](./seltzer-anti-patterns.md), [Request and response](./seltzer-request-response.md), [Routing](./seltzer-routing.md), [Pipeline](./seltzer-pipeline.md).

## `{ "error": "Internal Server Error", "message": "Handler must return ResponseData…" }`

You returned a bare object, array, string, `undefined`, or a wrong shape (`status` not a number, header values not strings, extra keys). Wrap it: `{ body: value }`. `{ ok: true }` fails `isResponseData`. `{}` is a valid empty `ResponseData`.

The same 500 is logged with the route and the returned value (`logger`, default `console.error`). This is **not** a hang. 0.2.0 hung when you returned `{ status, body }`; the runtime sends 500 instead if the shape is wrong, and sends the body if the shape is right.

## `{ "error": "Internal Server Error" }` with no `message`

A handler or hook threw. The body does not include the error message or the stack. Read the log line. Pass `listen(port, { debug: true })` to add the stack to that line only. Pass `logger` to send the line somewhere other than `console.error`.

Return `ResponseData` for a domain error. A throw is always this generic 500.

## `{ "error": "Not Found" }` when the handler exists

Matching is method + compiled path, case-sensitive.

| You registered | Request | Result |
|---|---|---|
| `GET` `/notes` | `POST /notes` | 405 + `Allow` |
| `/notes` | `/notes/` | 404 |
| `get` `/health` | `GET /health` | 404 (`req.method` is `"GET"`) |
| `/notes/:id` | `/notes/1` | **match** — `{ id: "1" }` |

Duplicate routes with the same rank: earlier registration wins.

## `{ "error": "Invalid JSON body" }`

`Content-Type` included `application/json` but the bytes were not JSON. The handler never ran. Fix the client, or omit that content type if you meant to send raw text (`ctx.body` will be a UTF-8 string, not a 415).

## `{ "error": "Payload Too Large" }`

The body is over `bodyLimit` (default 1 MB). The handler never ran, and Seltzer stopped reading. Pass `listen(port, { bodyLimit })` or `bodyLimit: 0` for unlimited.

## `{ "error": "Malformed path parameter" }`

A matched `:param` contained a bad percent-encoding (`%E0%A4`, `%ZZ`, a trailing `%`). That is 400, not 500. A bad encoding on a path that matches no route is still 404.

## `{ "error": "Method Not Allowed" }`

The path matches a route pattern, but not this method. The `Allow` header lists the methods that do. An unknown path is 404 and has no `Allow` header.

## `{ "error": "Missing required field: email" }`

`Route.contract.body` (or generated `ApiOperation.body`) marks `email` as `.required`. Empty string and whitespace count as missing. A number still counts as present. `execute` / the handler did not run. `ctx.valid` is not set by this stage. Several missing keys use `Missing required fields: …` in spec key order. A body that is not a plain object is `{ "error": "Request body must be an object" }`.

## `{ "error": "Validation failed", "issues": […] }`

That body comes from `validationError(issues)` inside `replace("validate")`, not from the default stage. `issues[].path` is an array of strings and numbers (`["email"]`, `["tags", 1]`, or `[]`). The handler did not run. `ctx.body` is still the raw input when the handler does run; the parsed value is `ctx.valid`. Replacing `validate` turns off `.required` for every route, including generated ones with no schema in your map.

## POST `ctx.body` is `undefined`

GET/HEAD skip the body. Other methods with an empty body are `undefined`. Non-JSON content types are a string, not an object — default `validate` then says “Request body must be an object” if `.required` keys exist.

Do not read `ctx.req` again; `parse` already consumed the stream.

## `client` throws `HttpError`

Non-2xx. Read `err.status`, `err.headers`, and `err.body` (parsed the same way as a success). This is expected for Seltzer’s own 404 JSON. 0.2.0 parsed that JSON as success. A deadline is `TimeoutError` (`code: "TIMEOUT"`). Aborting `options.signal` is `AbortError`. A connection failure is `NetworkError`. The client does not retry any of these.

## Client throws `SyntaxError` on success

The success `Content-Type` was JSON but the body was not. Or you pointed `baseUrl` at HTML. Text successes return a string when Content-Type is not JSON.

## `http://host:3000//notes`

That double slash was the old concatenation. The client now joins the boundary to one slash and keeps a base path. A trailing slash on the path itself is still a different URL.

## `listen` throws about Node

You imported Seltzer in a browser (or edge) runtime without `process.versions.node`. Use `fetch` on the frontend; run `listen` in Node.

## CORS errors in the Sig app

Pass `cors` to `listen`. Without it, there are no CORS headers and `OPTIONS` is a normal method. CORS headers are skipped when the request has no `Origin`. A mismatched `cors.origin` also skips headers. When `cors` is set, `OPTIONS` is 204 from `listen`, not from your routes. `Vary: Origin` is present when the allow-origin value is a specific origin, and absent when it is `*`. `credentials: true` with `origin: "*"` throws at startup.

## Extra CORS headers on `ResponseData` plus `listen({ cors })`

Usually redundant. `writeHead` on `ctx.res` throws. Put extra headers on the returned `ResponseData`.

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

## The server only answers on this machine

`listen(port)` binds `127.0.0.1`. Pass `host: "0.0.0.0"` (or `"::"`) when another machine or a container port-forward must connect. The old hello-world file `src/core/server/server.ts` was removed; edit `core/seltzer.ts`.

## Looking for `allowSelfSigned` or `undici`

Removed. The client uses global `fetch` and does not bypass certificate checks. Use a trusted certificate or `NODE_EXTRA_CA_CERTS`. KiwiPress still has its own WordPress fetch path for self-signed origins; that is not Seltzer's client.

## Suggested reading

- [Getting Started](./seltzer-getting-started.md)
- [JSON API tutorial](./seltzer-api-tutorial.md)
- [Status](./seltzer-status.md)
