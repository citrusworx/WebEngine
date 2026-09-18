# KiwiPress Core Classes

The core classes form an inheritance spine that separates WordPress infrastructure, transport, and CRUD concerns into distinct layers. Domain objects like `Posts`, `Pages`, and `Users` sit at the top of this spine and inherit everything they need.

This page is the practical spine reference. For what/why and first requests, use the [README](./README.md) and [Getting started](./kiwipress-getting-started.md). For WordPress → Nectarine, use [Transfer](./kiwipress-transfer.md). KiwiPress is a **standalone CMS library** (and a WordPress elective in [Make A Web App](../webengine/make-a-web-app.md)), not a core chapter and not a WebEngine import.

```
WPCore + WPAuth
  └── WPClient
        ├── WPRead      ← base for all WordPress domain objects
        ├── WPCreate
        ├── WPUpdate
        └── WPDelete

KiwiPress.connect()
  ├── wordpress.*   (Posts, Pages, …)
  ├── sync          (WPSync → NectarineStore)
  ├── native.*      (NativeCollection)
  └── persistence   (optional file / Nectarine PgSql)
```

Source files cited below live in the WebEngine monorepo under `packages/kiwipress/`. They are not part of this docs vault, so they are listed as paths rather than links.

```
WPCore
  └── WPClient
        ├── WPRead      ← base for all domain objects
        ├── WPCreate
        ├── WPUpdate
        └── WPDelete
```

---

## WPCore

**File:** `packages/kiwipress/src/core/WPCore.ts`

`WPCore` is the foundation of the entire class hierarchy. It has no knowledge of route execution or HTTP transport — its only job is to hold configuration and produce the shared infrastructure that every layer above it needs.

### Responsibilities

- Load and merge configuration from `process.env` and constructor arguments
- Validate that `WP_URL` is present
- Generate authentication headers based on whichever auth strategy is configured
- Interpolate `:param` placeholders in route paths with URL-encoded values

### Constructor

```ts
new WPCore(config?: Partial<WPCoreConfig>)
```

Config passed to the constructor is merged on top of any values found in `process.env`. Constructor values take priority.

### `WPCoreConfig`

```ts
type WPCoreConfig = {
  url: string;                       // WordPress base URL (required)
  apiBase: string;                   // API path prefix, default "wp-json/wp/v2"
  username?: string;                 // Basic auth username
  appPassword?: string;              // Basic auth application password
  token?: string;                    // Bearer token
  apiKey?: string;                   // X-API-Key header value
  allowSelfSigned?: boolean;         // TLS bypass for local HTTPS; see below
  headers?: Record<string, string>;  // Additional headers on every request
};
```

### Protected methods

| Method | Description |
|---|---|
| `createConfig(overrides?)` | Merges env config with constructor overrides, strips trailing slashes, validates `url` |
| `createAuthHeaders()` | Returns headers object with the appropriate `Authorization` header (Basic or Bearer) and/or `X-API-Key` based on what is configured |
| `interpolatePath(path, params?)` | Replaces `:key` segments in a route path with `encodeURIComponent`-encoded values from `params` |
| `getConfig()` | Returns the resolved `WPCoreConfig` |

### Auth header selection

`createAuthHeaders()` delegates to `WPAuth.headers()`. See **WPAuth** below.

---

## WPAuth

**File:** `packages/kiwipress/src/core/WPAuth.ts`

`WPAuth` owns credential strategy and header generation. `WPCore` constructs one from the resolved config.

```ts
import { WPAuth } from "@citrusworx/kiwipress";

const auth = new WPAuth({
  username: "admin",
  appPassword: "xxxx xxxx xxxx xxxx xxxx xxxx"
});

auth.strategy();      // "basic" | "bearer" | "api-key" | "none"
auth.isConfigured();  // true
auth.headers();       // { Authorization: "Basic …" }
```

Priority:

1. **Basic auth** — when both `username` and `appPassword` are set, produces `Authorization: Basic <base64>`
2. **Bearer token** — when `token` is set, produces `Authorization: Bearer <token>`
3. **API key** — when `apiKey` is set, adds `X-API-Key: <key>` (can be combined with either of the above)

