# Seltzer Study: Node.js Reading & Course List

**New to HTTP? Start with [HTTP, understood through Seltzer](./http-course/README.md).** It is a complete course for readers with basic JavaScript knowledge: plain-language lessons, runnable Notes API examples, exercises and answers, source walkthroughs, and explicitly proposed designs for unfinished capabilities.

This page remains the supplemental reading list for the contributor track. It is not the new course's syllabus.

**Contributor elective.** This is not the product getting-started path. App authors should not start here.

If you want to **run** the HTTP surface that exists today (`Seltzer.init` / `.route` / `.listen` / `ResponseData` / `before` / `generateRoutes` / `client.*`), use the [product README](./README.md), [Getting Started](./seltzer-getting-started.md), and the [JSON API tutorial](./seltzer-api-tutorial.md).

Come here when you intend to **rebuild** the shipped pipeline from `node:http` so you can extend `libraries/seltzer/src` without cargo-culting it. The exercises reconstruct 0.8.x behavior. They are not “implement the missing stage.”

A structured path to write **Seltzer** yourself — from raw `node:http` through streams, routing, pipeline stages, and contract validation — without leaning on AI for whole features.

Start with the [Seltzer Design Overview](./seltzer-design.md) if you have not read it yet. This guide maps learning topics directly to Seltzer's HTTP pipeline and hands-on exercises.

---

## Core Topics

The concepts you need to understand deeply:

- **Node runtime basics** — ESM (`"type": "module"`), `node:` imports, monorepo `yarn workspace`, Vitest
- **HTTP protocol** — methods, status codes, headers, content negotiation, statelessness
- **`node:http`** — `createServer`, request/response objects, when the connection closes
- **Streams** — `for await` of `IncomingMessage`; why bodies are not ready synchronously
- **URL handling** — `new URL()`, `URLSearchParams`, decoding path segments
- **Routing** — exact vs parametric routes; ranking static prefixes over `:id`
- **Async server handlers** — returning Promises; central error → 500 mapping
- **Pipeline design** — ordered named stages vs middleware chains (see [design](./seltzer-design.md) § Why Pipelines)
- **Validation / contracts** — `.required` at `validate`; `replace` for richer checks
- **HTTP client** — `fetch`, `HttpError` on non-2xx, optional `undici` TLS
- **TypeScript for libraries** — generics for context types, narrow exports, declaration files

### Seltzer topic map

| Seltzer concern | Where it lives today | What the exercises rebuild |
|---|---|---|
| Raw HTTP server | `src/core/seltzer.ts` — `http.createServer`, pipeline `run` | `IncomingMessage` / `ServerResponse` lifecycle |
| Context normalization | `pipeline/stages.ts` `contextStage` | `ctx.method` / `path` / `query` / `headers` |
| Body parsing | `parseStage` | Collect stream chunks, JSON 400 |
| Routing | `pipeline/router.ts` | Parametric path matching, rank, `ctx.params` |
| Pipeline stages | `pipeline/index.ts` (`parse` → `send`) | Named runner with `before` / `replace` |
| Structured responses | `core/response.ts` | Handlers return `{ status, headers, body }`; `send` |
| HTTP client | `src/core/client/client.ts` | `fetch`, `HttpError`, optional undici Agent |
| Contracts | `validateStage` + `Route.contract` | Presence checks; Nectarine `replace` later |
| `generateRoutes` | `src/generate/` | Host `execute` + `response()` brand |
| Library authoring | `package.json` — ESM + TypeScript | Generics (`Route<TContext>`), `.js` import extensions, `node:` prefix |

---

## Frontend Masters

### [Complete Intro to Node.js v3](https://frontendmasters.com/courses/node-js-v3/) — Scott Moss

**Priority: Start here.**

The closest "build servers in modern Node" foundation for Seltzer. Prioritize these sections:

- Modules and npm
- `node:http` and the request/response lifecycle
- Streams introduction
- Async patterns in server handlers

Seltzer is built on `node:http`, not Express. This course gives you the primitives the runtime wraps.

### [API Design in Node.js v4](https://frontendmasters.com/courses/api-design-nodejs/) — Scott Moss

Not Express-as-Seltzer, but strong on HTTP semantics, error shapes, and handler structure. Most relevant for:

- Consistent error response shapes
- Status code conventions
- Separating handler logic from protocol serialization — maps directly to Seltzer's structured response model

### [TypeScript 5 Fundamentals v4](https://frontendmasters.com/courses/typescript/)

Relevant when typing Seltzer's public API:

- Generics for `Route<TContext>` and pipeline step signatures
- Utility types for context and response objects
- Narrow exports and declaration files for a published library

---

## Official Docs & Free References

### [Node.js HTTP module](https://nodejs.org/api/http.html)

**Priority: Keep open while implementing.**

Primary reference for `parse` and `send` stages. Read `http.createServer`, `IncomingMessage`, and `ServerResponse` before writing any stage that touches the wire.

### [Node.js Stream module](https://nodejs.org/api/stream.html)

Required reading before reimplementing body parsing. Request bodies arrive as streams — they are not ready synchronously inside the server callback.

### [MDN: HTTP overview](https://developer.mozilla.org/en-US/docs/Web/HTTP)

Protocol concepts the runtime must get right: methods, status codes, headers, statelessness, content types.

### [The Node.js Handbook](https://www.freecodecamp.org/news/the-node-js-handbook/)

Free skim for event loop and modules if fundamentals feel rusty.

### [TypeScript handbook: Node.js ESM](https://www.typescriptlang.org/docs/handbook/modules/theory.html#node-js-esm)

ESM + `.js` extension rules used in Seltzer source imports.

---

## Books

