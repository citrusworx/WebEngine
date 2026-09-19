# KiwiPress Tutorial — Connect, Transfer, Persist

This tutorial walks through the product path in `@citrusworx/kiwipress` **0.4.3**.

The goal is to show how the library should be composed in real Node code:

- a WordPress domain object **reads**
- `normalizeWordPressItem` shows the destination shape
- `KiwiPress.connect` + `WPSync.transfer` **moves** the collection
- file persistence **survives** restart
- `native.posts.getBySlug` **reads** the Nectarine-shaped record

If you have already read [Getting Started](./kiwipress-getting-started.md), this is the same kind of guided build as the [Seltzer JSON API tutorial](../seltzer/seltzer-api-tutorial.md) — except the artifact is a CMS store, not an HTTP listener.

Every call below exists in `packages/kiwipress/src`. There is no invented media API, no Echo editor, and no WebEngine bootstrap.

## What we are building

A small script that:

1. connects to WordPress (or skips it — Path B at the end)
2. reads posts through `Posts`
3. normalizes one item onto `ContentRecord`
4. transfers the posts collection into `NectarineStore`
5. persists that store to a JSON file
6. reads the native collection after a fresh `connect`

By the end you will have used the public primitives worth teaching: `Posts`, `normalizeWordPressItem`, `KiwiPress.connect`, `ready`, `sync.transfer`, `createFilePersistence`, and `native.posts.getBySlug`.

## Setup

```bash
yarn add @citrusworx/kiwipress
```

A single TypeScript file is enough. In this workspace you can copy into `packages/kiwipress/src/example.ts` and run it with `tsx` / `ts-node` after a build.

You need:

- Node 18+
- either a reachable WordPress REST base **or** willingness to use the nectarine-only appendix
- write credentials only if you create a smoke post (the read/transfer path can use a public site)

```ts
import {
  Posts,
  KiwiPress,
  normalizeWordPressItem,
  createFilePersistence
} from "@citrusworx/kiwipress";
```

## Step 1: Connect a WordPress client

Start with the domain object, not the facade. The facade is for transfer and native collections.

```ts
const posts = new Posts({
  url: "https://example.com",
  apiBase: "wp-json/wp/v2",
  username: process.env.WP_USER,
  appPassword: process.env.WP_APP_PASSWORD
});
```

Why this works:

- `Posts` extends `WPRead` → `WPClient` → `WPCore`
- `url` is required (or `WP_URL` on Node)
- `apiBase` defaults to `wp-json/wp/v2` if omitted
- auth is optional for public reads

`KiwiPress.connect({ url })` will construct the same `Posts` client on `kiwi.wordpress.posts`. Using `new Posts` first keeps the HTTP path visible.

## Step 2: Read posts

```ts
const firstPage = await posts.getAll();
const hello = await posts.getBySlug("hello-world");
```

What you actually get:

- `getAll()` is `GET /wp-json/wp/v2/posts` — WordPress’s default page size
- `getBySlug` is the aliased route: KiwiPress path `/posts/:slug`, WordPress request `/posts?slug=hello-world`
- both return **raw WordPress JSON**. Slug lookups are often an **array**

Do not treat `hello.title` as a string yet. WordPress sends `{ rendered, raw? }`.

To page the whole collection (what transfer does):

```ts
const everything = await posts.listAll("posts", {
  status: "any",
  context: "edit"
});
```

`listAll` walks `X-WP-TotalPages` at `per_page=100`. You need credentials for `status=any` / `context=edit` on most sites.

## Step 3: Normalize one item

Raw JSON is the WordPress client contract. The CMS contract is `ContentRecord`.

```ts
const item = Array.isArray(hello) ? hello[0] : hello;
const record = normalizeWordPressItem("posts", item, "https://example.com");

console.log(record.title);   // string
console.log(record.status);  // "published" if WP said "publish"
console.log(record.slug);
console.log(record.meta.raw); // original payload
```

`publish` → `published`. `title.rendered` / `title.raw` → `title`. Featured media becomes a **string id**, not a file. See [Normalization](./kiwipress-normalize.md).

You do not have to normalize by hand before transfer. `WPSync` does it. This step exists so you see the shape before the store writes it.

