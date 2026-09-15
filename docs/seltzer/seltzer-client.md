# Seltzer Client

Outbound `fetch` helpers exported as `client` from `@citrusworx/seltzer`.

Source: `libraries/seltzer/src/core/client/client.ts`. This is not a full HTTP client. KiwiPress still wraps `fetch` itself for WordPress in places; treat `client.*` as the packaged sibling of `Seltzer.listen`.

Package **0.8.x** hardened this wrapper relative to 0.2.0: `HttpError` on non-2xx, JSON only when the success body is JSON, optional `allowSelfSigned` via `undici`.

## The object

```ts
import { client, HttpError, type Endpoint } from "@citrusworx/seltzer";

client.get(endpoint);
client.post(endpoint, data);
client.put(endpoint, data);
client.patch(endpoint, data);
client.delete(endpoint);
```

Each method returns `Promise<unknown>`.

## `Endpoint`

```ts
type Endpoint = {
  route?: Route;
  path: string;
  endpoint: string;
  options?: {
    baseUrl?: string;
    headers?: Record<string, string>;
    allowSelfSigned?: boolean;
  };
};
```

What the client **reads**:

- `path`
- `options.baseUrl`
- `options.headers`
- `options.allowSelfSigned` (only for `https://` URLs)

What the client **does not read**:

- `endpoint` — required by the type, ignored at runtime
- `route` — optional, ignored

## URL construction

```ts
const url = endpoint.options?.baseUrl
  ? `${endpoint.options.baseUrl}${endpoint.path}`
  : endpoint.path;
```

| `baseUrl` | `path` | Result |
|---|---|---|
| `http://127.0.0.1:3000` | `/notes` | `http://127.0.0.1:3000/notes` |
| `http://127.0.0.1:3000/` | `/notes` | `http://127.0.0.1:3000//notes` |
| unset | `http://127.0.0.1:3000/notes` | used as the full URL |
| unset | `/notes` | fetch of `/notes` (relative; fine in a browser, usually wrong in Node) |

Prefer `baseUrl` without a trailing slash and `path` with a leading slash. Or put the full URL in `path` and omit `baseUrl`.

Query strings belong on `path` (`/notes/1?verbose=1`). The client will not append `searchParams` for you.

## Methods

| Method | Body | Default headers |
|---|---|---|
| `get` | none | `options.headers` only |
| `delete` | none | `options.headers` only |
| `post` | `JSON.stringify(data)` | `Content-Type: application/json` merged with `options.headers` |
| `put` | same | same |
| `patch` | same | same |

Merge order for write methods:

```ts
headers: {
  "Content-Type": "application/json",
  ...endpoint.options?.headers,
}
```

Caller headers win. You can override `Content-Type`. `data` is always stringified.

## Success parsing

After `res.ok`:

- `204` / `205` → `undefined`
- empty body → `undefined`
- `Content-Type` `application/json` or `+json` → `JSON.parse`
- no Content-Type: parse JSON if the body is JSON, else text
- other Content-Types → text

## `HttpError`

Non-2xx responses throw:

```ts
class HttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly body: string; // full response text
}
```

The `message` is `HTTP ${status} ${statusText}` plus a body snippet (trimmed, max 200 characters, ellipsis if longer). Catch `instanceof HttpError` instead of reading `{ error: "Not Found" }` as a successful payload — that 0.2.0 habit is closed.

```ts
try {
  await client.get({
    path: "/missing",
    endpoint: "/missing",
    options: { baseUrl: "http://127.0.0.1:3000" },
  });
} catch (err) {
  if (err instanceof HttpError && err.status === 404) {
    // err.body is the raw '{"error":"Not Found"}'
  }
}
```

## `allowSelfSigned`

`allowSelfSigned: true` on an `https://` URL dynamically imports `undici` and uses `Agent({ connect: { rejectUnauthorized: false } })`. HTTP URLs ignore the flag. If `undici` is missing, the client throws a message telling you to install it or use a trusted certificate.

Prefer a real certificate or `NODE_EXTRA_CA_CERTS` when you can. Everyday `init().route().listen()` does not need `undici`.

## Typical server + client pair

```ts
import { Seltzer, client, type Endpoint, type ResponseData } from "@citrusworx/seltzer";

const app = Seltzer.init();
app.route({
  method: "GET",
  path: "/health",
  handler: (): ResponseData => ({ body: { ok: true } }),
});
const server = app.listen(3000);

const health: Endpoint = {
  path: "/health",
  endpoint: "/health",
  options: { baseUrl: "http://127.0.0.1:3000" },
};

const data = await client.get(health);
// { ok: true }

server.close();
```

`listen` returns the `http.Server`. A same-file smoke test can still race `ECONNREFUSED` if `client.get` runs before the port is bound — wait for `listening` or pass `onListening`.

## Sharing option shape with `.handler()`

`.handler({ adapter, options })` stores the same `options` bag on inbound `ctx.options`. It does **not** configure `client`. You copy the bag yourself:

```ts
const options = {
  baseUrl: "http://127.0.0.1:3000",
  headers: { "X-App": "notes" },
};

app.handler({ adapter: "node-http", options });

const notes: Endpoint = {
  path: "/notes",
  endpoint: "/notes",
  options,
};
```

There is no `app.client`.

## Browser vs Node

`client` calls global `fetch`. The root module also exports `Seltzer`, which imports `node:http`. For a Sig page, prefer platform `fetch` against the Seltzer origin so the bundle never pulls the server graph.

## What is not here

- Timeouts, retries, abort
- Slash-safe base-URL joining
- Typed generics on the JSON result
- Multipart / non-JSON request bodies
- Reading `Endpoint.endpoint` even when it is the absolute URL KiwiPress stores

KiwiPress may still `fetch` `ctx.endpoint` in its own helper. Do not assume Seltzer `client` follows that convention.

## Related

- [JSON API tutorial](./seltzer-api-tutorial.md) step 6
- [Patterns](./seltzer-patterns.md)
- [Anti-patterns](./seltzer-anti-patterns.md)
- [API Reference](./seltzer-api.md)
