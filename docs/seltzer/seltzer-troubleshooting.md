# Seltzer Troubleshooting

The usual “why didn’t it answer?” cases against `libraries/seltzer/src`.

Related: [Anti-patterns](./seltzer-anti-patterns.md), [Request and response](./seltzer-request-response.md), [Routing](./seltzer-routing.md).

## curl hangs

**Most likely:** the handler matched but never called `ctx.json` or `ctx.res.end`.

Check every branch, including validation `return`s. Returning `{ body }` does not send.

**Also likely:** `await` without a following write, or an async throw (`listen` does not catch it, so you may hang *and* see an unhandled rejection).

## `{ "error": "Not Found" }` when the handler exists

Matching is exact and case-sensitive.

| You registered | Request | Result |
|---|---|---|
| `GET` `/notes` | `POST /notes` | 404 |
| `/notes` | `/notes/` | 404 |
| `/notes/:id` | `/notes/1` | 404 |
| `get` `/health` | `GET /health` | 404 (`req.method` is `"GET"`) |

Log `req.method` and `url.pathname` in a throwaway handler if you are stuck. Duplicate routes: first registration wins; the second never runs.

## POST body is empty or `undefined`

You did not read the stream. There is no `ctx.body`. See [tutorial](./seltzer-api-tutorial.md) step 3.

`JSON.parse("")` throws — treat empty raw as `null` if that is what you want.

## `JSON.stringify` / circular value crash

`ctx.json` does not catch stringify errors. Keep handler payloads plain data.

## Client throws `SyntaxError: Unexpected token`

`client.*` always `res.json()`. A 500 HTML page, empty body, or `text/plain` will throw. Point `baseUrl` at the Seltzer process, not a random URL.

## Client returns `{ error: "Not Found" }` instead of throwing

That is a successful JSON parse of Seltzer’s 404. Check the payload or use `fetch` + `response.ok`.

## `http://host:3000//notes`

`baseUrl` had a trailing slash and `path` had a leading slash. Concatenation does not join paths.

## `listen` throws about Node

You imported Seltzer in a browser (or edge) runtime without `process.versions.node`. Use `fetch` on the frontend; run `listen` in Node.

## CORS errors in the Sig app

Seltzer sends no CORS headers. `ctx.json` cannot add them. Write `writeHead` yourself and register `OPTIONS`. See [Integration](./seltzer-integration.md).

## Port already in use

`listen` does not handle `EADDRINUSE`. Nothing in the library retries or picks a free port.

## Cannot close the server in tests

`listen` does not return `http.Server`. There is no `app.close()`. Process exit, or wrap `http.createServer` yourself (that is no longer “using listen”).

## Nectarine route did not appear

`registerRoute` did not call `.route`. The YAML node may be nested under `user`. Parametric `endpoint` values will not match. Copy exact pairs; walk `parser.yaml`.

## Changes to `server.ts` did nothing

`src/core/server/server.ts` is not used by `Seltzer.listen`. Edit `core/seltzer.ts`.

## Suggested reading

- [Getting Started](./seltzer-getting-started.md)
- [JSON API tutorial](./seltzer-api-tutorial.md)
- [Status](./seltzer-status.md)
