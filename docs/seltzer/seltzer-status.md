# Seltzer Status

Snapshot of `@citrusworx/seltzer` source against `libraries/seltzer/src`. Published npm is still **0.8.1**. The loopback `listen` default, server timeouts, removal of `src/core/server/server.ts`, strict `ResponseData` serialization, and the generic thrown-error body are in this tree and ship in the next minor; they are not in the 0.8.1 tarball.

The goal is the same as Juice’s and Sig.js’s maturity writing: make it easy to answer what is ready today, what is usable but still evolving, and what is still a design-doc future.

**0.8.x is the HTTP core.** The inspected 0.8.1 runtime includes default `validate`, `replace`, and the current `client`. The package declares `engines.node` `>=18` and has no runtime dependencies: the client uses global `fetch` only. Earlier 0.2.0 examples use a different API; do not mix those examples with current handler contracts. The [HTTP course source map](./http-course/source-map.md) records the baseline and capability boundaries used by the lessons. The slash-safe client, 30s deadline, and abort errors are in this tree and ship in the next minor; they are not in the 0.8.1 tarball.

Related: [Roadmap](./seltzer-roadmap.md). [API](./seltzer-api.md). [JSON API tutorial](./seltzer-api-tutorial.md).

## Maturity levels

### `Stable-ish`

The feature is usable today, central to the Seltzer experience, and unlikely to change dramatically in basic concept. Pre-1.0 still means the package version can move; the *idea* is settled.

### `Emerging`

The feature is useful and present, but the API, conventions, or implementation details are still likely to evolve.

### `Early`

The feature exists, but it is still exploratory, incomplete, or not yet something Seltzer should strongly promise as a finished public surface.

### `Draft`

The feature is more of a direction than a hardened part of the runtime.

## Matrix

| Area | Maturity | Notes |
|---|---|---|
| `Seltzer.init()` / `.route()` / `.listen()` | Stable-ish | Identity of the package. Node `http`. `listen` returns `Server`. Default bind `127.0.0.1`. `host` opts into another interface. Header, request, and keep-alive timeouts are on. `server.close()` stops accept. |
| Named pipeline | Stable-ish | `parse` → `send`. `before` / `replace`. Mutation in place. |
| Parametric match + static-prefix rank | Stable-ish | `/items/new` beats `/items/:id`. Params are `decodeURIComponent`. A trailing slash is a different path. Malformed `%` encoding on a matched param is 400. Known path + wrong method is 405 + `Allow`; unknown paths stay 404. |
| JSON `parse` + 400 on bad JSON | Stable-ish | GET/HEAD skip body. Empty body is `undefined`. Non-JSON content types are a UTF-8 string, not 415. Default body limit is 1 MB (`bodyLimit`, `0` unlimited); over the limit is 413 and reading stops. |
| `ResponseData` + `send` | Stable-ish | Handlers and hooks return `ResponseData`. Bare values are 500 and are logged (route + returned value). Strings are `text/plain; charset=utf-8`, JSON values are `application/json`, buffers are `application/octet-stream`, unless `Content-Type` is set. 204, 304, and HEAD send no body. Thrown errors are a generic 500; the error is logged, stack only with `listen({ debug: true })`. `logger` defaults to `console.error`. No `ctx.json` / `ctx.send`. Writing `ctx.res` throws. `replace("send")` throws. |
| Default `validate` (`.required`) | Emerging | Presence-only. Does not set `ctx.valid`. Failure stays `Missing required field` / `Request body must be an object`. |
| Replacement `validate` | Emerging | `replace("validate")` sets `ctx.valid` and returns `validationError(issues)`. `path` is `(string \| number)[]`. Zod is an app dependency, documented as that replacement. No schema field on `Route` or `generateRoutes`. |
| `generateRoutes` | Emerging | `ApiOperation[]` in, `Route[]` out. `handlers[name]` or catch-all `execute`. Unbound names throw at generation (`name method path`) unless `unbound: "notImplemented"` (501). Copies YAML `contract.body` for the default stage. Does not import Nectarine. |
| CORS / OPTIONS 204 | Stable-ish | Off unless `listen({ cors })`. Configured preflight is 204 before the pipeline. `Vary: Origin` when allow-origin is a specific origin, not `*`. `credentials: true` with `origin: "*"` throws at `listen`. |
| `client.*` + `HttpError` | Stable-ish | Global `fetch` only. Slash-safe join, query encoding, 30s deadline (`0` disables), caller `AbortSignal`. No retries. `HttpError` / `TimeoutError` / `AbortError` / `NetworkError` / `UrlError`. |
| `.handler()` options | Early | Copied to `ctx.options`. `adapter` unused inbound. |
| Tests | Stable-ish | Vitest: listen, pipeline, router, validate, generate, client, HTTP-surface, strict `ResponseData`, validate-stage, generate-routes, and client conformance. The YAML → listen proof is in WebEngine. |
| HTTPS listen / `app.use` / form bodies | Draft | Not in source. |
| Response-shape validation | Draft | Not in the pipeline. Hosts can check inside `replace("validate")` or the handler. |

