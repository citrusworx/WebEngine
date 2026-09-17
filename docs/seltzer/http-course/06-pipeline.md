# 06 — Open the request engine

[Previous](./05-notes-api.md) · [Course](./README.md) · [Next](./07-client.md)

**Goal:** trace a request, explain early exits, and place an extension where its inputs exist. Allow 75–90 minutes.

## A shared worksheet passed through ordered steps

Imagine a request accompanied by a worksheet. One step records its body, another identifies its destination, another writes the intended response. Each step can read fields earlier steps filled in. An early failure can send the worksheet directly to the reply desk.

In Seltzer that worksheet is `PipelineContext`. The steps are functions, called stages. The order is explicit:

```text
Node request
  -> CORS headers / OPTIONS shortcut
  -> parse -> context -> route -> validate -> handle -> response -> send
```

| Stage | Adds or decides |
|---|---|
| `parse` | `ctx.body`; malformed input can return 400 |
| `context` | `method`, `path`, query strings, normalized headers |
| `route` | `ctx.route`, `ctx.params`; no match returns 404 |
| `validate` | Checks required contract fields; can return 400 |
| `handle` | Calls the handler and assigns `ctx.response` |
| `response` | Checks that the handler returned `ResponseData` |
| `send` | Writes bytes to Node's response |

The initial context has empty `path`, `headers`, `query`, and `params`. `parse` reads the raw `req`, not those later-normalized fields. `before("context")` therefore cannot assume `ctx.headers.authorization` is populated yet.

## Mutate to continue, return a response to stop

A normal stage changes the context and returns `undefined`. A returned object recognized as `ResponseData` becomes `ctx.response` and switches the runner into “skip to built-in send” mode. A thrown error also switches to that mode, using a 500 response.

An ordinary handler's return is different: `handleStage` stores it on the context and returns nothing. That lets the following `response` stage check it. These two paths explain why returning an object from a custom stage can skip more work than you intended.

Read [Pipeline.run](../../../libraries/seltzer/src/pipeline/index.ts) and [the built-in stages](../../../libraries/seltzer/src/pipeline/stages.ts) alongside this table.

## Extend the implemented API

Add this **application code** after constructing `app` and before listening:

```js
app.before("handle", (ctx) => {
  console.log("Matched", ctx.method, ctx.path);
});
```

At this point normalization and matching are complete. The stage returns nothing, so handling continues. It will not log malformed-body, unmatched-route, or validation failures because those already short-circuited.

To observe completed responses across those early exits, attach the observer earlier:

```js
app.before("parse", (ctx) => {
  const started = performance.now();
  ctx.res.once("finish", () => {
    console.log(ctx.req.method, ctx.res.statusCode,
      Math.round(performance.now() - started), "ms");
  });
```

This avoids relying on a later stage to run. It still misses OPTIONS because that shortcut happens before the pipeline. `finish` is a server-side event, not proof that the client consumed the body. Production telemetry also needs aborted-connection handling and a policy for excluding sensitive data.

## A subtle trap: `before("send")`

It sounds like a universal place to add response headers. It is not. The runner skips every entry except the built-in send when short-circuiting. An inserted `before("send")` stage is skipped on early returns and errors.

A deliberate replacement of the built-in send can cover pipeline exits, but then you own sending. It still does not cover the listener's OPTIONS shortcut. Lesson 11 proposes a more explicit response-finalization contract rather than pretending an `after` hook already exists.

## Replacing validation

`app.replace("validate", customStage)` replaces, rather than supplements, the default validator. If you still want required-field behavior, your replacement must implement it. `before("validate", customStage)` instead adds a check and keeps the default stage.

The root package exports `Stage` as a TypeScript type, but it does not export every internal stage implementation or the `Pipeline` class as a public subpath. Follow source links to study internals; build applications against public APIs.

## Checkpoint

Trace three requests: valid POST, malformed JSON POST, and an unmatched GET. Which stages run? Would a `before("send")` response header appear on all three? Where would you put a route-aware access check, and which earlier work would already have happened?

[Answers](./answers.md#lesson-06)
