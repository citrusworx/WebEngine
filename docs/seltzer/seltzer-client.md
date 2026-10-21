# Seltzer Client

Outbound `fetch` helpers exported as `client` and `createClient` from `@citrusworx/seltzer`.

Source: `libraries/seltzer/src/core/client/client.ts`. Transport is global `fetch` only. The package has no runtime dependencies and does not import `undici`. This is not a full HTTP client. KiwiPress still wraps `fetch` itself for WordPress; treat `client.*` as the packaged sibling of `Seltzer.listen`.

The client does **not** retry. A 5xx, a timeout, and a dropped connection are each one attempt. Call again yourself if that is safe. Sending `Idempotency-Key` is just a header: put it in `options.headers`. Seltzer does not store or replay idempotency keys. That belongs to a future pipeline stage, not this client.

## The object

```ts
import {
  client,
  createClient,
  HttpError,
  TimeoutError,
  AbortError,
  NetworkError,
  UrlError,
  DEFAULT_CLIENT_TIMEOUT_MS,
  type Endpoint,
} from "@citrusworx/seltzer";

client.get(endpoint);
client.head(endpoint);
client.post(endpoint, data);
client.put(endpoint, data);
client.patch(endpoint, data);
client.delete(endpoint);

const api = createClient({
  baseUrl: "http://127.0.0.1:3000/api/v1",
  headers: { Authorization: "Bearer …" },
  timeout: 5_000,
});
```

`client` is `createClient()` with no base URL and no extra headers. Each method returns `Promise<unknown>`.

`DEFAULT_CLIENT_TIMEOUT_MS` is `30000`, the same number as the server `requestTimeout` (`DEFAULT_REQUEST_TIMEOUT_MS`).

## `Endpoint`

```ts
type Endpoint = {
  route?: Route;
  path: string;
  endpoint: string;
  options?: {
    baseUrl?: string;
    headers?: Record<string, string>;
    timeout?: number;
    signal?: AbortSignal;
    query?: QueryInput;
    allowAbsoluteUrl?: boolean;
  };
};
```

What the client **reads**:

- `path`
- `options.baseUrl` (falls back to the `createClient` base URL)
- `options.headers` (override client headers of the same name; names are matched case-insensitively)
- `options.timeout` (`0` disables; omitted uses the client timeout)
- `options.signal`
- `options.query`
- `options.allowAbsoluteUrl`

What the client **does not read**:

- `endpoint` — required by the type, ignored at runtime
- `route` — optional, ignored

There is no `allowSelfSigned` option. Certificate checks stay with Node. Prefer a real certificate or `NODE_EXTRA_CA_CERTS`.

## URL construction

`resolveRequestUrl` joins `baseUrl` and `path` with a single slash at the boundary. A base path is kept. Leading slashes on `path` and trailing slashes on the base path are only the join. A trailing slash on the relative path stays, because the server treats `/users` and `/users/` as different paths. The path is not re-encoded.

| `baseUrl` | `path` | Result |
|---|---|---|
| `http://127.0.0.1:3000` | `/notes` | `http://127.0.0.1:3000/notes` |
| `http://127.0.0.1:3000/` | `/notes` | `http://127.0.0.1:3000/notes` |
| `http://127.0.0.1:3000/api/v1` | `users` | `http://127.0.0.1:3000/api/v1/users` |
| `http://127.0.0.1:3000/api/v1/` | `/users/` | `http://127.0.0.1:3000/api/v1/users/` |
| `http://127.0.0.1:3000/api?x=1` | `/users?y=2` | `http://127.0.0.1:3000/api/users?x=1&y=2` |

`baseUrl` must be an absolute `http:` or `https:` URL when it is set. A call's `baseUrl` replaces the client `baseUrl`; it is not joined onto it.

### Query

`options.query` is appended with `URLSearchParams` (spaces become `+`).

- `null` and `undefined` are omitted, including inside arrays
- an array repeats the key (`tag=a&tag=b`); an empty array omits the key
- `0` and `false` are sent
- a plain object throws `TypeError` and no request is sent
- keys already present on the base or path are left in place; `query` does not delete them

### Absolute `path`

An `http:` / `https:` path, or a protocol-relative `//host/...` path, throws `UrlError` (`code: "INVALID_URL"`) unless `options.allowAbsoluteUrl` is `true`. With that option, an `http(s)` path is fetched as-is and `baseUrl` is ignored. Protocol-relative URLs and other schemes still throw. `UrlError` means nothing was sent.

