# KiwiPress Anti-Patterns

Common ways to fight the library or to document a CMS that is not shipped.

## 1. Treating KiwiPress as WebEngine

Bad: waiting for `engine.init()` or `Blueprint.adapters.cms` to construct `Posts`.

Why: KiwiPress does not import WebEngine or Types. `adapters.cms: "kiwipress"` is future-kernel vocabulary.

Better: `new Posts({ url })` or `KiwiPress.connect` in your Node process.

## 2. Treating the dashboard as the library

Bad: “KiwiPress is a cloud wizard that provisions droplets.”

Why: that copy lives in `apps/kiwipress` placeholders. The package is a REST client + in-process store.

Better: teach `packages/kiwipress`. Mention the app as an optional consumer.

## 3. Assuming `getBySlug` is one post

Bad:

```ts
const post = await posts.getBySlug("hello");
console.log(post.title.rendered);
```

Why: WordPress returns an array for `?slug=`. `title` may be undefined.

Better: take `[0]`, or `native.posts.getBySlug` after transfer (one `ContentRecord | undefined`).

## 4. Using `getAll()` as the migration

Bad: `for (const p of await posts.getAll()) store.upsert(normalize(p))`.

Why: first page only; usually published-only; no `X-WP-TotalPages`.

Better: `kiwi.sync.transfer(["posts"])` or `posts.listAll("posts", { status: "any", context: "edit" })`.

## 5. Passing WordPress objects into native `create`

Bad:

```ts
await kiwi.native.posts.create(await posts.getById(12));
```

Why: native `title` must be a string. `{ rendered }` becomes `"Untitled"`. `author` as number is dropped. `meta` is wiped.

Better: `normalizeWordPressItem("posts", wpPost)` then `store.upsert`, or `transfer()`.

## 6. Calling `ctx.json` in new Seltzer hosts

Bad:

```ts
handler: (ctx) => { ctx.json(await kiwi.native.posts.getAll()); }
```

Why: Seltzer 0.8.1 removed `ctx.json`. Handlers must return `{ body }`. The **existing** gateway still does this — that is a code-capped gap, not a pattern to copy.

Better:

```ts
handler: async (): Promise<ResponseData> => ({
  body: await kiwi.native.posts.getAll()
});
```

## 7. Re-reading `ctx.req` after Seltzer `parse`

Bad: `for await (const chunk of ctx.req)`.

Why: 0.8.1 already filled `ctx.body`. A second read is empty.

Better: `ctx.body`. (Gateway `readJson` is the old shape.)

## 8. Inventing `?id=` because “Seltzer has no params”

Bad: documenting `:id` as unsupported.

Why: Seltzer 0.8.1 matches `:param`. The gateway uses `?id=` because it was written that way.

## 9. Expecting taxonomies to write back to WordPress

Bad: `kiwi.wordpress.categories.create`.

Why: the class has no writes. Native `kiwi.native.categories.create` writes the **store**, not `wp-json`.

## 10. Treating `getByCity` as a WordPress guarantee

Bad: “Users can always be filtered by city.”

Why: KiwiPress sends `?city=`. Core WordPress may ignore it.

## 11. Loading `.env` inside the package

Bad: assuming `WP_URL` appears because you added a `.env` next to the library.

Why: the package reads `process.env` only. Apps load dotenv.

## 12. Documenting Juice `theme="kiwipress"` as this client

Bad: “import the KiwiPress theme to get the CMS.”

Why: that is `@citrusworx/juiceui` branding CSS.

## 13. Silent Postgres save

Bad: assuming `PgSql.query` failures throw through KiwiPress without checking.

Why: Nectarine may swallow; KiwiPress throws only when the result is `undefined`. A delete-then-insert save is still not transactional.

## 14. Mixing `published` and `publish` without a map

Bad: sending native `status: "published"` to `posts.update` and expecting WordPress to accept it.

Why: WordPress wants `publish`. Native `asStatus` accepts `publish` incoming; the WordPress REST API does not use `published`.
