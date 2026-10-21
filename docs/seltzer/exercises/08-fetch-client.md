# Exercise 8: Fetch Client

**Goal:** Build a small HTTP client with proper error handling.

**Proves you can rebuild:** Seltzer `client` (`HttpError`, content types, slash-safe join, a deadline).

**Shipped:** `client.*` throws `HttpError` on non-2xx with a parsed body. It uses global `fetch` only. There is no `undici` peer and no `allowSelfSigned` option. The default deadline is 30 seconds. The client does not retry.

## Requirements

1. Implement `get` and `post` using `fetch` (or mirror `Endpoint` + a slash-safe `baseUrl` / `path` join that keeps a base path).
2. Merge default headers with caller-provided headers (caller wins, including `Content-Type`).
3. Throw a dedicated error type when `!response.ok` (include `status`, `statusText`, headers, and the parsed body; the message may snippet the raw text).
4. Parse `application/json` and `+json` as JSON, `text/*` as a string, and anything else as bytes. `204` / `HEAD` / empty → `undefined`.
5. Accept a timeout and an `AbortSignal`. Time out with a different error than a caller abort, and clear the timer.
6. Do not retry. A string body is text; an object is JSON; `Uint8Array` is bytes.

## Scratch

```ts
class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly statusText: string,
    readonly body: string,
  ) {
    super();
    this.name = "HttpError";
  }
}

type ClientOptions = {
  headers?: Record<string, string>;
};

async function get(url: string, options?: ClientOptions): Promise<unknown> {
  // Your implementation here
}

async function post(url: string, body: unknown, options?: ClientOptions): Promise<unknown> {
  // Your implementation here
}
```

## Test against your server

```ts
const users = await get("http://localhost:3000/users");
```

## Done when

- Non-2xx responses throw `HttpError` instead of returning parsed JSON.
- A JSON 404 from Seltzer is a throw, not `{ error: "Not Found" }` as a successful value.
- You understand how 0.9.0 `client.ts` differs from the 0.2.0 always-`res.json()` wrapper.

## Next

Compare your work to `libraries/seltzer/src/core/client/client.ts` and `pipeline/`. See the [study guide](../courses.md) topic map.
