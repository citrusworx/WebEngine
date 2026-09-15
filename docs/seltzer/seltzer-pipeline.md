# Seltzer Pipeline

The named request pipeline is **shipped core** in `@citrusworx/seltzer` **0.8.x**, not a design elective.

Source: `libraries/seltzer/src/pipeline/**` and `Seltzer#before` / `Seltzer#replace` in `core/seltzer.ts`.

0.2.0 docs (and PR #34) described `parse` / `validate` / `send` as exercises. That story is closed. App authors should read this page the way they read [Routing](./seltzer-routing.md). [Design](./seltzer-design.md) explains *why* stages exist; this page explains *what they do*.

## Stage order

```text
parse → context → route → validate → handle → response → send
```

`STAGE_NAMES` is exported as that tuple. Each builtin occupies a named slot. User stages inserted with `before` share the target’s name but are not `builtin`.

| Stage | Responsibility |
|---|---|
| `parse` | Read the body (JSON or raw). Invalid JSON → 400. GET/HEAD skip the body. |
| `context` | Set `method`, `path`, `query`, and lowercased `headers` on ctx. |
| `route` | Match a registered route and fill `params`. No match → 404. |
| `validate` | If `ctx.route.contract.body` has `.required` keys, they must be present and non-empty on `ctx.body`. Failure → 400. No specs → no-op. |
| `handle` | Call the matched handler. Handlers must return `ResponseData`. |
| `response` | Reject non-`ResponseData` handler results with 500. Defaults live in `send`. |
| `send` | Write the HTTP response via `send()`. |

CORS headers and `OPTIONS` 204 run in `listen` **before** `pipeline.run`. They are not stages.

## Stage contract

```ts
type Stage = (
  ctx: PipelineContext,
) => void | ResponseData | Promise<void | ResponseData | undefined>;
```

Stages **mutate** `ctx` in place. Return `void` / `undefined` to continue. Return `ResponseData` to set `ctx.response` and skip remaining stages except builtin `send`.

Thrown errors become `{ status: 500, body: { error: "Internal Server Error", message } }` and also jump to `send`.

Unknown names throw: `Unknown pipeline stage "parse"` if that builtin is missing (it is not, on the default pipeline).

## `before`

```ts
app.before(name: StageName, stage: Stage): this
```

Inserts immediately **before the builtin** named `name`. Each call splices in front of that builtin, so earlier `before` calls run first and the latest insert runs immediately before the builtin:

`before("handle", a)` then `before("handle", b)` → `a`, `b`, builtin `handle`.

Auth example from tests:

```ts
import { Seltzer } from "@citrusworx/seltzer";
import type { ResponseData, Stage } from "@citrusworx/seltzer";

const requireAuth: Stage = (ctx) => {
  if (!ctx.headers.authorization) {
    return { status: 401, body: { error: "Unauthorized" } };
  }
};

const app = Seltzer.init().before("handle", requireAuth);

app.route({
  method: "GET",
  path: "/secret",
  handler: (): ResponseData => ({ body: { ok: true } }),
});
```

Missing `Authorization` → 401; `handle` does not run. Present → 200.

Logging after parse:

```ts
app.before("context", (ctx) => {
  // body already on ctx for POST; path not yet — that is set in `context`
});

app.before("route", (ctx) => {
  console.log(ctx.method, ctx.path);
});
```

Put logging `before("route")` if you need `ctx.path`. Put auth `before("handle")` so 404s still happen first.

## `replace`

```ts
app.replace(name: StageName, stage: Stage): this
```

Swaps the builtin. Inserted `before` stages stay in place. The replacement remains `builtin: true`, so later `before(name, …)` still finds it.

Nectarine’s intended hook:

```ts
app.replace("validate", (ctx) => {
  // read ctx.route?.contract, run Zod / full YAML checks
  // return { status: 400, body: { error: "…" } } or void
});
```

Default `validate` is presence-only for `.required`. Hosts that need types, formats, or response-shape checks replace it. Do not also reimplement JSON parse — that already happened.

`before("validate", …)` then `replace("validate", …)` runs: inserted stage, then the new builtin.

## Default `validate` rules

From `validateStage`:

- No `ctx.route.contract.body` → no-op (typical GET reads).
- Specs with no `.required` token (`name: "string"`) → no-op.
- `.required` is split on `.` (`string.required`, `int.required`).
- Body must be a plain object; arrays/strings/missing → 400 `{ error: "Request body must be an object" }`.
- A value is present if it is not `undefined` / `null`, and strings must be non-whitespace.
- Missing keys listed in one message: `Missing required field: email` or `Missing required fields: email, name`.

`generateRoutes` copies `ApiOperation.body` onto `Route.contract` so generated writes get this check without extra code.

## Short-circuit vs fall-through

| Stage result | Effect |
|---|---|
| `undefined` / `void` | next stage |
| `ResponseData` | skip to builtin `send` |
| throw | 500 JSON, skip to builtin `send` |

`handle` does not return `ResponseData` itself; it assigns `ctx.response = await handler(ctx)`. `response` then validates that shape. A handler that returns `{ ok: true }` is a 500 **after** handle, not a hang.

## What is not in the pipeline API

- `after(name, stage)` — only `before`
- `remove(name)` — not exported
- Free-form stage names — only `STAGE_NAMES`
- Immutable ctx copies — mutation is the model
- `app.use` / `next()`

[Exercises 6–7](./exercises/README.md) rebuild this runner from `node:http` so you can read `pipeline/index.ts` without cargo-culting it. They are not “implement the missing stage.”

## Related

- [Request and response](./seltzer-request-response.md)
- [Generate routes](./seltzer-generate.md)
- [Best practices](./seltzer-best-practices.md)
- [Design](./seltzer-design.md) — why not middleware
