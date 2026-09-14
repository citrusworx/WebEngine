# Exercise 8: Fetch Client

**Contributor elective — goes beyond shipped `client.*`.** Packaged `client.get/post/…` always `res.json()` and does **not** throw on `!response.ok`. Status checks and `undici` self-signed TLS live in KiwiPress, not in Seltzer. Product client: [seltzer-client.md](../seltzer-client.md).

**Goal:** Build a small HTTP client with proper error handling.

**Proves you can build:** Stronger client patterns (KiwiPress-shaped), not the current `client` object.

## Requirements

1. Implement `get(url, options?)` and `post(url, body, options?)` using `fetch`.
2. Merge default headers with caller-provided headers.
3. Throw a descriptive error when `!response.ok` (include status and statusText).
4. Parse JSON responses; handle empty bodies gracefully.
5. Bonus: read `packages/kiwipress/src/core/route-utils.ts` and note how `undici` Agent handles self-signed TLS.

## Scratch

```ts
type ClientOptions = {
  headers?: Record<string, string>;
};

async function get<T>(url: string, options?: ClientOptions): Promise<T> {
  // Your implementation here
}

async function post<T>(url: string, body: unknown, options?: ClientOptions): Promise<T> {
  // Your implementation here
}
```

## Test against your server

```ts
const users = await get<{ users: unknown[] }>("http://localhost:3000/users");
```

## Done when

- Non-2xx responses throw instead of returning parsed JSON.
- You understand how KiwiPress extends this pattern for WordPress API calls.

## Next

Refactor exercises 6–7 into `libraries/seltzer/src/` — one module per PR-sized chunk. See the [study guide](../courses.md) implementation layout.
