# KiwiPress

Standalone WordPress REST client and Nectarine-shaped CMS.

`@citrusworx/kiwipress` **0.4.3** hides WordPress query-string quirks behind domain objects (`Posts`, `Pages`, `Users`, `Categories`, `Tags`, `Comments`), then **transfers** that content into a Nectarine-shaped store you persist with a JSON file or Nectarine's Postgres adapter.

WordPress Headless is how many people start. It is not required. Greenfield apps can run `mode: "nectarine"` only.

[WebEngine](../webengine/README.md) does **not** orchestrate KiwiPress today. This package does not import WebEngine or `@citrusworx/types`. Use it the same way you use Seltzer or Nectarine: as a library.

The current model is:

- **`WPCore` + `WPAuth`** own URL, env, and Basic / Bearer / API-key headers
- **`WPClient`** owns outbound `fetch` (`execute` for reads, `mutate` for writes). A Seltzer instance is constructed only to stash `baseUrl` / headers / `allowSelfSigned`
- **`WPRead`** is the base class every WordPress domain object extends
- **Route helpers** rewrite clean paths such as `/posts/:slug` into `GET /posts?slug=`
- **`normalizeWordPressItem`** maps raw WP JSON onto `ContentRecord`
- **`WPSync.transfer()`** writes those records into `NectarineStore`
- **`CmsPersistence`** optionally saves that store (file or Nectarine `PgSql`)
- **`KiwiPress.connect()`** is the facade: WordPress clients in, native CMS out

`Blueprint.adapters.cms = "kiwipress"` is Types / future-kernel vocabulary. It is not a KiwiPress import.

## Who it is for

- Someone with a self-hosted WordPress REST API who wants a typed client
- Someone who wants a small native CMS (Nectarine-shaped records) in a Node app that is not WebEngine
- Someone who wants to move WordPress content onto that CMS and persist it
- Readers of the course hub who want the **WordPress elective**, not a hardwired kernel module

Skip this folder if you are not talking to WordPress and are not using the native CMS.

## Why it exists

The WordPress REST API is useful and inconsistent. A post by id is `/wp-json/wp/v2/posts/12`. A post by slug is `/wp-json/wp/v2/posts?slug=hello-world`. Application code that sprinkles those shapes around every screen copies the same mistakes.

CitrusWorx also did not want “the CMS” to mean “stay on WordPress forever.” Editors already know WordPress. Application code wants a schema it owns: `title`, `content`, `slug`, `status: draft | published | archived`.

KiwiPress exists so application code can say:

```ts
const post = await posts.getBySlug("hello-world");
```

and later:

```ts
const kiwi = KiwiPress.connect({
  url: "https://example.com",
  username,
  appPassword,
  persistence: createFilePersistence("./data/kiwipress-cms.json")
});
await kiwi.ready();
await kiwi.sync?.transfer(["posts", "pages"]);
const native = kiwi.toNectarine();
await native.native.posts.getBySlug("hello-world");
```

That second block is the product: **leave WordPress without abandoning the content**, in a library you can host yourself.

The design bets:

- **WordPress is the on-ramp, not the destination.** Domain objects talk to `wp-json`. Transfer is explicit.
- **Nectarine-shaped records are the CMS.** `ContentRecord` is what you persist and query after transfer.
- **Seltzer is transport vocabulary, not a WordPress framework.** Outbound calls are `fetch`. Inbound gateway registration is optional.
- **Persistence is opt-in.** Default store is in-memory so the package stays a cheap import.
- **Standalone.** No WebEngine import. No Types import.

Seltzer should not become a WordPress runtime. Nectarine should not become a CMS host. KiwiPress should not become a WebEngine-only module.

## Current setup shape

```ts
import { KiwiPress, Posts, createFilePersistence } from "@citrusworx/kiwipress";
```

