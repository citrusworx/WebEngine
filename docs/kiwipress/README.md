# KiwiPress

`@citrusworx/kiwipress` is an object-oriented WordPress REST API client built on top of [Seltzer](../seltzer/README.md) and [Nectarine](../nectarine/README.md). It provides domain objects for WordPress resources — posts, pages, users, categories, tags, and comments — with a clean API that hides WordPress query implementation details.

## Installation

```bash
yarn add @citrusworx/kiwipress
```

## Configuration

KiwiPress reads configuration from environment variables or a constructor argument.

### Environment variables

Create a `.env` file at `packages/kiwipress/.env`:

```env
WP_URL=https://your-wordpress-site.com
WP_API=wp-json/wp/v2

# Choose one authentication method:
WP_USER=your-username
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx

# — or —
WP_TOKEN=your-bearer-token

# — or —
WP_API_KEY=your-api-key
```

`WP_URL` is required. All other values are optional.

### Constructor config

Config passed to the constructor takes priority over environment variables.

```ts
import { Posts } from "@citrusworx/kiwipress";

const posts = new Posts({
  url: "https://your-wordpress-site.com",
  apiBase: "wp-json/wp/v2",
  username: "admin",
  appPassword: "xxxx xxxx xxxx xxxx xxxx xxxx"
});
```

#### `WPCoreConfig`

| Field | Type | Default | Description |
|---|---|---|---|
| `url` | `string` | — | WordPress site base URL (**required**) |
| `apiBase` | `string` | `"wp-json/v2"` | API path prefix |
| `username` | `string` | — | Username for Basic auth |
| `appPassword` | `string` | — | Application password for Basic auth |
| `token` | `string` | — | Bearer token |
| `apiKey` | `string` | — | Value for `X-API-Key` header |
| `headers` | `Record<string, string>` | — | Additional headers on every request |

## Authentication

Three authentication strategies are supported. KiwiPress picks the first one that is fully configured.

**Basic auth** (username + application password — recommended for self-hosted WordPress):

```ts
new Posts({ url, username: "admin", appPassword: "xxxx xxxx xxxx" });
```

**Bearer token**:

```ts
new Posts({ url, token: "my-bearer-token" });
```

**API key**:

```ts
new Posts({ url, apiKey: "my-api-key" });
```

## Quick start

```ts
import { Posts, Pages, Users } from "@citrusworx/kiwipress";

const posts = new Posts({ url: "https://example.com", apiBase: "wp-json/wp/v2" });

// Read
const all = await posts.getAll();
const post = await posts.getBySlug("hello-world");

// Write
const draft = await posts.create({
  title: "My New Post",
  content: "<p>Hello from KiwiPress.</p>",
  status: "draft"
});

await posts.update(draft.id, { status: "publish" });
await posts.delete(draft.id);
```

## Domain objects

### Posts

```ts
import { Posts } from "@citrusworx/kiwipress";

const posts = new Posts(config);
```

| Method | Description |
|---|---|
| `getAll()` | All published posts |
| `getById(id)` | Single post by ID |
| `getBySlug(slug)` | Single post by slug |
| `getByAuthor(author)` | Posts by author ID or login |
| `getByTag(tag)` | Posts by tag ID |
| `getByCategory(category)` | Posts by category ID |
| `getByDate(date)` | Posts published after an ISO date string |
| `create(data)` | Create a post |
| `update(id, data)` | Update a post |
| `delete(id)` | Delete a post |

### Pages

```ts
import { Pages } from "@citrusworx/kiwipress";

const pages = new Pages(config);
```

| Method | Description |
|---|---|
| `getAll()` | All pages |
| `getById(id)` | Single page by ID |
| `getBySlug(slug)` | Single page by slug |
| `getByAuthor(author)` | Pages by author ID or login |
| `create(data)` | Create a page |
| `update(id, data)` | Update a page |
| `delete(id)` | Delete a page |

### Users

```ts
import { Users } from "@citrusworx/kiwipress";

const users = new Users(config);
```

| Method | Description |
|---|---|
| `getAll()` | All users |
| `getById(id)` | Single user by ID |
| `getByEmail(email)` | Single user by email address |
| `getByCity(city)` | Users in a city |
| `getByCityState(state, city)` | Users in a city and state |
| `create(data)` | Create a user |
| `update(id, data)` | Update a user |
| `delete(id)` | Delete a user |

### Categories

```ts
import { Categories } from "@citrusworx/kiwipress";

const categories = new Categories(config);
```

| Method | Description |
|---|---|
| `getAll()` | All categories |
| `getById(id)` | Single category by ID |
| `getBySlug(slug)` | Single category by slug |

### Tags

```ts
import { Tags } from "@citrusworx/kiwipress";

const tags = new Tags(config);
```

| Method | Description |
|---|---|
| `getAll()` | All tags |
| `getById(id)` | Single tag by ID |
| `getBySlug(slug)` | Single tag by slug |

### Comments

```ts
import { Comments } from "@citrusworx/kiwipress";

const comments = new Comments(config);
```

| Method | Description |
|---|---|
| `getAll()` | All comments |
| `getById(id)` | Single comment by ID |
| `getByPost(postId)` | Comments on a specific post |

## Core classes

The domain objects above are the primary API. The core classes are exported for advanced use cases and extension.

| Class | Description |
|---|---|
| `WPCore` | Base infrastructure: config, auth headers, path interpolation |
| `WPClient` | Adds Seltzer route execution on top of `WPCore` |
| `WPRead` | Adds `read()` on top of `WPClient` — base for all domain objects |
| `WPCreate` | Adds `create()` |
| `WPUpdate` | Adds `update()` |
| `WPDelete` | Adds `delete()` |

Extend `WPRead` (or any of the CRUD classes) to build custom domain objects:

```ts
import { WPRead } from "@citrusworx/kiwipress";

class Media extends WPRead {
  getAll() {
    return this.read({ method: "GET", endpoint: "/media" });
  }
}
```

## Package layout

```
src/
├── index.ts          — public exports
├── core/
│   ├── WPCore.ts     — config and auth
│   ├── WPClient.ts   — Seltzer integration and route execution
│   ├── WPRead.ts     — read operations
│   ├── WPCreate.ts   — create operations
│   ├── WPUpdate.ts   — update operations
│   ├── WPDelete.ts   — delete operations
│   └── route-utils.ts
├── types/
│   └── api.ts
├── posts/
├── pages/
├── users/
├── categories/
├── tags/
└── comments/
```

## Status

KiwiPress is in active early development. The read-side API is stable. Write operations (create, update, delete) are implemented for Posts, Pages, and Users. The following areas are planned but not yet complete:

- `WPAuth` — dedicated sign-in and application password flow
- `WPSync` — import, export, migration, and backup
- Full response normalization

See [ARCHITECTURE.md](../../packages/kiwipress/ARCHITECTURE.md) for design rationale and the planned implementation path.
