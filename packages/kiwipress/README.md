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

## Development

```bash
yarn workspace @citrusworx/kiwipress build
yarn workspace @citrusworx/kiwipress test
```
