# Seltzer Roadmap

## Current position

Seltzer is no longer just an essay about pipelines.

It is a small, implemented listener with three visible layers:

- `Seltzer.init` / `.route` / `.handler` / `.listen` in `seltzer.ts`
- an inline `ctx` with `req`, `res`, `options`, and `json`
- `client.*` in `client.ts` as a JSON `fetch` wrapper

The strongest part of Seltzer today is still the kernel you can read in one file: exact routes, first match, JSON 404, `ctx.json`. The next strongest area is the vocabulary (`Route`, `Endpoint`) that KiwiPress and Nectarine-shaped YAML already speak.

The weakest areas are still:

- everything the [design overview](./seltzer-design.md) describes as stages
- body / params / structured returns
- `client` edge honesty
- tests

Early implementation is the honest label. The kernel is real enough to teach in depth (this docs set); the pipeline is not.

---

## What is already true

### 1. Exact-path `listen` is a finished idea, not a sketch

`route.method === req.method && route.path === pathname` is the matcher. `ctx.json` is `writeHead` + `stringify` + `end`. Unmatched requests are `{ error: "Not Found" }`.

What that means for the roadmap: Seltzer does not need a new “way to start a server.” It needs better *edges* (await handlers, return the `Server`, body helper) around this one.

### 2. Handlers own the socket

The product bet that shipped is the opposite of the design bet that has not: today the handler writes. The design wants the handler to return data and a `send` stage to write.

Both can be true later if structured returns are added **without** breaking `ctx.json`. Until then, docs and examples must teach writes, not returns.

### 3. The client is a sibling, not a full HTTP stack

Five methods, JSON only, concatenate `baseUrl` + `path`. That is enough to call a Seltzer process from Node. KiwiPress already outgrew it (status checks, `endpoint` as absolute URL, `undici` TLS).

The roadmap should not pretend `client` is KiwiPress. Align fields or document the split — do not silently read `endpoint` in prose.

### 4. Nectarine integration is copy, not codegen

YAML `method` / `endpoint` pairs are data. Seltzer `.route` is registration. The join is app code. `registerRoute` does not mount handlers and does not understand the `user.` prefix on the checked-in fixture.

A future contract stage is valuable. A fake importer in documentation is not.

### 5. The design doc is a real target, stored out of the product path

[seltzer-design.md](./seltzer-design.md) plus [courses](./courses.md) and [exercises](./exercises/README.md) are how contributors grow the runtime. They are electives. Product onboarding is the tutorial and topic pages.

The roadmap should keep that split sharp. Shipping a stage means moving it from design into `libraries/seltzer/src` **and then** into the product docs — not the other way around.

---

## What is still holding Seltzer back

### 1. Bodies and params are the first questions authors ask

Every JSON API needs a POST body and most need an id. The kernel answers neither. Query-string ids and hand-rolled `readJson` are teachable; they are also the ceiling of “feels like a framework.”

Highest-value code increments, if the core is opened:

1. a documented `readJson` helper (even unexported-as-pattern in docs today)
2. awaiting async handlers + 500 on throw
3. parametric routes **after** exact-path behavior is boring and tested

Do not document `:id` or `ctx.body` until they exist.

### 2. `listen` is hard to test

No returned `Server`, no `close`, no test suite. Docs can be honest without those. A 1.0 claim cannot.

### 3. `client` disagrees with `Endpoint` and with KiwiPress

Required `endpoint` field unused. `allowSelfSigned` unused. No `ok` check. Slash joining is naive.

Small fixes here help more than a new pipeline runner.

### 4. Handler return values look like they should work

`return { status, body }` is the design-doc happy path and a natural guess. It hangs. Either implement send, or keep anti-patterns loud. This docs pass does the latter.

### 5. The leftover `server.ts`

A second `createServer` in-tree confuses contributors. Delete or wire it when the package is touched. Docs already warn.

---

## Revised status

If Seltzer is viewed as an HTTP platform, its current maturity looks roughly like this:

