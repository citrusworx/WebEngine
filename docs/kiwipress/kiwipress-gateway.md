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
| GET | `/__kiwipress/cms` | guarded | mode, persistence kind, native counts, registered types, WordPress `auth` strategy |
| POST | `/__kiwipress/cms` | guarded | body `{ mode: "wordpress" \| "nectarine" }` |
| POST | `/__kiwipress/transfer` | guarded | `sync.transfer(collections?)`, then `promote()`, then `persist()` |
| GET/POST | `/__kiwipress/types` | guarded | list / create native CPT definitions |
| GET/PATCH/DELETE | `/__kiwipress/types/:slug` | guarded | read / update / delete a definition (delete drops its items) |
| GET/POST/PATCH/DELETE | `/__kiwipress/content/:kind` | guarded | posts, pages, or a registered CPT slug |

There are **no** inbound content routes for users, categories, tags, or comments. Transfer can still move those collections. CPT slugs are rejected on transfer — WordPress CPT sync is out of scope.

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
  native: { posts, pages, users, categories, tags, comments, [cptSlug]: number },
  types: CollectionTypeDefinition[]
}
```

`POST /__kiwipress/transfer` without `kiwi.sync` is 400 `{ error: "Transfer requires a WordPress URL." }`. Body may include `{ collections?: CmsCollection[] }`. Unknown / CPT slugs are 400.

WordPress vs native on posts/pages follows `kiwi.mode`. Custom type items always use the native store. `promote()` is what transfer’s handler calls after a successful sync.

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

## Seltzer handlers

Gateway handlers return Seltzer `ResponseData` (`{ status, body }`), read `ctx.body` / `ctx.query.id` / `ctx.params`, and use the same `authorizeKiwiPressGateway` guard as before. Content PATCH/DELETE still use `?id=` so the dashboard does not have to change.

Seltzer `.handler({ adapter: "node:http", options })` on `WPClient` only stashes outbound options. It does not make `listen` speak WordPress. Adapter string in source is `"node:http"`; Seltzer does not interpret it.

## What the backend app adds

`apps/kiwipress/back` is not extra library API. It:

- reads `WP_URL` / `WP_API` / credentials / `KIWIPRESS_GATEWAY_TOKEN` / `KIWIPRESS_API_PORT`
- uses `persistenceFromEnv() ?? createFilePersistence(cwd/data/kiwipress-cms.json)`
- starts nectarine-only when `WP_URL` is missing
- calls `registerKiwiPressGateway` and `listen`
- registers `registerKiwiPressProvision` for `/provision/plan`, `/provision/apply`, and `GET /provision/:id` (Seltzer `ResponseData`, same gateway token)

See [Dashboard](./kiwipress-dashboard.md).
