# 02 — Your first server, twice

[Previous](./01-http-messages.md) · [Course](./README.md) · [Next](./03-routing.md)

**Goal:** distinguish Node's transport work from Seltzer's response model. Allow 45–60 minutes.

## Let Node answer

Run [raw-http.mjs](./examples/raw-http.mjs) with `node docs/seltzer/http-course/examples/raw-http.mjs`:

```js
import http from "node:http";

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Hello, HTTP!" }));
});
server.listen(3000);
```

`createServer` creates a server and registers a callback. Node calls it for each request. `req` exposes the incoming message; `res` controls the outgoing one. `writeHead` chooses status and headers. `end` finishes this response, not the server process. See [Node's response API](https://nodejs.org/api/http.html#class-httpserverresponse).

This example answers every method and path with a greeting. Node does not know what `/notes` should mean. Routing is work an application or library adds. Stop this server before starting the next one.

## Let Seltzer handle the transport

[hello.mjs](./examples/hello.mjs) uses:

```js
import { Seltzer } from "@citrusworx/seltzer";

const app = Seltzer.init();
app.route({
  method: "GET",
  path: "/hello",
  handler: () => ({ body: { message: "Hello, HTTP!" } }),
});
const server = app.listen(3000);
```

`init` creates an instance. `route` registers a description without running the handler. `listen` starts a Node server and returns it so the host can manage its lifecycle. This server matches `GET /hello`; `/anything` gets a default 404.

## Understand the two objects

The outer `{ body: ... }` is a **response description**, called `ResponseData`. It can contain `status`, `headers`, and `body`.

The inner `{ message: "Hello, HTTP!" }` is the **payload**. It becomes the JSON content on the wire. The client does not receive the outer description as another wrapper.

```js
// Correct for an ordinary route handler:
() => ({ status: 200, body: { message: "Hello" } })

// Wrong for an ordinary route handler:
() => ({ message: "Hello" })
```

The second result fails Seltzer's shape check. Keeping the response description separate lets the handler decide what to send without knowing how Node writes bytes.

Omitting `status` selects 200. Object bodies are JSON-encoded. String bodies are sent as strings; specify `Content-Type: text/plain; charset=utf-8` when returning text. Our 204 responses omit the body.

## Developer view: response ownership

Read [seltzer.ts](../../../libraries/seltzer/src/core/seltzer.ts), then [response.ts](../../../libraries/seltzer/src/core/response.ts). The listener creates a context and runs the pipeline; the handler returns data; `send` encodes it and writes the response.

`ctx.res` remains accessible, but our normal handlers do not write to it. Mixing `res.end()` with a returned description creates competing response owners. The current `send` skips writing if headers were already sent; that guard does not make mixed ownership reliable.

The [source map](./source-map.md) links every major part of this flow.

## Checkpoint

Add `GET /about` to a copy of `hello.mjs`. Return plain text `A small HTTP course` with an explicit text content type. Explain why `res.end` finishes one response while Ctrl+C ends the program.

[Answers](./answers.md#lesson-02)