Package version today: **0.4.3**. Depends on `@citrusworx/seltzer@^0.8.1` and `@citrusworx/nectarine@^0.4.0`. Requires Node 18+ for the WordPress client and persistence helpers (`fs`, `fetch`, optional `pg` / `undici`).

WordPress client:

```ts
const posts = new Posts({
  url: "https://example.com",
  apiBase: "wp-json/wp/v2",
  username: "admin",
  appPassword: "xxxx xxxx xxxx xxxx xxxx xxxx"
});

const all = await posts.getAll();
const hello = await posts.getBySlug("hello-world");
```

Native CMS, no WordPress:

```ts
const kiwi = KiwiPress.connect({
  mode: "nectarine",
  persistence: createFilePersistence("./data/kiwipress-cms.json")
});
await kiwi.ready();
await kiwi.native.posts.create({
  title: "Written in Nectarine",
  status: "published"
});
```

## What it can do

The sections below are the capability showcase. Every snippet matches `packages/kiwipress/src`. If a pattern is not here, check [Status](./kiwipress-status.md) before assuming a WordPress-plugin or Echo-CMS API.

### 1. Read posts through a domain object

```ts
import { Posts } from "@citrusworx/kiwipress";

const posts = new Posts({
  url: "https://example.com",
  apiBase: "wp-json/wp/v2"
});

const all = await posts.getAll();
const byId = await posts.getById(12);
const bySlug = await posts.getBySlug("hello-world");
const byAuthor = await posts.getByAuthor(1);
const byTag = await posts.getByTag(4);
const byCategory = await posts.getByCategory(3);
const recent = await posts.getByDate("2026-01-01T00:00:00");
```

`getAll()` is WordPress’s default first page. Aliased reads become collection query strings (`?slug=`, `?author=`, `?tags=`, `?categories=`, `?after=`). The return value is **raw WordPress JSON** — often an array for slug lookups.

### 2. Create, update, and delete on WordPress

```ts
const draft = await posts.create({
  title: "Hello from KiwiPress",
  content: "<p>Created through the client.</p>",
  status: "draft"
});

await posts.update(draft.id, { status: "publish" });
await posts.delete(draft.id);
```

Bodies are `WordPressPayload` (`Record<string, unknown>`). There is no generated post schema. WordPress decides which fields it accepts. The same write methods exist on `Pages` and `Users`. `Categories`, `Tags`, and `Comments` are **read-only** on the WordPress side.

### 3. Authenticate with the first complete strategy

```ts
import { WPAuth } from "@citrusworx/kiwipress";

const auth = new WPAuth({
  username: "admin",
  appPassword: "xxxx xxxx xxxx xxxx xxxx xxxx"
});

auth.strategy();      // "basic"
auth.headers();       // { Authorization: "Basic …" }
```

Priority: Basic (username + app password) → Bearer (`token`) → none. `apiKey` always adds `X-API-Key` when present and can combine with Basic or Bearer. The constructor does **not** throw when auth is missing. Public reads may work; writes usually will not. See [Auth](./kiwipress-auth.md).

### 4. Normalize a raw WordPress item

```ts
import { normalizeWordPressItem, toNectarinePost } from "@citrusworx/kiwipress";

const record = normalizeWordPressItem("posts", wpPost, "https://example.com");
const nectarinePost = toNectarinePost(record);
```

`title.rendered` / `title.raw` become `title`. `publish` becomes `published`. The original payload stays on `record.meta.raw`. `Posts.getAll()` still returns raw JSON — normalization is opt-in. See [Normalization](./kiwipress-normalize.md).

### 5. Transfer a site into the native store

```ts
import { KiwiPress, createFilePersistence } from "@citrusworx/kiwipress";

const kiwi = KiwiPress.connect({
  url: "https://example.com",
  username: "admin",
  appPassword: "xxxx xxxx xxxx xxxx xxxx xxxx",
  persistence: createFilePersistence("./data/kiwipress-cms.json")
});

await kiwi.ready();
const preview = await kiwi.sync?.preview(["posts", "pages"]);
const result = await kiwi.sync?.transfer(["posts", "pages"]);

kiwi.promote();
await kiwi.native.posts.getBySlug("hello-world");
```

