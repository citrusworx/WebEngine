# Transferring WordPress into Nectarine

KiwiPress is a standalone on-ramp: moving WordPress content onto a Nectarine-shaped CMS **this library owns**. WebEngine is not required.

WordPress stays available as a headless source until you call `transfer()`. After that, `KiwiPress` can read from `NectarineStore` instead of `wp-json`. Persist the store if you want it to survive restart.

Related: [Tutorial](./kiwipress-tutorial.md), [Normalization](./kiwipress-normalize.md), [Native CMS](./kiwipress-native-cms.md).

## Why transfer

WordPress is excellent at what editors already know. It is a weak long-term content model for an application CMS:

- titles and bodies are `{ rendered, raw }` objects, not strings
- status uses `publish` instead of `published`
- related data is query-string flavored (`?slug=`, `?author=`)
- custom structure lives in plugins and meta, not in a schema file you own

Nectarine models under `libraries/nectarine/models/blog/` are the destination vocabulary: `title`, `content`, `slug`, `status: draft | published | archived`, `author_id`, timestamps.

KiwiPress sits in the middle so you do not rewrite the editorial team on day one. You can keep using KiwiPress in a project that never loads WebEngine.

## Normalize first

Raw WordPress JSON is still what `Posts.getAll()` returns. That is intentional — existing clients keep working.

When you want the destination shape without transferring:

```ts
import { normalizeWordPressItem, toNectarinePost } from "@citrusworx/kiwipress";

const record = normalizeWordPressItem("posts", wpPost, "https://example.com");
const nectarinePost = toNectarinePost(record);
```

`publish` becomes `published`. `title.rendered` becomes `title`. The original payload is kept on `record.meta.raw`.

## Transfer

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
const result = await kiwi.sync?.transfer([
  "posts",
  "pages",
  "users",
  "categories",
  "tags",
  "comments"
]);

kiwi.promote(); // in-place: kiwi.mode === "nectarine"
const native = kiwi.toNectarine(); // new instance, shared store

await native.native.posts.getBySlug("hello-world");
```

`kiwi.sync` is `undefined` without a WordPress URL. Optional chaining is the public pattern.

### What `transfer()` does

1. `store.hydrate()` if persistence is attached
2. for each collection, `wordpress.posts.listAll(collection, query)` — yes, `listAll` lives on `WPClient`; any domain instance can call it
3. `normalizeWordPressCollection`
4. `store.upsert` each record (source becomes `nectarine`)
5. `store.flush()`
6. return `{ mode: "nectarine", counts, records }`

`preview()` runs the same reads and returns `{ collections, counts }` without upsert or flush.

Default collections if you omit the argument: all six.

### Paging and query flags

`listAll` walks pages with `per_page=100` and `X-WP-TotalPages` (capped at 1000 pages). Extra query per collection:

| Collection | Query |
|---|---|
| posts, pages | `status=any`, `context=edit` |
| comments | `status=any`, `context=edit` |
| users | `context=edit` |
| categories, tags | `hide_empty=false` |

`Posts.getAll()` still returns WordPress’s default first page. Transfer does not use that method, so drafts, private posts, and sites with more than ten items are included — **if** the credentials allow `context=edit`.

A failed collection throws `WPSync failed to read WordPress <collection>: …` and stops. There is no partial-commit flag. Persistence flush happens only after every requested collection succeeds.

### After upsert

`NectarineStore.upsert` overwrites by `id` in that collection. Re-running transfer replaces records with the same WordPress id. It does not delete native-only records whose ids were never on WordPress.

`promote()` does not call transfer. It only sets `mode`. The gateway uses `mode` to decide WordPress vs native on `/__kiwipress/content/*`.

## Persistence during transfer

Without `persistence`, the store is **in memory**. That is still the library default.

`transfer()` always calls `flush()`. With no adapter, `flush` is a no-op. With a file or Postgres adapter, the snapshot is saved. Details: [Native CMS](./kiwipress-native-cms.md).

The `apps/kiwipress` gateway defaults to `./data/kiwipress-cms.json` so the product app survives restart. The published library does not create that file unless you pass persistence.

## Native CMS without WordPress

Greenfield projects can skip WordPress:

```ts
const kiwi = KiwiPress.connect({
  mode: "nectarine",
  persistence: createFilePersistence("./data/kiwipress-cms.json")
});
await kiwi.native.posts.create({
  title: "Written in Nectarine",
  content: "<p>No WordPress in this path.</p>",
  status: "published"
});
```

That is the same collection API transfer fills.

## What is not transferred yet

- media files and featured-image binaries (ids are stored, blobs are not)
- plugin-owned types (WooCommerce, ACF field groups as first-class models)
- comments/users write-back to WordPress after promote
- MySQL / Mongo persistence (file and Postgres are the ship set)
- gateway routes for users / taxonomies / comments (only posts and pages are exposed inbound)

Those belong on top of this contract, not instead of it.

## Stale claim, corrected

Older transfer docs said Seltzer still matches exact pathnames and therefore the gateway must use `?id=`. **Seltzer 0.8.1 matches `:param`.** The inbound KiwiPress gateway still uses `?id=` because `registerKiwiPressGateway` was written that way (and still uses a pre-`ResponseData` handler shape). See [Gateway](./kiwipress-gateway.md).
