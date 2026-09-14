# KiwiPress

`@citrusworx/kiwipress` is an object-oriented WordPress REST client built on [Seltzer](../seltzer/README.md).

It is not a WordPress plugin, not a theme, and not a core chapter of [Make A Web App With WebEngine](../webengine/make-a-web-app.md). It is a TypeScript API that hides WordPress query-string quirks behind domain objects: `Posts`, `Pages`, `Users`, `Categories`, `Tags`, `Comments`.

The current model is:

- `WPCore` owns URL, auth headers, and `:param` interpolation
- `WPClient` owns Seltzer + `execute` (reads) / `mutate` (writes)
- `WPRead` is the base class every domain object extends
- route helpers rewrite clean paths such as `/posts/:slug` into `GET /posts?slug=`

KiwiPress is strongest when you treat it as a **WordPress application layer** — not as a bag of `fetch` wrappers, and not as Nectarine-with-a-CMS-adapter (Nectarine is a package dependency and is **not imported** in `packages/kiwipress/src/`).

## Who this is for

- Someone integrating a self-hosted WordPress REST API from TypeScript
- Someone extending the client with another collection (`/media`, a custom post type)
- Readers of the course hub who want the **optional WordPress track**

Skip this entire folder unless you are talking to WordPress. Juice, Sig.js, Nectarine, and Seltzer do not require it.

## Why it exists

The WordPress REST API is useful and inconsistent. A post by id is `/wp-json/wp/v2/posts/12`. A post by slug is `/wp-json/wp/v2/posts?slug=hello-world`. Authors, tags, categories, and “after” dates are more query params. Application code that sprinkles those shapes around every screen will copy the same mistakes.

KiwiPress exists so application code can say:

```ts
const post = await posts.getBySlug("hello-world");
```

and a route helper (`createAliasedQueryRoute` in `packages/kiwipress/src/core/route-utils.ts`) can turn that into `GET {base}/posts?slug=hello-world`.

That is the same split Juice makes with attributes vs theme CSS: **the public shape stays clean; the vendor quirk stays in one handler.**

Seltzer is the HTTP/runtime primitive. KiwiPress should not turn Seltzer into a WordPress framework. Nectarine is the long-term config story (`userAPI.yml` and friends); the live client uses **static route objects** in each domain’s `routes.ts` instead of parsing YAML at runtime. `packages/kiwipress/ARCHITECTURE.md` still describes the YAML path as the design target.

What KiwiPress is not:

- a replacement for Nectarine models
- a WebEngine CMS adapter (Types has `adapters.cms?: string`, unused here)
- `WPAuth` / `WPSync` (planned; not in `src/`)
- an `apps/kiwipress` smoke app — that app is not in the repo; the in-package demo is `packages/kiwipress/src/example.ts`

## Mental model

```
Posts / Pages / Users / …
        │  extends
        ▼
     WPRead.read(route, params)
        │
        ▼
     WPClient.execute  →  route.handler  →  fetch
        or
     WPClient.mutate   →  requestWordPress (JSON body)
        │
        ▼
     WPCore  (url, apiBase, auth headers, :id interpolation)
```

`WPCreate` / `WPUpdate` / `WPDelete` exist as named wrappers around `mutate`. Domain objects call `this.mutate(...)` directly from `WPClient` rather than extending those classes.

## What it can do today

Read and write posts against a real WordPress REST base.

```ts
import { Posts } from "@citrusworx/kiwipress";

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
await posts.delete(draft.id);
```

`getBySlug` is the aliased route: KiwiPress path `/posts/:slug`, WordPress request `/posts?slug=hello-world`. `getById` is a direct `/posts/:id`.

The same pattern exists on `Pages` and `Users` (including writes). `Categories`, `Tags`, and `Comments` are **read-only**.

See [Getting started](./kiwipress-getting-started.md) for config and auth, and [Core classes](./core-classes.md) for the spine.

## Status

**Beta** on the read path for the six domain objects; **early** on writes and architecture completeness.

Shipped:

- package `@citrusworx/kiwipress` (`packages/kiwipress`)
- `WPCore`, `WPClient`, `WPRead`, `WPCreate`, `WPUpdate`, `WPDelete`
- `Posts`, `Pages`, `Users` with create / update / delete
- `Categories`, `Tags`, `Comments` reads
- `createWordPressRoute`, `createAliasedQueryRoute`, `requestWordPress`
- env var loading on Node (`WP_URL`, `WP_API`, `WP_USER`, `WP_APP_PASSWORD`, `WP_TOKEN`, `WP_API_KEY`, `WP_ALLOW_SELF_SIGNED`)
- default `apiBase` of `wp-json/wp/v2` (not `wp-json/v2`)

Not shipped:

- `WPAuth` (sign-in / application-password workflow as a class)
- `WPSync` (import / export / backup)
- response normalization beyond `response.json()`
- Nectarine YAML route loading
- an `apps/kiwipress` workspace

`packages/kiwipress/ARCHITECTURE.md` is older than the write methods — prefer this folder when they disagree.

## Placement in the ecosystem

**Optional WordPress track.** Not chapter 1–6 of the course.

| Package | Relationship |
|---|---|
| [Seltzer](../seltzer/README.md) | Transport. Required. |
| [Nectarine](../nectarine/README.md) | Declared dependency; unused in current `src/`. |
| [Types](../types/README.md) | `adapters.cms` can say `"kiwipress"` as a string. No import. |
| [Stenzil](../stenzil/README.md) | Future PHP templates are a separate elective. |
| [Juice](../juice/README.md) | Has a `kiwipress` theme id. That is styling, not this client. |

Course hub: [Make A Web App With WebEngine](../webengine/make-a-web-app.md) — electives table.

## Suggested reading order

1. This README — what / why / what works
2. [Getting started](./kiwipress-getting-started.md) — install, config, first reads and writes
3. [Core classes](./core-classes.md) — WPCore → WPClient → CRUD spine and route helpers
4. Back to [Seltzer](../seltzer/README.md) if you are extending routes

## Sibling docs

- [Seltzer](../seltzer/README.md)
- [Nectarine](../nectarine/README.md)
- [Types](../types/README.md)
- [Stenzil](../stenzil/README.md) (compiler elective, not required)

## Source of truth

- Package: `packages/kiwipress/package.json`
- Entry: `packages/kiwipress/src/index.ts`
- Core: `packages/kiwipress/src/core/`
- Domain objects: `packages/kiwipress/src/posts/`, `pages/`, `users/`, `categories/`, `tags/`, `comments/`
- In-package smoke: `packages/kiwipress/src/example.ts`
- Design notes (may lag): `packages/kiwipress/ARCHITECTURE.md`
