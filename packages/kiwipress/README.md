# @citrusworx/kiwipress

WordPress client utilities and route helpers for the CitrusWorx ecosystem.

## Install

```bash
npm install @citrusworx/kiwipress
```

## Usage

```ts
import { WPClient, WPCore } from "@citrusworx/kiwipress";
```

The package includes helpers for:

- core WordPress client operations
- create, read, update, and delete flows
- posts, pages, tags, categories, comments, and users

## Configuration

KiwiPress reads configuration from constructor arguments or from `process.env`.

```ts
import { Posts } from "@citrusworx/kiwipress";

const posts = new Posts({
    url: "https://your-wordpress-site.com",
    apiBase: "wp-json/wp/v2",
    username: "admin",
    appPassword: "xxxx xxxx xxxx xxxx xxxx xxxx"
});
```

If you prefer environment variables, load your `.env` file in the consuming app before constructing KiwiPress classes.

## Development

```bash
yarn workspace @citrusworx/kiwipress build
```
