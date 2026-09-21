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

KiwiPress reads configuration from constructor arguments or from `process.env` (`WP_URL`, `WP_API`, `WP_USER`, `WP_APP_PASSWORD`, `WP_TOKEN`, `WP_API_KEY`). Native CMS persistence is opt-in via `persistence` (`KIWIPRESS_CMS_FILE` for JSON, `PG_DB` / `KIWIPRESS_PG_DB` for Nectarine Postgres). Default is in-memory.

Dependencies are `@citrusworx/nectarine` and `@citrusworx/seltzer` only. This package does not import `@citrusworx/webengine` or `@citrusworx/types`.

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

## Development

```bash
yarn workspace @citrusworx/kiwipress build
yarn workspace @citrusworx/kiwipress test
```
