# Transferring WordPress into Nectarine

KiwiPress is the on-ramp. This page is the off-ramp: moving WordPress content onto the CMS WebEngine actually wants to run.

WordPress stays available as a headless source until you call `transfer()`. After that, `KiwiPress` can read from `NectarineStore` instead of `wp-json`.

## Why transfer

WordPress is excellent at what editors already know. It is a weak long-term content model for WebEngine:

- titles and bodies are `{ rendered, raw }` objects, not strings
- status uses `publish` instead of `published`
- related data is query-string flavored (`?slug=`, `?author=`)
- custom structure lives in plugins and meta, not in a schema file you own

Nectarine models under `libraries/nectarine/models/blog/` are the destination shape: `title`, `content`, `slug`, `status: draft | published | archived`, `author_id`, timestamps.

KiwiPress sits in the middle so you do not rewrite the editorial team on day one.

## Normalize first

Raw WordPress JSON is still what `Posts.getAll()` returns. That is intentional — existing clients keep working.

When you want the destination shape:

```ts
import { normalizeWordPressItem, toNectarinePost } from "@citrusworx/kiwipress";

const record = normalizeWordPressItem("posts", wpPost, "https://example.com");
const nectarinePost = toNectarinePost(record);
```

`publish` becomes `published`. `title.rendered` becomes `title`. The original payload is kept on `record.meta.raw`.

## Transfer

```ts
import { KiwiPress } from "@citrusworx/kiwipress";

const kiwi = KiwiPress.connect({
  url: "https://example.com",
  username: "admin",
  appPassword: "xxxx xxxx xxxx xxxx xxxx xxxx"
});

const preview = await kiwi.sync?.preview(["posts", "pages"]);
const result = await kiwi.sync?.transfer(["posts", "pages", "users", "categories", "tags", "comments"]);

kiwi.promote(); // in-place: gateway now serves native collections
const native = kiwi.toNectarine(); // new instance in nectarine mode

await native.native.posts.getBySlug("hello-world");
```

`transfer()`:

1. reads each WordPress collection through the existing domain objects
2. normalizes every item onto `ContentRecord`
3. upserts into the shared `NectarineStore`
4. returns counts plus the records

The store is **in memory** in this release. Postgres / MySQL / Mongo persistence through Nectarine adapters is the next layer, not a hidden one.

## Native CMS without WordPress

Greenfield projects can skip WordPress:

```ts
const kiwi = KiwiPress.connect({ mode: "nectarine" });
await kiwi.native.posts.create({
  title: "Written in Nectarine",
  content: "<p>No WordPress in this path.</p>",
  status: "published"
});
```

That is the same collection API transfer fills.

## Nectarine API YAML

`loadNectarineApi` walks the nested documents Nectarine actually ships (`user.get.allUsers.api`) and flattened `{ get: { allUsers: { api }}}` files:

```ts
import { loadNectarineApi, loadNectarineApiFile } from "@citrusworx/kiwipress";

const routes = loadNectarineApiFile("libraries/nectarine/models/user/userAPI.yml");
// [{ resource: "user", operation: "get", name: "allUsers", method: "GET", endpoint: "/users" }, ...]
```

Copy `method` + `endpoint` onto Seltzer routes. Seltzer still matches exact pathnames — `/users/:id` is a literal string until Seltzer grows a param matcher. The inbound KiwiPress gateway therefore uses `?id=` for item updates, same as the Seltzer tutorial.

`parser.yaml` in Nectarine `console.log`s the document. Prefer `loadNectarineApi(object)` in tests.

## App gateway

`apps/kiwipress/back` is a Seltzer process that calls `registerKiwiPressGateway`. Exact paths:

| Method | Path | Role |
|---|---|---|
| GET | `/__kiwipress/health` | process check |
| GET | `/__kiwipress/cms` | mode + native counts |
| POST | `/__kiwipress/cms` | `{ mode: "wordpress" \| "nectarine" }` |
| POST | `/__kiwipress/transfer` | run `WPSync.transfer` and `promote()` |
| GET/POST/PATCH/DELETE | `/__kiwipress/content/posts` | WordPress or native; item id in `?id=` for PATCH/DELETE |
| GET/POST/PATCH/DELETE | `/__kiwipress/content/pages` | same |

The Vite app proxies `/__kiwipress` to port 8787. Set `WP_URL` on the backend to enable the WordPress entry. Without it, the gateway starts in `nectarine` mode only.

Dashboard **Content** is the UI for this: transfer panel plus the posts/pages manager.

## What is not transferred yet

- media files and featured-image binaries (ids are stored, blobs are not)
- plugin-owned types (WooCommerce, ACF field groups as first-class models)
- comments/users write-back to WordPress after promote
- durable database storage for `NectarineStore`

Those belong on top of this contract, not instead of it.
