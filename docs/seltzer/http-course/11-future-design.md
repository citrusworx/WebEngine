# 11 — Design the parts that are still missing

[Previous](./10-testing-operations.md) · [Course](./README.md) · [Next](./12-capstone.md)

**Goal:** turn an observed limitation into a testable design without confusing it with an existing feature. Allow 90–150 minutes for one proposal.

Everything labeled **Proposed** on this page is a course design direction. None of the suggested signatures below is implemented by this course. They are not promises for Seltzer 0.9 or 1.0. The intended skill is evaluating a design, including when to reject it.

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
// Proposed API only; do not copy into a 0.8.1 application.
app.listen(3000, { maxBodyBytes: 1_048_576 });
```

The number above is an exercise default of one MiB, not a universally appropriate limit. The budget counts bytes, not JavaScript string length. It should bound retained data before `Buffer.concat`, not merely reject after allocating everything.

**Implementation seam:** pass a parser policy into pipeline construction or request context. Decide whether limits apply globally or per route. Per-route limits conflict with the current parse-before-route order; either change that order or do a lightweight match first. Both can change observable error precedence and need migration notes.

**Connection decision:** do not call `req.destroy()` immediately and then promise a 413 reached the client. Define whether to stop reading and close after responding, or drain under a separate bound. Test socket cleanup and the next request on a reused connection. Also decide whether compressed bodies are supported; if so, compressed and expanded sizes need independent budgets.

**Acceptance tests:** exactly-at-limit succeeds; one byte over fails; several chunks crossing the limit fail; an absent length header is bounded; an aborted request releases buffers; another client's request still succeeds; no handler executes after rejection.

**Open decision:** preserve the unlimited default for compatibility or adopt a finite default as an explicit behavior change. A changelog must state which was chosen.

## B. Proposed: outbound deadlines and cancellation

**Current evidence:** `Endpoint.options` has no signal or deadline. `request` passes no caller-controlled abort signal. URLs are concatenated directly.

**Plain-language problem:** when a caller stops waiting, the work should have a defined end rather than continuing indefinitely in the background.

Candidate API, **proposed only**:

```ts
client.get({
  path: "/notes",
  endpoint: "/notes",
  options: { baseUrl, signal: callerSignal, timeoutMs: 2000 },
});
```

The deadline should cover obtaining the response **and consuming its body**, not just receipt of headers. Compose caller cancellation and the deadline without losing the earlier abort reason. Clean up timers and listeners on success, failure, and abort. The implementation must respect the package's Node support range; do not assume every abort helper exists in every supported release.

An abort is not an `HttpError`: it has no complete non-2xx HTTP response. Define a documented cancellation/deadline error category so hosts can distinguish it from server rejection. Cancelling the wait does not guarantee a remote write was cancelled.

Do not add automatic retries as an invisible side effect. An idempotency key requires server-side storage and replay semantics; a header alone does not make a POST safe to repeat.

**URL policy:** specify whether `baseUrl = https://host/api` and `path = /notes` means `/api/notes` or `/notes`. Replacing concatenation with `new URL(path, baseUrl)` changes that result. Preserve established prefixes or clearly version the change. Cover query strings, escaped characters, trailing slashes, and absolute paths without rewriting user input unexpectedly.

**Acceptance tests:** delayed headers time out; delayed body times out; caller abort wins; completed requests leave no timer; HTTP 404 still yields `HttpError`; prefix joining is deterministic; no silent retry performs a duplicate write.

## C. Proposed: a richer validation contract

**Current evidence:** `.required` establishes presence only. `replace("validate", ...)` is implemented, so a host can supply stronger checks today. A general schema engine is not built into Seltzer.

**Plain-language problem:** a form can contain every box and still contain the wrong kind of information.

First decide ownership. Seltzer can expose transport boundaries while Nectarine or a host adapter owns schema interpretation. Keeping a validator adapter separate avoids silently turning every Seltzer consumer into a database/schema consumer.

A validator needs a result contract: success with validated data, or failure with field paths and stable error codes. Decide whether it merely checks or also normalizes `"42"` into `42`. Silent coercion can turn a user mistake into a stored value they never intended.

