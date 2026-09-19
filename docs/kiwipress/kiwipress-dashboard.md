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

- **Posts** (`/app/posts`) and **Pages** (`/app/pages`) — shared `CollectionWorkspace`
  - list / create / edit / delete via `/__kiwipress/content/{posts|pages}`
  - no simulated stubs
- **Types** (`/app/types`) — register native custom collections (slug, labels, statuses)
- **Type items** (`/app/c/:slug`) — same `CollectionWorkspace` for any registered CPT
- **Content** (`/app/content`) — transfer + collection overview
  - `GET /__kiwipress/cms` status (mode, persistence, native counts)
  - `POST /__kiwipress/transfer` for all six collections, then re-read status
  - `POST /__kiwipress/cms` `{ mode: "wordpress" }`
- backend default file persistence under `data/kiwipress-cms.json`
- WordPress entry when `WP_URL` is set; nectarine-only otherwise
- Juice theme id `kiwipress` (styling only; lives in `@citrusworx/juiceui`)

**Marketing / placeholder (do not document as library features)**

- Home, How it works, Developers, Get KiwiPress, Contact, Login
- Wizard steps (Welcome → Blueprints → Configure → Database → Domain → Payment → Provisioning → Live → Scale). Provisioning calls `POST /provision/plan` then `POST /provision/apply` and polls `GET /provision/:id`. Live and Projects can confirm and `POST /provision/destroy`. The browser never sends `DO_TOKEN`.
- Dashboard pages: Projects, Blueprints, Billing, Activity, Settings, Account — copy + empty placeholders. Posts, Pages, Types, and `/app/c/:slug` are live against the gateway.
- Sidebar brand “KiwiPress Cloud” and `v0.0.1` — UI chrome, not `@citrusworx/kiwipress` 0.4.3
- Vite also proxies `/wp-json` to `https://wp.local.citrusworx.test` for local WP; that is app config, not a library default
- `front/src/tools/wysiwyg/` is a spec + editor experiment, not a shipped CMS

The front package does **not** depend on `@citrusworx/kiwipress`. It talks HTTP to the backend. The backend depends on the library.

## How to run

Local wizard + provision walkthrough (plan without `DO_TOKEN`, optional apply): [`apps/kiwipress/README.md`](../../apps/kiwipress/README.md). Env placeholders live in `apps/kiwipress/back/.env.example` and `apps/kiwipress/front/.env.example`.

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
- Vite: `http://127.0.0.1:5173`, proxies `/__kiwipress` and `/provision` to `KIWIPRESS_API_URL` or `http://localhost:8787`

Useful env (backend):

| Env | Role |
|---|---|
| `WP_URL` | enable WordPress clients + transfer |
| `WP_API` | default `wp-json/wp/v2` |
| `WP_USER` / `WP_APP_PASSWORD` / `WP_TOKEN` / `WP_API_KEY` | outbound WP auth |
| `KIWIPRESS_CMS_FILE` or `KIWIPRESS_PG_DB` / `PG_DB` | override persistence |
| `KIWIPRESS_GATEWAY_TOKEN` | require Bearer / `X-KiwiPress-Token` |
| `KIWIPRESS_API_PORT` | listen port |
| `DO_TOKEN` (or blueprint `credentials.env`) | required for `POST /provision/apply` and `POST /provision/destroy`; plan works without it |

Frontend: `VITE_KIWIPRESS_GATEWAY_TOKEN` (same value as the gateway token when you set one). Vite `allowedHosts` includes `app.local.citrusworx.test`, `frontend.kiwi.local`, `localhost`.

Without `WP_URL`, Posts, Pages, and custom types still work in nectarine mode: empty native collections until you create records in the dashboard. The transfer button will 400 (`Transfer requires a WordPress URL.`). Transfer stays limited to the six WordPress-oriented collections.

## Collection workspace notes

- Lists are normalized in the **app** (`extractTextValue`) so WordPress `{ rendered }` and native strings both display
- Editor status options are WordPress-shaped (`publish`, `draft`, `pending`, `private`). Native `published` is shown as `publish` in the list
- PATCH/DELETE use `?id=` — that matches the gateway, not Seltzer `:id`
- Create-from-blank is on Posts, Pages, and `/app/c/:slug` (`POST /__kiwipress/content/{kind}`)
- Custom type items live at **`/app/c/:slug`**. Type definitions live at **`/app/types`**. The sidebar lists registered types under Types.

## Provision routes (app host, not the library)

`registerKiwiPressProvision` is registered next to the CMS gateway and uses the same `authorizeKiwiPressGateway` token. Handlers return Seltzer `ResponseData` (`ctx.body` / `ctx.params`).

| Method | Path | Role |
|---|---|---|
| POST | `/provision/plan` | Wizard snapshot → pack + patched grape config → `planGrapeConfig`. Works without `DO_TOKEN`. |
| POST | `/provision/apply` | Same mapping. Missing token → **503**. Otherwise creates a job and runs `applyGrapeConfig` asynchronously. |
| POST | `/provision/destroy` | Same mapping and auth. Missing token → **503**. Sync `destroyGrapeResources`; sanitized deleted/skipped/failed/warnings. Local `.grape/ssh` files are not removed. |
| GET | `/provision/:id` | Job status, timeline events, apply summary (droplet ids/IPs, db id/host/status, warnings). |

`databaseType: "dedicated"` loads `libraries/grapevine/examples/blueprints/kiwipress-managed`. Shared / self-hosted / default loads `kiwipress-compose`. Pack paths are resolved from the monorepo root, not `cwd`.

Responses are sanitized: DigitalOcean tokens and password fields are stripped. The browser only sends `VITE_KIWIPRESS_GATEWAY_TOKEN`.

## Gateway honesty

The CMS helper (`registerKiwiPressGateway`) is still the older `ctx.json` façade. See [Gateway](./kiwipress-gateway.md). New provision routes do **not** copy that pattern.
