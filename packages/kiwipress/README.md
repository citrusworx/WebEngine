# @citrusworx/kiwipress

WordPress is the entry point. Nectarine is the CMS you transfer into. WebEngine is where that CMS runs.

```ts
import { KiwiPress, Posts } from "@citrusworx/kiwipress";

const posts = new Posts({
    url: "https://your-wordpress-site.com",
    apiBase: "wp-json/wp/v2",
    username: "admin",
    appPassword: "xxxx xxxx xxxx xxxx xxxx xxxx"
});

const kiwi = KiwiPress.connect({
    url: "https://your-wordpress-site.com",
    username: "admin",
    appPassword: "xxxx xxxx xxxx xxxx xxxx xxxx"
});

await kiwi.sync?.transfer();
const native = kiwi.toNectarine();
await native.native.posts.getAll();
```

KiwiPress reads configuration from constructor arguments or from `process.env` (`WP_URL`, `WP_API`, `WP_USER`, `WP_APP_PASSWORD`, `WP_TOKEN`, `WP_API_KEY`).

## Development

```bash
yarn workspace @citrusworx/kiwipress build
yarn workspace @citrusworx/kiwipress test
```
