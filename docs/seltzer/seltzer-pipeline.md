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
| `parse` | Read the body (JSON or raw UTF-8 string). Invalid JSON → 400. Empty → `undefined`. Over `bodyLimit` → 413. GET/HEAD skip the body. |
| `context` | Set `method`, `path`, `query`, and lowercased `headers` on ctx. |
| `route` | Match a registered route and fill `params`. Unknown path → 404. Known path, wrong method → 405 + `Allow`. Malformed param encoding → 400. |
| `validate` | If `ctx.route.contract.body` has `.required` keys, they must be present and non-empty on `ctx.body`. Presence only. Failure → 400 with the messages below. No specs → no-op. Does not set `ctx.valid`. |
| `handle` | Call the matched handler. Handlers must return `ResponseData`. |
| `response` | Reject non-`ResponseData` handler results with 500 and a log line (route + returned value). Defaults live in `send`. |
| `send` | Write the HTTP response via `send()`. `replace("send")` throws. |

CORS headers and `OPTIONS` 204 run in `listen` **before** `pipeline.run`, and only when `cors` was passed. They are not stages. Without `cors`, `OPTIONS` enters the pipeline like any other method.

## Stage contract

```ts
type Stage = (
  ctx: PipelineContext,
) => void | ResponseData | Promise<void | ResponseData | undefined>;
```

Stages **mutate** `ctx` in place. Return `void` / `undefined` to continue. Return `ResponseData` to set `ctx.response` and skip remaining stages except builtin `send`. Any other return is 500 and is logged.

Thrown errors become `{ status: 500, body: { error: "Internal Server Error" } }` and also jump to `send`. The body has no `message` and no stack. `listen({ logger })` gets one line (default `console.error`) with the error message. `debug: true` adds the stack to that line only.

While a hook or handler runs, `ctx.res` writes throw. `ctx.json` and `ctx.send` throw.

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

Swaps the builtin. Inserted `before` stages stay in place. The replacement remains `builtin: true`, so later `before(name, …)` still finds it. `replace("send")` throws. The builtin `send` is the only writer.

`before("validate", …)` then `replace("validate", …)` runs: inserted stage, then the new builtin.

## Default `validate` rules

From `validateStage`:

- No `ctx.route.contract.body` → no-op (typical GET reads).
- Specs with no `.required` token (`name: "string"`) → no-op.
- `.required` is split on `.` (`string.required`, `int.required`). The words `string` and `int` are not type checks. A number, boolean, object, or array counts as present.
- Body must be a plain object when any key is `.required`. Arrays, strings, and a missing body → 400 `{ error: "Request body must be an object" }`.
- A value is present if it is not `undefined` / `null`, and strings must be non-whitespace.
- Missing keys are listed in spec key order: `Missing required field: email` or `Missing required fields: email, name`.
- The stage does not read or write `ctx.valid`. After a normal request it is still `undefined` unless an earlier hook assigned it. `ctx.body` stays the raw parsed input.
- These failure bodies are not `validationError()`. That helper is for replacements.

`generateRoutes` copies `ApiOperation.body` onto `Route.contract` so generated writes get this check without extra code. It does not attach a schema.

## Replacement `validate`

```ts
app.replace("validate", stage)
```

The replacement **is** the validate stage. The `.required` checks do not also run.

The stage receives `ctx` after `parse`, `context`, and `route` (`ctx.route`, `ctx.body`, `ctx.params`, `ctx.query` are set). It returns:

| Return | Effect |
|---|---|
| `undefined` / `void` | continue to `handle` |
| `ResponseData`, including `validationError(issues)` | skip to builtin `send`. The handler does not run |
| any other value | 500 `{ error: "Internal Server Error", message: "Handler must return ResponseData …" }`, logged, handler does not run |
| throw | 500 `{ error: "Internal Server Error" }` with no message and no stack. The error is logged. `debug: true` adds the stack to that log line only |

Parsed values go on `ctx.valid`:

```ts
type ValidatedInput<TBody = unknown, TParams = unknown, TQuery = unknown> = {
  body?: TBody;
  params?: TParams;
  query?: TQuery;
};
```

`ctx.body`, `ctx.params`, and `ctx.query` stay the raw pipeline input. Handlers that did not replace `validate` keep reading those fields; `ctx.valid` is `undefined`.

`validationError(issues)` returns:

```ts
{
  status: 400,
  body: {
    error: "Validation failed",
    issues: [{ path: ["email"], message: "Invalid email" }],
  },
}
```

`path` is `(string | number)[]`. `[]` is the whole value, `["email"]` is a field, `["items", 0, "qty"]` is a nested index. A bare string is not a path. The helper copies `path` and `message` and rejects any other path element.

Seltzer does not depend on Zod. The app may. This recipe is the same shape as `schema.safeParse`: `{ success: true, data }` or `{ success: false, error: { issues: [{ path, message }] } }`.

```ts
import { z } from "zod"; // application dependency — not a dependency of @citrusworx/seltzer
import { Seltzer, validationError, type ResponseData } from "@citrusworx/seltzer";

const JoinWaitlist = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

const CreateNote = z.object({
  text: z.string().min(1),
});

const schemas = {
  "POST /api/waitlist": JoinWaitlist,
  "POST /api/notes": CreateNote,
};

const app = Seltzer.init().replace("validate", (ctx) => {
  const key = ctx.route ? `${ctx.route.method} ${ctx.route.path}` : "";
  const schema = schemas[key as keyof typeof schemas];
  if (!schema) {
    return;
  }

  const parsed = schema.safeParse(ctx.body);
  if (!parsed.success) {
    return validationError(
      parsed.error.issues.map((issue) => ({
        path: issue.path.filter(
          (part): part is string | number => typeof part === "string" || typeof part === "number",
        ),
        message: issue.message,
      })),
    );
  }

  ctx.valid = { body: parsed.data };
});

app.route({
  method: "POST",
  path: "/api/waitlist",
  handler: (ctx): ResponseData => ({
    status: 201,
    body: ctx.valid?.body,
  }),
});
```

`ctx.route.path` is the pattern (`/api/products/:id`), not the request path (`ctx.path`). Generated routes can use `ctx.route.contract.name` (`joinWaitlist`) the same way. `contract.body` is still the YAML spec map, so a replacement can read it, but nothing in Seltzer turns those strings into a schema. A route missing from the map continues with `ctx.valid` unset, including when that route's `contract.body` contains `.required`.

Do not reimplement JSON parse in the replacement. `parse` already did that.

## Short-circuit vs fall-through

| Stage result | Effect |
|---|---|
| `undefined` / `void` | next stage |
| `ResponseData` | skip to builtin `send` |
| any other value | 500 JSON, logged, skip to builtin `send` |
| throw | generic 500 JSON, logged, skip to builtin `send` |

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
