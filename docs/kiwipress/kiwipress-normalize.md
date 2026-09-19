# Normalization and ContentRecord

WordPress JSON is not the native CMS. `normalizeWordPressItem` is the map.

Source: `packages/kiwipress/src/core/normalize.ts`, `packages/kiwipress/src/cms/types.ts`.

Related: [Transfer](./kiwipress-transfer.md), [Native CMS](./kiwipress-native-cms.md).

## Why a second shape

A typical post from `GET /wp-json/wp/v2/posts/12`:

```json
{
  "id": 12,
  "slug": "hello-world",
  "status": "publish",
  "title": { "rendered": "Hello World" },
  "content": { "rendered": "<p>Body</p>" },
  "author": 3,
  "featured_media": 44
}
```

Nectarine blog models (and `NativeCollection`) want strings and a smaller status enum. KiwiPress does not change what `Posts.getAll()` returns. Normalization is opt-in, or automatic inside `WPSync.transfer()`.

## `ContentRecord`

```ts
type CmsCollection =
  | "posts"
  | "pages"
  | "users"
  | "categories"
  | "tags"
  | "comments";

type ContentStatus =
  | "draft"
  | "published"
  | "archived"
  | "pending"
  | "approved"
  | "spam";

type ContentRecord = {
  id: string;
  collection: CmsCollection;
  title: string;
  content: string;
  slug: string;
  status: ContentStatus;
  authorId?: string;
  featuredImage?: string;
  createdAt?: string;
  updatedAt?: string;
  source: { cms: "wordpress" | "nectarine"; id: string; url?: string };
  meta: Record<string, unknown>;
};
```

`NectarineStore.upsert` then sets `source.cms` to `"nectarine"`. The original WordPress id stays on `source.id` when it was present.

## `normalizeWordPressItem(collection, value, sourceUrl?)`

| WordPress field | Record field | Rule |
|---|---|---|
| `id` or `ID` | `id` | stringified number or non-empty string; else `${collection}:${title}` |
| `title` / `name` / `slug` | `title` | `extractTextValue`; fallback `Untitled post` (singularized from collection) |
| `content` / `description` / `excerpt` | `content` | first non-empty text |
| `slug` | `slug` | string or `""` |
| `status` | `status` | see map below |
| `author` or `author_id` | `authorId` | stringified |
| `featured_image` (string) or `featured_media` (number) | `featuredImage` | string id, not a blob |
| `date` or `date_gmt` | `createdAt` | |
| `modified` | `updatedAt` | |
| — | `source` | `{ cms: "wordpress", id, url: sourceUrl }` |
| `email`, `name`, `count`, `parent`, `post`, plus full item | `meta` | `meta.raw` is the original object |

Non-objects become `{}` then an untitled record. `normalizeWordPressCollection` wraps `asCollection`: arrays stay arrays; `null`/`undefined` → `[]`; a single object → one-element array.

### `extractTextValue`

1. string → as-is
2. object with string `raw` → `raw` (preferred over rendered)
3. object with string `rendered` → `rendered`
4. else `""`

### Status map

| Incoming (lowercased) | `ContentStatus` |
|---|---|
| `publish`, `published` | `published` |
| `pending` | `pending` |
| `approved` | `approved` |
| `spam` | `spam` |
| `private`, `future`, `trash`, `archived` | `archived` |
| anything else, including `draft` and missing | `draft` |

Comments use `pending` / `approved` / `spam`. Posts use `published` / `draft` / `archived`.

## `toNectarinePost(record)`

Maps onto the Nectarine `Post` field names (`author_id`, `featured_image`, `created_at`). Status collapses to `draft | published | archived`: `pending` / `approved` / `spam` become `draft`.

This helper does **not** write the store. Transfer upserts `ContentRecord`s, not `NectarinePost`s.

## What is not normalized

- rendered HTML is not stripped to plaintext
- Gutenberg blocks stay HTML strings
- featured **files** are not downloaded
- ACF / Yoast / Woo meta stay inside `meta.raw` only
- users: `title` comes from `name` (or slug); email lives in `meta.email`

## Native create is a different mapper

`NativeCollection.create` does **not** call `normalizeWordPressItem`. It reads `title` / `content` / `slug` / `status` as **strings**. A WordPress `{ title: { rendered } }` payload becomes title `"Untitled"`. If you create native records from WP JSON, normalize first or flatten yourself.
