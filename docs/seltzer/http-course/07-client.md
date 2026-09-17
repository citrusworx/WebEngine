# 07 — Sit on the other side of HTTP

[Previous](./06-pipeline.md) · [Course](./README.md) · [Next](./08-browser-boundaries.md)

**Goal:** distinguish an HTTP error response from a failed exchange, and understand Seltzer's client wrapper. Allow 60 minutes.

## A promise can resolve with an unsuccessful HTTP status

Start the Notes server. Save this as a temporary `.mjs` client and run it:

```js
const res = await fetch("http://127.0.0.1:3000/notes/missing");
console.log(res.status, res.ok);
console.log(await res.text());
```

Expect `404 false`, then an error body. Native fetch resolves with a response for HTTP 404. It rejects for failures such as network errors instead. Checking `res.ok` is application work when using fetch directly. [Fetch standard](https://fetch.spec.whatwg.org/#fetch-method)

The response body is also a stream. `res.text()` consumes it; calling `res.json()` afterward on the same response is not a second independent read. Decide how to consume it, or retain the resulting text and parse that text yourself.

## Seltzer chooses a different error contract

The [complete course client](./examples/notes-client.mjs) uses:

```js
import { client, HttpError } from "@citrusworx/seltzer";

const endpoint = {
  path: "/notes/missing",
  endpoint: "/notes/missing",
  options: { baseUrl: "http://127.0.0.1:3000" },
};

try {
  console.log(await client.get(endpoint));
} catch (error) {
  if (error instanceof HttpError) {
    console.log(error.status, error.body);
  } else {
    console.error("No usable result", error);
  }
}
```

The `Endpoint` type currently requires both `path` and `endpoint`; URL construction uses `path`. They are not two requests. The duplication is a historical API detail worth understanding rather than inventing a meaning for the unused field.

`client` turns a non-2xx response into `HttpError`. Its `body` is the complete response text, not automatically parsed JSON; `message` contains only a short snippet. A successful call resolves to the decoded body, not a fetch `Response`, so use native fetch when you need response headers or success status.

## What gets decoded?

| Response | Client result |
|---|---|
| JSON or `+json` content type | Parsed JSON |
| Other content type | Text |
| No content type, valid JSON text | Parsed JSON |
| No content type, other text | Text |
| 204, 205, or empty success body | `undefined` |
| Non-2xx | Throws `HttpError` |
| Successful status with malformed advertised JSON | JSON parsing error |

The inbound parser and outbound client are not identical. In particular, the client recognizes `+json` media types, while the incoming parser currently searches for `application/json`.

## Classify before retrying

An HTTP 400 tells you the server received a request and rejected it. A connection failure may mean it never arrived. A lost connection after sending a POST can mean the write succeeded but its response was lost. You cannot deduce “nothing happened” from a network exception.

Our client has no automatic retry, timeout, or abort option. It concatenates `baseUrl + path`; choose exactly one slash at the boundary. A missing slash or duplicate slash is not normalized for you.

For a controlled timeout today, use native fetch with an abort signal in host code. Do not pass an imaginary `timeoutMs` option to Seltzer and assume it works. Lesson 11 designs that feature explicitly.

The `allowSelfSigned` option disables certificate verification on a special outbound HTTPS path using optional `undici`. It is not a way to enable HTTPS on the server. The local course needs neither this flag nor undici.

## Checkpoint

Run the complete client once while Notes is available, then after stopping Notes. Explain the final intentional 404 in the first run and the connection failure in the second. Which one is `HttpError`? Why would retrying every caught exception be a poor policy?

[Answers](./answers.md#lesson-07)
