# Seltzer Roadmap

## Current position

Seltzer is no longer an essay about pipelines, and it is no longer the 0.2.0 exact-path `ctx.json` listener.

It is a shipped 0.8.x runtime with three visible layers:

- `Seltzer.init` / `.route` / `.before` / `.replace` / `.handler` / `.listen` in `seltzer.ts`
- a named pipeline (`parse` → `send`) plus `ResponseData` / `send` / `generateRoutes`
- `client.*` + `HttpError` in `client.ts`

The strongest part of Seltzer today is the request engine: parametric routes, JSON parse, structured returns, and a pipeline you can insert into without inventing Express. The next strongest area is the Nectarine join (`ApiOperation[]` → `Route[]`).

The weakest areas are still:

- HTTPS and production listen edges (timeouts, host bind)
- full contract validation (reserved for `replace("validate")`)
- client URL joining and abort/timeout
- leftover `server.ts`

0.8.x is the honest label for the HTTP core. Packaging 0.8.1 did not add runtime behavior.

These docs belong with Seltzer ≥0.8 on `cursor/blackwater-phase0-backend`. They must not be merged onto `master` alone while master still ships 0.2.0 APIs.

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

[seltzer-design.md](./seltzer-design.md) still explains why not middleware. Most of its lifecycle diagram is source. Remaining forks (Zod, HTTPS, `after`) belong on this roadmap.

---

## What is still holding Seltzer back

### 1. `validate` is presence-only

`.required` closed the “no contracts” gap. Type and format checks are still host work. Highest-value increment: a Nectarine `replace("validate")` that reads the same `Route.contract` field.

### 2. `client` URL join is still naive

`HttpError` and JSON-vs-text closed the honesty gap. Slash-safe join, abort, and timeouts did not.

### 3. Listen is HTTP-only

No HTTPS, no `listen({ host })` overload. CORS and `Server.close` did ship.

### 4. The leftover `server.ts`

A second `createServer` in-tree still confuses contributors. Delete or wire it when the package is touched. Docs already warn.

### 5. Stage API has no `after` / remove

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

Do not add Zod inside Seltzer’s default stage if Nectarine owns contracts. Document the hook; implement the replacement in the host.

### Priority 3. Client join / abort

Small fixes here help more than a new stage.

### Priority 4. Stay complementary to Nectarine, Sig, Juice

Seltzer should not grow a YAML compiler, a theme, or a component tree.

---

## Recommended build order

1. Keep docs and examples locked to source (ongoing).
2. Host `replace("validate")` for real contracts.
3. `client` slash-safe join + AbortSignal.
4. Decide `server.ts` (delete or re-export).
5. Only then: HTTPS listen or `after(name)` — not both at once.

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
| `init` / `route` / `listen` | HTTPS listen |
| Named pipeline, `before` / `replace` | `after` / remove |
| `/users/:id` → `ctx.params` | Trailing-slash normalize |
| Handler `return { status, headers, body }` | Bare-payload wrapping (intentionally rejected) |
| `parse` JSON + 400 | form-urlencoded / multipart |
| Default `.required` validate | Zod / response-shape contracts |
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

The next stage is refinement around contracts, client URLs, and listen edges — not reinventing Seltzer from scratch.

Until those land, the product docs stay with [Status](./seltzer-status.md) and the APIs in `libraries/seltzer/src` at 0.8.1.
