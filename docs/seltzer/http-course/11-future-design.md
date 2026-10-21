# 11 — Design the parts that are still missing

[Previous](./10-testing-operations.md) · [Course](./README.md) · [Next](./12-capstone.md)

**Goal:** turn an observed limitation into a testable design without confusing it with an existing feature. Allow 90–150 minutes for one proposal.

Everything still labeled **Proposed** on this page is a course design direction. Those signatures are not promises. Section B (outbound deadlines, cancellation, and URL join) has shipped; the other sections have not. The intended skill is evaluating a design, including when to reject it.

## Start from a failed promise

“Add production support” is too vague to implement or test. “Do not allocate an unbounded buffer for one incoming request” is a specific problem. It forces choices about byte counting, response status, unread data, and connection cleanup.

Use this sequence for each feature:

1. Describe the user-visible problem with a concrete request.
2. Identify which current function owns that behavior.
3. Write the desired result for success, invalid input, and cancellation.
4. Choose an API only after deciding those semantics.
5. Name compatibility effects, alternatives, and unresolved decisions.
6. Write acceptance tests before predicting an implementation date.

## A. Proposed: bounded incoming bodies

**Current evidence:** `readBody` in `pipeline/stages.ts` collects every chunk before decoding. `ListenOptions` contains no body-size setting. A route-aware stage runs after the body has already been buffered.

**Plain-language problem:** one visitor can send a parcel so large that the receiving desk runs out of space before inspecting the address.

**Proposed behavior:** the parser counts actual incoming bytes and stops collection at a configured limit. Over-limit input produces 413 when a response is still possible. An advertised `Content-Length` can allow early rejection but is not the sole source of truth: chunked or dishonest inputs must also be bounded.

One possible public shape, **not valid today**, is:

```ts
// Proposed API only; do not copy into a 0.9.0 application.
app.listen(3000, { maxBodyBytes: 1_048_576 });
```

The number above is an exercise default of one MiB, not a universally appropriate limit. The budget counts bytes, not JavaScript string length. It should bound retained data before `Buffer.concat`, not merely reject after allocating everything.

**Implementation seam:** pass a parser policy into pipeline construction or request context. Decide whether limits apply globally or per route. Per-route limits conflict with the current parse-before-route order; either change that order or do a lightweight match first. Both can change observable error precedence and need migration notes.

**Connection decision:** do not call `req.destroy()` immediately and then promise a 413 reached the client. Define whether to stop reading and close after responding, or drain under a separate bound. Test socket cleanup and the next request on a reused connection. Also decide whether compressed bodies are supported; if so, compressed and expanded sizes need independent budgets.

**Acceptance tests:** exactly-at-limit succeeds; one byte over fails; several chunks crossing the limit fail; an absent length header is bounded; an aborted request releases buffers; another client's request still succeeds; no handler executes after rejection.

**Open decision:** preserve the unlimited default for compatibility or adopt a finite default as an explicit behavior change. A changelog must state which was chosen.

## B. Shipped: outbound deadlines and cancellation

**Current behavior:** `createClient({ timeout })` and `options.timeout` set the deadline. The default is 30 seconds (`DEFAULT_CLIENT_TIMEOUT_MS`), the same number as the server `requestTimeout`. `0` disables it. `options.signal` aborts the call. `resolveRequestUrl` joins `baseUrl` and `path`.

```ts
client.get({
  path: "/notes",
  endpoint: "/notes",
  options: { baseUrl, signal: callerSignal, timeout: 2000 },
});
```

The deadline covers headers and the body. Caller abort and the deadline are merged (`AbortSignal.any` when it exists, otherwise a Node 18 combine). If the caller signal aborts, the error is `AbortError` even when the timer also fires. `TimeoutError`, `AbortError`, and `NetworkError` are not `HttpError`. The timer is cleared when the call ends. Cancelling the wait does not guarantee a remote write was cancelled.

