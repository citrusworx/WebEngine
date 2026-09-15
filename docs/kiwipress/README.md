# KiwiPress

`@citrusworx/kiwipress` is a **standalone** WordPress REST client and Nectarine-shaped CMS.

It is a TypeScript application layer on [Seltzer](../seltzer/README.md) that hides WordPress query-string quirks behind domain objects (`Posts`, `Pages`, `Users`, `Categories`, `Tags`, `Comments`), then **transfers** that content into a [Nectarine](../nectarine/README.md)-shaped store you can persist with a JSON file or Nectarine's Postgres adapter.

WordPress Headless is how many people start. It is not required. Greenfield apps can run `mode: "nectarine"` only.

[WebEngine](../webengine/README.md) may orchestrate KiwiPress later. This package does not import WebEngine or `@citrusworx/types`. Use it in other projects the same way you use Seltzer or Nectarine: as a library.

The current model is:

- `WPCore` owns URL, env, and `:param` interpolation
- `WPAuth` owns Basic / Bearer / API-key headers
- `WPClient` owns Seltzer + `execute` (reads) / `mutate` (writes)
- `WPRead` is the base class every WordPress domain object extends
- route helpers rewrite clean paths such as `/posts/:slug` into `GET /posts?slug=`
- `normalizeWordPressItem` maps raw WP JSON onto `ContentRecord`
- `WPSync.transfer()` writes those records into `NectarineStore`
- `CmsPersistence` optionally saves that store (file or Nectarine `PgSql`)
- `KiwiPress.connect()` is the facade: WordPress clients in, native CMS out

`Blueprint.adapters.cms = "kiwipress"` is Types / future-kernel vocabulary. It is not a KiwiPress import.

## Who this is for

- Someone with a self-hosted WordPress REST API who wants a typed client
- Someone who wants a small native CMS (Nectarine-shaped records) in a Node app that is not WebEngine
- Someone who wants to move WordPress content onto that CMS and persist it
- Readers of the course hub who want the **WordPress elective**, not a hardwired kernel module

Skip this folder if you are not talking to WordPress and are not using the native CMS.

## Why it exists

The WordPress REST API is useful and inconsistent. A post by id is `/wp-json/wp/v2/posts/12`. A post by slug is `/wp-json/wp/v2/posts?slug=hello-world`. Application code that sprinkles those shapes around every screen copies the same mistakes.

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

Seltzer is the HTTP/runtime primitive. Nectarine is the destination schema, API YAML, and optional SQL adapters. KiwiPress should not turn Seltzer into a WordPress framework, and it should not keep people on WordPress forever. It should also not become a WebEngine-only module.

## Mental model

```
Posts / Pages / Users / …     WordPress entry (optional)
        │  extends WPRead
        ▼
 WPClient.execute / mutate
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

`WPCreate` / `WPUpdate` / `WPDelete` exist as named wrappers around `mutate`. Domain objects call `this.mutate(...)` from `WPClient` rather than extending those classes.

## What it can do today

Read and write posts against a real WordPress REST base, transfer them into a Nectarine store, and persist that store.

```ts
import { KiwiPress, Posts, createFilePersistence } from "@citrusworx/kiwipress";

const posts = new Posts({
  url: "https://example.com",
  apiBase: "wp-json/wp/v2",
  username: "admin",
  appPassword: "xxxx xxxx xxxx xxxx xxxx xxxx"
});

const all = await posts.getAll();
const hello = await posts.getBySlug("hello-world");

const draft = await posts.create({
  title: "Hello from KiwiPress",
  content: "<p>Created through the client.</p>",
  status: "draft"
});

await posts.update(draft.id, { status: "publish" });

const kiwi = KiwiPress.connect({
  url: "https://example.com",
  username: "admin",
  appPassword: "xxxx xxxx xxxx xxxx xxxx xxxx",
  persistence: createFilePersistence("./data/kiwipress-cms.json")
});

