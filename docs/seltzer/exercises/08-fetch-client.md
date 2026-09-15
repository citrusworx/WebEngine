# Exercise 8: Fetch Client

**Goal:** Build a small HTTP client with proper error handling.

**Proves you can rebuild:** Seltzer `client` as shipped in 0.8.x (`HttpError`, JSON vs text).

**Shipped:** `client.*` throws `HttpError` on non-2xx. It does **not** always `res.json()`. Optional `allowSelfSigned` uses undici — treat that as a bonus, not a day-one requirement.

## Requirements

1. Implement `get(url, options?)` and `post(url, body, options?)` using `fetch` (or mirror `Endpoint` + `baseUrl + path`).
2. Merge default headers with caller-provided headers (caller wins on write methods).
3. Throw a dedicated error type when `!response.ok` (include `status`, `statusText`, full `body`; message may snippet the body).
4. Parse JSON only when Content-Type is JSON (or `+json`); return text otherwise. `204` / empty → `undefined`.
5. Bonus: dynamically import `undici` `Agent({ connect: { rejectUnauthorized: false } })` for `allowSelfSigned` on `https://` only.

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
- You understand how 0.8.x `client.ts` differs from the 0.2.0 always-`res.json()` wrapper.

## Next

Compare your work to `libraries/seltzer/src/core/client/client.ts` and `pipeline/`. See the [study guide](../courses.md) topic map.
