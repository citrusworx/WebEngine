# KiwiPress Troubleshooting

Usual failures against `packages/kiwipress/src` at **0.4.3**.

Related: [Anti-patterns](./kiwipress-anti-patterns.md), [Auth](./kiwipress-auth.md), [Gateway](./kiwipress-gateway.md).

## `WPCore requires a WordPress URL`

Constructor / `KiwiPress.connect({ mode: "wordpress" })` saw neither `config.url` nor `process.env.WP_URL`. Use `mode: "nectarine"` if you do not have WordPress. The published package does not load `.env`.

## `KiwiPress WordPress clients require config.url…`

You accessed `kiwi.wordpress` or `useWordPress()` on a nectarine-only instance. Transfer is also missing (`kiwi.sync` is `undefined`).

## `WordPress request failed: 401 …`

Writes, `context=edit`, or `status=any` without a complete auth strategy. Set username + app password (or token). Public `getAll()` can succeed while `transfer()` fails.

## `WordPress request failed: 404 …`

Wrong `apiBase`, pretty permalinks off, or REST disabled. Default base is `wp-json/wp/v2`, not `wp-json/v2`. Trailing slashes are stripped; a wrong host is not.

## `WordPress request failed: 403 …`

Application password rejected, or the user cannot `edit_posts`. `listAll` with `context=edit` needs a privileged user.

## Transfer threw `WPSync failed to read WordPress comments`

One collection failed; the whole `transfer()` throws. Check that comments REST is enabled and credentials allow `status=any`. Try `transfer(["posts"])` first.

## `getBySlug` looks empty / `title` is undefined

You treated an **array** as an object. Use `[0]` or normalize. Native `getBySlug` returns `undefined` when the slug is missing — not `[]`.

## Native create title is `"Untitled"`

You passed WordPress `{ title: { rendered } }`. Native wants a string. Normalize first.

## Native `authorId` missing after create

`author` as a number is ignored. Pass `authorId: "3"` or upsert a normalized record.

## Only ten posts transferred

You did not call `transfer()` / `listAll`. You looped `getAll()`.

Drafts missing: transfer query needs credentials for `status=any`.

## File not created

Library default is memory. Pass `createFilePersistence`. `ready()` hydrates; `transfer` / native writes flush. Missing parent dirs are created on save.

## Postgres `could not connect`

Set `PG_USER`, `PG_PASS`, `PG_HOST`, `PG_PORT`, and `database` / `PG_DB`. Inject `executor` in tests.

## Postgres `query failed`

Nectarine returned `undefined`. KiwiPress throws. Check SQL / credentials. Remember save is delete-then-insert.

## `Unable to encode WordPress credentials`

No `Buffer` and no `btoa`. Unexpected in Node 18+.

## Self-signed fetch fails

Flag is only used when the URL is `https://` and `allowSelfSigned` is true. Install `undici` in the host. HTTP (`http://localhost:8080`) does not need it.

## Users `getByCity` returns everyone

KiwiPress sent `?city=`. Core WordPress may ignore it. Not a client bug.

## Gateway `401 Unauthorized`

Non-loopback caller and no matching `KIWIPRESS_GATEWAY_TOKEN`. Send `Authorization: Bearer` or `X-KiwiPress-Token`. Health stays public.

## Gateway `400` `id query parameter is required`

PATCH/DELETE `/__kiwipress/content/posts` without `?id=`.

## Gateway `400` `Transfer requires a WordPress URL`

Backend started without `WP_URL`. Content can still run nectarine-only.

## Gateway 500 / empty body / `ctx.json is not a function`

Current `registerKiwiPressGateway` returns Seltzer `ResponseData` and reads `ctx.body` / `ctx.query.id`. If you still see `ctx.json is not a function`, you are on an old library build — rebuild `@citrusworx/kiwipress`. Do not add `ctx.json` back to Seltzer.

## Dashboard Content loads, other pages are empty

Posts and Pages are live against the gateway. Projects / billing / wizard remain placeholders.

## Juice looks unstyled

Import `@citrusworx/juiceui/styles` and `@citrusworx/juiceui/styles/themes/kiwipress`, and set `theme="kiwipress"` on a root. That is the **theme**, not `@citrusworx/kiwipress`.
