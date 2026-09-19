# KiwiPress Patterns

Reusable compositions from current KiwiPress primitives. These are not new APIs.

Related: [Tutorial](./kiwipress-tutorial.md), [Best practices](./kiwipress-best-practices.md), [Anti-patterns](./kiwipress-anti-patterns.md).

## Public WordPress reads

```ts
const posts = new Posts({ url: "https://example.com" });
const page = await posts.getAll();
```

No credentials. Fine for a public `publish`ed index. Do not use this as the transfer source if you need drafts.

## Authenticated transfer

```ts
const kiwi = KiwiPress.connect({
  url,
  username,
  appPassword,
  persistence: createFilePersistence("./data/kiwipress-cms.json")
});
await kiwi.ready();
await kiwi.sync?.preview(["posts"]);
await kiwi.sync?.transfer(["posts", "pages"]);
kiwi.promote();
```

Preview first if you want counts without writing. Transfer uses `listAll` + `context=edit`.

## One-shot migrate script

```ts
const kiwi = KiwiPress.connect({
  url: process.env.WP_URL!,
  username: process.env.WP_USER,
  appPassword: process.env.WP_APP_PASSWORD,
  persistence: createFilePersistence(process.env.KIWIPRESS_CMS_FILE ?? "./data/kiwipress-cms.json")
});
await kiwi.ready();
const result = await kiwi.sync!.transfer();
console.log(result.counts);
```

Run in CI or a laptop. The dashboard is optional.

## Greenfield native CMS

```ts
const kiwi = KiwiPress.connect({
  mode: "nectarine",
  persistence: persistenceFromEnv() ?? createFilePersistence("./data/kiwipress-cms.json")
});
await kiwi.ready();
await kiwi.native.posts.create({
  title: "Hello",
  content: "<p>Hi</p>",
  status: "published",
  slug: "hello"
});
```

Same store transfer would have filled.

## Normalize at the UI boundary

```ts
const raw = await posts.getBySlug(slug);
const item = Array.isArray(raw) ? raw[0] : raw;
if (!item) return;
const record = normalizeWordPressItem("posts", item, url);
```

Keep WordPress JSON out of templates. After `promote()`, use `native.posts.getBySlug` and skip this.

## Custom read-only collection

```ts
class Media extends WPRead {
  getAll() {
    return this.read(createWordPressRoute({ method: "GET", endpoint: "/media" }));
  }
}
```

Do not pretend this is a shipped `Media` export.

## File in prod, executor in tests

```ts
const persistence = process.env.VITEST
  ? { kind: "custom" as const, load: async () => snapshot, save: async (next) => { snapshot = next; } }
  : createFilePersistence("./data/kiwipress-cms.json");
```

Postgres tests should inject `SqlExecutor` so `pg` is not imported.

## Host-owned Seltzer routes (0.8.1)

Prefer this over copying `registerKiwiPressGateway` internals:

```ts
import type { ResponseData } from "@citrusworx/seltzer";

app.route({
  method: "GET",
  path: "/cms/posts",
  handler: async (): Promise<ResponseData> => ({
    body: await kiwi.native.posts.getAll()
  })
});
```

Return `{ status, body }` on errors. Read `ctx.body` for POST. Use `ctx.params.id` if you register `/cms/posts/:id`.

## Dual-mode content handler

```ts
async function listPosts() {
  if (kiwi.mode === "nectarine") {
    return kiwi.native.posts.getAll();
  }
  return kiwi.wordpress.posts.listAll("posts", { status: "any", context: "edit" });
}
```

That is what the gateway content GET does (then it currently `ctx.json`s the result).
