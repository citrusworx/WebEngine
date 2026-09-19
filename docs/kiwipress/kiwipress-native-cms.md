# Native CMS and Persistence

After transfer — or instead of WordPress — KiwiPress is a small in-process CMS: `NectarineStore` plus `NativeCollection`.

Source: `packages/kiwipress/src/cms/`.

Related: [Transfer](./kiwipress-transfer.md), [Normalization](./kiwipress-normalize.md).

## Facade

```ts
const kiwi = KiwiPress.connect({
  mode: "nectarine", // or "wordpress" when url is set
  persistence: createFilePersistence("./data/kiwipress-cms.json"),
  store: existingStore // optional share
});

await kiwi.ready();   // hydrate from persistence once
kiwi.mode;            // "wordpress" | "nectarine"
kiwi.native.posts;    // NativeCollection
kiwi.store;           // NectarineStore
await kiwi.persist(); // flush
kiwi.promote();       // mode = nectarine, same instance
kiwi.useWordPress();  // mode = wordpress; throws if no WP clients
kiwi.toNectarine();   // new KiwiPress, mode nectarine, shared store
```

Default `mode` is `"wordpress"`, which requires `url` or `WP_URL`. `mode: "nectarine"` does not.

`ready()` is idempotent per adapter: `hydrate` no-ops if already hydrated. Switching persistence via `store.usePersistence` resets that flag.

## `NectarineStore`

In-memory buckets for the six `CmsCollection`s.

| Method | Behavior |
|---|---|
| `list(collection)` | shallow copy of the bucket |
| `get(collection, id)` | id compared as string |
| `findBySlug(collection, slug)` | first matching slug |
| `upsert(record)` | replace or push; forces `source.cms = "nectarine"` |
| `remove(collection, id)` | returns whether anything was removed |
| `snapshot()` | `{ posts, pages, users, categories, tags, comments }` |
| `replace(partial)` | missing collections become `[]` |
| `clear()` | empty buckets |
| `usePersistence(adapter)` | attach `CmsPersistence` |
| `hydrate()` | `load()` once; ignore `null` |
| `flush()` | queued `save(snapshot())`; no-op without adapter |

`flush` serializes saves on a promise chain so overlapping native writes do not interleave two snapshots. A failed save still advances the queue (the rejection is not swallowed for the caller — `await flush()` throws — but the next flush is not stuck).

`GET /__kiwipress/cms` reports `kiwi.store.persistenceKind`: `memory` | `file` | `postgres` | `custom`.

## `NativeCollection`

```ts
kiwi.native.posts;
kiwi.native.pages;
kiwi.native.users;
kiwi.native.categories;
kiwi.native.tags;
kiwi.native.comments;
```

Each method hydrates first.

| Method | Returns | Notes |
|---|---|---|
| `getAll()` | `ContentRecord[]` | |
| `getById(id)` | `ContentRecord \| undefined` | |
| `getBySlug(slug)` | `ContentRecord \| undefined` | |
| `create(data)` | `ContentRecord` | then `flush` |
| `update(id, data)` | `ContentRecord` | throws if missing; then `flush` |
| `delete(id)` | `boolean` | then `flush` |

### Create fields actually copied

`create` accepts `WordPressPayload | Partial<ContentRecord>` but only reads:

- `id` — string or number, else `crypto.randomUUID()`
- `title` — string, else `"Untitled"`
- `content` — string, else `""`
- `slug` — string, else slugified title (`[^a-z0-9]+` → `-`)
- `status` — see below
- `authorId` — **only if already a string** (a numeric WordPress `author` is ignored)
- `featuredImage` — **only if already a string**

`meta` is always `{}`. Extra keys are dropped. `createdAt` / `updatedAt` are set to `new Date().toISOString()`.

### Update fields actually copied

`title`, `content`, `slug`, `status` when they are strings / valid statuses. `authorId` and `featuredImage` are **not** patched. `updatedAt` is refreshed.

### Native status

`publish` → `published`. Allowed: `draft`, `published`, `archived`, `pending`, `approved`, `spam`. Anything else uses the fallback (`draft` on create, existing status on update).

## Persistence interface

```ts
interface CmsPersistence {
  readonly kind?: "file" | "postgres" | "memory" | "custom";
  load(): Promise<CmsSnapshot | null>;
  save(snapshot: CmsSnapshot): Promise<void>;
}
```

`kind` is optional; missing → reported as `custom` when attached, `memory` when none.

`normalizeSnapshot` accepts either `{ collections: { posts: [...] } }` or a flat `{ posts: [...] }`. Invalid items are dropped. Load of a missing file returns `null` (empty store). Corrupt JSON throws.

### File

```ts
createFilePersistence("./data/kiwipress-cms.json");
```

`path.resolve`s the path. `load` reads UTF-8 JSON. `ENOENT` → `null`. `save` `mkdir`s the directory, writes `*.pid.timestamp.tmp`, then `rename`s. On-disk shape: `{ version: 1, collections }`.

Node `fs` only. No WebEngine.

### Postgres

```ts
createPostgresPersistence({ database: "kiwipress" });
createPostgresPersistence({ database, table: "kiwipress_content" });
createPostgresPersistence({ executor });
```

Table name must match `^[A-Za-z_][A-Za-z0-9_]*$`. Default `kiwipress_content`:

```sql
CREATE TABLE IF NOT EXISTS kiwipress_content (
  collection TEXT NOT NULL,
  id TEXT NOT NULL,
  record JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection, id)
);
```

Without `executor`, KiwiPress dynamically imports `@citrusworx/nectarine/adapters/pg`, `addDb(database)`, `connect(database)`. Failed connect throws and names `PG_USER`, `PG_PASS`, `PG_HOST`, `PG_PORT`.

Nectarine `PgSql.query` can return `undefined` on error. KiwiPress **throws** if a query returns `undefined`.

`save` is `DELETE FROM table` then one `INSERT` per record. `PgSql` has no transactions. A crash mid-save can empty the table. That is shipped behavior, not a docs myth.

`pg` is loaded by Nectarine’s adapter, not by KiwiPress’s import graph, until you opt into the default executor.

### Env helper

```ts
persistenceFromEnv(); // process.env
persistenceFromEnv({ KIWIPRESS_CMS_FILE: "/tmp/kiwi.json" });
```

Order: `KIWIPRESS_CMS_FILE` → file; else `KIWIPRESS_PG_DB` or `PG_DB` → Postgres; else `undefined` (in-memory). File wins if both are set.

The dashboard backend uses `persistenceFromEnv() ?? createFilePersistence(cwd + "/data/kiwipress-cms.json")`. The library does not apply that default.

## Custom adapters

```ts
store.usePersistence({
  kind: "custom",
  async load() { return snapshot; },
  async save(next) { snapshot = next; }
});
```

That is what the unit tests use. MySQL and Mongo are **not** shipped.

## What this is not

- a Nectarine SQL schema for posts (the blog YAML models are documentation/destination vocabulary; the store is JSON buckets)
- a multi-tenant CMS
- Echo / visual editing
- WebEngine-owned state
