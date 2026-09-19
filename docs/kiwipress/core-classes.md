# KiwiPress Core Classes

The core classes form an inheritance spine that separates WordPress infrastructure, transport, and CRUD concerns. Domain objects like `Posts`, `Pages`, and `Users` sit at the top of this spine.

This page is the practical spine reference. For what/why, use the [README](./README.md). For first requests, [Getting started](./kiwipress-getting-started.md). For the guided path, the [tutorial](./kiwipress-tutorial.md). KiwiPress is a **standalone CMS library** (WordPress elective in [Make A Web App](../webengine/make-a-web-app.md)), not a core chapter and not a WebEngine import.

```
WPCore + WPAuth
  └── WPClient          execute / mutate / listAll  (fetch, not listen)
        ├── WPRead      ← base for all WordPress domain objects
        ├── WPCreate
        ├── WPUpdate
        └── WPDelete

KiwiPress.connect()
  ├── wordpress.*   (Posts, Pages, …)   if url
  ├── sync          (WPSync)            if url
  ├── native.*      (NativeCollection)
  └── persistence   (optional file / Nectarine PgSql)
```

Source files live under `packages/kiwipress/`. They are listed as paths rather than links.

Topic pages own the deep dives: [Auth](./kiwipress-auth.md), [Domain](./kiwipress-domain.md), [Normalize](./kiwipress-normalize.md), [Transfer](./kiwipress-transfer.md), [Native CMS](./kiwipress-native-cms.md), [Gateway](./kiwipress-gateway.md).

---

## WPCore

**File:** `packages/kiwipress/src/core/WPCore.ts`

Holds configuration. No HTTP.

- Merge `process.env` (Node only) with constructor overrides (constructor wins)
- Require `url`
- Default `apiBase` to `wp-json/wp/v2`
- Default `allowSelfSigned` for `localhost` / `*.local.citrusworx.test`
- Delegate headers to `WPAuth`
- Interpolate `:key` in paths with `encodeURIComponent`

```ts
new WPCore(config?: Partial<WPCoreConfig>)
```

`WPCoreConfig`: `url`, `apiBase`, `username?`, `appPassword?`, `token?`, `apiKey?`, `allowSelfSigned?`, `headers?`.

Protected: `createConfig`, `createAuthHeaders`, `interpolatePath`, `getConfig`.

---

## WPAuth

**File:** `packages/kiwipress/src/core/WPAuth.ts`

See [Auth](./kiwipress-auth.md). `strategy()`, `isConfigured()`, `headers()`. Priority: Basic → Bearer → API-key-only; `X-API-Key` may combine.

---

## WPClient

**File:** `packages/kiwipress/src/core/WPClient.ts`

Extends `WPCore`. Constructs `Seltzer.init().handler({ adapter: "node:http", options: { baseUrl, headers, allowSelfSigned } })` **only to stash options**. Outbound I/O is `requestWordPress` / `requestWordPressPage` (`fetch`). This is not `Seltzer.listen` and not Seltzer `client.*`.

| Method | Role |
|---|---|
| `buildEndpoint(route, params?)` | Interpolate path; absolute `endpoint` URL |
| `execute(route, params?)` | `route.handler(endpoint)` — GET / aliases |
| `mutate(route, body?, params?)` | `requestWordPress` with JSON body — POST/PUT/DELETE |
| `listAll(collection, query?)` | **public** pager (`per_page=100`, `X-WP-TotalPages`, max 1000) |
| `getApp()` | internal Seltzer instance |

`execute` lets aliased handlers rewrite `/posts/:slug` → `GET /posts?slug=`. `mutate` skips the route handler and talks to WordPress REST directly.

---

## WPRead / WPCreate / WPUpdate / WPDelete

Thin named wrappers around `execute` / `mutate`. All current domain objects **extend `WPRead`**. Posts, Pages, and Users hold private collaborator subclasses for writes:

```ts
class Posts extends WPRead {
  create(data: WordPressPayload) {
    return this.creator.createPost(data);
  }
}
```

Do not extend `WPCreate` as the Posts base class.

---

## Route utilities

**File:** `packages/kiwipress/src/core/route-utils.ts`

| Helper | Role |
|---|---|
| `requestWordPress` | `fetch` + throw on non-2xx + `response.json()` |
| `requestWordPressPage` | same, plus `X-WP-Total` / `X-WP-TotalPages` |
| `createWordPressRoute` | `Route` whose handler is `requestWordPress` |
| `createAliasedQueryRoute` | last path segment → `?queryKey=` |
| `createAliasedQueryRouteFromKeys` | last N segments → `state=` + `city=` (users) |
| `getLastParam` / `buildCollectionQueryEndpoint` | internals |

Self-signed: `https://` + `allowSelfSigned` → dynamic `undici` `Agent`.

These `Route` objects are **outbound** descriptors. Their handlers receive a Seltzer `Endpoint`, not a `listen` `RequestContext`, and they do not return `ResponseData`.

---

## Types

**File:** `packages/kiwipress/src/types/api.ts`

```ts
type ApiDefinition = { method: string; endpoint: string };
type WordPressPayload = Record<string, unknown>;
```

---

## Normalize, WPSync, facade, persistence, YAML, gateway

Summaries only — full pages elsewhere.

- **Normalize** (`core/normalize.ts`) — [Normalization](./kiwipress-normalize.md)
- **WPSync** — [Transfer](./kiwipress-transfer.md)
- **`KiwiPress.connect`** — [Native CMS](./kiwipress-native-cms.md)
- **`CmsPersistence`** — file / Postgres / env — same page
- **`loadNectarineApi`** — [Nectarine API YAML](./kiwipress-nectarine-api.md)
- **`registerKiwiPressGateway`** — [Gateway](./kiwipress-gateway.md). Item writes use `?id=`. Handlers still call `ctx.json` (mismatch with Seltzer 0.8.1 `ResponseData`). `options.token` / loopback rules apply; `/__kiwipress/health` is public `{ ok: true }`.