The client does not retry. That is a [non-goal](../../../libraries/seltzer/README.md#no-client-retries): the caller owns retry policy. An idempotency key needs server-side storage and replay. That stage is planned and is not implemented. `options.headers` can still send `Idempotency-Key`.

**URL policy:** `baseUrl = http://host/api/v1` and `path = users` is `/api/v1/users`, not `/users`. `new URL(path, baseUrl)` is not the join, because a leading slash would drop the base path. Boundary slashes collapse. A trailing slash on the relative path stays. `options.query` is encoded; `null` and `undefined` are omitted; arrays repeat the key. An absolute `path` throws `UrlError` unless `allowAbsoluteUrl` is set. The path is not re-encoded.

**Tests:** `libraries/seltzer/src/core/client/client.conformance.test.ts` covers delayed headers, a delayed body, caller abort, an already-aborted signal, the Node 18 combine, timer cleanup, HTTP 404 as `HttpError`, prefix joining, and a single attempt on 503, timeout, and connection failure.

## C. Proposed: a richer validation contract

**Current evidence:** `.required` establishes presence only and does not set `ctx.valid`. `replace("validate", ...)` is implemented. `validationError(issues)` is the standard 400 (`path` is `(string | number)[]`), and a Zod `safeParse` recipe is documented. Seltzer does not depend on Zod. `Route` / `generateRoutes` still have no schema field. A general schema engine is not built into Seltzer.

**Plain-language problem:** a form can contain every box and still contain the wrong kind of information.

First decide ownership. Seltzer can expose transport boundaries while Nectarine or a host adapter owns schema interpretation. Keeping a validator adapter separate avoids silently turning every Seltzer consumer into a database/schema consumer.

A validator needs a result contract: success with validated data, or failure with field paths and stable error codes. Decide whether it merely checks or also normalizes `"42"` into `42`. Silent coercion can turn a user mistake into a stored value they never intended.

Distinguish body, route-parameter, and query validation. Repeated query values are currently collapsed, so a future array-valued query contract needs a representation change first. Unknown fields need an explicit allow/reject/strip policy. Optional, null, absent, and blank are separate states.

**Compatibility:** stricter checks can reject requests accepted by 0.9.0. Preserve presence-only defaults initially or announce a breaking contract change. Replacing a validator must state whether required-field behavior is preserved.

**Acceptance tests:** absent versus null; false and zero; wrong scalar type; nested field paths; unknown keys; malformed contracts rejected during startup; handler never sees invalid data; normalized values are exactly the ones the handler receives.

## D. Proposed: one response-finalization and error boundary

**Current evidence:** an inserted `before("send")` stage is skipped after early responses. OPTIONS bypasses the whole pipeline. Thrown error messages are included in 500 bodies. If built-in send itself throws, the runner catches it but has no later sending pass; replacing the response alone cannot guarantee delivery.

**Plain-language problem:** a stamp intended for every outgoing envelope should not be missing from rejection letters, and a failed delivery cannot be fixed by rewriting a letter nobody sends.

Define a finalization step that receives the selected response before bytes are written and runs once for successful handlers, validation failures, missing routes, thrown errors, and OPTIONS. This could live in the listener or in a revised pipeline contract. A new `after()` method alone does not solve bypassed paths.

The boundary should choose public error content independently from internal logs. A request ID can link a generic client error to private diagnostics. Validate status/header values and handle serialization failures before committing headers where possible. After headers are sent, a second JSON error response is no longer a valid fallback; define connection termination and logging behavior.

**Acceptance tests:** a common header appears on 200/400/404/500/OPTIONS; private exception text never enters the response; circular JSON follows the error policy; a finalizer exception does not recurse forever; already-started responses are not written twice; completion and cancellation are distinguished in telemetry.

## E. Proposed: explicit listen and shutdown policy

**Current evidence:** `listen(port, options)` returns Node's server, binds `127.0.0.1` unless `host` is set, and turns on header (20s), request (30s), and keep-alive (5s) timeouts. The host calls `server.close()`; idle keep-alive sockets need `closeIdleConnections()` if the callback must not wait. TLS configuration and an integrated drain deadline are still absent. The object-only shape below was not adopted.

Candidate API, **proposed only**:

```ts
app.listen({ port: 3000, host: "127.0.0.1", shutdownGraceMs: 5000 });
```

Prefer a backwards-compatible overload if this shape is adopted. Decide whether Seltzer owns OS signals or the host does; a reusable library should not casually install global process handlers. The course currently keeps signal handling in the executable entrypoint.

Separate TLS termination choices. A reverse proxy may provide HTTPS while Seltzer handles local HTTP. Built-in HTTPS `listen` is a [non-goal](../../../libraries/seltzer/README.md#no-built-in-https-listen): `listen` only calls `http.createServer`. A host that already has TLS passes no-arg `app.handler()` to `https.createServer` and owns that server's timeouts. This section is a design exercise, not a plan to add native TLS to `listen`.

**Acceptance tests:** loopback binding; port-zero reporting; startup errors reach the caller; repeated close is well-defined; new work stops during drain; active requests have a deadline; host cleanup can await completion.

## F. Proposed: streaming responses and better protocol edges

**Current evidence:** `ResponseData.body` supports strings, JSON-like values, buffers, and typed byte arrays. There is no explicit stream response contract, and there is no WebSocket API. Returning a `Readable` does not opt into streaming; the encoder can try to serialize an object instead. Streaming and WebSockets are **Not yet** ([Non-goals](../../../libraries/seltzer/README.md#not-yet-streaming-responses-and-websockets)), not a decision that they will never exist.

A streaming design must wait when the destination cannot accept more bytes, stop the source on disconnect, and define error handling before versus after headers. It also needs clear ownership of source cleanup. Buffer support alone is not streaming support.

Malformed parameter encoding is already a 400, and a known path with the wrong method is already 405 with `Allow`. HEAD already sends no body (headers still describe the GET representation, including `Content-Length`). Still separate from those: treating `+json` media types the same way the outbound client does. Avoid promising them as one vaguely named “HTTP compliance” change.

**Acceptance tests:** a slow reader does not cause unbounded buffering; disconnection cancels the source; pre-header failure can choose an error response; post-header failure closes cleanly; HEAD produces no content; unsupported methods identify allowed ones under the chosen policy.

## A reasoned sequence, not a release schedule

For a small public JSON service, I would evaluate body bounds and a reliable error boundary first, outbound cancellation next, and stronger schema adapters afterward. Streaming can wait until there is a real streaming consumer. Another application's constraints may justify a different order.

Choose one of A–F and write a one-page proposal. Include a rejected alternative and explain its cost. Your proposal is complete when another developer can write meaningful acceptance tests without guessing your intended behavior.

[Review guide](./answers.md#lesson-11)