### Notes

- `WPCore` is not directly useful on its own. Extend `WPRead` (or a CRUD class) to get a usable client.
- `WP_URL` is the only truly required value. Without it the constructor throws.
- `apiBase` defaults to `"wp-json/wp/v2"`. Set it explicitly if your site uses a different prefix.
- `allowSelfSigned` defaults to `true` when the URL host is `localhost` or ends with `.local.citrusworx.test`. `WP_ALLOW_SELF_SIGNED` (`1` / `true` / `yes`) overrides on Node. `requestWordPress` only uses the undici TLS bypass when this flag is set **and** the request URL is `https://`.

---

## WPClient

**File:** `packages/kiwipress/src/core/WPClient.ts`

`WPClient` extends `WPCore` and adds the HTTP transport layer. It initialises a `Seltzer` instance and provides two internal execution methods that all upper layers call: `execute` for reads and `mutate` for writes.

### Responsibilities

- Initialise a `Seltzer` instance configured with the Node.js HTTP adapter, the full API base URL, and auth headers
- Build fully-resolved `Endpoint` objects from a route definition and optional path params
- Execute read-side routes by delegating to the route's handler
- Execute write-side routes by calling `requestWordPress` directly with a JSON body

### Protected methods

| Method | Signature | Description |
|---|---|---|
| `buildEndpoint` | `(route, params?) → Endpoint` | Interpolates path params, constructs the full URL, and bundles everything into a Seltzer `Endpoint` object |
| `execute` | `(route, params?) → Promise<any>` | Calls `buildEndpoint` then invokes `route.handler` — used for GET operations |
| `mutate` | `(route, body?, params?) → Promise<any>` | Calls `buildEndpoint`, adds `Content-Type: application/json`, and sends the request through `requestWordPress` with the serialised body — used for POST, PUT, DELETE |
| `getApp` | `() → Seltzer` | Returns the internal Seltzer instance |

### How `execute` and `mutate` differ

`execute` delegates entirely to the route's own `handler` function. This lets individual route handlers translate clean KiwiPress path shapes into WordPress query strings (e.g. `/posts/:slug` → `GET /posts?slug=hello-world`) before the request goes out.

`mutate` bypasses the handler and calls `requestWordPress` directly, because write operations use standard REST semantics (POST/PUT/PATCH/DELETE with a JSON body) and do not need query translation.

### Notes

- `WPClient` is still an internal class. Prefer extending `WPRead` or a CRUD class rather than `WPClient` directly.
- Auth headers are set once at construction time and baked into every request.
- `allowSelfSigned` is forwarded into Seltzer handler options and into each `Endpoint`.

---

## WPRead

**File:** `packages/kiwipress/src/core/WPRead.ts`

`WPRead` extends `WPClient` and adds the protected `read` method. It is the base class for all current domain objects (`Posts`, `Pages`, `Users`, `Categories`, `Tags`, `Comments`).

### Responsibilities

- Provide a named, semantically clear entry point for read operations
- Delegate to `WPClient.execute` under the hood

### Protected methods

| Method | Signature | Description |
|---|---|---|
| `read` | `(route, params?) → Promise<any>` | Executes a read-side route — thin wrapper around `execute` |

### Usage

All domain objects call `this.read(route, params)` from their public methods:

```ts
class Posts extends WPRead {
  getAll() {
    return this.read(getAllPosts);
  }

  getBySlug(slug: string) {
    return this.read(getPostBySlug, { slug });
  }
}
```

### Notes

- `WPRead` is the right base class for any custom read-only domain object.
- Posts, Pages, and Users extend `WPRead` and hold a `WPCreate` collaborator for `create()`. Update and delete still call `this.mutate()`.

---

## WPCreate

**File:** `packages/kiwipress/src/core/WPCreate.ts`

`WPCreate` extends `WPClient` and adds a named `create` method for POST operations.

### Responsibilities

