# Seltzer API Reference

Public surface of `@citrusworx/seltzer` as implemented in `libraries/seltzer/src`.

This page is the compact contract. For the mental model, start with [Request and response](./seltzer-request-response.md), [Routing](./seltzer-routing.md), and [Client](./seltzer-client.md).

Exports from the package root (`libraries/seltzer/src/index.ts`):

- `Seltzer`
- `client`
- types `Route`, `Endpoint`

There are no subpath exports. `HandlerConfig` is not exported. The inbound `ctx` shape is not exported.

## `Seltzer.init`

```ts
static init(): Seltzer
```

Returns `new Seltzer()`. Empty route list, `config === null`.

```ts
import { Seltzer } from "@citrusworx/seltzer";

const app = Seltzer.init();
```

## `route`

```ts
route(route: Route): this
```

Pushes onto a private array and returns `this`.

```ts
app.route({
  method: "GET",
  path: "/health",
  handler: (ctx) => ctx.json({ ok: true }),
});
```

## `handler`

```ts
handler(config: { adapter: string; options: { baseUrl?: string; headers?: Record<string, string>; allowSelfSigned?: boolean } }): this
```

Stores `config`. `listen` copies `config.options` onto `ctx.options`. `adapter` is unused. Replacing config: last `.handler()` wins.

## `listen`

```ts
listen(port: number): void
```

Throws `Seltzer.listen requires a Node.js runtime.` when `process.versions.node` is missing.

Creates `http.createServer`, matches first exact `method` + `pathname`, 404s with `{ error: "Not Found" }`, otherwise `handler(ctx)`. Logs `Seltzer server listening on port ${port}`.

Does not return the `http.Server`. Does not `await` handlers. Does not serialize handler return values.

## Inbound `ctx` (not exported)

Built inside `listen`:

```ts
{
  req: IncomingMessage;
  res: ServerResponse;
  options?: HandlerConfig["options"];
  json(data: unknown, status?: number): void;
}
```

`json` default status is `200`. Always `Content-Type: application/json`.

## `Route`

```ts
type Route<TContext = any> = {
  method: string;
  path: string;
  handler: (ctx: TContext) => any;
};
```

`TContext` is not inferred from `listen`. Callers often leave it as `any`.

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

Used by `client`. See [Client](./seltzer-client.md) for which fields are actually read.

## `client`

```ts
const client: {
  get(endpoint: Endpoint): Promise<any>;
  post(endpoint: Endpoint, data: any): Promise<any>;
  put(endpoint: Endpoint, data: any): Promise<any>;
  patch(endpoint: Endpoint, data: any): Promise<any>;
  delete(endpoint: Endpoint): Promise<any>;
};
```

URL = `options.baseUrl + path` or `path`. Write methods JSON-stringify `data` and set `Content-Type: application/json` (overridable via headers). All methods `res.json()`.

## Not in the public surface

| Name | Reality |
|---|---|
| `app.use` / `app.get` | Missing |
| `ctx.body` / `ctx.params` / `ctx.query` | Missing |
| `pipeline.insert` | Design only |
| `src/core/server/server.ts` | Unused hello-world server |
| `src/core/types.ts` | Empty (if present in dist history) |
| HTTPS `listen` | Missing — `http.createServer` only |

## Related

- [README](./README.md) — showcase
- [Status](./seltzer-status.md)
