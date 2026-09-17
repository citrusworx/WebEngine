# 10 — Prove behavior, then think about running it

[Previous](./09-generated-routes.md) · [Course](./README.md) · [Next](./11-future-design.md)

**Goal:** test observable HTTP behavior and distinguish a working example from an operated service. Allow 75–90 minutes.

## Test the promise made to the client

A handler unit test can prove that a function returns `{ status: 201 }`. It cannot prove that routing selected that handler, parsing supplied the right body, or sending produced the expected headers. An HTTP-level test exercises that path.

The course uses Node's test runner and native fetch:

```sh
node --test docs/seltzer/http-course/examples/course.test.mjs
```

The tests create fresh app instances, listen on port `0` so the operating system chooses an available port, wait for the listener, then inspect `server.address().port`. They close the server afterward even if an assertion fails. No database or internet service is involved.

Do not assume Seltzer's `onListening` callback receives the assigned ephemeral port: the current implementation passes the original argument, which is zero in this case. Inspect the returned Node server instead.

## Read tests as experiments

Open [course.test.mjs](./examples/course.test.mjs). Read each test title before its assertions. Which public behavior would break if that test failed?

The suite covers the CRUD round trip, invalid input, malformed JSON before routing, static-route precedence, generated response wrapping, the client error contract, CORS/OPTIONS behavior, and the early-exit header trap. Some tests record current limitations rather than ideal behavior. A future fix should update that expectation and the lesson together.

Predict the result before running a test. If your prediction is wrong, trace the relevant stage instead of changing assertions until they become green.

## Separate construction from listening

`notes-app.mjs` builds an app without opening a port. `notes-server.mjs` starts it. This lets tests create isolated instances and lets another host decide when to listen.

The server entrypoint also owns shutdown. It stops accepting new connections using `server.close`, waits for completion, and uses a five-second deadline as a bounded fallback. That deadline is an application choice. A real host must also stop background jobs and close database resources in an intentional order. [Node server lifecycle](https://nodejs.org/api/http.html#serverclosecallback)

## Know what your health endpoint proves

`GET /health` returning `{ ok: true }` proves the process can answer that route. It does not prove that a database, payment service, or filesystem is healthy. Liveness asks whether a process is alive; readiness asks whether it can serve the work you intend to send it. Choose checks that answer the appropriate question without turning health probes into expensive jobs.

## A small operating plan

Before deploying an evolved version of this project, answer concrete questions:

- Where does TLS terminate? Seltzer's `listen` currently creates HTTP, not HTTPS.
- What bounds incoming body bytes, request duration, and outbound waiting?
- Where do notes live after restart, and who can read or change them?
- Which errors are logged privately, and which details are sent to clients?
- What happens to in-flight work during shutdown or a disconnected client?

The current pipeline includes thrown error messages in 500 bodies. Do not put secrets in exceptions and assume the runtime hides them. Lesson 11 proposes a deliberate error boundary. No Seltzer-native abort propagation, streaming response contract, or full authorization system is implied by a passing CRUD test.

## Developer exercise: failure has a shape

Inject an executor that throws, then assert status 500 without exposing an application secret. Today the library's default behavior makes the latter requirement fail if the exception contains the secret. Record that as a missing capability, or implement an application boundary; do not describe it as already solved.

Similarly, simulating a client disconnect is a different test from throwing inside a handler. Cancellation requires cooperation from the work being performed, not just a different response status.

## Checkpoint

Why should tests use a fresh app and an ephemeral port? What would leak if a failing test forgot to close its server? Does a successful health request prove notes survive a restart? Propose one HTTP test for a malformed create request and name the stage it should exercise.

[Answers](./answers.md#lesson-10)
