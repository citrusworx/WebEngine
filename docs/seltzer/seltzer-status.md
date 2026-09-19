# Seltzer Status

Honest snapshot of `@citrusworx/seltzer` **0.8.1** against `libraries/seltzer/src` on `cursor/blackwater-phase0-backend`.

The goal is the same as Juice’s and Sig.js’s maturity writing: make it easy to answer what is ready today, what is usable but still evolving, and what is still a design-doc future.

**0.8.x is the HTTP core.** 0.8.0 is the solidified runtime git labeled 0.7.0 (default `validate`, `replace`, hardened `client`). 0.8.1 is packaging/DX only (description, `engines.node` `>=18`, optional `undici` peer, standalone README). Versions 0.3–0.7 were never published. **0.2.0 remains what `origin/master` still documents** — do not mix those APIs.

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
| `Seltzer.init()` / `.route()` / `.listen()` | Stable-ish | Identity of the package. Node `http`. `listen` returns `Server`. |
| Named pipeline | Stable-ish | `parse` → `send`. `before` / `replace`. Mutation in place. |
| Parametric match + static-prefix rank | Stable-ish | `/items/new` beats `/items/:id`. |
| JSON `parse` + 400 on bad JSON | Stable-ish | GET/HEAD skip body. |
| `ResponseData` + `send` | Stable-ish | Bare values are 500. No `ctx.json`. |
| Default `validate` (`.required`) | Emerging | Presence-only. Zod is `replace("validate")`. |
| `generateRoutes` | Emerging | Host `execute` + `response()` brand. POST/PUT/PATCH/DELETE plus optional `ApiOperation.status`. |
| CORS / OPTIONS 204 | Stable-ish | On `listen`, before the pipeline. |
| `client.*` + `HttpError` | Emerging | JSON/text parse, optional `undici` TLS. Naive URL join remains. |
| `.handler()` options | Early | Copied to `ctx.options`. `adapter` unused inbound. |
| Tests | Stable-ish | Vitest: listen, pipeline, router, validate, generate, client. |
| HTTPS listen / `app.use` / form bodies | Draft | Not in source. |
| Full contract / response-shape validation | Draft | Reserved for Nectarine via `replace`. |

## What is shipped

| Area | Source | Notes |
|---|---|---|
| `Seltzer.init()` | `core/seltzer.ts` | `new Seltzer()` |
| `.route()` | same | `compileRoute` |
| `.before()` / `.replace()` | same + `pipeline/index.ts` | |
| `.handler()` | same | stores config |
| `.listen(port, options?)` | same | returns `http.Server` |
| Stages | `pipeline/stages.ts` | parse…send |
| Matcher | `pipeline/router.ts` | rank + params |
| `ResponseData` / `send` / `response()` | `core/response.ts` | |
| `generateRoutes` | `generate/generate-routes.ts` | |
| `client` / `HttpError` | `core/client/client.ts` | |
| Example server | `src/example.ts` | GET `/` |

`src/core/server/server.ts` is a leftover hello-world `createServer`. It is **not** used by `Seltzer.listen`.

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
| `client` always `res.json()`, no `ok` check | `HttpError`; JSON or text |
| `allowSelfSigned` unused | undici Agent on https |
| No tests | Vitest suite |
| `listen` returns `void` | Returns `http.Server` |

## Strongest areas

- `init` → `route` → `listen` with `ResponseData`
- named pipeline you can insert/replace without `next()`
- parametric routes with static-prefix preference
- `generateRoutes` as the Nectarine join
- `client` that fails loudly on 4xx/5xx

These form the case for Seltzer as the ecosystem’s HTTP engine, not a thin `createServer` wrapper.

## Most promising emerging areas

- richer `validate` (Zod) via `replace` without changing handler signatures
- slash-safe client URL join
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

> Seltzer 0.8.x is a small Node HTTP runtime with object routes, `ResponseData` handlers, and a named request pipeline. It parses JSON, matches `/resources/:id`, validates `.required` body fields, and maps Nectarine `ApiOperation[]` through `generateRoutes`. It is not Express, and it is not the 0.2.0 `ctx.json` listener still described on master.

Less accurate positioning:

- a middleware framework
- an unimplemented design essay
- automatic SQL from YAML (that is Nectarine’s compiler + host `execute`)

## Practical interpretation

If you are building with Seltzer today:

- return `{ body }` (and `status` / `headers` when needed)
- use `ctx.params` / `ctx.body` / `ctx.query`
- generate routes from operations; replace `validate` when contracts grow
- catch `HttpError` on `client.*`
- treat `ctx.json` and “no `:id`” as outdated docs, not APIs

## Suggested reading

- [README](./README.md)
- [JSON API tutorial](./seltzer-api-tutorial.md)
- [Getting Started](./seltzer-getting-started.md)
- [Roadmap](./seltzer-roadmap.md)
- [Troubleshooting](./seltzer-troubleshooting.md)