- Exact-path listener: strong
- `ctx.json`: strong, sharp (no extra headers)
- Client: useful and narrow
- Docs as product surface: much stronger after the tutorial and topic pages
- Pipeline / params / parse: not started in source
- Production-hardened framework: not the goal yet

In practical terms:

- Seltzer already feels like a real first HTTP process for this monorepo
- Seltzer does not yet feel like a complete alternative to Express, and it should not try to by growing `use()`

That is a strong place to be.

---

## Priorities

### Priority 1. Keep the product path obvious

The next work that helps the most is not a new stage. It is:

- examples that look like JSON APIs, not pipeline diagrams
- anti-patterns for Express and design-doc habits
- a guided tutorial that includes POST body and query lookup

This docs set is that work. Keep it aligned with `libraries/seltzer/src` when the code moves.

### Priority 2. Harden `listen` edges

If the core is opened:

1. `await` the handler; map uncaught errors to JSON 500
2. return `http.Server` (or an object with `close`)
3. optionally a small `readJson` exported helper — still not a pipeline

Do not add `app.use` as the extensibility story. The design already chose named stages over middleware.

### Priority 3. Make `client` match its type

Useful increments:

- document (or implement) `endpoint` vs `path`
- refuse to claim `allowSelfSigned`
- optional `ok` check **or** keep always-json and say so (current docs say so)
- slash-safe join

### Priority 4. Parametric routes after exact match is tested

`/users/:id` is the most requested missing piece. It is also the easiest to fake in docs. Implement it in source, test it, then teach it. Until then, query strings.

### Priority 5. Pipeline as the contributor track

Exercises 5–7 and the design essay remain the path to named stages. Promote a stage to the README showcase only when `seltzer.ts` (or a module it calls) runs it.

### Priority 6. Stay complementary to Nectarine, Sig, Juice

Seltzer should not grow a YAML compiler, a theme, or a component tree. If a pattern needs a contract, copy Nectarine. If it needs a page, Sig + Juice `fetch`.

---

## Recommended build order

1. Keep docs and examples locked to source (ongoing).
2. Await handlers + 500 mapping; return `Server` from `listen`.
3. `client` field/URL honesty.
4. Tests for match, 404, `json`, first-wins.
5. Optional `readJson` helper.
6. Only then: parametric routes or a real parse stage — not both at once.
7. Structured returns and named pipeline after those are boring.

---

## What would not move Seltzer upward

- Documenting `ctx.params` / `pipeline.insert` before they exist
- An Express compatibility layer
- Codegen from Nectarine that is not in Nectarine
- Merging Seltzer and Nectarine into one “backend framework” package
- Starting app authors on exercise 06

Those would blur the split that justifies the product path versus the elective path.

---

## Shipped vs design-doc future

| Shipped (teach this) | Design / exercises (label this) |
|---|---|
| `init` / `route` / `listen` | Named pipeline runner |
| Exact match, first-wins | `/users/:id` → `ctx.params` |
| `ctx.json`, raw `res` | Handler `return { status, headers, body }` |
| Manual body stream | `parse` stage |
| `client.*` JSON fetch | Status-throwing client, TLS agent |
| Copy Nectarine exact paths | Contract `validate` stage |
| Wrapper functions for auth/CORS | `before("handle", fn)` |

---

## Summary

Seltzer is in a meaningfully stronger place than a design-only HTTP essay.

It now has:

- a credible exact-path listener
- `ctx.json` as a real write helper
- a JSON client sibling
- a documented split with Nectarine, Sig, and Juice
- a guided tutorial and topic depth that match that split

The next stage is not inventing Seltzer from scratch.

The next stage is refinement:

- make `listen` awaitable and closeable
- make `client` match its types
- test the matcher
- promote parse / params / pipeline only when they land in source

That is a strong place to be. Until those land, the product docs stay with [Status](./seltzer-status.md) and the APIs in `libraries/seltzer/src`.