Distinguish body, route-parameter, and query validation. Repeated query values are currently collapsed, so a future array-valued query contract needs a representation change first. Unknown fields need an explicit allow/reject/strip policy. Optional, null, absent, and blank are separate states.

**Compatibility:** stricter checks can reject requests accepted by 0.8.1. Preserve presence-only defaults initially or announce a breaking contract change. Replacing a validator must state whether required-field behavior is preserved.

**Acceptance tests:** absent versus null; false and zero; wrong scalar type; nested field paths; unknown keys; malformed contracts rejected during startup; handler never sees invalid data; normalized values are exactly the ones the handler receives.

## D. Proposed: one response-finalization and error boundary

**Current evidence:** an inserted `before("send")` stage is skipped after early responses. OPTIONS bypasses the whole pipeline. Thrown error messages are included in 500 bodies. If built-in send itself throws, the runner catches it but has no later sending pass; replacing the response alone cannot guarantee delivery.

**Plain-language problem:** a stamp intended for every outgoing envelope should not be missing from rejection letters, and a failed delivery cannot be fixed by rewriting a letter nobody sends.

Define a finalization step that receives the selected response before bytes are written and runs once for successful handlers, validation failures, missing routes, thrown errors, and OPTIONS. This could live in the listener or in a revised pipeline contract. A new `after()` method alone does not solve bypassed paths.

The boundary should choose public error content independently from internal logs. A request ID can link a generic client error to private diagnostics. Validate status/header values and handle serialization failures before committing headers where possible. After headers are sent, a second JSON error response is no longer a valid fallback; define connection termination and logging behavior.

**Acceptance tests:** a common header appears on 200/400/404/500/OPTIONS; private exception text never enters the response; circular JSON follows the error policy; a finalizer exception does not recurse forever; already-started responses are not written twice; completion and cancellation are distinguished in telemetry.

## E. Proposed: explicit listen and shutdown policy

**Current evidence:** `listen(port, options)` returns Node's server, but does not accept a host, TLS configuration, or an integrated drain deadline. The host can already call `server.close()`.

Candidate API, **proposed only**:

```ts
app.listen({ port: 3000, host: "127.0.0.1", shutdownGraceMs: 5000 });
```

Prefer a backwards-compatible overload if this shape is adopted. Decide whether Seltzer owns OS signals or the host does; a reusable library should not casually install global process handlers. The course currently keeps signal handling in the executable entrypoint.

Separate TLS termination choices. A reverse proxy may provide HTTPS while Seltzer handles local HTTP. Native TLS support would require certificate provisioning and renewal decisions; it should not be confused with the outbound self-signed option.

**Acceptance tests:** loopback binding; port-zero reporting; startup errors reach the caller; repeated close is well-defined; new work stops during drain; active requests have a deadline; host cleanup can await completion.

## F. Proposed: streaming responses and better protocol edges

**Current evidence:** `ResponseData.body` supports strings, JSON-like values, buffers, and typed byte arrays. There is no explicit stream response contract. Returning a `Readable` does not opt into streaming; the encoder can try to serialize an object instead.

A streaming design must wait when the destination cannot accept more bytes, stop the source on disconnect, and define error handling before versus after headers. It also needs clear ownership of source cleanup. Buffer support alone is not streaming support.

Protocol improvements should be separately scoped: malformed parameter encoding as a client error, method mismatch as 405 with `Allow`, explicit HEAD behavior, and consistent JSON media-type handling. Avoid promising them as one vaguely named “HTTP compliance” change.

**Acceptance tests:** a slow reader does not cause unbounded buffering; disconnection cancels the source; pre-header failure can choose an error response; post-header failure closes cleanly; HEAD produces no content; unsupported methods identify allowed ones under the chosen policy.

## A reasoned sequence, not a release schedule

For a small public JSON service, I would evaluate body bounds and a reliable error boundary first, outbound cancellation next, and stronger schema adapters afterward. Streaming can wait until there is a real streaming consumer. Another application's constraints may justify a different order.

Choose one of A–F and write a one-page proposal. Include a rejected alternative and explain its cost. Your proposal is complete when another developer can write meaningful acceptance tests without guessing your intended behavior.

[Review guide](./answers.md#lesson-11)
