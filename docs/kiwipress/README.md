# KiwiPress

`@citrusworx/kiwipress` is the WordPress entry point into [WebEngine](../webengine/README.md).

It is a TypeScript application layer on [Seltzer](../seltzer/README.md) that hides WordPress query-string quirks behind domain objects (`Posts`, `Pages`, `Users`, `Categories`, `Tags`, `Comments`), then **transfers** that content into a [Nectarine](../nectarine/README.md)-shaped CMS.

WordPress Headless is how people start. The destination is a more expressive, modern CMS that WebEngine can run without WordPress.

The current model is:

- `WPCore` owns URL, env, and `:param` interpolation
- `WPAuth` owns Basic / Bearer / API-key headers
- `WPClient` owns Seltzer + `execute` (reads) / `mutate` (writes)
- `WPRead` is the base class every WordPress domain object extends
- route helpers rewrite clean paths such as `/posts/:slug` into `GET /posts?slug=`
- `normalizeWordPressItem` maps raw WP JSON onto `ContentRecord`
- `WPSync.transfer()` writes those records into `NectarineStore`
- `KiwiPress.connect()` is the facade: WordPress clients in, native CMS out

`Blueprint.adapters.cms = "kiwipress"` means this package.

## Who this is for

- Someone with a self-hosted WordPress REST API who wants a typed client
- Someone who wants to move that content onto Nectarine / WebEngine later
- Readers of the course hub who want the **WordPress on-ramp** into the stack

Skip this folder if you are not talking to WordPress and are not transferring CMS content.

## Why it exists

The WordPress REST API is useful and inconsistent. A post by id is `/wp-json/wp/v2/posts/12`. A post by slug is `/wp-json/wp/v2/posts?slug=hello-world`. Application code that sprinkles those shapes around every screen copies the same mistakes.

KiwiPress exists so application code can say:

```ts
const post = await posts.getBySlug("hello-world");
```

and later:

```ts
const kiwi = KiwiPress.connect({ url: "https://example.com", username, appPassword });
await kiwi.sync?.transfer(["posts", "pages"]);
const native = kiwi.toNectarine();
await native.native.posts.getBySlug("hello-world");
```

That second block is the product: **leave WordPress without abandoning the content.**

Seltzer is the HTTP/runtime primitive. Nectarine is the destination schema and API YAML. KiwiPress should not turn Seltzer into a WordPress framework, and it should not keep people on WordPress forever.

## Mental model

```
Posts / Pages / Users / …     WordPress entry
        │  extends WPRead
        ▼
 WPClient.execute / mutate
        │
        ▼
 ContentRecord (normalizeWordPressItem)
        │  WPSync.transfer()
        ▼
 NectarineStore  →  NativeCollection
        │
        ▼
 WebEngine runtime (destination CMS)
```

`WPCreate` / `WPUpdate` / `WPDelete` exist as named wrappers around `mutate`. Domain objects call `this.mutate(...)` from `WPClient` rather than extending those classes.

## What it can do today

Read and write posts against a real WordPress REST base, then transfer them into an in-memory Nectarine store.

```ts
import { KiwiPress, Posts } from "@citrusworx/kiwipress";

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
  appPassword: "xxxx xxxx xxxx xxxx xxxx xxxx"
});

const transferred = await kiwi.sync?.transfer(["posts"]);
const nativePosts = await kiwi.toNectarine().native.posts.getAll();
```

`getBySlug` is the aliased route: KiwiPress path `/posts/:slug`, WordPress request `/posts?slug=hello-world`. Native `getBySlug` reads the transferred `ContentRecord`.

The same WordPress pattern exists on `Pages` and `Users` (including writes). `Categories`, `Tags`, and `Comments` are **read-only** on WordPress and become native collections after transfer.

See [Getting started](./kiwipress-getting-started.md), [Core classes](./core-classes.md), and [Transfer](./kiwipress-transfer.md).

## Status

**Beta** on the WordPress read/write path for the six domain objects. **Early** on the native CMS (in-memory store; Postgres via Nectarine is next).

Shipped:

- package `@citrusworx/kiwipress` (`packages/kiwipress`)
- `WPCore`, `WPAuth`, `WPClient`, `WPRead`, `WPCreate`, `WPUpdate`, `WPDelete`, `WPSync`
- `Posts`, `Pages`, `Users` with create / update / delete
- `Categories`, `Tags`, `Comments` reads
- `createWordPressRoute`, `createAliasedQueryRoute`, `requestWordPress`
- `normalizeWordPressItem`, `toNectarinePost`, `loadNectarineApi`
- `KiwiPress.connect()`, `NectarineStore`, `registerKiwiPressGateway`
- env var loading on Node (`WP_URL`, `WP_API`, `WP_USER`, `WP_APP_PASSWORD`, `WP_TOKEN`, `WP_API_KEY`, `WP_ALLOW_SELF_SIGNED`)
- default `apiBase` of `wp-json/wp/v2`
- `apps/kiwipress` product app (front + Seltzer gateway)

Not shipped:

- persisting `NectarineStore` through Nectarine DB adapters
- a full Echo visual CMS
- media / custom post type domain objects
- plugin adapters (WooCommerce, BuddyPress, MemberPress)

`packages/kiwipress/ARCHITECTURE.md` matches this folder.

## Placement in the ecosystem

**WordPress on-ramp.** Not chapter 1–6 of the core course, but it is how WordPress users enter the stack.

| Package | Relationship |
|---|---|
| [Seltzer](../seltzer/README.md) | Transport. Required. Inbound gateway uses `Seltzer.route` + `ctx.json`. |
| [Nectarine](../nectarine/README.md) | Destination schema and API YAML. `loadNectarineApi` walks those files. |
| [Types](../types/README.md) | `adapters.cms: "kiwipress"` names this package. |
| [WebEngine](../webengine/README.md) | Future orchestrator for the native CMS. |
| [Stenzil](../stenzil/README.md) | Future PHP templates are a separate elective. |
| [Juice](../juice/README.md) | Has a `kiwipress` theme id. That is styling, not this client. |

Course hub: [Make A Web App With WebEngine](../webengine/make-a-web-app.md) — electives table.

## Suggested reading order

1. This README — what / why / WordPress → Nectarine
2. [Getting started](./kiwipress-getting-started.md) — install, config, first reads and writes
3. [Transfer](./kiwipress-transfer.md) — WPSync and the native CMS
4. [Core classes](./core-classes.md) — spine, auth, normalize, gateway
5. [Seltzer](../seltzer/README.md) and [Nectarine](../nectarine/README.md) if you are extending routes or models

## Source of truth

- Package: `packages/kiwipress/package.json`
- Entry: `packages/kiwipress/src/index.ts`
- Core: `packages/kiwipress/src/core/`
- Facade: `packages/kiwipress/src/cms/KiwiPress.ts`
- Domain objects: `packages/kiwipress/src/posts/`, `pages/`, `users/`, `categories/`, `tags/`, `comments/`
- App: `apps/kiwipress/`
- In-package smoke: `packages/kiwipress/src/example.ts`
- Architecture: `packages/kiwipress/ARCHITECTURE.md`