## Step 4: Transfer into the facade

```ts
const kiwi = KiwiPress.connect({
  url: "https://example.com",
  apiBase: "wp-json/wp/v2",
  username: process.env.WP_USER,
  appPassword: process.env.WP_APP_PASSWORD,
  persistence: createFilePersistence("./data/kiwipress-cms.json")
});

await kiwi.ready();

const preview = await kiwi.sync?.preview(["posts"]);
console.log(preview?.counts.posts);

const result = await kiwi.sync?.transfer(["posts"]);
console.log(result?.counts);
```

`kiwi.sync` exists only when a WordPress URL was resolved. `transfer()`:

1. hydrates the store if persistence is configured
2. calls `listAll` per collection (not `getAll`)
3. normalizes every item
4. `upsert`s into `NectarineStore` (source becomes `cms: "nectarine"`)
5. `flush()`es the snapshot
6. returns `{ mode: "nectarine", counts, records }`

`preview` counts without writing. It still hits WordPress.

Default collections if you omit the array: posts, pages, users, categories, tags, comments.

## Step 5: Persist and read native

The `persistence` argument in Step 4 already attached a file adapter. `transfer()` flushed. A second process can hydrate:

```ts
const again = KiwiPress.connect({
  mode: "nectarine",
  persistence: createFilePersistence("./data/kiwipress-cms.json")
});

await again.ready();
const nativeHello = await again.native.posts.getBySlug("hello-world");

console.log(nativeHello?.title);
console.log(nativeHello?.status); // "published"
```

Native `getBySlug` returns `ContentRecord | undefined`, not a WordPress array.

`kiwi.promote()` flips `mode` to `"nectarine"` **in place** (the gateway then serves native collections). `kiwi.toNectarine()` returns a **new** instance sharing the same store. Either is valid after transfer. The tutorial uses a fresh `connect({ mode: "nectarine" })` so you see persistence, not just a mode flag.

File format:

```json
{
  "version": 1,
  "collections": {
    "posts": [ /* ContentRecord */ ],
    "pages": [],
    "users": [],
    "categories": [],
    "tags": [],
    "comments": []
  }
}
```

Omit `persistence` and the store dies with the process. That is still the library default.

## Step 6: Write on the native side

```ts
const created = await again.native.posts.create({
  title: "After transfer",
  content: "<p>Owned by KiwiPress now.</p>",
  status: "published"
});

await again.native.posts.update(created.id, { title: "After transfer (edited)" });
```

Native `create` / `update` persist a **subset**: `title`, `content`, `slug`, `status`, and on create `authorId` / `featuredImage` only when those values are already strings. Extra WordPress keys are not copied into `meta`. Do not pass `{ title: { rendered: "…" } }` here — that becomes the fallback title `"Untitled"`.

## Path B — no WordPress

If you do not have a REST install, skip Steps 1–4:

```ts
const kiwi = KiwiPress.connect({
  mode: "nectarine",
  persistence: createFilePersistence("./data/kiwipress-cms.json")
});

await kiwi.ready();
await kiwi.native.posts.create({
  title: "Hello",
  content: "<p>Greenfield.</p>",
  status: "published",
  slug: "hello"
});

const hello = await kiwi.native.posts.getBySlug("hello");
```

That is the same collection API transfer fills. `kiwi.wordpress` and `kiwi.sync` throw / are undefined without a URL.

## What this tutorial did not do

- start `apps/kiwipress` (optional; [Dashboard](./kiwipress-dashboard.md))
- register `registerKiwiPressGateway` (optional; [Gateway](./kiwipress-gateway.md))
- open Postgres (`createPostgresPersistence`; [Native CMS](./kiwipress-native-cms.md))
- write comments or taxonomies back to WordPress (not shipped)
- download media binaries (ids only)
- call WebEngine

## Where to go next

- [Domain objects](./kiwipress-domain.md) — every public method
- [Transfer](./kiwipress-transfer.md) — paging, status queries, what is not moved
- [Native CMS](./kiwipress-native-cms.md) — store, file, Postgres, env
- [Patterns](./kiwipress-patterns.md)
- [Status](./kiwipress-status.md)
