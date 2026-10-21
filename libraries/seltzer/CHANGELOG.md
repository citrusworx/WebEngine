# @citrusworx/seltzer

## Unreleased

## 0.10.0

Published 2026-10-21.

### Minor Changes

- `app.handler()` returns a Node `(req, res) => void` request listener. Mount it with `http.createServer(app.handler())` or `https.createServer(tlsOptions, app.handler())`. It runs the same pipeline as `listen` (body limit, CORS / OPTIONS, logger, debug, strict `ResponseData`). `handleRequest` stays private. This call takes no arguments.
- `app.adapter(config)` stores `{ adapter, options }` and returns the app. `options` is copied onto `ctx.options`. `adapter` is unused inbound. Last call wins. This is the options stash.
- `app.handler(config)` still stores that config and returns the app, but it is deprecated. It forwards to `adapter(config)`. The first call in a process emits one `process.emitWarning` (`DeprecationWarning`, code `SELTZER_DEP_HANDLER_CONFIG`). The `init` / `listen` `logger` does not receive it. Node prints the warning to stderr unless a `warning` listener is attached or deprecation warnings are disabled. The alias will be removed in the next minor after 0.10.0.
- `Seltzer.init({ bodyLimit, cors, logger, debug, locals })` accepts those request options. `credentials: true` with `origin: "*"` throws at `init`. `listen` still accepts the same fields. A field passed to `listen` replaces the init value for that server only. `cors` is replaced as a whole object, not merged. An omitted field keeps the init value. `host`, port, and the three server timeouts stay on `listen`. A host-owned server does not receive those timeouts. Set `DEFAULT_HEADERS_TIMEOUT_MS`, `DEFAULT_REQUEST_TIMEOUT_MS`, and `DEFAULT_KEEP_ALIVE_TIMEOUT_MS` on it when you want Seltzer's defaults.
- Built-in HTTPS `listen` stays a non-goal. The bring-your-own-server recipe is how a host terminates TLS.

### Migrating

- Replace `app.handler({ adapter, options })` with `app.adapter({ adapter, options })`. `app.handler()` with no arguments is the request listener and stays.

## 0.9.0

### Minor Changes

Published 2026-10-21. Gates 1–7: loopback `listen`, the HTTP surface, strict `ResponseData`, `validate` / `ctx.valid`, `generateRoutes` unbound operations, the hardened client, and explicit non-goals. No runtime dependencies. `handleRequest` stays private.

### Migrating from 0.8.1

- `listen` defaults to `127.0.0.1`. Pass `host: "0.0.0.0"` when the process must accept connections from other machines.
- Server timeouts are on by default (headers 20s, request 30s, keep-alive 5s). `0` disables that timer.
- A known path with the wrong method is **405** with an `Allow` header, not 404. Unknown paths stay 404.
- Request bodies default to a 1 MB `bodyLimit`. A larger body is **413** and is not read to completion. `bodyLimit: 0` is unlimited.
- Malformed percent-encoding in a matched path parameter is **400**, not 500.
- `OPTIONS` is a 204 preflight only when `listen` is passed `cors`. Without `cors`, `OPTIONS` is an ordinary method.
- `Vary: Origin` is set when the allow-origin value is a specific origin, and omitted when it is `*`.
- `credentials: true` with `origin: "*"` throws at `listen`, before bind.
- Return `ResponseData`. `ctx.json`, `ctx.send`, `ctx.res` writes (`writeHead`, `end`, `write`, `setHeader`, assignment), and `replace("send")` throw.
- A thrown error no longer leaks `error.message`. The body is **500** `{ error: "Internal Server Error" }`. The error is logged. `listen({ debug: true })` adds the stack to that log only.
- String bodies use `Content-Type: text/plain; charset=utf-8`. `Buffer` and `Uint8Array` bodies use `application/octet-stream`, unless `Content-Type` is already set. Objects, arrays, numbers, booleans, and `null` stay JSON.
- Status **204** and **304**, and **HEAD** requests, send no body.
- `ctx.valid` is where a replacement `validate` stage puts parsed `{ body?, params?, query? }`. `validationError(issues)` returns 400 `{ error: "Validation failed", issues }`. The default `.required` stage does not set `ctx.valid`.
- `generateRoutes` takes `ApiOperation[]`. A name with neither `handlers[name]` nor `execute` throws `UnboundOperationsError` (`name method path`). Pass `unbound: "notImplemented"` to register those routes as 501 `{ error: "Not Implemented" }`.
- The client no longer depends on `undici`. `allowSelfSigned` is removed from `Endpoint`, `RequestContext`, and `HandlerConfig`. Certificate checks stay with Node.
- The client waits at most 30 seconds (`DEFAULT_CLIENT_TIMEOUT_MS`) unless `createClient({ timeout })` or `options.timeout` sets another value. `0` disables the timer. The client does not retry.
- URL join keeps one slash between `baseUrl` and `path` and preserves a base path (`/api/v1` + `users` → `/api/v1/users`).
- New client errors: `TimeoutError` (`TIMEOUT`), `AbortError` (`ABORTED`), `NetworkError` (`NETWORK`), and `UrlError` (`INVALID_URL`), alongside `HttpError` (`HTTP_ERROR`) with a parsed body.
- A string request body is sent as text (`text/plain; charset=utf-8`), not JSON. `Uint8Array` / `Buffer` are bytes. Objects, arrays, numbers, booleans, and `null` are still JSON.

