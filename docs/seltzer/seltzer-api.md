# Seltzer API Reference

Public surface of `@citrusworx/seltzer` **0.9.0** as implemented in `libraries/seltzer/src`.

This page is the compact contract. For the mental model, start with [Request and response](./seltzer-request-response.md), [Routing](./seltzer-routing.md), [Pipeline](./seltzer-pipeline.md), [Generate routes](./seltzer-generate.md), and [Client](./seltzer-client.md).

Exports from the package root (`libraries/seltzer/src/index.ts`):

- `Seltzer`
- `STAGE_NAMES`
- `client`, `createClient`, `resolveRequestUrl`, `HttpError`, `TimeoutError`, `AbortError`, `NetworkError`, `UrlError`
- `generateRoutes`, `UnboundOperationsError`
- `response`, `send`, `isResponseData`, `isExplicitResponse`, `validationError`
- types: `Route`, `RouteContract`, `RequestContext`, `ValidatedInput`, `ValidationIssue`, `Endpoint`, `ClientCallOptions`, `HostOptions`, `QueryInput`, `ListenOptions`, `CorsOptions`, `ResponseData`, `PipelineContext`, `Stage`, `StageName`, `ApiOperation`, `ExecuteArgs`, `GenerateRoutesOptions`, `HttpMethod`, `OperationHandler`, `UnboundOperationPolicy`, `ClientConfig`, `SeltzerClient`
- listen defaults: `DEFAULT_LISTEN_HOST`, `DEFAULT_HEADERS_TIMEOUT_MS`, `DEFAULT_REQUEST_TIMEOUT_MS`, `DEFAULT_KEEP_ALIVE_TIMEOUT_MS`, `DEFAULT_BODY_LIMIT_BYTES`, `DEFAULT_CLIENT_TIMEOUT_MS` (`30000`, same number as the request timeout)
- `InitOptions`

There are no subpath exports. `HandlerConfig` is used by `.adapter(config)` but is not re-exported from the package root. `handler(config)` is a deprecated alias of that call.

## `Seltzer.init`

```ts
static init<TLocals = unknown>(options?: InitOptions<TLocals>): Seltzer
```

Returns `new Seltzer()`. Empty route list, default pipeline, `config === null`.

`options` may set `bodyLimit`, `cors`, `logger`, `debug`, and `locals`. Those apply to `listen` and to no-arg `handler()`. `credentials: true` with `origin: "*"` throws here, before any server exists. A non-integer or negative `bodyLimit` throws here when you pass it. `host` and the three server timeouts are not `init` options.

```ts
import { Seltzer } from "@citrusworx/seltzer";

const app = Seltzer.init();
```

## `route`

```ts
route<TContext extends RequestContext = RequestContext>(route: Route<TContext>): this
```

Compiles the path (`:param` → regex) and pushes onto a private array. Returns `this`.

```ts
app.route({
  method: "GET",
  path: "/health",
  handler: (): ResponseData => ({ body: { ok: true } }),
});
```

## `before` / `replace`

```ts
before(name: StageName, stage: Stage): this
replace(name: StageName, stage: Stage): this
```

`before` inserts immediately before the named builtin. `replace` swaps that builtin (later `before` still finds it). Returning `ResponseData` from a stage jumps to `send`. See [Pipeline](./seltzer-pipeline.md).

## `handler`

```ts
handler(): (req: IncomingMessage, res: ServerResponse) => void
```

Returns a Node request listener. Mount it on a server the host owns:

```ts
http.createServer(app.handler())
https.createServer(tlsOptions, app.handler())
```

That listener runs the same pipeline as `listen`: `parse` → `context` → `route` → `validate` → `handle` → `response` → `send`. It applies `bodyLimit`, CORS / `OPTIONS` 204, `logger`, `debug`, `locals`, and the strict `ResponseData` checks. It reads those from `init`. A field passed to `listen` does not change this listener. It does not bind a port and it does not set `headersTimeout`, `requestTimeout`, or `keepAliveTimeout`. Copy `DEFAULT_HEADERS_TIMEOUT_MS`, `DEFAULT_REQUEST_TIMEOUT_MS`, and `DEFAULT_KEEP_ALIVE_TIMEOUT_MS` onto the host server when you want Seltzer's timers. See [Bring your own server](../../libraries/seltzer/README.md#bring-your-own-server).