`transfer()` pages WordPress with `per_page=100` and `X-WP-TotalPages`, using `status=any` and `context=edit` where WordPress supports it. It does **not** call `getAll()`. Drafts, private posts, and sites with more than ten items are included. See [Transfer](./kiwipress-transfer.md).

### 6. Run a native CMS with no WordPress

```ts
const kiwi = KiwiPress.connect({
  mode: "nectarine",
  persistence: createFilePersistence("./data/kiwipress-cms.json")
});

await kiwi.ready();
const created = await kiwi.native.posts.create({
  title: "Written in Nectarine",
  content: "<p>No WordPress in this path.</p>",
  status: "published"
});

await kiwi.native.posts.getById(created.id);
await kiwi.native.posts.update(created.id, { status: "archived" });
await kiwi.native.posts.delete(created.id);
```

`mode: "nectarine"` does not require `url`. Native collections exist for all six CMS collections, including taxonomies and comments. See [Native CMS](./kiwipress-native-cms.md).

### 7. Persist to a file or Postgres

```ts
import {
  createFilePersistence,
  createPostgresPersistence,
  persistenceFromEnv
} from "@citrusworx/kiwipress";

createFilePersistence("./data/kiwipress-cms.json");
createPostgresPersistence({ database: "kiwipress" });
createPostgresPersistence({ executor }); // tests / custom SQL
persistenceFromEnv(); // KIWIPRESS_CMS_FILE, else KIWIPRESS_PG_DB / PG_DB
```

Without `persistence`, the store is in memory. `await kiwi.ready()` hydrates once. Native mutations and `WPSync.transfer()` flush after they write. File saves write `{ version: 1, collections }` atomically (temp file + rename). Postgres uses table `kiwipress_content` through Nectarine `PgSql` and save is delete-then-insert.

### 8. Register an inbound Seltzer gateway

```ts
import { Seltzer } from "@citrusworx/seltzer";
import { KiwiPress, registerKiwiPressGateway } from "@citrusworx/kiwipress";

const kiwi = KiwiPress.connect({ url: process.env.WP_URL, persistence });
await kiwi.ready();

const app = Seltzer.init();
registerKiwiPressGateway(app, kiwi, {
  token: process.env.KIWIPRESS_GATEWAY_TOKEN
});
app.listen(8787);
```

That is what `apps/kiwipress/back` does. Routes live under `/__kiwipress`. Item writes use `?id=`. **Honesty:** the registered handlers still call a local `ctx.json` helper and re-read `ctx.req`. Current Seltzer **0.8.1** wants handlers to **return `ResponseData`** and already parsed `ctx.body`. Documented as shipped code, not as the Seltzer tutorial pattern. See [Gateway](./kiwipress-gateway.md).

### 9. Walk Nectarine API YAML

```ts
import { loadNectarineApi, loadNectarineApiFile } from "@citrusworx/kiwipress";

const routes = loadNectarineApiFile("libraries/nectarine/models/user/userAPI.yml");
// [{ resource: "user", operation: "get", name: "allUsers", method: "GET", endpoint: "/users" }, ...]
```

This is a walker, not a router. Copy `method` + `endpoint` onto Seltzer routes yourself, or use Seltzer `generateRoutes` + Nectarine `listApiOperations`. See [Nectarine API YAML](./kiwipress-nectarine-api.md).

### 10. Optional dashboard app

`apps/kiwipress` is a Juice + Sig marketing site, onboarding wizard, and dashboard that **consumes** the library. It is not the library. The live CMS surface is **Content**: transfer panel plus posts/pages manager. Other dashboard pages (Projects, Billing, …) are placeholders. See [Dashboard app](./kiwipress-dashboard.md). Local run + wizard provision walkthrough: [`apps/kiwipress/README.md`](../../apps/kiwipress/README.md).

