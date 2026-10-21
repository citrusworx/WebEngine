# Seltzer Status

Snapshot of `@citrusworx/seltzer` **0.10.0**, published 2026-10-21. `libraries/seltzer/package.json` is **0.10.0**. 0.10.0 adds no-arg `app.handler()` and moves the options stash to `app.adapter(config)` ([changelog](../../libraries/seltzer/CHANGELOG.md)). `handler(config)` remains a deprecated alias, removed in the next minor after 0.10.0. `handleRequest` is still private.

The goal is the same as Juice’s and Sig.js’s maturity writing: make it easy to answer what is ready today, what is usable but still evolving, and what is still a design-doc future.

**0.9.0 is the HTTP core.** It includes loopback `listen`, server timeouts, default `validate`, `replace`, strict `ResponseData`, and the fetch client. **0.10.0** adds no-arg `app.handler()` and `app.adapter(config)`. The package declares `engines.node` `>=18` and has no runtime dependencies: the client uses global `fetch` only. Earlier 0.2.0 examples use a different API; do not mix those examples with current handler contracts. The [HTTP course source map](./http-course/source-map.md) records the baseline and capability boundaries used by the lessons.

Related: [Roadmap](./seltzer-roadmap.md). [API](./seltzer-api.md). [JSON API tutorial](./seltzer-api-tutorial.md). [Changelog](../../libraries/seltzer/CHANGELOG.md).

## Maturity levels

These five labels are the only ones this matrix uses.

### `Stable`

The behavior in the row is what this tree documents, and a conformance test under `libraries/seltzer/src` covers that surface. Pre-1.0 still means a later minor can change it. The tests lock the behavior the row describes. `app.handler()` is Stable and shipped in 0.10.0.

### `Emerging`

The feature ships in 0.9.0 and is safe to call, and the API or an uncovered edge is still likely to move. A conformance file may exist and still leave part of the documented surface untested. The client stays Emerging for that reason.

### `Draft`

The direction is written down. 0.9.0 does not offer it as a finished public surface.

### `Not yet`

Absent from 0.9.0, and not ruled out. A later design can add it. This is not a refusal.

### `Non-goal`

