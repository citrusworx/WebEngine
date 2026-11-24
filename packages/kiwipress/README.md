# @citrusworx/kiwipress

KiwiPress is a standalone WordPress REST client and Nectarine-shaped CMS. Use it in any Node project. WebEngine can orchestrate it later; it is not required to import, run, or persist KiwiPress.

```ts
import { KiwiPress, Posts, createFilePersistence } from "@citrusworx/kiwipress";

const posts = new Posts({
    url: "https://your-wordpress-site.com",
    apiBase: "wp-json/wp/v2",
    username: "admin",
    appPassword: "xxxx xxxx xxxx xxxx xxxx xxxx"
});

const kiwi = KiwiPress.connect({
    url: "https://your-wordpress-site.com",
    username: "admin",
    appPassword: "xxxx xxxx xxxx xxxx xxxx xxxx",
    persistence: createFilePersistence("./data/kiwipress-cms.json")
});

await kiwi.ready();
await kiwi.sync?.transfer();
const native = kiwi.toNectarine();
await native.native.posts.getAll();
```

Greenfield, no WordPress:

```ts
const kiwi = KiwiPress.connect({
    mode: "nectarine",
    persistence: createFilePersistence("./data/kiwipress-cms.json")
});
await kiwi.native.posts.create({ title: "Hello", status: "published" });
```

Native `create` reads `id` (string or number), `title`, `content`, `slug`, `status`, `authorId`, and `featuredImage` (strings), and `meta` (object). `update` reads `title`, `content`, `slug`, and `status` and shallow-merges `meta`. Native writes ignore other payload keys. On create, a missing or non-string title becomes `"Untitled"`. For WordPress REST data, use `WPSync.transfer()` or normalize the record with `normalizeWordPressItem` before calling `store.upsert()`.

KiwiPress reads configuration from constructor arguments or from `process.env` (`WP_URL`, `WP_API`, `WP_USER`, `WP_APP_PASSWORD`, `WP_TOKEN`, `WP_API_KEY`). Native CMS persistence is opt-in via `persistence` (`KIWIPRESS_CMS_FILE` for JSON, `PG_DB` / `KIWIPRESS_PG_DB` for Nectarine Postgres). Default is in-memory.

Dependencies are `@citrusworx/nectarine` and `@citrusworx/seltzer` only. This package does not import `@citrusworx/webengine` or `@citrusworx/types`.

For `createPostgresPersistence({ database })`, install Nectarine's optional driver in your project with `npm install pg@8`. Set `PG_USER`, `PG_PASS` (or `PG_PASSWORD`), and `PG_HOST`. `PG_PORT` defaults to `5432`. In-memory and file persistence work without the driver.

## Content integrity

- `WPSync.transfer()` reads WordPress and writes normalized records to the KiwiPress store. An import replaces an existing record with the same collection and ID, including native edits to that record. If a later collection fails to load, earlier changes stay in memory and the transfer skips its final save. A subsequent save can persist those changes.
- Native mutations update the in-memory store before saving. If persistence fails, the call rejects and the change stays in memory. Inspect the store before retrying a write, and use `kiwi.persist()` to retry saving the current snapshot.
- File persistence replaces one JSON snapshot by renaming a temporary file. Use one writer per file. Power-loss durability requires additional measures.
- The unreleased default PostgreSQL adapter replaces the snapshot inside one transaction. Version 0.5.0 and custom executors that supply only `query` still save with separate delete and insert statements. A failed save in either of those cases can leave an empty or partial table.

## Raw vs rendered WordPress fields

`Posts.getAll()` stays view-context. WordPress only includes `title.raw` / `content.raw` when you ask for **edit context on an authenticated request**. `WPSync.transfer()` already does that for posts, pages, comments, users, media, and CPTs.

