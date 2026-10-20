# Seltzer API Reference

Public surface of `@citrusworx/seltzer` **0.8.1** as implemented in `libraries/seltzer/src`.

This page is the compact contract. For the mental model, start with [Request and response](./seltzer-request-response.md), [Routing](./seltzer-routing.md), [Pipeline](./seltzer-pipeline.md), [Generate routes](./seltzer-generate.md), and [Client](./seltzer-client.md).

Exports from the package root (`libraries/seltzer/src/index.ts`):

- `Seltzer`
- `STAGE_NAMES`
- `client`, `HttpError`
- `generateRoutes`
- `response`, `send`, `isResponseData`, `isExplicitResponse`, `validationError`
- types: `Route`, `RouteContract`, `RequestContext`, `ValidatedInput`, `ValidationIssue`, `Endpoint`, `ListenOptions`, `CorsOptions`, `ResponseData`, `PipelineContext`, `Stage`, `StageName`, `ApiOperation`, `ExecuteArgs`, `GenerateRoutesOptions`, `HttpMethod`
- listen defaults: `DEFAULT_LISTEN_HOST`, `DEFAULT_HEADERS_TIMEOUT_MS`, `DEFAULT_REQUEST_TIMEOUT_MS`, `DEFAULT_KEEP_ALIVE_TIMEOUT_MS`

There are no subpath exports. `HandlerConfig` is used by `.handler()` but is not re-exported from the package root.

## `Seltzer.init`

```ts
static init(): Seltzer
```

Returns `new Seltzer()`. Empty route list, default pipeline, `config === null`.

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
handler(config: {
  adapter: string;
  options: { baseUrl?: string; headers?: Record<string, string>; allowSelfSigned?: boolean };
}): this
```

Stores `config`. `listen` copies `config.options` onto `ctx.options`. `adapter` is unused inbound. Last `.handler()` wins.

## `listen`

```ts
listen<TLocals = unknown>(port: number, options?: ListenOptions<TLocals>): http.Server
```

Throws `Seltzer.listen requires a Node.js runtime.` when `process.versions.node` is missing.

Creates `http.createServer`, applies CORS only when `cors` is set, answers a configured `OPTIONS` preflight with 204, runs the pipeline, and returns that `http.Server`.

**Breaking (next minor, not in the 0.8.1 tarball):** the default bind is `127.0.0.1`, not Node's all-interfaces default. Pass `host: "0.0.0.0"` or `host: "::"` to accept connections from other machines. An empty `host` throws.

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

CORS is **off** unless `listen` is passed `cors`. No `cors` means no `Access-Control-*` headers, and `OPTIONS` is an ordinary method (a route, 405, or 404).

When `cors` is set, `OPTIONS` is **204** with an empty body before the pipeline, including unknown paths. Other methods still run the pipeline, with CORS headers added when the request has `Origin`.

If `cors.origin` is a specific origin, it must equal that `Origin`. `"*"` sends `Access-Control-Allow-Origin: *`. Omit `origin` to reflect the request `Origin`. Default methods: `GET,POST,PUT,PATCH,DELETE,OPTIONS`. Default headers: `Content-Type`. `maxAge` sets `Access-Control-Max-Age` (seconds); omit it to leave the header off. `credentials: true` sends `Access-Control-Allow-Credentials: true` and **throws at `listen`** when combined with `origin: "*"`.

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
  options?: {
    baseUrl?: string;
    headers?: Record<string, string>;
    allowSelfSigned?: boolean;
  };
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
```

See [Generate routes](./seltzer-generate.md).

## `client` / `HttpError`

```ts
class HttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly body: string;
}

const client: {
  get(endpoint: Endpoint): Promise<unknown>;
  post(endpoint: Endpoint, data: unknown): Promise<unknown>;
  put(endpoint: Endpoint, data: unknown): Promise<unknown>;
  patch(endpoint: Endpoint, data: unknown): Promise<unknown>;
  delete(endpoint: Endpoint): Promise<unknown>;
};
```

URL = `options.baseUrl + path` or `path`. Write methods JSON-stringify `data`. Non-2xx throws `HttpError`. See [Client](./seltzer-client.md).

## `Endpoint`

```ts
type Endpoint = {
  route?: Route;
  path: string;
  endpoint: string;
  options?: {
    baseUrl?: string;
    headers?: Record<string, string>;
    allowSelfSigned?: boolean;
  };
};
```

## Not in the public surface

| Name | Reality |
|---|---|
| `app.use` / `app.get` | Missing |
| `ctx.json` / `ctx.send` | Removed. Calling either throws. Return `ResponseData` |
| `ctx.res.writeHead` / `end` / `setHeader` | Throw while a handler or hook runs |
| `replace("send")` | Throws. Builtin `send` is the only writer |
| `app.pipeline` | Use `before` / `replace` on `Seltzer` |
| `src/core/server/server.ts` | Removed. It was an unused hello-world `createServer` |
| HTTPS `listen` | Missing — `http.createServer` only |
| `after(name, stage)` | Missing — only `before` |

## Related

- [README](./README.md)
- [Status](./seltzer-status.md)
