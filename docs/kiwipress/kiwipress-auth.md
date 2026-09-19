# Auth

WordPress credentials live on `WPAuth`. `WPCore` constructs one from the resolved config. `KiwiPress.connect` also exposes `kiwi.auth` for the same strategy.

Source: `packages/kiwipress/src/core/WPAuth.ts`. Tests: `WPAuth.test.ts`.

This page is **WordPress outbound** auth. Inbound dashboard auth is a different token — see [Gateway](./kiwipress-gateway.md).

## Strategies

```ts
type AuthStrategy = "basic" | "bearer" | "api-key" | "none";
```

`strategy()` returns the **primary** strategy:

1. `"basic"` when both `username` and `appPassword` are set
2. else `"bearer"` when `token` is set
3. else `"api-key"` when only `apiKey` is set
4. else `"none"`

`isConfigured()` is `strategy() !== "none"`.

`headers()` builds the outbound map:

| Config | Header |
|---|---|
| username + appPassword | `Authorization: Basic <base64(username:appPassword)>` |
| else token | `Authorization: Bearer <token>` |
| apiKey (any time) | `X-API-Key: <key>` |
| headers | copied first, then overwritten by the above |

Basic wins over Bearer. An API key **combines** with Basic or Bearer. Extra `headers` from config are the base object.

```ts
import { WPAuth } from "@citrusworx/kiwipress";

const auth = new WPAuth({
  username: "admin",
  appPassword: "aaaa bbbb cccc dddd eeee ffff"
});

auth.strategy();      // "basic"
auth.isConfigured();  // true
auth.headers();       // { Authorization: "Basic …" }
```

Incomplete Basic (username without password) falls through to Bearer if `token` is set.

## Application passwords

Self-hosted WordPress: Users → Profile → Application Passwords. The value is a space-separated string. Send it as `appPassword` / `WP_APP_PASSWORD`. Do not use the account login password in Basic — many hosts reject it on REST.

This is the usual path. KiwiPress does not implement OAuth, cookies, or nonce flows.

## Bearer tokens

`token` / `WP_TOKEN` becomes `Authorization: Bearer …`. Use this when a plugin or proxy issues a JWT (or similar) and you are not using an application password. KiwiPress does not refresh tokens.

## API keys

`apiKey` / `WP_API_KEY` becomes `X-API-Key`. Core WordPress does not read that header. It is for a gateway or plugin in front of `wp-json`. Safe to set alongside Basic.

## Extra headers

```ts
new Posts({
  url: "https://example.com",
  headers: { "X-Site": "kiwi" }
});
```

Merged into every `fetch`. Auth headers overwrite the same keys if they collide (`Authorization`, `X-API-Key`).

## Encoding

Basic uses `Buffer` on Node, `btoa` in a browser-like runtime. If neither exists, `WPAuth` throws `Unable to encode WordPress credentials.`

## What does not throw

`new Posts({ url })` without credentials succeeds. `strategy()` is `"none"`. Public GETs may work. Writes and `context=edit` / `status=any` (what transfer uses) usually 401.

`KiwiPress.connect({ mode: "wordpress" })` without `url` / `WP_URL` **does** throw. That is a URL check, not an auth check.

## TLS

`allowSelfSigned` is not an auth strategy. When the request URL is `https://` and the flag is true, `requestWordPress` dynamically imports `undici` and uses `rejectUnauthorized: false`. Default is true for `localhost` and `*.local.citrusworx.test`. Override with `WP_ALLOW_SELF_SIGNED` or the constructor field.

`undici` is not a KiwiPress dependency. Install it in the host if you rely on that bypass.

## Facade

```ts
const kiwi = KiwiPress.connect({ url, username, appPassword });
kiwi.auth.strategy(); // "basic"
```

`kiwi.auth` is built from the connect config even when WordPress clients are absent (`mode: "nectarine"` without a URL). In that case there is nothing to authenticate against.

Gateway `GET /__kiwipress/cms` reports `auth: kiwi.auth.strategy()` next to mode and persistence. That is WordPress strategy, not the gateway bearer token.