- Provide a semantically named entry point for resource creation
- Delegate to `WPClient.mutate` with the supplied body

### Protected methods

| Method | Signature | Description |
|---|---|---|
| `create` | `(route, body, params?) → Promise<any>` | Sends a POST request with `body` serialised as JSON |

### Usage

Posts, Pages, and Users keep extending `WPRead`. Create goes through a small `WPCreate` collaborator constructed once with the same config:

```ts
class PostCreate extends WPCreate {
  createPost(data: WordPressPayload) {
    return this.create(createPost, data);
  }
}

class Posts extends WPRead {
  create(data: WordPressPayload) {
    return this.creator.createPost(data);
  }
}
```

> Update and delete still call `this.mutate()` from the `WPRead` subclass. That is a later step.

---

## WPUpdate

**File:** `packages/kiwipress/src/core/WPUpdate.ts`

`WPUpdate` extends `WPClient` and adds a named `update` method for PUT/PATCH operations.

### Responsibilities

- Provide a semantically named entry point for resource updates
- Delegate to `WPClient.mutate` with the supplied body and path params

### Protected methods

| Method | Signature | Description |
|---|---|---|
| `update` | `(route, body, params?) → Promise<any>` | Sends a PUT/PATCH request with `body` serialised as JSON; `params` are interpolated into the route path (e.g. `{ id: 42 }` for `/posts/:id`) |

### Usage

```ts
class Posts extends WPRead {
  update(id: string | number, data: WordPressPayload) {
    return this.mutate(updatePost, data, { id });
  }
}
```

---

## WPDelete

**File:** `packages/kiwipress/src/core/WPDelete.ts`

`WPDelete` extends `WPClient` and adds a named `delete` method for DELETE operations.

### Responsibilities

- Provide a semantically named entry point for resource deletion
- Delegate to `WPClient.mutate` with no body and optional path params

### Protected methods

| Method | Signature | Description |
|---|---|---|
| `delete` | `(route, params?) → Promise<any>` | Sends a DELETE request; no body is sent; `params` are interpolated into the route path |

### Usage

```ts
class Posts extends WPRead {
  delete(id: string | number) {
    return this.mutate(deletePost, undefined, { id });
  }
}
```

---

## Route utilities

**File:** `packages/kiwipress/src/core/route-utils.ts`

`route-utils` is not a class — it is a set of factory functions used by each domain's `routes.ts` file to define `Route<Endpoint>` objects. These functions keep individual route files concise and push WordPress query translation concerns into one place.

### `requestWordPress(ctx, init?)`

The base fetch wrapper used by all KiwiPress requests.

- Merges endpoint-level headers with any headers in `init`
- Calls the native `fetch` API
- Throws a descriptive error on non-2xx responses
- Returns the parsed JSON response body

### `createWordPressRoute(config, init?)`

Creates a `Route<Endpoint>` for routes where the KiwiPress path maps directly to a WordPress REST endpoint (e.g. `GET /posts/:id`).

```ts
export const getPostById = createWordPressRoute({ method: "GET", endpoint: "/posts/:id" });
```

### `createAliasedQueryRoute(config, collection, queryKey)`

Creates a `Route<Endpoint>` for routes where KiwiPress uses a clean path param but WordPress expects a query string parameter.

- `collection` — the WordPress REST collection (e.g. `"posts"`)
- `queryKey` — the WordPress query param name (e.g. `"slug"`)

```ts
// KiwiPress path: GET /posts/:slug
// WordPress request: GET /posts?slug=hello-world
export const getPostBySlug = createAliasedQueryRoute(
  { method: "GET", endpoint: "/posts/:slug" },
  "posts",
  "slug"
);
```

The handler extracts the last path segment with `getLastParam`, then rewrites the URL using `buildCollectionQueryEndpoint`.

### `getLastParam(ctx)`

Extracts and URL-decodes the final path segment from an `Endpoint`. Used internally by `createAliasedQueryRoute` to pull the param value out of the interpolated path.

### `buildCollectionQueryEndpoint(ctx, collection, query)`

