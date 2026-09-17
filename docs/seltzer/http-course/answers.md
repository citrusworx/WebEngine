# Checkpoint answers and review notes

[Course](./README.md)

Try each checkpoint first. These answers explain the cause, not just the observed status. Equivalent implementations are welcome when their behavior is explicit.

## Lesson 00

Stopping the server causes a connection failure: no HTTP response comes from the application. `/missing` on a running server produces an actual HTTP 404. The server process remains alive when a browser tab closes. TypeScript checks source-level expectations; incoming bytes did not go through its type checker, so runtime validation is still required.

## Lesson 01

Create uses `POST /notes`, `Content-Type: application/json`, and body `{"text":"Learn HTTP"}`. A successful server-side write can happen before the client loses the response. Retrying can create a second note. A client exception alone cannot tell you whether the first write committed.

## Lesson 02

Add this before `listen`:

```js
app.route({
  method: "GET",
  path: "/about",
  handler: () => ({
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    body: "A small HTTP course",
  }),
});
```

`res.end` completes the outgoing response associated with that callback. The listening server is a separate long-lived object. Ctrl+C interrupts the process unless application signal handling changes the shutdown behavior.

## Lesson 03

`/notes?q=stats` has pathname `/notes`; queries do not select `/notes/stats`. For repeated `q`, current normalization keeps the last value, `blue`. An unmatched route gets the pipeline's `Not Found`; a missing note gets our handler's `Note not found`. Both are 404 but arose at different stages.

## Lesson 04

| Body | Default required check | Notes application |
|---|---|---|
| `{}` | Rejects absence | Handler never runs |
| `{"text":0}` | Passes presence | Rejects non-string |
| `{"text":false}` | Passes presence | Rejects non-string |
| `{"text":" "}` | Rejects blank | Handler never runs |
| `{"text":" useful "}` | Passes | Trims and stores `useful` |

A cast only changes what a type checker believes; it does not convert or inspect the runtime value. This is why `unknown` plus a check is more honest than declaring all external JSON to be a note.

## Lesson 05

Inside `createNotesApp`, before returning the app:

```js
app.route({
  method: "GET",
  path: "/notes/first",
  handler: () => {
    const note = notes.values().next().value;
    return note ? { body: note }
      : { status: 404, body: { error: "No notes yet" } };
  },
});
```

The static route wins on specificity. Deleting a map entry removes application data; it does not unregister the parameter route. That route continues handling other IDs and returning a missing-note response for the deleted one.

## Lesson 06

A valid POST runs all seven built-ins. Invalid JSON runs parse, then jumps to built-in send. An unmatched GET runs parse, context, route, then jumps to send. Inserted `before("send")` work only runs on the full path, not those early exits.

A route-aware access check can run before validate or before handle, after route matching. At either point, parsing and normalization have already occurred. A before-handle check also comes after built-in validation, so some invalid input is rejected before identity/permission checks.

## Lesson 07

The first run's deliberate read-after-delete receives a real 404 and Seltzer throws `HttpError`. With no listening server, native fetch fails and the caught error is not `HttpError`. Successful responses with malformed JSON can fail decoding as another category. Blind retries ignore both the cause and the possibility that a previous write already happened.

## Lesson 08

OPTIONS is handled before matching and receives 204 even on an unknown path. Curl does not implement a browser page's cross-origin access restrictions. A browser can refuse to expose a response while the server remains callable by other clients; for some requests, the server-side effect may already have occurred. CORS cannot stand in for credential verification and permission checks.

## Lesson 09

An executor's ordinary `{ status: "draft", body: "note text" }` is payload data, so the client sees those exact fields under HTTP status 200. Use `response({ status: 204 })` for an explicit generated delete result. Returning null would trigger the default not-found response, whereas `[]` correctly represents a successful empty collection read.

## Lesson 10

A fresh app avoids state leaking between tests. Port zero avoids conflicts with another test or development process. A forgotten listener can keep the test process alive and reserve a port. Health only proves the route can answer; our in-memory notes do not survive restart.

A malformed-create test sends literal broken JSON with the JSON content type, asserts 400, and verifies no note was stored. It exercises parsing and early exit, not just the handler's validation function.

## Lesson 11

There is no single approved future API. Review whether the proposal specifies outcomes for success, invalid input, cancellation, and resource cleanup. Reject designs that use timers without cleanup, inspect body size only after allocating the whole body, promise delivery after destroying the connection, or assume retrying a write is harmless.

A good compatibility note names an existing caller-visible behavior that changes. A good acceptance test can fail even when the implementation appears structurally similar to the proposal. “It calls our new helper” is weaker evidence than “an oversized chunked request cannot reach the handler.”

## Lesson 12

For the Reading List capstone, a `finished` body value should be checked with `typeof value === "boolean"`, preserving false. A query value must be interpreted from strings explicitly, for example accepting only `"true"` or `"false"` and rejecting other supplied values.

Use the rubric in [the capstone](./12-capstone.md). Have the reviewer choose at least one request you did not rehearse. The objective is transferable reasoning, not reproducing the Notes app line for line.