`handleRequest` stays private. Pass the listener in. There is no method that accepts an already-built server.

`handler()` does not take a config object. Storing options is `adapter(config)`.

### Deprecated: `handler(config)`

```ts
handler(config: {
  adapter: string;
  options: { baseUrl?: string; headers?: Record<string, string> };
}): this
```

This overload is deprecated. It forwards to `adapter(config)`, stores the same object, and returns the app. The first call in a process emits one `process.emitWarning` (`DeprecationWarning`, code `SELTZER_DEP_HANDLER_CONFIG`). The `init` / `listen` `logger` does not receive it. It will be removed in the next minor after 0.10.0. Editors flag the overload because the signature is marked `@deprecated`. `handler()` with no arguments does not warn.

## `adapter`

```ts
adapter(config: {
  adapter: string;
  options: { baseUrl?: string; headers?: Record<string, string> };
}): this
```

Stores `config` and returns this app. `listen` and `handler()` copy `config.options` onto `ctx.options`. The `adapter` string is unused inbound. Last `adapter()` wins. This is not a request listener. KiwiPress uses it to stash a base URL. It does not mount HTTP. On the published 0.9.0 tarball this stash is still named `handler(config)`. `adapter()` arrives with unreleased 0.10.0.

## `listen`

```ts
listen<TLocals = unknown>(port: number, options?: ListenOptions<TLocals>): http.Server
```

Throws `Seltzer.listen requires a Node.js runtime.` when `process.versions.node` is missing.

Creates `http.createServer` with the same listener `handler()` returns, applies the loopback default and the timeout defaults, and returns that `http.Server`.

`bodyLimit`, `cors`, `logger`, `debug`, and `locals` passed here replace the `init` values for this server only. An omitted field keeps the `init` value. `cors` is replaced as a whole object, not merged field by field. `app.handler()` keeps the `init` values.

CORS runs only when the effective `cors` is set. A configured `OPTIONS` preflight is 204 before the pipeline.

**Shipped in 0.9.0:** the default bind is `127.0.0.1`, not Node's all-interfaces default. Pass `host: "0.0.0.0"` or `host: "::"` to accept connections from other machines. An empty `host` throws.

Header, request, and keep-alive timeouts are on:

| Option | Default | Meaning |
|---|---|---|
| `headersTimeout` | `20000` | Milliseconds to receive complete headers. `0` disables. |
| `requestTimeout` | `30000` | Milliseconds for the whole request, including the body. `0` disables. Must be `0` or `>= headersTimeout`. |
| `keepAliveTimeout` | `5000` | Idle keep-alive before the socket is destroyed. `0` disables. Must be `< headersTimeout` when headers timeout is on. |

Those numbers are `DEFAULT_HEADERS_TIMEOUT_MS`, `DEFAULT_REQUEST_TIMEOUT_MS`, and `DEFAULT_KEEP_ALIVE_TIMEOUT_MS`. `DEFAULT_LISTEN_HOST` is `"127.0.0.1"`. Non-integers and negative timeouts throw before the server binds. The legacy `server.timeout` is left at Node's `0` so it does not fight `requestTimeout`.

`bodyLimit` defaults to `DEFAULT_BODY_LIMIT_BYTES` (`1048576`, 1 MB). `0` means unlimited. A non-integer or negative value throws before the server binds. A request body over the limit is **413** `{ error: "Payload Too Large" }` and Seltzer stops reading it. GET and HEAD are not limited because their bodies are skipped.

`onListening(port)` receives the bound TCP port (`listen(0)` reports the ephemeral port). When `onListening` is omitted, the default log is `Seltzer server listening on http://<host>:<port>`.