```ts
import {
    Posts,
    extractTextParts,
    normalizeWordPressItem,
    withEditContext
} from "@citrusworx/kiwipress";

const posts = new Posts({ url, username, appPassword });

// Explicit — does not change getAll() defaults
const editable = await posts.listAll("posts", withEditContext({ status: "any" }));
const record = normalizeWordPressItem("posts", editable[0]);

record.title;                 // best available (raw, then rendered)
record.meta.titleRaw;         // Gutenberg / unfiltered source
record.meta.titleRendered;    // HTML WordPress would display
record.meta.contentRaw;
record.meta.contentRendered;
record.meta.excerptRaw;       // only when WordPress sent excerpt
record.meta.wpMeta;           // WP REST `meta` object, when present
record.meta.acf;              // passed through when the `acf` key exists
record.meta.raw;              // original item

extractTextParts({ raw: "<!-- wp:p -->", rendered: "<p></p>" });
// { raw, rendered, text: raw }
```

Featured images: `_embed` `source_url` wins, then the previous normalize fallbacks. Optionally `resolveFeaturedImageUrl(media, id)` calls `Media.getById`.

## WordPress REST search

`kiwi.wordpress.search` is a read-only client for core `/wp/v2/search`. Hits are `SearchHit`s, not full posts and not `ContentRecord`s.

```ts
const hits = await kiwi.wordpress.search.query("kiwi", { type: "post", per_page: 10 });
// hits[0].id, .title, .url, .type, .subtype
```

Options map onto the WordPress REST args: `type` (`post` | `term` | `post-format`), `subtype`, `page`, `per_page`, `exclude`, `include`. This is not Elasticsearch, a search plugin, or native Nectarine store search.

## Bridge plugin

`kiwi.bridge` talks to the KiwiPress Bridge plugin (`kiwipress/v1`). It does not move posts. Content stays on `/wp/v2` with the same application password.

```ts
const health = await kiwi.bridge.health(); // no Authorization header

await kiwi.bridge.verifyCredentials(); // public health, then GET /wp/v2/users/me?context=edit (manage_options)

await kiwi.bridge.saveSettings({
    frontend_url: "https://app.example.com",
    paired: true,
    project_label: "acme"
});

const settings = await kiwi.bridge.getSettings();

const link = await kiwi.bridge.createPreviewLink({ postId: 42, source: "auto" });
const draft = await kiwi.bridge.preview(link.token); // no Authorization header
```

`health().features` is `[]` when an older plugin omits the field. 0.2.0 reports `["preview"]`. `preview_path` is part of settings (default `/preview` on the plugin).

`preview()` is unauthenticated even when `WP_USER` / `WP_APP_PASSWORD` or constructor credentials are set. WordPress rejects the public preview route if a bad `Authorization` header is present. `createPreviewLink()` is authenticated and requires `edit_post`.

`previewTokenFromUrl()` and `decodePreviewTokenUnverified()` only find the `kiwipress_preview` query parameter and decode the payload for routing. They do not check the HMAC. Call `preview()` before trusting the claims.

Failures are a `BridgeError` with `code`. Preview codes are chosen from the plugin error code before the HTTP status, so a 401 expired token is not `bad_credentials` and a 404 missing post is not `plugin_missing`.

| Code | When |
| --- | --- |
| `bad_credentials` | WordPress returns 401 for the application password. |
| `insufficient_role` | The user is signed in but `capabilities.manage_options` is not true. |
| `plugin_missing` | `kiwipress/v1` returns 404 and the body is not a preview error. |
| `site_unreachable` | DNS, connection, or timeout. |
| `request_failed` | Any other unexpected WordPress response. |
| `preview_missing` | The preview token header was empty. |
| `preview_invalid` | The token signature or payload is not valid. |
| `preview_expired` | The token is past its expiry, including the plugin's skew. |
| `preview_forbidden` | The embedded user can no longer edit the post. |
| `preview_disabled` | Draft preview is off because the site is not paired. |
| `preview_not_found` | The post is missing, trashed, or not in the REST API. |

The KiwiPress app encrypts the application password before it stores it. This package does not.

## Development

```bash
yarn workspace @citrusworx/kiwipress build
yarn workspace @citrusworx/kiwipress test
```
