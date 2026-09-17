# 09 — Describe operations, then generate routes

[Previous](./08-browser-boundaries.md) · [Course](./README.md) · [Next](./10-testing-operations.md)

**Goal:** separate HTTP registration from data execution and avoid response-wrapper mistakes. Allow 60–75 minutes.

## A description is not an implementation

Once several resources have similar routes, writing their method/path wiring repeatedly becomes tedious. An operation description records that wiring as data. It still needs a function that performs the operation.

Our generated example starts with records such as:

```js
{
  resource: "note",
  crud: "read",
  name: "noteById",
  method: "GET",
  path: "/notes/:id",
  query: "noteById",
}
```

`query` here is a **named operation key**. It is not the URL search string, SQL, or an instruction Seltzer executes by itself. URL query inputs remain on `ctx.query`.

## Follow the translation

Stop Notes and run:

```sh
node docs/seltzer/http-course/examples/run-generated.mjs
```

The complete application is [generated-server.mjs](./examples/generated-server.mjs). `generateRoutes(operations, { execute })` returns route objects. The host registers each one with `app.route(route)`.

When a request matches, the generated handler passes `resource`, named `query`, `params`, parsed `body`, original `operation`, and `ctx` to the supplied executor. Our executor switches on the key and reads a map. No database, YAML parser, or query compiler is required.

Try `/notes/intro`, `/notes/stats`, and `/notes/missing`. Observe that the generated static stats route wins over the parameter route too.

## The return contract differs from a hand-written handler

An ordinary handler returns `ResponseData`. A generated route's **executor** normally returns payload data; the generated handler wraps it.

| Executor result | Generated behavior |
|---|---|
| `[{ id: "intro" }]` | Sends that array as body |
| `{ body: "a field in my data" }` | Sends an object containing a `body` field |
| `{}` | Sends an empty JSON object |
| `null` or `undefined` | Default 404, for any generated operation |
| `response({ status: 201, body: note })` | Sends an explicit transport result |

The `response()` helper brands the object with a non-enumerable symbol. This avoids confusing business data containing fields named `status` or `body` with transport instructions.

For a generated delete, do not return `undefined` to mean success: that selects 404. Return `response({ status: 204 })`. For an empty collection, return `[]`. For a generated create, explicitly choose 201 using `response`; an ordinary payload defaults to 200.

## Where Nectarine can join

Nectarine can flatten a YAML API description into the same `ApiOperation[]` shape using `listApiOperations`. Seltzer then generates routes. The host supplies an executor backed by its chosen repository or Nectarine query facilities.

```text
YAML description -> Nectarine operation list -> Seltzer route generation
                                                 |
HTTP request -> matched generated handler -> host execute -> data result
```

This is an architectural sketch, not another required dependency for the course. The runnable example uses hand-written operations so you can learn the contract before adding database setup. For the concrete optional integration, continue with [Seltzer integration](../seltzer-integration.md) and [Nectarine](../../nectarine/README.md).

Generation copies body specs into `Route.contract`, so the same presence-only validation applies. It does not make a full schema validator appear. Read [generate-routes.ts](../../../libraries/seltzer/src/generate/generate-routes.ts) to see both the copied metadata and the wrapping decisions.

## Checkpoint

Add a generated read operation whose payload is `{ status: "draft", body: "note text" }`. Verify that these fields remain application data. Then design the explicit return for a successful generated delete and explain why an empty list should not return null.

[Answers](./answers.md#lesson-09)