## 0.8.1

### Patch Changes

- 815b941: Standalone packaging hygiene for à-la-carte consumers: npm description (small Node HTTP runtime), `engines.node` `>=18`, optional `undici` peer, and a README that leads with `init().route().listen()`. npm **0.8.0** shipped the HTTP core without that polish; **0.8.1** is the packaging/DX fix. No runtime behavior changes.

## 0.8.0

### Minor Changes

- npm **0.8.0** is the solidified core that git labeled **0.7.0**: default `validate` for `.required` body fields, `Seltzer#replace()`, and hardened outbound `client` (`HttpError`, JSON parsing, optional `allowSelfSigned`). Packaging/DX hygiene (description, engines, optional `undici` peer, standalone README) did not make this tarball. Versions 0.3–0.7 were never published.

## 0.7.0

### Minor Changes

- 5accf92: Harden outbound HTTP `client`: throw `HttpError` (status + body snippet) on non-2xx, parse JSON only for JSON successes, and support optional `allowSelfSigned` via undici Agent (KiwiPress pattern).
- 7634d3a: Default `validate` stage enforces `.required` body fields from `Route.contract` (copied by `generateRoutes` from `ApiOperation.body`). `Seltzer#replace(name, stage)` swaps a builtin so Nectarine can hang full contract checks. `before` is unchanged.

## 0.6.0

### Minor Changes

- 632d20f: `generateRoutes` maps Nectarine `ApiOperation[]` (from `listApiOperations`) onto object-based `Route`s. Handlers call host `execute` and return `ResponseData` (404 when a read finds nothing). Explicit transport results use `response(...)`. Static-prefix paths win over `:id`. Compatible with the Seltzer 0.5 pipeline.
- 2150bb9: Named HTTP request pipeline (`parse` → `context` → `route` → `validate` → `handle` → `response` → `send`) with `Seltzer#before(name, stage)` for inserting stages. `validate` is a no-op stub. Default listen/handle behavior is unchanged for `init().route().listen()`.
- 12ec2bc: Handlers return ResponseData; the runtime sends the HTTP response. Removed the writing ctx.json helper from RequestContext (breaking).

## 0.5.0

### Minor Changes

- Named HTTP request pipeline: `parse` → `context` → `route` → `validate` → `handle` → `response` → `send`.
- New public API: `Seltzer#before(name, stage)` inserts a stage immediately before a named builtin stage. Returning `ResponseData` short-circuits to `send`.
- `validate` is a named no-op stub (reserved for Nectarine).
- Default `init().route().listen()` behavior matches 0.4.0 (params, body, ResponseData, CORS, OPTIONS 204, errors).

## 0.4.0

### Minor Changes

- **Breaking:** Handlers must return `ResponseData` (`{ status?, headers?, body? }` or a Promise of it). The runtime `send`s the HTTP response. Bare objects/strings/arrays are not wrapped — invalid returns are a 500.
- **Breaking:** Removed the writing `ctx.json` helper from `RequestContext`. `req` / `res` remain on ctx for now, but normal responses should not touch `res`.
- Internal 404/400/500 paths use the same `send` path. Object/array bodies default to JSON with status `200` when omitted.

## 0.3.0

### Minor Changes

- Server listen supports parametric routes, JSON body parsing, async handlers, CORS options, and `locals` for app context
- Routes remain object-based via `.route({ method, path, handler })`

## 0.2.0

### Minor Changes

- Updates

## 0.1.0

### Minor Changes

- Added READMEs to each

## 0.0.2

### Patch Changes

- e7a1584: Release preparation
- e7a1584: Standardize library package manifests for independent publishing, align build outputs with published entrypoints, and add Changesets-based release automation for the monorepo.
