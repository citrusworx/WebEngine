# WordPress Domain Objects

KiwiPress hides WordPress collection URLs behind six classes. Three have writes. Three are read-only on WordPress and become writable only after transfer, on the native side.

Source: `packages/kiwipress/src/posts`, `pages`, `users`, `categories`, `tags`, `comments`.

Related: [Auth](./kiwipress-auth.md), [Normalization](./kiwipress-normalize.md), [Core classes](./core-classes.md).

## CRUD axes

| Class | WordPress reads | WordPress writes | Native collection after transfer |
|---|---|---|---|
| `Posts` | getAll, getById, getBySlug, getByAuthor, getByTag, getByCategory, getByDate | create, update, delete | `kiwi.native.posts` |
| `Pages` | getAll, getById, getBySlug, getByAuthor, getByTag, getByCategory | create, update, delete | `kiwi.native.pages` |
| `Users` | getAll, getById, getByEmail, getByCity, getByCityState | create, update, delete | `kiwi.native.users` |
| `Categories` | getAll, getById, getBySlug | — | `kiwi.native.categories` |
| `Tags` | getAll, getById, getBySlug | — | `kiwi.native.tags` |
| `Comments` | getAll, getById, getByPost | — | `kiwi.native.comments` |

Every WordPress class extends `WPRead`. Writes go through a private `WPCreate` / `WPUpdate` / `WPDelete` collaborator constructed with the same config. There is no `Media` class and no custom post type class.

All six inherit `listAll(collection, query)` from `WPClient`. Transfer uses that, not `getAll()`.

## Shared return contract

WordPress methods return **parsed JSON** from `requestWordPress`. That is whatever WordPress sent:

- `getById` is usually one object
- `getAll` / aliased filters are usually an array
- `getBySlug` is usually an **array** (WordPress collection + `?slug=`)

Native methods return `ContentRecord` or `ContentRecord[]` or `undefined`. Do not mix the two shapes in one UI helper without a branch.

Failed HTTP throws `Error` with `WordPress request failed: <status> <statusText>`. There is no `HttpError` wrapper on this path — that type belongs to Seltzer `client`.

## Posts

```ts
import { Posts } from "@citrusworx/kiwipress";

const posts = new Posts({ url: "https://example.com" });
```

| Method | KiwiPress path | WordPress request |
|---|---|---|
| `getAll()` | `GET /posts` | `GET /posts` |
| `getById(id)` | `GET /posts/:id` | `GET /posts/:id` |
| `getBySlug(slug)` | `GET /posts/:slug` | `GET /posts?slug=` |
| `getByAuthor(author)` | `GET /posts/:author` | `GET /posts?author=` |
| `getByTag(tag)` | `GET /posts/:tag` | `GET /posts?tags=` |
| `getByCategory(category)` | `GET /posts/:category` | `GET /posts?categories=` |
| `getByDate(date)` | `GET /posts/:date` | `GET /posts?after=` |
| `create(data)` | `POST /posts` | `POST /posts` |
| `update(id, data)` | `PUT /posts/:id` | `PUT /posts/:id` |
| `delete(id)` | `DELETE /posts/:id` | `DELETE /posts/:id` |

`getByDate` is `after=`, not a calendar-day filter. Pass an ISO timestamp.

Create / update bodies are `WordPressPayload`. Typical fields WordPress accepts: `title`, `content`, `excerpt`, `status`, `slug`, `author`, `categories`, `tags`, `featured_media`. KiwiPress does not validate them.

WordPress write status is `publish` / `draft` / `pending` / `private` / … — not the native `published` enum. After transfer, native status is mapped (see [Normalization](./kiwipress-normalize.md)).

## Pages

Same write collaborators as posts. Reads:

| Method | WordPress query rewrite |
|---|---|
| `getBySlug(slug)` | `?slug=` |
| `getByAuthor(author)` | `?author=` |
| `getByTag(tag)` | `?tags=` |
| `getByCategory(category)` | `?categories=` |

There is no `getByDate` on `Pages`. Tag and category aliases use the same query keys posts use (`tags`, `categories`).

## Users

| Method | WordPress request |
|---|---|
| `getAll()` | `GET /users` |
| `getById(id)` | `GET /users/:id` |
| `getByEmail(email)` | `GET /users?email=` |
| `getByCity(city)` | `GET /users?city=` |
| `getByCityState(state, city)` | `GET /users?state=&city=` |
| `create` / `update` / `delete` | standard REST on `/users` |

`getByCity` and `getByCityState` are real KiwiPress aliases: they send those query keys. They do **not** add `search=` or `meta_query`. Whether a given WordPress install honors `city` / `state` is a WordPress (or plugin) question. Core `wp/v2/users` does not document those parameters. Treat them as “we will request this,” not “WordPress will filter this.”

User create usually needs an administrator application password. Public sites hide emails unless `context=edit`.

## Categories, Tags, Comments

Read-only WordPress classes.

```ts
await categories.getBySlug("news");
await tags.getById(9);
await comments.getByPost(12); // GET /comments?post=
```

No `create` / `update` / `delete` on these classes. After `WPSync.transfer()`, `kiwi.native.categories` (and tags, comments) are full `NativeCollection`s — that is a different API.

## `KiwiPress.wordpress`

When `KiwiPress.connect` sees a URL, it constructs all six clients once:

```ts
kiwi.wordpress.posts;
kiwi.wordpress.pages;
kiwi.wordpress.users;
kiwi.wordpress.categories;
kiwi.wordpress.tags;
kiwi.wordpress.comments;
```

Accessing `kiwi.wordpress` without a URL throws: `KiwiPress WordPress clients require config.url or process.env.WP_URL.`

## Custom collections

There is no plugin registry. Extend `WPRead` and build routes with `createWordPressRoute` / `createAliasedQueryRoute` as in [Getting started](./kiwipress-getting-started.md). Media, WooCommerce products, and ACF field groups are not shipped.

## Pitfalls

- Passing a native `ContentRecord` into `posts.update` without flattening `title` / `content` back to WordPress strings / rendered objects
- Assuming `getAll()` transferred the site
- Assuming `getBySlug` is one object
- Calling `categories.create` — it does not exist