## Mental model

```
Posts / Pages / Users / …     WordPress entry (optional)
        │  extends WPRead
        ▼
 WPClient.execute / mutate     outbound fetch, not Seltzer.listen
        │
        ▼
 ContentRecord (normalizeWordPressItem)
        │  WPSync.transfer()
        ▼
 NectarineStore  →  NativeCollection
        │  CmsPersistence (opt-in)
        ▼
 File JSON or Nectarine Postgres — any Node host
```

| You want… | Use |
|---|---|
| Talk to WordPress | `new Posts(config)` / `kiwi.wordpress.posts` |
| Auth headers | `WPAuth` / constructor credentials |
| A Nectarine-shaped record | `normalizeWordPressItem` |
| Move a site | `kiwi.sync.preview` / `kiwi.sync.transfer` |
| Read the destination CMS | `kiwi.native.posts.getBySlug` |
| Survive restart | `createFilePersistence` or `createPostgresPersistence` |
| Skip WordPress | `KiwiPress.connect({ mode: "nectarine" })` |
| Switch an existing instance | `kiwi.promote()` (in place) or `kiwi.toNectarine()` (new instance, shared store) |
| HTTP façade for the dashboard | `registerKiwiPressGateway` |
| YAML → `{ method, endpoint }` | `loadNectarineApi` |

`WPCreate` / `WPUpdate` / `WPDelete` exist as named wrappers around `mutate`. Posts, Pages, and Users extend `WPRead` and delegate writes to those collaborators.

## Product path vs course theater

**Building with the library** (start here)

1. [Getting Started](./kiwipress-getting-started.md)
2. [Guided tutorial](./kiwipress-tutorial.md)
3. Topic pages: [domain objects](./kiwipress-domain.md), [auth](./kiwipress-auth.md), [normalize](./kiwipress-normalize.md), [transfer](./kiwipress-transfer.md), [native CMS](./kiwipress-native-cms.md), [gateway](./kiwipress-gateway.md)
4. [Patterns](./kiwipress-patterns.md) · [Best practices](./kiwipress-best-practices.md) · [Anti-patterns](./kiwipress-anti-patterns.md)

There is no `docs/kiwipress/course/`. A progressive course would retell the tutorial and topics without a larger shipped surface. Learn HTTP from [Seltzer](../seltzer/README.md); learn YAML models from [Nectarine](../nectarine/README.md).

## Suggested reading order

1. This README — what / why / showcase
2. [Getting Started](./kiwipress-getting-started.md) — install, WP client, nectarine-only
3. [Tutorial](./kiwipress-tutorial.md) — connect → read → normalize → transfer → persist → native read
4. [Domain objects](./kiwipress-domain.md) — Posts, Pages, Users, taxonomies, comments
5. [Auth](./kiwipress-auth.md) — Basic / Bearer / app passwords
6. [Normalization](./kiwipress-normalize.md) — `ContentRecord`, status map
7. [Transfer](./kiwipress-transfer.md) — `WPSync`, paging, `listAll`
8. [Native CMS](./kiwipress-native-cms.md) — store, collections, file / Postgres / env
9. [Gateway](./kiwipress-gateway.md) — `/__kiwipress`, token, Seltzer mismatch
10. [Nectarine API YAML](./kiwipress-nectarine-api.md) — `loadNectarineApi`
11. [Dashboard app](./kiwipress-dashboard.md) — `apps/kiwipress`
12. [Core classes](./core-classes.md) — spine reference
13. [Patterns](./kiwipress-patterns.md) · [Best practices](./kiwipress-best-practices.md) · [Anti-patterns](./kiwipress-anti-patterns.md)
14. [API reference](./kiwipress-api.md)
15. [Troubleshooting](./kiwipress-troubleshooting.md)
16. [Status](./kiwipress-status.md) — honesty matrix
17. [Roadmap](./kiwipress-roadmap.md)

