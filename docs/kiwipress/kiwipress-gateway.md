# Seltzer Gateway

`registerKiwiPressGateway(app, kiwi, options?)` attaches inbound routes under `/__kiwipress` for the optional dashboard and any host that wants the same façade.

Source: `packages/kiwipress/src/gateway/register.ts`, `auth.ts`. Used by `apps/kiwipress/back/src/server.ts`.

This is **not** “Seltzer serving WordPress.” Outbound WordPress is still `requestWordPress`. The gateway is an inbound proxy onto `KiwiPress`.

## Register

```ts
import { Seltzer } from "@citrusworx/seltzer";
import {
  KiwiPress,
  createFilePersistence,
  registerKiwiPressGateway
} from "@citrusworx/kiwipress";

const kiwi = KiwiPress.connect({
  url: process.env.WP_URL,
  persistence: createFilePersistence("./data/kiwipress-cms.json")
});
await kiwi.ready();

const app = Seltzer.init();
registerKiwiPressGateway(app, kiwi, {
  token: process.env.KIWIPRESS_GATEWAY_TOKEN?.trim() || undefined
});
app.listen(Number(process.env.KIWIPRESS_API_PORT ?? 8787));
```

`listen` binds every interface. Treat the token as required in any non-loopback deploy.

## Routes

| Method | Path | Auth | Role |
|---|---|---|---|
| GET | `/__kiwipress/health` | public | `{ ok: true }` |
| GET | `/__kiwipress/cms` | guarded | mode, persistence kind, native counts, WordPress `auth` strategy |
| POST | `/__kiwipress/cms` | guarded | body `{ mode: "wordpress" \| "nectarine" }` |
| POST | `/__kiwipress/transfer` | guarded | `sync.transfer(collections?)`, then `promote()`, then `persist()` |
| GET | `/__kiwipress/content/posts` | guarded | native `getAll` or WordPress `listAll` (`status=any`, `context=edit`) |
| POST | `/__kiwipress/content/posts` | guarded | native `create` or `wordpress.posts.create` |
| PATCH | `/__kiwipress/content/posts?id=` | guarded | native `update` or WordPress `update` |
| DELETE | `/__kiwipress/content/posts?id=` | guarded | native `delete` or WordPress `delete` |
| GET/POST/PATCH/DELETE | `/__kiwipress/content/pages` | guarded | same as posts |

There are **no** inbound content routes for users, categories, tags, or comments. Transfer can still move those collections.

PATCH/DELETE without `id` respond `{ error: "id query parameter is required." }` with status 400.

`GET /__kiwipress/cms` body (success):

```ts
{
  mode: kiwi.mode,
  entry: "wordpress",
  destination: "nectarine",
  standalone: true,
  persistence: kiwi.store.persistenceKind,
  auth: kiwi.auth.strategy(),
  native: { posts, pages, users, categories, tags, comments } // counts
}
```

`POST /__kiwipress/transfer` without `kiwi.sync` is 400 `{ error: "Transfer requires a WordPress URL." }`. Body may include `{ collections?: CmsCollection[] }`.

WordPress vs native on content routes follows `kiwi.mode`, not “did transfer run.” `promote()` is what transfer’s handler calls after a successful sync.

## Gateway auth

```ts
type KiwiPressGatewayOptions = {
  token?: string;
  allowLoopbackWithoutToken?: boolean;
};
```

`authorizeKiwiPressGateway(req, options)`:

1. If `options.token` is set, the request must present the **same** token. Comparison is SHA-256 then `timingSafeEqual`. Presentation: `Authorization: Bearer …` or `X-KiwiPress-Token`.
2. If no token is configured and `allowLoopbackWithoutToken` is not `false`, loopback remotes (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`) pass. Anyone else is denied.
3. `allowLoopbackWithoutToken: false` with no token denies everyone.

`/__kiwipress/health` skips this guard.

The Vite app sends `VITE_KIWIPRESS_GATEWAY_TOKEN` as Bearer when that env is set. The local proxy is loopback, so a token is optional on a developer laptop and **required** once the API is reachable off-box.

This token is not `WPAuth`. It does not become a WordPress application password.

## Seltzer 0.8.1

Handlers **return `ResponseData`**: `{ status?, headers?, body? }`. `parse` fills `ctx.body`. `ctx.json` was removed in Seltzer 0.4.0. Bare returns are 500.

`registerKiwiPressGateway` now matches that contract:

- every route returns `{ status, body }`
- POST/PATCH bodies come from `ctx.body`
- PATCH/DELETE still use `?id=` (`ctx.query.id`) so existing dashboard callers stay valid
- auth failures are `401 { error: "Unauthorized" }`

If you are writing **new** host routes, keep returning `ResponseData`. Do not add a `ctx.json` helper. Parametric `/content/posts/:id` is available in Seltzer if you want it later; this helper keeps `?id=` for compatibility.

Seltzer `.handler({ adapter: "node:http", options })` on `WPClient` only stashes outbound options. It does not make `listen` speak WordPress. Adapter string in source is `"node:http"`; Seltzer does not interpret it.

## What the backend app adds

`apps/kiwipress/back` is not extra library API. It:

- reads `WP_URL` / `WP_API` / credentials / `KIWIPRESS_GATEWAY_TOKEN` / `KIWIPRESS_API_PORT`
- uses `persistenceFromEnv() ?? createFilePersistence(cwd/data/kiwipress-cms.json)`
- starts nectarine-only when `WP_URL` is missing
- calls `registerKiwiPressGateway` and `listen`
- registers `registerKiwiPressProvision` for `/provision/plan`, `/provision/apply`, and `GET /provision/:id` (Seltzer `ResponseData`, same gateway token)

See [Dashboard](./kiwipress-dashboard.md).