await kiwi.ready();
const transferred = await kiwi.sync?.transfer(["posts"]);
const nativePosts = await kiwi.toNectarine().native.posts.getAll();
```

`getBySlug` is the aliased route: KiwiPress path `/posts/:slug`, WordPress request `/posts?slug=hello-world`. Native `getBySlug` reads the transferred `ContentRecord`.

The same WordPress pattern exists on `Pages` and `Users` (including writes). `Categories`, `Tags`, and `Comments` are **read-only** on WordPress and become native collections after transfer.

See [Getting started](./kiwipress-getting-started.md), [Core classes](./core-classes.md), and [Transfer](./kiwipress-transfer.md).

## Status

**Beta** on the WordPress read/write path for the six domain objects. **Early** on the native CMS (in-memory by default; JSON file and Nectarine Postgres when you pass `persistence`).

Shipped:

- package `@citrusworx/kiwipress` (`packages/kiwipress`)
- `WPCore`, `WPAuth`, `WPClient`, `WPRead`, `WPCreate`, `WPUpdate`, `WPDelete`, `WPSync`
- `Posts`, `Pages`, `Users` with create / update / delete
- `Categories`, `Tags`, `Comments` reads
- `createWordPressRoute`, `createAliasedQueryRoute`, `requestWordPress`
- `normalizeWordPressItem`, `toNectarinePost`, `loadNectarineApi`
- `KiwiPress.connect()`, `NectarineStore`, `CmsPersistence`, `registerKiwiPressGateway`
- env var loading on Node (`WP_URL`, `WP_API`, `WP_USER`, `WP_APP_PASSWORD`, `WP_TOKEN`, `WP_API_KEY`, `WP_ALLOW_SELF_SIGNED`, `KIWIPRESS_CMS_FILE`, `KIWIPRESS_PG_DB` / `PG_DB`)
- default `apiBase` of `wp-json/wp/v2`
- `apps/kiwipress` product app (front + Seltzer gateway with file persistence by default)

Not shipped:

- MySQL / Mongo persistence adapters
- a full Echo visual CMS
- media / custom post type domain objects
- plugin adapters (WooCommerce, BuddyPress, MemberPress)

`packages/kiwipress/ARCHITECTURE.md` matches this folder.

## Placement in the ecosystem

**Standalone CMS library, WordPress elective.** Not chapter 1–6 of the core course. WebEngine is a possible host, not the runtime.

| Package | Relationship |
|---|---|
| [Seltzer](../seltzer/README.md) | Transport. Required for the WordPress client and inbound gateway. |
| [Nectarine](../nectarine/README.md) | Destination schema, API YAML, optional `PgSql`. `loadNectarineApi` walks those files. |
| [Types](../types/README.md) | `adapters.cms: "kiwipress"` names this package for a future kernel. KiwiPress does not import Types. |
| [WebEngine](../webengine/README.md) | Future orchestrator. Not a KiwiPress dependency. |
| [Stenzil](../stenzil/README.md) | Future PHP templates are a separate elective. |
| [Juice](../juice/README.md) | Has a `kiwipress` theme id. That is styling, not this client. |

Course hub: [Make A Web App With WebEngine](../webengine/make-a-web-app.md) — electives table.

## Suggested reading order

1. This README — what / why / standalone WordPress → Nectarine
2. [Getting started](./kiwipress-getting-started.md) — install, config, first reads and writes
3. [Transfer](./kiwipress-transfer.md) — WPSync, native CMS, persistence
4. [Core classes](./core-classes.md) — spine, auth, normalize, gateway
5. [Seltzer](../seltzer/README.md) and [Nectarine](../nectarine/README.md) if you are extending routes or models

## Source of truth

- Package: `packages/kiwipress/package.json`
- Entry: `packages/kiwipress/src/index.ts`
- Core: `packages/kiwipress/src/core/`
- Facade: `packages/kiwipress/src/cms/KiwiPress.ts`
- Persistence: `packages/kiwipress/src/cms/persistence.ts`
- Domain objects: `packages/kiwipress/src/posts/`, `pages/`, `users/`, `categories/`, `tags/`, `comments/`
- App: `apps/kiwipress/`
- In-package smoke: `packages/kiwipress/src/example.ts`
- Architecture: `packages/kiwipress/ARCHITECTURE.md`