`logger` receives one string when a handler or hook returns a non-`ResponseData` value or throws. The default is `console.error`. `debug: true` appends the stack of a thrown error to that string. The HTTP body of a thrown error stays `{ error: "Internal Server Error" }`.

Shutdown is the returned server:

```ts
const server = app.listen(3000);
server.close((error) => {
  // accepting has stopped; existing requests can finish
});
```

`close()` waits for open connections. Idle keep-alive clients hold that callback until `keepAliveTimeout` unless the host also calls `server.closeIdleConnections()`. Seltzer does not install `SIGTERM` handlers.

```ts
type ListenOptions<TLocals = unknown> = {
  host?: string;
  locals?: TLocals;
  cors?: CorsOptions;
  bodyLimit?: number;
  headersTimeout?: number;
  requestTimeout?: number;
  keepAliveTimeout?: number;
  onListening?: (port: number) => void;
  /** One formatted line per failed handler or hook. Default `console.error`. */
  logger?: (message: string) => void;
  /** Include stack traces in `logger` output. Off by default. Never changes the HTTP body. */
  debug?: boolean;
};

type CorsOptions = {
  origin?: string;
  methods?: string[];
  headers?: string[];
  maxAge?: number;
  credentials?: boolean;
};
```

CORS is **off** unless `init` or `listen` is passed `cors`. No effective `cors` means no `Access-Control-*` headers, and `OPTIONS` is an ordinary method (a route, 405, or 404).

When `cors` is set, `OPTIONS` is **204** with an empty body before the pipeline, including unknown paths. Other methods still run the pipeline, with CORS headers added when the request has `Origin`.

If `cors.origin` is a specific origin, it must equal that `Origin`. `"*"` sends `Access-Control-Allow-Origin: *`. Omit `origin` to reflect the request `Origin`. Default methods: `GET,POST,PUT,PATCH,DELETE,OPTIONS`. Default headers: `Content-Type`. `maxAge` sets `Access-Control-Max-Age` (seconds); omit it to leave the header off. `credentials: true` sends `Access-Control-Allow-Credentials: true` and **throws at `init` or `listen`** when that call combines it with `origin: "*"`.

`Vary: Origin` is set when the allow-origin value is a specific origin (configured or reflected). It is omitted when the value is `*`. A request with no `Origin`, or an origin that does not match a configured one, gets no CORS headers. The application request is not rejected with 403.

## `RequestContext`

```ts
type ValidatedInput<TBody = unknown, TParams = unknown, TQuery = unknown> = {
  body?: TBody;
  params?: TParams;
  query?: TQuery;
};

type RequestContext<TLocals = unknown, TValid extends ValidatedInput = ValidatedInput> = {
  req: IncomingMessage;
  res: ServerResponse;
  method: string;
  path: string;
  query: Record<string, string>;
  params: Record<string, string>;
  body: unknown;
  /** Set by a replacement `validate` stage. The default stage leaves this unset. */
  valid?: TValid;
  headers: Record<string, string>;
  locals: TLocals;
  options?: { baseUrl?: string; headers?: Record<string, string> };
};
```

## `Route` / `RouteContract`

```ts
type RouteContract = {
  resource?: string;
  name?: string;
  body?: Record<string, string>;
};

type Route<TContext = RequestContext> = {
  method: string;
  path: string;
  handler: (ctx: TContext) => ResponseData | Promise<ResponseData>;
  contract?: RouteContract;
};
```

## `ResponseData` helpers

```ts
type ResponseData = { status?: number; headers?: Record<string, string>; body?: unknown };

function isResponseData(value: unknown): value is ResponseData;
function response(data: ResponseData): ResponseData;
function isExplicitResponse(value: unknown): value is ResponseData;
function send(res: ServerResponse, data: ResponseData): void;

type ValidationIssue = {
  path: readonly (string | number)[];
  message: string;
};

function validationError(issues: readonly ValidationIssue[]): ResponseData;
```

`response()` brands a value for `generateRoutes` `execute`. Hand-written handlers return a plain `ResponseData` object.