## Status

**0.4.3** (`@citrusworx/kiwipress`). WordPress read/write for Posts, Pages, and Users is the strongest path. Native CMS is real (in-memory by default; JSON file and Nectarine Postgres when you pass `persistence`). The inbound gateway and dashboard Content page are usable and **early** — the gateway still speaks a pre-`ResponseData` Seltzer shape.

Shipped:

- package `@citrusworx/kiwipress` (`packages/kiwipress`)
- `WPCore`, `WPAuth`, `WPClient`, `WPRead`, `WPCreate`, `WPUpdate`, `WPDelete`, `WPSync`
- `Posts`, `Pages`, `Users` with create / update / delete
- `Categories`, `Tags`, `Comments` WordPress reads
- `createWordPressRoute`, `createAliasedQueryRoute`, `requestWordPress`, `listAll`
- `normalizeWordPressItem`, `toNectarinePost`, `loadNectarineApi`
- `KiwiPress.connect()`, `NectarineStore`, `NativeCollection`, `CmsPersistence`
- `registerKiwiPressGateway` + gateway token helper
- env var loading on Node (`WP_URL`, `WP_API`, `WP_USER`, `WP_APP_PASSWORD`, `WP_TOKEN`, `WP_API_KEY`, `WP_ALLOW_SELF_SIGNED`, `KIWIPRESS_CMS_FILE`, `KIWIPRESS_PG_DB` / `PG_DB`)
- default `apiBase` of `wp-json/wp/v2`
- `apps/kiwipress` product app (front + Seltzer gateway with file persistence by default)

Not shipped:

- MySQL / Mongo persistence adapters
- a full Echo visual CMS
- media / custom post type domain objects
- plugin adapters (WooCommerce, BuddyPress, MemberPress)
- gateway handlers that return Seltzer `ResponseData`

See [Status](./kiwipress-status.md) for the area-by-area matrix and [Roadmap](./kiwipress-roadmap.md) for what is worth building next.

## Placement in the ecosystem

**Standalone CMS library, WordPress elective.** Not chapter 1–6 of the core course. WebEngine is a possible future host, not the runtime.

| Package | Relationship |
|---|---|
| [Seltzer](../seltzer/README.md) | Types (`Route`, `Endpoint`) and optional inbound `listen`. Outbound WordPress is KiwiPress `fetch`. Required as a dependency. |
| [Nectarine](../nectarine/README.md) | Destination schema, API YAML, optional `PgSql`. `loadNectarineApi` walks those files. |
| [Types](../types/README.md) | `adapters.cms: "kiwipress"` names this package for a future kernel. KiwiPress does not import Types. |
| [WebEngine](../webengine/README.md) | Future orchestrator. Not a KiwiPress dependency. Does not start the dashboard. |
| [Stenzil](../stenzil/README.md) | Future PHP templates are a separate elective. |
| [Juice](../juice/README.md) | Has a `kiwipress` theme id. That is styling, not this client. |
| [Sig.js](../sigjs/README.md) | The dashboard front uses Sig for the Content UI. The library does not. |

Course hub: [Make A Web App With WebEngine](../webengine/make-a-web-app.md) — electives table.

## Source of truth

- Package: `packages/kiwipress/package.json` (0.4.3)
- Entry: `packages/kiwipress/src/index.ts`
- Core: `packages/kiwipress/src/core/`
- Facade: `packages/kiwipress/src/cms/KiwiPress.ts`
- Persistence: `packages/kiwipress/src/cms/persistence.ts`
- Domain objects: `packages/kiwipress/src/posts/`, `pages/`, `users/`, `categories/`, `tags/`, `comments/`
- Gateway: `packages/kiwipress/src/gateway/`
- App: `apps/kiwipress/` (consumes the library; is not the library)
- In-package smoke: `packages/kiwipress/src/example.ts`
- Architecture: `packages/kiwipress/ARCHITECTURE.md`
