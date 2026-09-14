# Seltzer Client

Outbound `fetch` helpers exported as `client` from `@citrusworx/seltzer`.

Source: `libraries/seltzer/src/core/client/client.ts`. This is not a full HTTP client. KiwiPress already wraps `fetch` itself for WordPress; treat `client.*` as the packaged sibling of `Seltzer.listen`, not as a replacement for `undici`.

## The object

```ts
import { client, type Endpoint } from "@citrusworx/seltzer";

client.get(endpoint);
client.post(endpoint, data);
client.put(endpoint, data);
client.patch(endpoint, data);
client.delete(endpoint);
```

Each method returns `Promise<any>`: `fetch(url, init).then((res) => res.json())`.

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

What the client **does not read**:

- `endpoint` — required by the type, ignored at runtime
- `route` — optional, ignored
- `options.allowSelfSigned` — typed, ignored (a comment mentions an HTTPS agent; none is constructed)

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

Query strings belong on `path` (`/note?id=1`). The client will not append `searchParams` for you.

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

Caller headers win. You can override `Content-Type`. You cannot skip `JSON.stringify` — `data` is always stringified, including `undefined` (body `"undefined"` as JSON? `JSON.stringify(undefined)` is the value `undefined`, and `fetch` may treat that as no body). Pass a real object.

## JSON-only responses

Every method ends with `res.json()`. That means:

- Non-JSON success bodies throw (`SyntaxError`)
- Empty 204 bodies throw
- HTML error pages throw
- A JSON **error** document (`{ error: "Not Found" }` with status 404) **succeeds** as a parsed object — there is no `if (!res.ok) throw`

If you need status checks, use `fetch` yourself, or follow [exercise 8](./exercises/08-fetch-client.md) (elective; not how `client` behaves today). KiwiPress’s `requestWordPress` already throws on `!response.ok` and optionally uses `undici` for self-signed TLS. That code is in KiwiPress, not in Seltzer.

## Typical server + client pair

```ts
import { Seltzer, client, type Endpoint } from "@citrusworx/seltzer";

const app = Seltzer.init();
app.route({
  method: "GET",
  path: "/health",
  handler: (ctx) => ctx.json({ ok: true }),
});
app.listen(3000);

const health: Endpoint = {
  path: "/health",
  endpoint: "/health",
  options: { baseUrl: "http://127.0.0.1:3000" },
};

const data = await client.get(health);
// { ok: true }
```

Call the client from a second process, a script, or a Sig effect. `listen` does not return the `http.Server` and does not wait for the listening callback (that callback only `console.log`s). A same-file smoke test can race `ECONNREFUSED` if `client.get` runs before the port is bound — retry, or run the client after the log line appears.

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

That duplication is honest. There is no `app.client`.

## Browser vs Node

`client` calls global `fetch`. Browsers have it. Modern Node has it. There is no package export that avoids `Seltzer` for browser bundles — the root module also exports the class that imports `node:http`. For a Sig page, either:

- use platform `fetch` against the Seltzer origin, or
- import `client` only if your bundler can tree-shake / ignore `Seltzer.listen`

The honest frontend pattern in [Integration](./seltzer-integration.md) uses `client.get` in docs as a shape; production Juice/Sig apps often `fetch` directly so they never pull `node:http`.

## What is not here

- Timeouts, retries, abort
- Base-URL joining that understands slashes
- `allowSelfSigned`
- Typed generics on the JSON result (the signature is `Promise<any>`)
- Multipart / non-JSON request bodies
- Reading `Endpoint.endpoint` even when it is the absolute URL KiwiPress stores

KiwiPress sets `endpoint` to a full WordPress URL and then **does not use `client`** — it `fetch`es `ctx.endpoint`. Do not assume Seltzer `client` follows that convention.

## Related

- [JSON API tutorial](./seltzer-api-tutorial.md) step 6
- [Patterns](./seltzer-patterns.md) — endpoint objects per collection
- [Anti-patterns](./seltzer-anti-patterns.md) — assuming `!ok` throws
- [API Reference](./seltzer-api.md)