Constructs a full WordPress query URL from the base URL on a context object:

```
{baseUrl}/{collection}?{query}
// e.g. https://example.com/wp-json/wp/v2/posts?slug=hello-world
```

---

## Types

**File:** `packages/kiwipress/src/types/api.ts`

```ts
// Describes a raw route definition before it becomes a Route<Endpoint>
type ApiDefinition = {
  method: string;    // HTTP method: "GET", "POST", "PUT", "DELETE"
  endpoint: string;  // Path with optional :params, e.g. "/posts/:id"
};

// Generic payload for create and update operations
type WordPressPayload = Record<string, unknown>;
```

`ApiDefinition` is the input shape for `createWordPressRoute` and `createAliasedQueryRoute`. `WordPressPayload` is used as the body type for all mutating domain object methods.

---

## Normalize

**File:** `packages/kiwipress/src/core/normalize.ts`

`normalizeWordPressItem(collection, value, sourceUrl?)` maps raw WordPress JSON onto `ContentRecord`. `toNectarinePost` maps that onto the Nectarine `Post` schema (`title`, `content`, `slug`, `status`, `author_id`, `featured_image`).

`Posts.getAll()` still returns raw JSON. Normalization is opt-in via these helpers or `WPSync.transfer()`.

---

## WPSync

**File:** `packages/kiwipress/src/core/WPSync.ts`

`WPSync` reads WordPress collections through domain objects and upserts `ContentRecord`s into a `NectarineStore`, then flushes if persistence is configured.

```ts
await kiwi.sync?.preview(["posts"]);
await kiwi.sync?.transfer(["posts", "pages"]);
```

See [Transfer](./kiwipress-transfer.md).

---

## KiwiPress facade

**File:** `packages/kiwipress/src/cms/KiwiPress.ts`

```ts
const kiwi = KiwiPress.connect({ url, username, appPassword, persistence });
await kiwi.ready();       // hydrate from persistence if configured
kiwi.mode;                // "wordpress" | "nectarine"
kiwi.wordpress.posts;     // existing Posts client
kiwi.native.posts;        // NativeCollection on NectarineStore
kiwi.promote();           // in-place switch to nectarine
kiwi.toNectarine();       // new instance sharing the store
await kiwi.persist();     // flush the store
```

`mode: "nectarine"` does not require `url`. Native collections then are the CMS. `persistence` is opt-in; omit it for in-memory.

---

## Nectarine API YAML

**File:** `packages/kiwipress/src/nectarine/api.ts`

`loadNectarineApi(data)` walks nested (`user.get.allUsers.api`) and flat API documents. `loadNectarineApiFile` uses Nectarine `parser.yaml`.

---

## Persistence

**Files:** `packages/kiwipress/src/cms/persistence.ts`, `file-persistence.ts`, `postgres-persistence.ts`

```ts
import { createFilePersistence, createPostgresPersistence } from "@citrusworx/kiwipress";

createFilePersistence("./data/kiwipress-cms.json");
createPostgresPersistence({ database: "kiwipress" }); // Nectarine PgSql; needs pg at runtime
createPostgresPersistence({ executor });              // tests / custom SQL
```

`NectarineStore.hydrate()` / `flush()` back this. KiwiPress does not import WebEngine to persist.

---

## Gateway

**File:** `packages/kiwipress/src/gateway/register.ts`

`registerKiwiPressGateway(app, kiwi, options?)` attaches exact Seltzer routes under `/__kiwipress`. Item writes use `?id=`. Used by `apps/kiwipress/back`. GET `/__kiwipress/cms` reports `persistence` (`memory` | `file` | `postgres` | `custom`).

`options.token` (`KIWIPRESS_GATEWAY_TOKEN`) is required for any non-loopback caller. `/__kiwipress/health` stays a public liveness probe and only returns `{ ok: true }`.

`WPClient.listAll(collection, query)` pages WordPress using `X-WP-TotalPages`. `WPSync.transfer()` uses it with `status=any` and `context=edit` so drafts and later pages are not dropped.

