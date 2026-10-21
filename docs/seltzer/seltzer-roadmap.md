# Seltzer Roadmap

## Current position

Seltzer is no longer an essay about pipelines, and it is no longer the 0.2.0 exact-path `ctx.json` listener.

It is a shipped 0.10.0 runtime with three visible layers:

- `Seltzer.init` / `.route` / `.before` / `.replace` / `.handler` / `.listen` in `seltzer.ts`
- a named pipeline (`parse` → `send`) plus `ResponseData` / `send` / `generateRoutes`
- `client.*` + `HttpError` in `client.ts`

The strongest part of Seltzer today is the request engine: parametric routes, JSON parse, structured returns, and a pipeline you can insert into without inventing Express. The next strongest area is the Nectarine join (`ApiOperation[]` → `Route[]`).

The weakest areas that are still open:

- response-shape validation (the `replace("validate")` hook and `validationError()` are documented; Seltzer still has no schema library)
- typed `client` results (`unknown` today)

HTTPS listen, `app.use`, form and multipart parsing, and client retries are [non-goals](../../libraries/seltzer/README.md#non-goals). Plain HTTP host bind, timeouts, and the outbound deadline already shipped. Streaming responses and WebSockets are **Not yet**.

0.9.0 is the honest label for the HTTP core. Packaging 0.8.1 did not add runtime behavior. 0.9.0 did: loopback `listen`, timeouts, the HTTP surface, strict `ResponseData`, `ctx.valid`, unbound `generateRoutes`, and the fetch client.

These docs describe the 0.10.0 runtime on `master`, which matches the npm tarball published 2026-10-21. 0.9.0 remains the HTTP-core cut. 0.10.0 adds no-arg `app.handler()` and `app.adapter(config)`. For worked proposals with acceptance criteria, see the HTTP course's [future-design lesson](./http-course/11-future-design.md). Those proposals are exercises, not committed release plans.

---

## What is already true

### 1. The pipeline shipped

Named stages, `before`, `replace`, short-circuit to `send`, mutation in place. [Pipeline](./seltzer-pipeline.md) is a product topic. Exercises 6–7 rebuild it; they do not invent it.

### 2. Handlers return data; the runtime writes

The design bet that 0.2.0 inverted (`ctx.json` writes immediately) was reversed in 0.4.0. Bare payloads are rejected. Do not document both styles as current.

### 3. `:id` and JSON bodies shipped (0.3)

Query-string stand-ins and hand-rolled `readJson` are optional styles, not requirements.

### 4. Nectarine integration is flatten + generate, not copy-paste

YAML `method` / `endpoint` pairs become `ApiOperation.path`. Seltzer `.route` is still registration. The join is `generateRoutes`, not a fake importer in documentation.

### 5. The design doc is rationale, not a backlog of missing stages

[seltzer-design.md](./seltzer-design.md) still explains why not middleware. Most of its lifecycle diagram is source. Remaining forks (a bundled schema library, `after`) belong on this roadmap. HTTPS listen is a non-goal. Zod stays an application dependency used through `replace("validate")`.

---

## What is still holding Seltzer back

### 1. `validate` is presence-only

`.required` closed the “no contracts” gap. It is presence-only and does not set `ctx.valid`. Type and format checks are still host work: `replace("validate")`, `ctx.valid`, and `validationError(issues)`. `Route.contract` is still YAML strings, not a schema. A Nectarine-owned schema adapter is not in Seltzer.

### 2. `client` results are still `unknown`

Slash-safe join, a 30s deadline, and distinct timeout / abort / network errors shipped. The client still returns `unknown`. Retries are a [non-goal](../../libraries/seltzer/README.md#no-client-retries): the caller owns that policy. A server-side idempotency stage is planned. `Idempotency-Key` is only a header until that stage exists.

### 3. Listen is HTTP on purpose

`listen(port, { host })` defaults to `127.0.0.1`. Header, request, and keep-alive timeouts are on (20s / 30s / 5s). `server.close()` stops accepting. Built-in HTTPS listen is a non-goal: `listen` calls `http.createServer` only. A host that wants TLS uses `https.createServer(tlsOptions, app.handler())` and sets the timeout constants on that server. There is no `listen({ port, host })` object overload and no integrated drain deadline.

### 4. Stage API has no `after` / remove

Insert-before covers auth and logging. Some hosts will want post-`handle` decoration without replacing `response`.

---

## Revised status

If Seltzer is viewed as an HTTP platform, its current maturity looks roughly like this:

- Object-route listener: strong
- Pipeline / params / parse / `ResponseData`: strong
- `generateRoutes`: useful and still evolving with hosts
- Client: global `fetch`, 30s deadline, no retries, no `undici`
- Docs as product surface: this set, locked to 0.10.0 source
- Production-hardened framework (quotas, OpenAPI): not the goal yet. HTTPS listen is a non-goal, not a later milestone

In practical terms:

- Seltzer already feels like a real HTTP process for this monorepo
- Seltzer should not try to win by growing `use()`

That is a strong place to be.

---

## Priorities

### Priority 1. Keep the product path obvious

Examples that return `ResponseData`, tutorials that use `:id` and `ctx.body`, anti-patterns for leftover `ctx.json`. This docs set is that work. Keep it aligned with `libraries/seltzer/src` when the code moves.

### Priority 2. Richer validate via `replace`

Do not add Zod inside Seltzer’s default stage. The hook is documented (`validationError`, `ctx.valid`, a Zod `safeParse` example). Implement the replacement in the host. `replace` removes the `.required` checks.

### Priority 3. Typed client results

Join, abort, and the deadline are in. Generics on the JSON result are the remaining client nicety. Client retries are a non-goal. A server-side idempotency stage is planned.

### Priority 4. Stay complementary to Nectarine, Sig, Juice

Seltzer should not grow a YAML compiler, a theme, or a component tree.

---

## Recommended build order

1. Keep docs and examples locked to source (ongoing).
2. Host `replace("validate")` for real contracts (the Seltzer side of that hook is documented).
3. Typed `client` results. Join, abort, and the 30s deadline are in. Client retries stay a non-goal. A server-side idempotency stage is the planned follow-on, separate from the client.
4. Only then: `after(name)`, if a host needs post-handle decoration. HTTPS listen stays a non-goal.

---

## What would not move Seltzer upward

- Documenting `ctx.json` / “no `:id`” as current
- An Express compatibility layer
- A second YAML flatten inside Seltzer
- Merging Seltzer and Nectarine into one “backend framework” package
- Starting app authors on exercise 06

---

## Shipped vs still open

| Shipped (teach this) | Still open |
|---|---|
| `init` / `route` / `listen` on `127.0.0.1`, timeouts, `server.close()`, no-arg `app.handler()` | Drain deadline. Built-in HTTPS `listen` is a non-goal. TLS is `https.createServer(tlsOptions, app.handler())` |
| Named pipeline, `before` / `replace` | `after` / remove |
| `/users/:id` → `ctx.params` | Trailing-slash normalize |
| Handler `return { status, headers, body }` | Bare-payload wrapping (intentionally rejected). Streaming and WebSockets are **Not yet** |
| `parse` JSON + 400 | Urlencoded is a host `URLSearchParams` recipe. Multipart bytes are out of scope |
| Default `.required` validate; `ctx.valid`; `validationError()`; Zod shown as a host `replace("validate")` | Response-shape checks; a schema bundled in Seltzer |
| `generateRoutes` + `response()` | Generating OpenAPI |
| `client.*`, slash-safe join, 30s deadline, abort | Typed JSON results. Retries are a non-goal. Idempotency storage is planned |
| CORS + OPTIONS 204 | Per-route CORS overrides |
| Vitest | — |

---

## Summary

Seltzer 0.9.0 is a meaningfully stronger place than both a design-only HTTP essay and the 0.2.0 kernel.

It now has:

- a credible object-route listener
- a named pipeline with insert/replace
- parametric matching and JSON parse
- `ResponseData` as the handler contract
- `generateRoutes` as the Nectarine join
- a client that throws on failure

The next stage is refinement around contracts — not reinventing Seltzer from scratch, and not adding HTTPS listen. Host bind, the three server timeouts, and the outbound deadline are already in source.

Until those land, the product docs stay with [Status](./seltzer-status.md) and the APIs in `libraries/seltzer/src` at 0.10.0.
