# Seltzer Study: Node.js Reading & Course List

A structured path to write **Seltzer** yourself — from raw `node:http` through streams, routing, pipeline stages, and contract validation — without leaning on AI for whole features.

Start with the [Seltzer Design Overview](./README.md) if you have not read it yet. This guide maps learning topics directly to Seltzer's HTTP pipeline, current implementation gaps, and hands-on exercises.

---

## Core Topics

The concepts you need to understand deeply:

- **Node runtime basics** — ESM (`"type": "module"`), `node:` imports, monorepo `yarn workspace`, `node:test`
- **HTTP protocol** — methods, status codes, headers, content negotiation, statelessness
- **`node:http`** — `createServer`, request/response objects, when the connection closes
- **Streams** — `data` / `end` / `error` on request bodies; why bodies are not ready synchronously
- **URL handling** — `new URL()`, `URLSearchParams`, decoding path segments
- **Routing** — exact vs parametric routes; extracting `:id` without a framework
- **Async server handlers** — returning Promises from handlers; central error → 500 mapping
- **Pipeline design** — ordered named stages vs middleware chains (see design doc § Why Pipelines)
- **Validation / contracts** — runtime checks at a dedicated stage (preview Nectarine integration)
- **HTTP client** — `fetch`, non-2xx handling, TLS edge cases (see KiwiPress `undici` pattern)
- **TypeScript for libraries** — generics for context types, narrow exports, declaration files

### Seltzer topic map

| Seltzer concern | Where it lives today | What you need to write by hand |
|---|---|---|
| Raw HTTP server | `libraries/seltzer/dist/core/seltzer.js` — `http.createServer`, `writeHead`, `end` | `IncomingMessage` / `ServerResponse` lifecycle |
| Context normalization | Design in [README](./README.md) § Context Object | Build `ctx` from method, path, query, headers, body, params |
| Body parsing | Design § Parse Request (streams) | Collect stream chunks, parse JSON safely |
| Routing | Current: exact match only; design: `:id` params | Parametric path matching, `ctx.params` |
| Pipeline stages | Design § Pipeline Model (`parse → context → route → validate → handle → response → send`) | Named, ordered stage runner with insert/replace |
| Structured responses | Design § Structured Response Model | Handlers return `{ status, headers, body }`; runtime sends |
| HTTP client | `libraries/seltzer/dist/core/client/client.js` + `packages/kiwipress/src/core/route-utils.ts` | `fetch`, error handling, optional `undici` Agent for TLS |
| Contracts | Planned; ties to Nectarine | Validation at a pipeline stage, not ad hoc in handlers |
| Library authoring | `libraries/seltzer/package.json` — ESM + TypeScript | Generics (`Route<TContext>`), `.js` import extensions, `node:` prefix |

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

Required reading before implementing body parsing. Request bodies arrive as streams — they are not ready synchronously inside the server callback.

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

### [Seltzer Design Overview](./README.md) § Why Pipelines Were Chosen Over Middleware

**Required reading.** Seltzer deliberately avoids middleware chains and hook systems. Understand the pipeline model before implementing stages.

### [Pipeline pattern](https://martinfowler.com/articles/collection-pipeline/) — Martin Fowler

Conceptual backing for named, ordered stages instead of free-form middleware.

---

## Optional / Later

### [Nectarine](../nectarine/README.md)

Skim once the `validate` stage exists. Seltzer executes HTTP; Nectarine defines schemas and contracts. They integrate at the validation stage, not inside handlers.

---

## Hands-On Exercises

Each exercise is ~1–2 hours. Write them in plain `node:http` + TypeScript — in a scratch file or [`libraries/seltzer/src/example.ts`](../../libraries/seltzer/src/example.ts). **Do not use AI for the core logic**; syntax lookup and TypeScript errors are fine.

Numbered starter templates live in [`exercises/`](./exercises/).