## Methods and request bodies

| Method | Body | Default `Content-Type` |
|---|---|---|
| `get` / `head` / `delete` | none | `options.headers` only |
| `post` / `put` / `patch` | see below | depends on the value |

| `data` | Sent as | Default `Content-Type` |
|---|---|---|
| plain object, array, number, boolean, `null` | `JSON.stringify` | `application/json` |
| string | the string | `text/plain; charset=utf-8` |
| `Uint8Array` or `Buffer` | the bytes | `application/octet-stream` |
| `undefined` | no body | none |

A caller `Content-Type` wins, matched case-insensitively, so only one content type is sent. `FormData`, `Blob`, and streams throw `TypeError`. Pass a string or bytes instead.

## Success parsing

| Response | Result |
|---|---|
| `204`, `205`, or request method `HEAD` | `undefined` (a body is discarded) |
| empty body | `undefined` |
| `application/json` or a `+json` type | parsed JSON |
| `text/*` | string |
| no `Content-Type`, body is JSON text | parsed JSON |
| no `Content-Type`, other text | string |
| anything else | `Uint8Array` |

Invalid JSON with a JSON content type on a **successful** status throws `SyntaxError`, not `HttpError`. On a **failed** status the same bad JSON is `HttpError.body` as the raw string, so the status is still visible.

The inbound parser is close but not identical: it treats every non-JSON request body as a UTF-8 string. The client returns bytes for a response that is neither JSON nor `text/*`.

## Errors

These are different classes and `code` values. A timeout is not an HTTP error: the server may still be working.

| Class | `code` | When |
|---|---|---|
| `HttpError` | `HTTP_ERROR` | non-2xx response. `status`, `statusText`, lowercase `headers`, parsed `body` |
| `TimeoutError` | `TIMEOUT` | the deadline elapsed (`timeoutMs`) |
| `AbortError` | `ABORTED` | `options.signal` aborted. `reason` is the abort reason. Wins if the deadline also fires |
| `NetworkError` | `NETWORK` | connection or transport failure. `cause` is the fetch error |
| `UrlError` | `INVALID_URL` | the URL was rejected before `fetch` |

`HttpError.message` is `HTTP ${status} ${statusText}` plus a trimmed body snippet (max 200 characters, ellipsis if longer).

```ts
try {
  await client.get({
    path: "/missing",
    endpoint: "/missing",
    options: { baseUrl: "http://127.0.0.1:3000", timeout: 1_000 },
  });
} catch (err) {
  if (err instanceof HttpError && err.status === 404) {
    // err.body is the parsed JSON, for example { error: "Not Found" }
  } else if (err instanceof TimeoutError) {
    // deadline, not a status code
  } else if (err instanceof AbortError) {
    // caller signal
  } else if (err instanceof NetworkError) {
    // nothing came back
  }
}
```

## Timeout and abort

The default deadline is 30 seconds, covering headers and the body. `createClient({ timeout })` changes it for every call. `options.timeout` overrides that, and `0` in either place disables the timer.

`options.signal` is merged with the deadline. Node's `AbortSignal.any` is used when it exists. Node 18 combines the signals by hand. The timer is cleared when the call finishes, fails, or is aborted. `unref` is used so a pending deadline does not hold the process open by itself; `clearTimeout` still runs.

An already-aborted signal throws `AbortError` and does not open a connection.

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

`listen` returns the `http.Server`. Wait for `listening` or pass `onListening` before calling the client.

## Sharing option shape with `.handler()`

`.handler({ adapter, options })` stores `baseUrl` and `headers` on inbound `ctx.options`. It does **not** configure `client`. Copy them yourself:

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

- Retries
- Server-side idempotency storage (a header is not a replay)
- Typed generics on the JSON result
- Multipart helpers (`FormData` is rejected)
- Reading `Endpoint.endpoint` even when it is the absolute URL KiwiPress stores
- TLS certificate bypass

KiwiPress may still `fetch` `ctx.endpoint` in its own helper, including its own self-signed path. Do not assume Seltzer `client` follows that convention.

## Related

- [JSON API tutorial](./seltzer-api-tutorial.md) step 6
- [Patterns](./seltzer-patterns.md)
- [Anti-patterns](./seltzer-anti-patterns.md)
- [API Reference](./seltzer-api.md)