## What is shipped

| Area | Source | Notes |
|---|---|---|
| `Seltzer.init()` | `core/seltzer.ts` | `new Seltzer()` |
| `.route()` | same | `compileRoute` |
| `.before()` / `.replace()` | same + `pipeline/index.ts` | |
| `.handler()` | same | stores config |
| `.listen(port, options?)` | same | returns `http.Server`. Default host `127.0.0.1`. Timeouts: headers 20s, request 30s, keep-alive 5s. Body limit 1 MB. CORS only when `cors` is set. `logger` defaults to `console.error`. `debug` is off. |
| Stages | `pipeline/stages.ts` | parse…send |
| Matcher | `pipeline/router.ts` | rank + params |
| `ResponseData` / `send` / `response()` | `core/response.ts` | string, JSON, or bytes. 204, 304, and HEAD send no body. |
| `validationError()` | `core/validation.ts` | 400 `{ error: "Validation failed", issues }`. `path` is `(string \| number)[]`. |
| `generateRoutes` | `generate/generate-routes.ts` | |
| `client` / `createClient` / `HttpError` | `core/client/client.ts` | 30s default. No retries. No `undici`. |
| Example server | `src/example.ts` | GET `/` |

`Seltzer.listen` in `core/seltzer.ts` is the only listener. The leftover hello-world `src/core/server/server.ts` was removed.

## Myths that closed (0.2.0 docs → 0.8.1)

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
- typed `client` generics

## Early or draft areas

- HTTPS `listen`
- `after` / remove stage
- form-urlencoded / multipart
- first-class file/stream responses beyond string/Buffer bodies
- custom 404 envelope for hand-written unmatched routes (generated routes already take `notFound`)

They can be valuable later. They should not appear as if they shipped.

## Tests

```bash
yarn workspace @citrusworx/seltzer test
yarn workspace @citrusworx/seltzer build
yarn workspace @citrusworx/seltzer typecheck
```

## Recommended positioning right now

> Seltzer 0.8.x is a small Node HTTP runtime with object routes, `ResponseData` handlers, and a named request pipeline. It parses JSON, matches `/resources/:id`, validates `.required` body fields (presence only, `ctx.valid` left unset), and maps Nectarine `ApiOperation[]` through `generateRoutes`. Richer checks are `replace("validate")` plus `validationError()`; Zod is not a Seltzer dependency. It is not Express, and it is not the 0.2.0 `ctx.json` listener.

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

## Suggested reading

- [README](./README.md)
- [JSON API tutorial](./seltzer-api-tutorial.md)
- [Getting Started](./seltzer-getting-started.md)
- [Roadmap](./seltzer-roadmap.md)
- [Troubleshooting](./seltzer-troubleshooting.md)