`validationError` is the standard 400 for a replacement `validate` stage: `{ error: "Validation failed", issues: [{ path, message }] }`. `path` is an array of strings and numbers. The default `.required` stage does not use it. See [Pipeline](./seltzer-pipeline.md#replacement-validate).

`send` writes `status` (default 200) and `headers`. Strings are `text/plain; charset=utf-8`. Objects, arrays, numbers, booleans, and `null` are JSON (`application/json`). `Buffer` / `Uint8Array` are raw bytes (`application/octet-stream`). A `Content-Type` you already set is kept. Status 204 and 304, and `{ head: true }`, send no body.

## `generateRoutes`

```ts
function generateRoutes<TContext extends RequestContext = RequestContext>(
  operations: readonly ApiOperation[],
  options: GenerateRoutesOptions<TContext>,
): Route<TContext>[];

class UnboundOperationsError extends Error {
  readonly operations: readonly ApiOperation[];
}

type UnboundOperationPolicy = "throw" | "notImplemented";
```

`operations` is a plain `ApiOperation[]`. Seltzer does not import Nectarine. `handlers[name]` binds that operation. `execute` binds every other selected name. Default `unbound: "throw"` raises `UnboundOperationsError` listing `name method path` for each miss. `unbound: "notImplemented"` registers 501 `{ error: "Not Implemented" }`. A payload is status 200. `response({ status })` sets another status. See [Generate routes](./seltzer-generate.md).

## `client` / `HttpError`

```ts
class HttpError extends Error {
  readonly code: "HTTP_ERROR";
  readonly status: number;
  readonly statusText: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: unknown;
}
class TimeoutError extends Error { readonly code: "TIMEOUT"; readonly timeoutMs: number }
class AbortError extends Error { readonly code: "ABORTED"; readonly reason: unknown }
class NetworkError extends Error { readonly code: "NETWORK"; readonly cause?: unknown }
class UrlError extends Error { readonly code: "INVALID_URL" }

function createClient(config?: {
  timeout?: number;
  baseUrl?: string;
  headers?: Record<string, string>;
}): SeltzerClient;

const client: SeltzerClient;
```

`client` is `createClient()`. The default timeout is 30s (`DEFAULT_CLIENT_TIMEOUT_MS`). `0` disables it. Per-call `options.timeout` overrides the client. There is no retry. `Idempotency-Key` is an ordinary header. See [Client](./seltzer-client.md).

## `Endpoint`

```ts
type Endpoint = {
  route?: Route;
  path: string;
  endpoint: string;
  options?: {
    baseUrl?: string;
    headers?: Record<string, string>;
    timeout?: number;
    signal?: AbortSignal;
    query?: QueryInput;
    allowAbsoluteUrl?: boolean;
  };
};
```

`resolveRequestUrl(baseUrl, path, options)` joins with one slash and keeps a base path. An absolute `path` throws `UrlError` unless `allowAbsoluteUrl` is set. `endpoint` and `route` are ignored.

## Not in the public surface

| Name | Reality |
|---|---|
| `app.use` / `app.get` | Non-goal. Extend the named pipeline with `before` / `replace` |
| `ctx.json` / `ctx.send` | Removed. Calling either throws. Return `ResponseData` |
| `ctx.res.writeHead` / `end` / `setHeader` | Throw while a handler or hook runs |
| `replace("send")` | Throws. Builtin `send` is the only writer |
| `app.pipeline` | Use `before` / `replace` on `Seltzer` |
| `src/core/server/server.ts` | Removed. It was an unused hello-world `createServer` |
| HTTPS `listen` | Non-goal. `listen` is `http.createServer` only. Mount TLS with `https.createServer(tlsOptions, app.handler())` |
| Form / multipart parser | Non-goal. Non-JSON bodies are a UTF-8 string. Recipe: [Form urlencoded](./seltzer-request-response.md#form-urlencoded) |
| `after(name, stage)` | Missing — only `before` |

## Related

- [README](./README.md)
- [Status](./seltzer-status.md)
