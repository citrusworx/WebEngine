# Dashboard App (`apps/kiwipress`)

`apps/kiwipress` is an optional **product app** that consumes `@citrusworx/kiwipress`. It is not the library. WebEngine does not start it, orchestrate it, or import it.

Two workspaces:

| Workspace | Package name | Role |
|---|---|---|
| `apps/kiwipress/front` | `@citrusworx/kiwipressapp-front` **0.1.1** | Vite + Juice `theme="kiwipress"` + Sig.js |
| `apps/kiwipress/back` | `@citrusworx/kiwipressapp-back` **0.1.4** | Seltzer process + `registerKiwiPressGateway` |

There is no root `apps/kiwipress/package.json`.

## What it demos (honest)

**Shipped against the library**

- **Content** (`/app/content`) — `TransferPanel` + `ContentManager`
  - `GET /__kiwipress/cms` status (mode, persistence, native counts)
  - `POST /__kiwipress/transfer` for all six collections, then re-read status
  - `POST /__kiwipress/cms` `{ mode: "wordpress" }`
  - load / edit / delete **posts and pages** via `/__kiwipress/content/{posts|pages}`
- backend default file persistence under `data/kiwipress-cms.json`
- WordPress entry when `WP_URL` is set; nectarine-only otherwise
- Juice theme id `kiwipress` (styling only; lives in `@citrusworx/juiceui`)

**Marketing / placeholder (do not document as library features)**

- Home, How it works, Developers, Get KiwiPress, Contact, Login
- Wizard steps (Welcome → Blueprints → Configure → Database → Domain → Payment → Provisioning → Live → Scale)
- Dashboard pages: Projects, Blueprints, Billing, Activity, Settings, Account — copy + empty placeholders
- Sidebar brand “KiwiPress Cloud” and `v0.0.1` — UI chrome, not `@citrusworx/kiwipress` 0.4.3
- Vite also proxies `/wp-json` to `https://wp.local.citrusworx.test` for local WP; that is app config, not a library default
- `front/src/tools/wysiwyg/` is a spec + editor experiment, not a shipped CMS

The front package does **not** depend on `@citrusworx/kiwipress`. It talks HTTP to the backend. The backend depends on the library.

## How to run

From the monorepo root, after the library is built:

```bash
yarn workspace @citrusworx/kiwipress build

# terminal 1
yarn workspace @citrusworx/kiwipressapp-back dev

# terminal 2
yarn workspace @citrusworx/kiwipressapp-front dev
```

Defaults:

- API: `http://127.0.0.1:8787` (`KIWIPRESS_API_PORT`)
- Vite: `http://127.0.0.1:5173`, proxies `/__kiwipress` to `KIWIPRESS_API_URL` or `http://localhost:8787`

Useful env (backend):

| Env | Role |
|---|---|
| `WP_URL` | enable WordPress clients + transfer |
| `WP_API` | default `wp-json/wp/v2` |
| `WP_USER` / `WP_APP_PASSWORD` / `WP_TOKEN` / `WP_API_KEY` | outbound WP auth |
| `KIWIPRESS_CMS_FILE` or `KIWIPRESS_PG_DB` / `PG_DB` | override persistence |
| `KIWIPRESS_GATEWAY_TOKEN` | require Bearer / `X-KiwiPress-Token` |
| `KIWIPRESS_API_PORT` | listen port |

Frontend: `VITE_KIWIPRESS_GATEWAY_TOKEN` (same value as the gateway token when you set one). Vite `allowedHosts` includes `app.local.citrusworx.test`, `frontend.kiwi.local`, `localhost`.

Without `WP_URL`, Content still works in nectarine mode: empty native collections until you transfer (impossible) or you write records another way. The transfer button will 400 (`Transfer requires a WordPress URL.`).

## Content manager notes

- Lists are normalized in the **app** (`extractTextValue`) so WordPress `{ rendered }` and native strings both display
- Editor status options are WordPress-shaped (`publish`, `draft`, `pending`, `private`). Native `published` is shown as `publish` in the list
- PATCH/DELETE use `?id=` — that matches the gateway, not Seltzer `:id`
- There is no create-from-blank control in the manager UI; load existing items or transfer first

## Gateway honesty

The backend registers the library helper as-is. See [Gateway](./kiwipress-gateway.md) for the `ctx.json` / `ResponseData` mismatch. If Content “loads” in your environment, you are seeing whatever that helper does on the Seltzer version in the workspace. Do not copy `ctx.json` into new Seltzer 0.8.1 hosts.
