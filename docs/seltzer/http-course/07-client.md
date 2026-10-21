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

`client` turns a non-2xx response into `HttpError`. `body` is parsed with the same content-type rules as a success (JSON, text, or bytes), and `headers` is the response header map. `message` contains only a short snippet of the raw text. A successful call resolves to the decoded body, not a fetch `Response`, so use native fetch when you need success headers or the success status.

## What gets decoded?

| Response | Client result |
|---|---|
| JSON or `+json` content type | Parsed JSON |
| `text/*` | String |
| Any other content type | `Uint8Array` |
| No content type, valid JSON text | Parsed JSON |
| No content type, other text | String |
| 204, 205, HEAD, or empty body | `undefined` |
| Non-2xx | Throws `HttpError` with the parsed body |
| Successful status with malformed advertised JSON | `SyntaxError` |

The inbound parser and outbound client are not identical. The client recognizes `+json` media types and returns bytes for a response that is neither JSON nor `text/*`. The incoming parser searches for `application/json` and treats every other request body as a UTF-8 string.

## Classify before retrying

An HTTP 400 tells you the server received a request and rejected it. A connection failure may mean it never arrived. A lost connection after sending a POST can mean the write succeeded but its response was lost. You cannot deduce “nothing happened” from a network exception.

The client does not retry. A 400, a timeout, and a connection failure are different outcomes (`HttpError`, `TimeoutError`, `NetworkError`). Repeating every caught exception can write twice.

URL join keeps one slash between `baseUrl` and `path` and keeps a base path (`/api/v1` + `users` is `/api/v1/users`). An absolute `path` throws `UrlError` unless `options.allowAbsoluteUrl` is set.

The default deadline is 30 seconds (`options.timeout`, or `createClient({ timeout })`). `0` disables it. Pass `options.signal` to cancel. A deadline is not an `HttpError`. There is no `allowSelfSigned` option and no `undici` dependency. That flag was never a way to turn on HTTPS for `listen`.

## Checkpoint

Run the complete client once while Notes is available, then after stopping Notes. Explain the final intentional 404 in the first run and the connection failure in the second. Which one is `HttpError`? Why would retrying every caught exception be a poor policy?

[Answers](./answers.md#lesson-07)