The package will not grow this. The alternative is in [Non-goals](../../libraries/seltzer/README.md#non-goals).

## Matrix

| Area | Maturity | Notes |
|---|---|---|
| `Seltzer.init()` / `.route()` / `.listen()` | Stable | Identity of the package. Node `http`. `listen` returns `Server`. Default bind `127.0.0.1`. `host` opts into another interface. Header, request, and keep-alive timeouts are on. `server.close()` stops accept. Covered by `core-api.conformance.test.ts`. |
| Named pipeline | Stable | `parse` → `send`. `before` / `replace`. Mutation in place. Unknown stage names throw. Covered by `core-api.conformance.test.ts`. |
| Parametric match + static-prefix rank | Stable | `/items/new` beats `/items/:id`. Params are `decodeURIComponent`. A trailing slash is a different path. Malformed `%` encoding on a matched param is 400. Known path + wrong method is 405 + `Allow`; unknown paths stay 404. Covered by `http-surface.conformance.test.ts`. |
| JSON `parse` + 400 on bad JSON | Stable | GET/HEAD skip body. Empty body is `undefined`. Non-JSON content types are a UTF-8 string, not 415. Default body limit is 1 MB (`bodyLimit`, `0` unlimited); over the limit is 413 and reading stops. Covered by `http-surface.conformance.test.ts`. |
| `ResponseData` + `send` | Stable | Handlers and hooks return `ResponseData`. Bare values are 500 and are logged (route + returned value). Strings are `text/plain; charset=utf-8`, JSON values are `application/json`, buffers are `application/octet-stream`, unless `Content-Type` is set. 204, 304, and HEAD send no body. Thrown errors are a generic 500; the error is logged, stack only with `listen({ debug: true })`. `logger` defaults to `console.error`. No `ctx.json` / `ctx.send`. Writing `ctx.res` throws. `replace("send")` throws. Covered by `response-data.conformance.test.ts`. |
| Default `validate` (`.required`) | Stable | Presence-only. Does not set `ctx.valid`. Failure stays `Missing required field` / `Request body must be an object`. That narrow contract is what `validate.conformance.test.ts` locks. |
| Replacement `validate` | Emerging | `replace("validate")` can set `ctx.valid` and return `validationError(issues)`. `path` is `(string \| number)[]`. Zod is an app dependency, documented as that replacement, and is not installed here. No schema field on `Route` or `generateRoutes`. The helpers are tested; the host schema integration is still the part that moves. |
| `generateRoutes` | Stable | `ApiOperation[]` in, `Route[]` out. `handlers[name]` or catch-all `execute`. Unbound names throw at generation (`name method path`) unless `unbound: "notImplemented"` (501). Copies YAML `contract.body` for the default stage. Does not import Nectarine. Covered by `generate-routes.conformance.test.ts`. The YAML → `listen` proof is in WebEngine. |
| CORS / OPTIONS 204 | Stable | Off unless `init({ cors })` or `listen({ cors })`. A `listen` cors object replaces the init object. Configured preflight is 204 before the pipeline. `Vary: Origin` when allow-origin is a specific origin, not `*`. `credentials: true` with `origin: "*"` throws at `init` or at `listen` when that call passes it. Covered by `http-surface.conformance.test.ts` and `handler.conformance.test.ts`. |
| `client.*` + `HttpError` | Emerging | Global `fetch`. `client.conformance.test.ts` covers slash-safe join, query encoding, the 30s deadline, caller abort, and `HttpError` / `TimeoutError` / `AbortError` / `NetworkError` / `UrlError`. The result is still `unknown`. Documented edges outside that file: ignored `endpoint`, `FormData` rejection, `Buffer` bodies, the error snippet. No retries. Stays Emerging. |
| `app.adapter()` | Emerging | `adapter(config)` stores `{ adapter, options }` and returns the app. `options` is copied onto `ctx.options`. The `adapter` string is unused inbound. This is not the request listener. `handler(config)` is a deprecated alias: it forwards, and the first call in a process emits one warning, code `SELTZER_DEP_HANDLER_CONFIG`. That alias will be removed in the next minor after 0.10.0. The stash behavior is covered by `handler.conformance.test.ts`. The row stays Emerging because the stored adapter name still has no inbound effect. The listener is a different row. |
| Tests | Stable | Vitest: listen, pipeline, router, validate, generate, client, HTTP-surface, strict `ResponseData`, validate-stage, generate-routes, client conformance, the urlencoded recipe on `127.0.0.1`, `handler.conformance.test.ts` (bring-your-own server, HTTPS fixture, init/listen precedence, listen/handler parity), and the README docs-drift check. The YAML → listen proof is in WebEngine. |
| HTTPS listen, `app.use`, form/multipart, sessions, cookies, static files, templating, client retries, ORM | Non-goal | [Non-goals](../../libraries/seltzer/README.md#non-goals). Urlencoded fields are a host `URLSearchParams` recipe. |
| Streaming responses / WebSockets | Not yet | No stream or socket API. A `Buffer` body is still one payload. Possible later. |
| `app.handler()` | Stable | No-arg `app.handler()` returns `(req, res) => void`. `http.createServer(app.handler())` and `https.createServer(tls, app.handler())` run the same pipeline as `listen`. `handleRequest` stays private. Listen overrides do not change a listener from `handler()`. Host-owned servers own their timeouts (`DEFAULT_HEADERS_TIMEOUT_MS`, `DEFAULT_REQUEST_TIMEOUT_MS`, `DEFAULT_KEEP_ALIVE_TIMEOUT_MS`). Covered by `handler.conformance.test.ts`. Shipped in 0.10.0. |
| `after` / remove stage | Draft | Not in the pipeline API. `before` and `replace` are the extension points. |
| Custom 404 envelope for hand-written routes | Draft | Unmatched hand-written paths use the builtin 404. Generated routes already take `notFound`. |
| Response-shape validation | Draft | Not in the pipeline. Hosts can check inside `replace("validate")` or the handler. |

## What is shipped

| Area | Source | Notes |
|---|---|---|
| `Seltzer.init(options?)` | `core/seltzer.ts` | `new Seltzer()`. Optional `bodyLimit`, `cors`, `logger`, `debug`, `locals`. |
| `.route()` | same | `compileRoute` |
| `.before()` / `.replace()` | same + `pipeline/index.ts` | |
| `.adapter(config)` | same | stores config and returns the app. Not a request listener. |
| `.handler()` | same | Node request listener only. Same pipeline as `listen`. Uses `init` options. Does not set timeouts. `handler(config)` is a deprecated alias of `adapter(config)`. |
| `.listen(port, options?)` | same | `http.createServer` of that listener, loopback `127.0.0.1`, timeouts 20s / 30s / 5s. A passed `bodyLimit`, `cors`, `logger`, `debug`, or `locals` replaces the `init` value for that server. `cors` is not merged field by field. |
| Stages | `pipeline/stages.ts` | parse…send |
| Matcher | `pipeline/router.ts` | rank + params |
| `ResponseData` / `send` / `response()` | `core/response.ts` | string, JSON, or bytes. 204, 304, and HEAD send no body. |
| `validationError()` | `core/validation.ts` | 400 `{ error: "Validation failed", issues }`. `path` is `(string \| number)[]`. |
| `generateRoutes` | `generate/generate-routes.ts` | |
| `client` / `createClient` / `HttpError` | `core/client/client.ts` | 30s default. No retries. No `undici`. |
| Example server | `src/example.ts` | GET `/` |

`listen` is the only method that binds a socket. No-arg `handler()` is the request listener that `listen` passes to `http.createServer`. The leftover hello-world `src/core/server/server.ts` was removed.

## Myths that closed (0.2.0 docs → 0.9.0)

| Old claim | Now |
|---|---|
| No body parser | `parse` JSON / raw; 400 on bad JSON |
| No `:id` | Parametric compile + `ctx.params` |
| No pipeline | Named stages + `before` / `replace` |
| Handler return discarded | Must return `ResponseData`; runtime sends |
| Use `ctx.json` | Removed (breaking in 0.4.0) |
| Pipeline is a design elective | Shipped core |
| Nectarine is copy-only | `listApiOperations` + `generateRoutes` |
| No CORS | `listen({ cors })` + OPTIONS 204 |
| `client` always `res.json()`, no `ok` check | `HttpError` with parsed body; JSON, text, or bytes |
| `allowSelfSigned` / optional `undici` | Removed. Global `fetch` only. KiwiPress keeps its own TLS path |
| No tests | Vitest suite |
| `listen` returns `void` | Returns `http.Server`. `server.close()` stops accepting |
| `listen(port)` binds every interface | Default host is `127.0.0.1`. Public bind is `host: "0.0.0.0"` |

## Strongest areas

- `init` → `route` → `listen` with `ResponseData`
- named pipeline you can insert/replace without `next()`
- parametric routes with static-prefix preference
- `generateRoutes` as the Nectarine join
- `client` that fails loudly on 4xx/5xx

These form the case for Seltzer as the ecosystem’s HTTP engine, not a thin `createServer` wrapper.

## Most promising emerging areas

- host schema libraries via `replace("validate")` (Seltzer does not depend on Zod) without changing handler signatures
- `generateRoutes` covering more write operations in hosts
- outbound `client` (join, deadline, and error classes are tested; the result is still `unknown`)

## Draft areas

- `after` / remove stage
- custom 404 envelope for hand-written unmatched routes (generated routes already take `notFound`)
- response-shape validation

They can be valuable later. They should not appear as if they shipped. HTTPS listen, `app.use`, and form or multipart parsing are [non-goals](../../libraries/seltzer/README.md#non-goals), not drafts.

## Not yet

- streaming responses (a `Readable` is not a stream)
- WebSockets

Streaming and WebSockets are absent, and they are not refusals. See [Non-goals](../../libraries/seltzer/README.md#not-yet-streaming-responses-and-websockets). `handleRequest` stays private. Hosts mount a server with no-arg `app.handler()`, which is Stable and shipped in 0.10.0.

## Non-goals

Hard boundaries (no `app.use`, no HTTPS `listen`, no form or multipart parser, no sessions, cookies, static files, or templating, no client retries, no ORM) are the package [Non-goals](../../libraries/seltzer/README.md#non-goals). Zero runtime dependencies is the stance there. They should not reappear here as Draft.

## Tests

```bash
yarn workspace @citrusworx/seltzer test
yarn workspace @citrusworx/seltzer build
yarn workspace @citrusworx/seltzer typecheck
```

## Recommended positioning right now

> Seltzer 0.10.0 is a small Node HTTP runtime with object routes, `ResponseData` handlers, and a named request pipeline. It parses JSON, matches `/resources/:id`, validates `.required` body fields (presence only, `ctx.valid` left unset), and maps Nectarine `ApiOperation[]` through `generateRoutes`. Richer checks are `replace("validate")` plus `validationError()`; Zod is not a Seltzer dependency. It is not Express, and it is not the 0.2.0 `ctx.json` listener. `listen(port)` binds `127.0.0.1`. No-arg `app.handler()` is the request listener for a host-owned server. `app.adapter(config)` stores options.

Less accurate positioning:

- a middleware framework
- an unimplemented design essay
- automatic SQL from YAML (that is Nectarine’s compiler + host `execute`)

## Practical interpretation

If you are building with Seltzer today:

- return `{ body }` (and `status` / `headers` when needed). Do not write `ctx.res`, `ctx.json`, or `ctx.send`
- pass `logger` to `listen` when `console.error` is the wrong place for handler failures. `debug: true` adds stacks to that log only
- use `ctx.params` / `ctx.body` / `ctx.query`. `ctx.valid` stays unset unless your `replace("validate")` assigns it
- generate routes from operations; bind every name (`handlers` or `execute`) or pass `unbound: "notImplemented"`; replace `validate` when contracts grow, and dispatch on the route inside that stage
- catch `HttpError` on `client.*`. A deadline is `TimeoutError`, a caller abort is `AbortError`, and a dropped connection is `NetworkError`. The client does not retry
- treat `ctx.json` and “no `:id`” as outdated docs, not APIs
- pass `host: "0.0.0.0"` when the process must accept connections from other machines. `listen(port)` binds `127.0.0.1`
- call `server.close()` to stop accepting. Idle keep-alive sockets delay the close callback until `keepAliveTimeout` unless you also call `server.closeIdleConnections()`
- mount your own `http.Server` or `https.Server` with no-arg `app.handler()`. Set `DEFAULT_HEADERS_TIMEOUT_MS`, `DEFAULT_REQUEST_TIMEOUT_MS`, and `DEFAULT_KEEP_ALIVE_TIMEOUT_MS` on that server when you want Seltzer's timers. `listen` does not speak TLS. No-arg `app.handler()` shipped in 0.10.0

## Suggested reading

- [README](./README.md)
- [JSON API tutorial](./seltzer-api-tutorial.md)
- [Getting Started](./seltzer-getting-started.md)
- [Roadmap](./seltzer-roadmap.md)
- [Troubleshooting](./seltzer-troubleshooting.md)
