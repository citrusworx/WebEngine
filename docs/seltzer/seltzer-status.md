# Seltzer Status

Honest snapshot of `@citrusworx/seltzer` **0.2.0** against `libraries/seltzer/src`.

## Maturity

**Early implementation.** The workspace index is right. The long design README was easy to read as a finished runtime; it is not.

No guided “build a product HTTP app” tutorial is included beyond [Getting Started](./seltzer-getting-started.md) and [Examples](./seltzer-examples.md). A Juice-style page tutorial would lie about pipeline stages that are not there.

## What is shipped

| Area | Source | Notes |
|---|---|---|
| `Seltzer.init()` | `core/seltzer.ts` | `new Seltzer()` |
| `.route()` | same | push + chain |
| `.handler()` | same | stores config |
| `.listen(port)` | same | `http.createServer` |
| Exact method + pathname | `listen` | first match |
| `ctx.json` | inline in `listen` | JSON only |
| JSON 404 | same | `{ error: "Not Found" }` |
| `client.get/post/put/patch/delete` | `core/client/client.ts` | always `res.json()` |
| Types `Route`, `Endpoint` | `seltzer.ts` | |
| Example server | `src/example.ts` | GET `/` |

`src/core/server/server.ts` is a leftover hello-world `createServer`. It is **not** used by `Seltzer.listen`. `src/core/types.ts` is empty.

## What the design doc describes that is not in source

| Design | Code |
|---|---|
| Parse body stage | You read the stream |
| Structured `ctx` (query, headers map, params, body) | `{ req, res, options, json }` |
| `/users/:id` | Exact strings only |
| Validate / contracts | None |
| Handler returns `{ status, headers, body }` | Handler must write (typically `ctx.json`) |
| Format + send stages | `ctx.json` writes immediately |
| Named pipeline insert/replace | None |
| Streams / files as first-class responses | Use `ctx.res` yourself |

## Client honesty

- URL = `baseUrl + path` or `path`
- `Endpoint.endpoint` and `Endpoint.route` unused
- No timeout, retry, or non-2xx handling
- `allowSelfSigned` unused

## Tests

The package scripts are `build` and `typecheck`. There is no Seltzer test suite in `libraries/seltzer`.

## Integration

See [Integration](./seltzer-integration.md). KiwiPress and other packages may *want* Seltzer as a transport shape; this library’s public API is what the table above lists.

## Roadmap (same order as the exercises)

1. Body parse + JSON errors
2. Parametric routing
3. Structured return values
4. Named pipeline
5. Contract stage (Nectarine)

Until those land, keep calling this Early.