| # | Exercise | Proves you can build |
|---|---|---|
| 1 | Echo server: log method, path, headers; return plain text | Basic `createServer` callback |
| 2 | JSON POST server: stream-collect body → `JSON.parse` → echo object | **Parse stage** foundation |
| 3 | Router: register `{ method, path, handler }`, 404 fallback | Current Seltzer v0.2 behavior |
| 4 | Parametric router: `/users/:id` → `{ id: "42" }` | **Route stage** upgrade |
| 5 | Handler returns `{ status, body }`; runtime calls `writeHead`/`end` | **Response + send stages** |
| 6 | Five named functions run in order on a shared `ctx` | **Pipeline runner** skeleton |
| 7 | Insert custom stage before `handle` (e.g. auth header check) | Pipeline modification API |
| 8 | `fetch` client with status check + JSON parse | Seltzer client + KiwiPress patterns |

After exercise 6, refactor incrementally into `libraries/seltzer/src/` modules:

- `pipeline/stages.ts` — stage implementations
- `pipeline/index.ts` — runner + insert/replace API
- `pipeline/router.ts` — matching + params
- `types/context.ts`, `types/request.ts`, `types/response.ts`
- `contracts/` — validation hook surface

---

## Course Journey Phases

Each phase unlocks a concrete, commit-sized goal in Seltzer.

### Phase A — Speak HTTP (1–2 weeks)

**Exercises:** 1–3

**Outcome:** You can explain every line in current `Seltzer.listen()` (`libraries/seltzer/dist/core/seltzer.js`).

### Phase B — Own the body (1 week)

**Exercises:** 2 + Node stream docs

**Outcome:** Implement `parse` stage with JSON + raw fallback (per design doc).

### Phase C — Context + routing (1 week)

**Exercises:** 3–4

**Outcome:** `ctx` type populated; dynamic segments in `ctx.params`.

### Phase D — Pipeline engine (2 weeks)

**Exercises:** 5–7 + pipeline reading

**Outcome:** Replace monolithic server callback with stage runner; API to `before("handle", fn)`.

### Phase E — Contracts + polish (ongoing)

Add `validate` stage stub; wire optional contract id on routes; tests with `node:test` + `http.request`.

### Phase F — Consumer confidence

Read `packages/kiwipress/src/core/WPClient.ts` and extend Seltzer client patterns (errors, TLS) using Phase A fundamentals.

---

## When You're Stuck

- **Read the Node docs for the exact API** (`req.on("data")`, `res.writeHead`) before asking AI to write a stage
- **Trace one request on paper** — method, path, which stage mutates what on `ctx`
- **Compare to current dist** — `libraries/seltzer/dist/core/seltzer.js` is only ~45 lines; use as a baseline, not the ceiling
- **Allowed AI use** — syntax lookup, TypeScript errors, test scaffolding; **not** whole pipeline implementations

---

## Recommended Study Order

1. **Seltzer design overview** ([README](./README.md)) — 1 hour; know the target pipeline
2. **Exercise 1–2** + Node HTTP/stream docs — hands-on before any course
3. **FEM: Complete Intro to Node.js v3** (HTTP + streams sections)
4. **Exercise 3–5** — rebuild current Seltzer behavior yourself from scratch in a scratch file
5. **FEM: API Design in Node.js v4** (error/response shaping) — maps to structured handler returns
6. **Exercise 6–7** — pipeline runner
7. **TypeScript generics refresh** — type `Context`, `Route<T>`, stage signatures
8. **Implement in `libraries/seltzer/src/`** — one stage per PR-sized chunk
9. **Nectarine contract skim** — when `validate` stage lands

---

## Success Criteria

You are ready to extend Seltzer without AI scaffolding when you can:

1. Implement a new pipeline stage (e.g. logging, auth) and register it with `before("handle", ...)`
2. Explain why request bodies require stream handling
3. Add a parametric route and populate `ctx.params` without copying from AI output
4. Return structured data from a handler and let the runtime serialize the HTTP response
5. Extend the Seltzer client the way KiwiPress extends HTTP calls (status checks, TLS)
