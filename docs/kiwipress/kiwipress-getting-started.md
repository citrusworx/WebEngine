# Getting Started With KiwiPress

This is the usable WordPress REST client path — a **standalone library**, not a WebEngine module. Use it in any Node project that can reach a WordPress REST API. The destination CMS path is [Transfer](./kiwipress-transfer.md).

You need a WordPress site with the REST API reachable (typically `/wp-json/wp/v2`) and, for writes, credentials.

## Install

```bash
yarn add @citrusworx/kiwipress
```

In this monorepo:

```bash
yarn workspace @citrusworx/kiwipress build
```

## Configure

Constructor values win over `process.env`. `url` is required (or `WP_URL` on Node).

```ts
import { Posts } from "@citrusworx/kiwipress";

const posts = new Posts({
  url: "https://your-wordpress-site.com",
  apiBase: "wp-json/wp/v2",
  username: "admin",
  appPassword: "xxxx xxxx xxxx xxxx xxxx xxxx"
});
```

On Node, `WPCore` also reads:

| Env | Config field |
|---|---|
| `WP_URL` | `url` |
| `WP_API` | `apiBase` |
| `WP_USER` | `username` |
| `WP_APP_PASSWORD` | `appPassword` |
| `WP_TOKEN` | `token` |
| `WP_API_KEY` | `apiKey` |
| `WP_ALLOW_SELF_SIGNED` | `allowSelfSigned` (`1` / `true` / `yes`) |

The published package does not load `.env` files. The app or test harness must.

### `WPCoreConfig`

| Field | Type | Default | Notes |
|---|---|---|---|
| `url` | `string` | — | Required. Trailing slashes stripped. |
| `apiBase` | `string` | `"wp-json/wp/v2"` | Leading/trailing slashes stripped. |
| `username` / `appPassword` | `string` | — | Basic auth when both set |
| `token` | `string` | — | `Authorization: Bearer …` if Basic is not set |
| `apiKey` | `string` | — | `X-API-Key` (can combine with Basic or Bearer) |
| `headers` | `Record<string, string>` | `{}` | Merged into every request |
| `allowSelfSigned` | `boolean` | `true` when host is `localhost` or ends with `.local.citrusworx.test` | HTTPS + this flag uses undici with `rejectUnauthorized: false` |

Older docs said the default `apiBase` was `"wp-json/v2"`. The current constructor default is `"wp-json/wp/v2"`. Set it explicitly if your site differs.

## Authenticate

KiwiPress picks the first complete strategy in `createAuthHeaders()`:

1. **Basic** — `username` and `appPassword` → `Authorization: Basic <base64>`
2. **Bearer** — `token` → `Authorization: Bearer <token>`
3. **API key** — always added as `X-API-Key` when present

Application passwords are the usual self-hosted path. The constructor throws only when `url` is missing — not when auth is missing. Public reads may work without credentials; writes usually will not.

## First reads

```ts
import { Posts, Pages, Users } from "@citrusworx/kiwipress";

const config = { url: "https://example.com", apiBase: "wp-json/wp/v2" };
const posts = new Posts(config);

const all = await posts.getAll();
const byId = await posts.getById(12);
const bySlug = await posts.getBySlug("hello-world");
const byAuthor = await posts.getByAuthor(1);
const byTag = await posts.getByTag(4);
const byCategory = await posts.getByCategory(3);
const recent = await posts.getByDate("2026-01-01T00:00:00");
```

Aliased reads (slug, author, tag, category, date) become collection query strings. `getByDate` maps to WordPress `after=`.

`Pages` also has `getByCategory` and `getByTag` (string arguments) plus the write methods. `Users` has `getByEmail`, `getByCity`, and `getByCityState(state, city)`.

## First writes

```ts
const draft = await posts.create({
  title: "KiwiPress Smoke Test Post",
  content: "<p>This post was created through KiwiPress.</p>",
  status: "draft",
  slug: `kiwipress-smoke-${Date.now()}`
});

await posts.update(draft.id, { status: "publish" });
await posts.delete(draft.id);
```

Bodies are `WordPressPayload` (`Record<string, unknown>`). There is no generated post schema. WordPress decides which fields it accepts.

`packages/kiwipress/src/example.ts` is this create-then-`getBySlug` flow against `http://localhost:8080`, then a `KiwiPress.connect().sync.transfer(["posts"])` into a file-backed native store.

## Transfer into Nectarine

WordPress is the on-ramp. When you want the native CMS this library owns:

```ts
import { KiwiPress, createFilePersistence } from "@citrusworx/kiwipress";

const kiwi = KiwiPress.connect({
  url: "https://example.com",
  username: "admin",
  appPassword: "xxxx xxxx xxxx xxxx xxxx xxxx",
  persistence: createFilePersistence("./data/kiwipress-cms.json")
});

await kiwi.ready();
await kiwi.sync?.transfer(["posts", "pages"]);
const native = kiwi.toNectarine();
await native.native.posts.getAll();
```

Pass `persistence` only when you want the store to survive process restart. Default is in-memory. Postgres uses Nectarine `PgSql` (`createPostgresPersistence({ database })` or `PG_DB`); inject an `SqlExecutor` in tests so `pg` is not loaded at import time.

Full walkthrough: [Transfer](./kiwipress-transfer.md).

## Read-only taxonomies and comments

```ts
import { Categories, Tags, Comments } from "@citrusworx/kiwipress";

const categories = new Categories(config);
await categories.getAll();
await categories.getBySlug("news");

const tags = new Tags(config);
await tags.getById(9);

const comments = new Comments(config);
await comments.getByPost(12);
```

There are no `create` / `update` / `delete` methods on these three classes.

## Extend with a custom collection

`read` expects a Seltzer `Route`, not a raw `{ method, endpoint }` object. Build the route with the helper the domain files use:

```ts
import { WPRead, createWordPressRoute } from "@citrusworx/kiwipress";

const getAllMedia = createWordPressRoute({
  method: "GET",
  endpoint: "/media"
});

class Media extends WPRead {
  getAll() {
    return this.read(getAllMedia);
  }
}
```

For a WordPress query-string alias:

```ts
import { createAliasedQueryRoute } from "@citrusworx/kiwipress";

const getMediaBySlug = createAliasedQueryRoute(
  { method: "GET", endpoint: "/media/:slug" },
  "media",
  "slug"
);
```

That is how `getPostBySlug` is defined in `packages/kiwipress/src/posts/routes.ts`.

## Pitfalls

- **Responses from `Posts` / `Pages` are raw JSON.** Use `normalizeWordPressItem` or `WPSync.transfer()` when you want Nectarine-shaped `ContentRecord`s. `getBySlug` returns whatever WordPress returned (often an array).
- **Failed HTTP throws.** `requestWordPress` throws `WordPress request failed: <status> <statusText>` on non-2xx.
- **Nectarine YAML is loaded by `loadNectarineApi`.** The WordPress client still uses static `routes.ts` files; transfer and native CMS follow Nectarine models.
- **`WPCreate` is not the Posts base class.** Posts extends `WPRead` and calls `mutate`.
- **Self-signed HTTPS** only bypasses TLS verification when `allowSelfSigned` is true and the URL is `https://`.
- **Seltzer inbound paths are exact.** The app gateway updates items with `?id=`, not `/posts/:id`.

## Where to go next

- [Transfer](./kiwipress-transfer.md)
- [Core classes](./core-classes.md)
- [Seltzer](../seltzer/README.md)
- [Nectarine](../nectarine/README.md)
- [Make A Web App](../webengine/make-a-web-app.md) electives table (WebEngine is one possible host)
