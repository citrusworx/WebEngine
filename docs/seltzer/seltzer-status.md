# Seltzer Status

Honest snapshot of `@citrusworx/seltzer` **0.2.0** against `libraries/seltzer/src`.

The goal is the same as Juice’s and Sig.js’s maturity writing: make it easy to answer what is ready today, what is usable but still evolving, and what is still a design-doc future.

**Early implementation.** The workspace index is right. The long [design overview](./seltzer-design.md) is easy to read as a finished runtime; it is not.

Related: [Roadmap](./seltzer-roadmap.md) for direction. [API](./seltzer-api.md) for the surface as it exists. [JSON API tutorial](./seltzer-api-tutorial.md) for the product path.

## Maturity levels

### `Stable-ish`

The feature is usable today, central to the Seltzer experience, and unlikely to change dramatically in basic concept. Early still means the package version can move; the *idea* is settled.

### `Emerging`

The feature is useful and present, but the API, conventions, or implementation details are still likely to evolve.

### `Early`

The feature exists, but it is still exploratory, incomplete, or not yet something Seltzer should strongly promise as a finished public surface.

### `Draft`

The feature is more of a direction than a hardened part of the runtime. Design-doc stages live here until they have source.

## Matrix

| Area | Maturity | Notes |
|---|---|---|
| `Seltzer.init()` / `.route()` / `.listen()` | Stable-ish | This is the identity of the package. Tiny, readable, Node `http`. |
| Exact method + pathname match | Stable-ish | `===` on `req.method` and `url.pathname`. First win. No glob. |
| JSON 404 fallback | Stable-ish | `{ error: "Not Found" }`. Not customizable. |
| `ctx.json` | Stable-ish | Immediate `writeHead` + `stringify` + `end`. JSON only. |
| Node `req` / `res` on `ctx` | Stable-ish | Escape hatch for anything `json` cannot do. |
| Docs as product surface | Emerging to Stable-ish | Tutorial, topic pages, patterns, anti-patterns now sit next to the kernel. |
| `client.*` | Emerging | Works for JSON round-trips. No status check, ignores `endpoint` / `allowSelfSigned`. |
| `.handler()` options | Early | Stored and copied to `ctx.options`. `adapter` unused. KiwiPress uses the bag for outbound config. |
| Body parsing | Draft | You read the stream. Design: `parse` stage. |
| Query / headers helpers | Draft | `ctx.req` only. |
| Parametric routes | Draft | Literal paths only. `/users/:id` registers that string. |
| Structured handler returns | Draft | Return value discarded. |
| Named pipeline insert | Draft | No `pipeline` object. |
| CORS / HTTPS listen / timeouts | Draft | Platform or handler code. |
| Tests | Draft | No suite in `libraries/seltzer`. |
| Nectarine contract stage | Draft | Copy YAML by hand. |

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

`src/core/server/server.ts` is a leftover hello-world `createServer`. It is **not** used by `Seltzer.listen`.

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
| Await + 500 mapping for async handlers | Unhandled if you throw |

## Strongest areas

These are the parts of Seltzer that already carry real value:

- `init` → `route` → `listen` as a process you can hold in your head
- exact-path JSON GET/POST
- `ctx.json` as the default write
- `client.*` for same-shape JSON calls
- copy-wiring Nectarine `{ method, endpoint }` for exact paths

These form the strongest case for Seltzer as the ecosystem’s HTTP vocabulary, even while the pipeline is future work.

## Most promising emerging areas

- `client` honesty (status, URL joining, which `Endpoint` fields count)
- `.handler()` actually meaning something inbound
- returning the `http.Server` from `listen` so tests can `close`
- awaiting handlers and mapping throws to 500

These are small, high-value increments that do not require inventing Express.

## Early or draft areas

Treat these as design, not product:

- body parser stage
- parametric routes
- structured returns + send stage
- named pipeline
- Nectarine validation stage
- CORS / HTTPS helpers

They can be valuable later. They should not be the center of the Seltzer promise, and they should not appear in app-author tutorials as if they shipped.

## Client honesty

- URL = `baseUrl + path` or `path`
- `Endpoint.endpoint` and `Endpoint.route` unused
- No timeout, retry, or non-2xx handling
- `allowSelfSigned` unused

## Tests

The package scripts are `build` and `typecheck`. There is no Seltzer test suite in `libraries/seltzer`.

```bash
yarn workspace @citrusworx/seltzer build
yarn workspace @citrusworx/seltzer typecheck
```

Docs examples were checked against source, not executed as a live server from this docs pass.

## Integration (what is real)

**Nectarine.** Copy `{ method, endpoint }` or walk `parser.yaml`. No importer. Skip `:id` YAML. Adapters run inside handlers. See [Integration](./seltzer-integration.md).

**Sig.js / Juice.** `fetch` the JSON. CORS is your headers. Seltzer does not start the UI.

**Grapevine.** Provisions machines. Does not spawn `listen`.

**KiwiPress.** Uses `Seltzer.init().handler()` for option storage and its own `fetch`, including `undici` for self-signed TLS.

## Recommended positioning right now

If Seltzer is being described externally or internally, the most honest current positioning is:

> Seltzer Early is a tiny Node `http` listener plus a JSON `fetch` client. You register exact method/path handlers, write with `ctx.json`, and parse bodies yourself. It is the CitrusWorx HTTP vocabulary — not Express, not a pipeline runtime, and not a Nectarine codegen backend.

That framing matches the strongest current reality.

Less accurate positioning right now would be:

- a middleware framework
- a finished request pipeline with named stages
- automatic routes from YAML
- parametric REST on `:id` segments

## Practical interpretation

If you are building with Seltzer today:

- confidently use `init`, `route`, `listen`, `ctx.json`, exact paths
- read streams and query strings in the handler
- copy Nectarine exact-path pairs
- use `client.*` when JSON-in / JSON-out is enough
- treat parametric routes, pipeline insert, and structured returns as things you write yourself (electives) or live without

That is the cleanest adoption model for the current state of the system.

## Suggested reading

- [README](./README.md) — model and showcase
- [JSON API tutorial](./seltzer-api-tutorial.md) — guided build
- [Getting Started](./seltzer-getting-started.md)
- [Roadmap](./seltzer-roadmap.md)
- [Troubleshooting](./seltzer-troubleshooting.md)
