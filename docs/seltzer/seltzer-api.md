# Seltzer API Reference

Public surface of `@citrusworx/seltzer` **0.8.1** as implemented in `libraries/seltzer/src`.

This page is the compact contract. For the mental model, start with [Request and response](./seltzer-request-response.md), [Routing](./seltzer-routing.md), [Pipeline](./seltzer-pipeline.md), [Generate routes](./seltzer-generate.md), and [Client](./seltzer-client.md).

Exports from the package root (`libraries/seltzer/src/index.ts`):

- `Seltzer`
- `STAGE_NAMES`
- `client`, `HttpError`
- `generateRoutes`
- `response`, `send`, `isResponseData`, `isExplicitResponse`
- types: `Route`, `RouteContract`, `RequestContext`, `Endpoint`, `ListenOptions`, `CorsOptions`, `ResponseData`, `PipelineContext`, `Stage`, `StageName`, `ApiOperation`, `ExecuteArgs`, `GenerateRoutesOptions`, `HttpMethod`

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

Creates `http.createServer`, applies CORS, answers `OPTIONS` with 204, runs the pipeline. Default log: `Seltzer server listening on port ${port}`. Override with `onListening`.

```ts
type ListenOptions<TLocals = unknown> = {
  locals?: TLocals;
  cors?: CorsOptions;
  onListening?: (port: number) => void;
};

type CorsOptions = {
  origin?: string;
  methods?: string[];
  headers?: string[];
};
```

CORS runs only when the request has `Origin`. If `cors.origin` is set, it must equal that origin; otherwise the request origin is reflected. Default methods: `GET,POST,PUT,PATCH,DELETE,OPTIONS`. Default headers: `Content-Type`. `Vary: Origin` is set when CORS headers are applied.

Returns the `http.Server`.

## `RequestContext`

```ts
type RequestContext<TLocals = unknown> = {
  req: IncomingMessage;
  res: ServerResponse;
  method: string;
  path: string;
  query: Record<string, string>;
  params: Record<string, string>;
  body: unknown;
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
```

`response()` brands a value for `generateRoutes` `execute`. Hand-written handlers return a plain `ResponseData` object.

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
| `ctx.json` | Removed in 0.4.0 |
| `app.pipeline` | Use `before` / `replace` on `Seltzer` |
| `src/core/server/server.ts` | Unused hello-world server |
| HTTPS `listen` | Missing — `http.createServer` only |
| `after(name, stage)` | Missing — only `before` |

## Related

- [README](./README.md)
- [Status](./seltzer-status.md)
