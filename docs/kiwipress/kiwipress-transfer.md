# Transferring WordPress into Nectarine

KiwiPress is a standalone on-ramp: moving WordPress content onto a Nectarine-shaped CMS **this library owns**. WebEngine is not required to run that CMS.

WordPress stays available as a headless source until you call `transfer()`. After that, `KiwiPress` can read from `NectarineStore` instead of `wp-json`. Persist the store if you want it to survive restart.

## Why transfer

WordPress is excellent at what editors already know. It is a weak long-term content model for an application CMS:

- titles and bodies are `{ rendered, raw }` objects, not strings
- status uses `publish` instead of `published`
- related data is query-string flavored (`?slug=`, `?author=`)
- custom structure lives in plugins and meta, not in a schema file you own

Nectarine models under `libraries/nectarine/models/blog/` are the destination shape: `title`, `content`, `slug`, `status: draft | published | archived`, `author_id`, timestamps.

KiwiPress sits in the middle so you do not rewrite the editorial team on day one. You can keep using KiwiPress in a project that never loads WebEngine.

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
import { KiwiPress, createFilePersistence } from "@citrusworx/kiwipress";

const kiwi = KiwiPress.connect({
  url: "https://example.com",
  username: "admin",
  appPassword: "xxxx xxxx xxxx xxxx xxxx xxxx",
  persistence: createFilePersistence("./data/kiwipress-cms.json")
});

await kiwi.ready();
const preview = await kiwi.sync?.preview(["posts", "pages"]);
const result = await kiwi.sync?.transfer(["posts", "pages", "users", "categories", "tags", "comments"]);

kiwi.promote(); // in-place: gateway now serves native collections
const native = kiwi.toNectarine(); // new instance in nectarine mode

await native.native.posts.getBySlug("hello-world");
```

`transfer()`:

1. pages every WordPress collection (`per_page=100`, `X-WP-TotalPages`) with `status=any` and `context=edit` where WordPress supports it
2. normalizes every item onto `ContentRecord`
3. upserts into the shared `NectarineStore`
4. `flush()`es if `persistence` is configured
5. returns counts plus the records

`Posts.getAll()` still returns WordPress’s default first page. Transfer does not use that method — it uses `listAll()`, so drafts, private posts, and sites with more than ten items are included.

## Persistence

Without `persistence`, the store is **in memory**. That is still the library default so KiwiPress stays a cheap import.

Opt in with the `CmsPersistence` interface (`load` / `save`):

| Helper | Backend | Extra runtime |
|---|---|---|
| `createFilePersistence(path)` | JSON file via Node `fs` | none |
| `createPostgresPersistence({ database })` | Table `kiwipress_content` through Nectarine `PgSql` | `pg` (Nectarine's adapter imports it) |
| `createPostgresPersistence({ executor })` | Same SQL, your client | tests / custom hosts |
| `persistenceFromEnv()` | `KIWIPRESS_CMS_FILE`, else `KIWIPRESS_PG_DB` / `PG_DB` | — |

`await kiwi.ready()` hydrates once. Native create/update/delete and `WPSync.transfer()` flush after they mutate. Nectarine `PgSql.query` swallows errors; KiwiPress throws if a query returns `undefined`. Snapshot save is delete-then-insert because `PgSql` has no transactions.

The `apps/kiwipress` gateway defaults to `./data/kiwipress-cms.json` so the product app survives restart. The published library does not create that file unless you pass persistence.

MySQL and Mongo adapters can wait. Do not pull WebEngine in to get a database.

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
| GET | `/__kiwipress/health` | process check (`{ ok: true }`, unauthenticated) |
| GET | `/__kiwipress/cms` | mode, persistence kind, native counts |
| POST | `/__kiwipress/cms` | `{ mode: "wordpress" \| "nectarine" }` |
| POST | `/__kiwipress/transfer` | run `WPSync.transfer` and `promote()` |
| GET/POST/PATCH/DELETE | `/__kiwipress/content/posts` | WordPress or native; item id in `?id=` for PATCH/DELETE |
| GET/POST/PATCH/DELETE | `/__kiwipress/content/pages` | same |

Seltzer `listen(port)` binds every interface. Content, transfer, and CMS routes are **not** public:

- set `KIWIPRESS_GATEWAY_TOKEN` and send `Authorization: Bearer …` or `X-KiwiPress-Token`
- local Vite proxy is loopback, so those routes also accept 127.0.0.1 / ::1 without a token
- non-loopback callers without a token get `401`

The frontend sends `VITE_KIWIPRESS_GATEWAY_TOKEN` when that env is set.

The Vite app proxies `/__kiwipress` to port 8787. Set `WP_URL` on the backend to enable the WordPress entry. Without it, the gateway starts in `nectarine` mode only. Persistence defaults to a JSON file under `data/`; set `KIWIPRESS_CMS_FILE` or `PG_DB` to override.

Dashboard **Content** is the UI for this: transfer panel plus the posts/pages manager.

## What is not transferred yet

- media files and featured-image binaries (ids are stored, blobs are not)
- plugin-owned types (WooCommerce, ACF field groups as first-class models)
- comments/users write-back to WordPress after promote
- MySQL / Mongo persistence (file and Postgres are the ship set)

Those belong on top of this contract, not instead of it.
