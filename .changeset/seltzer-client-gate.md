---
"@citrusworx/seltzer": minor
---

**Breaking:** the outbound client no longer depends on `undici`. `allowSelfSigned` is removed from `Endpoint`, `RequestContext`, and `HandlerConfig`. The client uses global `fetch` only and does not bypass certificate checks.

**Breaking:** `client` waits at most 30 seconds (`DEFAULT_CLIENT_TIMEOUT_MS`, the same number as the server `requestTimeout`) unless `createClient({ timeout })` or `options.timeout` sets another value. `0` disables the timer. The client does not retry.

**Breaking:** `HttpError.body` is the parsed body (JSON, text, or `Uint8Array`), not the raw response text. `HttpError.headers` is the response header map. A deadline throws `TimeoutError` (`code: "TIMEOUT"`). A caller `AbortSignal` throws `AbortError` (`code: "ABORTED"`). A transport failure throws `NetworkError` (`code: "NETWORK"`). An absolute `path` throws `UrlError` unless `options.allowAbsoluteUrl` is set.

**Breaking:** URL join keeps one slash between `baseUrl` and `path` and preserves a base path (`/api/v1` + `users` → `/api/v1/users`). A string body is `text/plain`; `Uint8Array` / `Buffer` are bytes. Objects, arrays, numbers, booleans, and `null` are still JSON.

`options.headers` can send `Idempotency-Key`. Server-side idempotency is not implemented.
