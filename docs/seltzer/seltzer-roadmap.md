# Seltzer Roadmap

## Current position

Seltzer is no longer an essay about pipelines, and it is no longer the 0.2.0 exact-path `ctx.json` listener.

It is a shipped 0.8.x runtime with three visible layers:

- `Seltzer.init` / `.route` / `.before` / `.replace` / `.handler` / `.listen` in `seltzer.ts`
- a named pipeline (`parse` → `send`) plus `ResponseData` / `send` / `generateRoutes`
- `client.*` + `HttpError` in `client.ts`

The strongest part of Seltzer today is the request engine: parametric routes, JSON parse, structured returns, and a pipeline you can insert into without inventing Express. The next strongest area is the Nectarine join (`ApiOperation[]` → `Route[]`).

The weakest areas are still:

- HTTPS listen (plain HTTP host bind and timeouts shipped)
- response-shape validation (the `replace("validate")` hook and `validationError()` are documented; Seltzer still has no schema library)
- client URL joining and abort/timeout

0.8.x is the honest label for the HTTP core. Packaging 0.8.1 did not add runtime behavior.

These docs describe the 0.8.1 runtime now present on local `master` after the Blackwater Phase 0 merge. For worked proposals with acceptance criteria, see the HTTP course's [future-design lesson](./http-course/11-future-design.md). Those proposals are exercises, not committed release plans.

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

[seltzer-design.md](./seltzer-design.md) still explains why not middleware. Most of its lifecycle diagram is source. Remaining forks (a bundled schema library, HTTPS, `after`) belong on this roadmap. Zod stays an application dependency used through `replace("validate")`.

---

## What is still holding Seltzer back

### 1. `validate` is presence-only

`.required` closed the “no contracts” gap. It is presence-only and does not set `ctx.valid`. Type and format checks are still host work: `replace("validate")`, `ctx.valid`, and `validationError(issues)`. `Route.contract` is still YAML strings, not a schema. A Nectarine-owned schema adapter is not in Seltzer.

### 2. `client` URL join is still naive

`HttpError` and JSON-vs-text closed the honesty gap. Slash-safe join, abort, and timeouts did not.

### 3. Listen is HTTP-only

`listen(port, { host })` defaults to `127.0.0.1`. Header, request, and keep-alive timeouts are on (20s / 30s / 5s). `server.close()` stops accepting. HTTPS is still missing. There is no `listen({ port, host })` object overload and no integrated drain deadline.

### 4. Stage API has no `after` / remove

Insert-before covers auth and logging. Some hosts will want post-`handle` decoration without replacing `response`.

---

## Revised status

If Seltzer is viewed as an HTTP platform, its current maturity looks roughly like this:

- Object-route listener: strong
- Pipeline / params / parse / `ResponseData`: strong
- `generateRoutes`: useful and still evolving with hosts
- Client: useful and narrower than undici
- Docs as product surface: this set, locked to 0.8.1 source
- Production-hardened framework (HTTPS, quotas, OpenAPI): not the goal yet

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

### Priority 3. Client join / abort

Small fixes here help more than a new stage.

### Priority 4. Stay complementary to Nectarine, Sig, Juice

Seltzer should not grow a YAML compiler, a theme, or a component tree.

---

## Recommended build order

1. Keep docs and examples locked to source (ongoing).
2. Host `replace("validate")` for real contracts (the Seltzer side of that hook is documented).
3. `client` slash-safe join + AbortSignal.
4. Only then: HTTPS listen or `after(name)` — not both at once.

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
| `init` / `route` / `listen` on `127.0.0.1`, timeouts, `server.close()` | HTTPS listen |
| Named pipeline, `before` / `replace` | `after` / remove |
| `/users/:id` → `ctx.params` | Trailing-slash normalize |
| Handler `return { status, headers, body }` | Bare-payload wrapping (intentionally rejected) |
| `parse` JSON + 400 | form-urlencoded / multipart |
| Default `.required` validate; `ctx.valid`; `validationError()`; Zod shown as a host `replace("validate")` | Response-shape checks; a schema bundled in Seltzer |
| `generateRoutes` + `response()` | Generating OpenAPI |
| `client.*` + `HttpError` + undici TLS | Slash-safe join, timeouts |
| CORS + OPTIONS 204 | Per-route CORS overrides |
| Vitest | — |

---

## Summary

Seltzer 0.8.x is a meaningfully stronger place than both a design-only HTTP essay and the 0.2.0 kernel.

It now has:

- a credible object-route listener
- a named pipeline with insert/replace
- parametric matching and JSON parse
- `ResponseData` as the handler contract
- `generateRoutes` as the Nectarine join
- a client that throws on failure

The next stage is refinement around contracts, client URLs, and HTTPS — not reinventing Seltzer from scratch. Host bind and the three server timeouts are already in source.

Until those land, the product docs stay with [Status](./seltzer-status.md) and the APIs in `libraries/seltzer/src` at 0.8.1.