### *Node.js Design Patterns* (3rd ed.) — Mamolo & Cavallaro

Use as reference, not a read-through. Skip Express-centric chapters.

| Chapter | Seltzer relevance |
|---|---|
| Ch. 5–7 | Streams and async control flow — body parsing, error propagation |
| Ch. 11 | HTTP from Node's perspective — complements official docs |

---

## Architecture Reading

### [Seltzer Design Overview](./seltzer-design.md) § Why Pipelines Were Chosen Over Middleware

**Required reading.** Seltzer deliberately avoids middleware chains and hook systems. Understand the pipeline model before reimplementing stages.

### [Pipeline](./seltzer-pipeline.md)

**Shipped behavior.** Read this before treating exercises as a product tutorial.

### [Pipeline pattern](https://martinfowler.com/articles/collection-pipeline/) — Martin Fowler

Conceptual backing for named, ordered stages instead of free-form middleware.

---

## Optional / Later

### [Nectarine](../nectarine/README.md)

Skim once you have used `replace("validate", …)` or `generateRoutes`. Seltzer executes HTTP and the default `validate` stage checks `.required` body fields; Nectarine defines schemas and flattens `ApiOperation[]`. They integrate at generate + validate, not inside every handler.

---

## Hands-On Exercises

Each exercise is ~1–2 hours. Write them in plain `node:http` + TypeScript — in a scratch file or [`libraries/seltzer/src/example.ts`](../../libraries/seltzer/src/example.ts). **Do not use AI for the core logic**; syntax lookup and TypeScript errors are fine.

Numbered starter templates live in [`exercises/`](./exercises/).

| # | Exercise | Proves you can rebuild |
|---|---|---|
| 1 | Echo server: log method, path, headers; return plain text | Basic `createServer` callback |
| 2 | JSON POST server: stream-collect body → `JSON.parse` → echo object | Shipped **`parse` stage** |
| 3 | Router: register `{ method, path, handler }`, 404 fallback | Exact-match subset of `route` |
| 4 | Parametric router: `/users/:id` → `{ id: "42" }`; static prefix wins | Shipped **`route` stage** |
| 5 | Handler returns `{ status, body }`; runtime calls `writeHead`/`end` | Shipped **`response` + `send`** |
| 6 | Named stages run in order on a shared `ctx` | Shipped **pipeline runner** |
| 7 | `before("handle")` + `replace("validate")` + short-circuit to `send` | Shipped **pipeline modification API** |
| 8 | `fetch` client with `HttpError` + JSON vs text | Shipped **`client`** |

After exercise 6, compare your runner to `libraries/seltzer/src/pipeline/` instead of inventing a new layout:

- `pipeline/stages.ts` — stage implementations
- `pipeline/index.ts` — runner + `before` / `replace`
- `pipeline/router.ts` — matching + params
- `core/response.ts` — `ResponseData` + `send`
- `generate/` — `ApiOperation` → `Route` (optional extra)

---

## Course Journey Phases

Each phase unlocks a concrete, commit-sized *understanding* of code that already exists.

### Phase A — Speak HTTP

**Exercises:** 1–3

**Outcome:** You can explain every line in `Seltzer.listen()` and the default pipeline construction.

### Phase B — Own the body

**Exercises:** 2 + Node stream docs

**Outcome:** You could reimplement `parseStage` (JSON + raw; 400 on bad JSON).

### Phase C — Context + routing

**Exercises:** 3–4

**Outcome:** `ctx` type populated; dynamic segments in `ctx.params`; static prefixes ranked.

### Phase D — Pipeline engine

**Exercises:** 5–7 + pipeline reading

**Outcome:** You could reimplement the stage runner and `before("handle", fn)`.

### Phase E — Contracts + generate

Read `validateStage` and `generateRoutes`. Add tests the way `*.test.ts` does (`listen(0)`, `fetch`, `close`).

### Phase F — Consumer confidence

Read `client.ts` and extend Seltzer client patterns (errors, TLS) using Phase A fundamentals.

---

## When You're Stuck

- **Read the Node docs for the exact API** (`for await` of `req`, `res.writeHead`) before asking AI to write a stage
- **Trace one request on paper** — method, path, which stage mutates what on `ctx`
- **Compare to current src** — `libraries/seltzer/src/pipeline/` is the ceiling, not a future
- **Allowed AI use** — syntax lookup, TypeScript errors, test scaffolding; **not** whole pipeline implementations

---

## Recommended Study Order

1. **Product README** ([README](./README.md)) — know what already ships
2. **Design overview** ([seltzer-design.md](./seltzer-design.md)) — why pipelines
3. **Exercise 1–2** + Node HTTP/stream docs
4. **FEM: Complete Intro to Node.js v3** (HTTP + streams sections)
5. **Exercise 3–5** — rebuild shipped matching + `ResponseData`
6. **FEM: API Design in Node.js v4** (error/response shaping)
7. **Exercise 6–7** — pipeline runner
8. **TypeScript generics refresh** — type `RequestContext`, `Route<T>`, `Stage`
9. **Read `libraries/seltzer/src/`** — one module at a time against your scratch code
10. **Nectarine `listApiOperations` skim** — when you care about `generateRoutes`

---

## Success Criteria

You are ready to extend Seltzer without AI scaffolding when you can:

1. Implement a new pipeline stage (e.g. logging, auth) and register it with `before("handle", ...)`
2. Explain why request bodies require stream handling and why invalid JSON is 400
3. Add a parametric route and populate `ctx.params`, including why `/items/new` beats `/items/:id`
4. Return structured data from a handler and let the runtime serialize the HTTP response
5. Extend the Seltzer client the way 0.8.x does (`HttpError`, JSON vs text, optional TLS)
