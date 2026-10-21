# KiwiPress Cloud (`apps/kiwipress`)

Product app that consumes `@citrusworx/kiwipress`. This is the only platform app — do not add a second stack or fork Blackwater compose.

| Workspace | Package | Role |
| --- | --- | --- |
| `apps/kiwipress/front` | `@citrusworx/kiwipressapp-front` | Vite + Juice + Sig. Wizard, marketing, dashboard chrome. |
| `apps/kiwipress/back` | `@citrusworx/kiwipressapp-back` | Seltzer process: CMS gateway (`/__kiwipress`), GrapeVine provision (`/provision/*`), and WordPress bridge pairing (`/projects/:id/bridge/*`). |

There is no root `apps/kiwipress/package.json`. Library docs live in [`docs/kiwipress`](../../docs/kiwipress/README.md); this file is how to run the app locally and walk the wizard against real plan/apply.

## Install

From the monorepo root:

```bash
yarn install
yarn workspace @citrusworx/kiwipress build
yarn workspace @citrusworx/grapevine build
```

`@citrusworx/kiwipress` and `@citrusworx/grapevine` export from `dist`. The back process will not start without those builds.

## Env

Copy the examples. **Never commit a real `.env` or a DigitalOcean token.**

```bash
cp apps/kiwipress/back/.env.example apps/kiwipress/back/.env
cp apps/kiwipress/front/.env.example apps/kiwipress/front/.env
```

Vite loads `apps/kiwipress/front/.env` automatically.

The API loads `apps/kiwipress/back/.env` on startup when that file exists (comments and blank lines ignored; `KEY=value` with optional quotes). It **does not override** variables already set in the shell — an exported `DO_TOKEN` still wins, including an empty export. Restart the back after editing `.env`. You do not need to `source` the file for the common case.

### Back (`apps/kiwipress/back/.env.example`)

| Env | Role |
| --- | --- |
| `KIWIPRESS_API_PORT` | Listen port. Default `8787`. |
| `KIWIPRESS_GATEWAY_TOKEN` | When set, `/__kiwipress` (except health) and `/provision/*` require `Authorization: Bearer …` or `X-KiwiPress-Token`. Leave unset for loopback-only laptop use. |
| `DO_TOKEN` | **Server-only.** Required for `POST /provision/apply` and `POST /provision/destroy`. Plan works without it. Blueprints use `credentials.env: DO_TOKEN`. |
| `KIWIPRESS_SECRET_KEY` | **Server-only.** 32 bytes as base64 or 64 hex characters. Required to pair a WordPress site. Encrypts the application password at rest with AES-256-GCM. Pairing returns **503** when it is missing or not 32 bytes. Generate with `node --input-type=module -e "import { randomBytes } from 'node:crypto'; console.log(randomBytes(32).toString('base64'))"`. |
| `WP_URL` / `WP_API` / `WP_USER` / `WP_APP_PASSWORD` / `WP_TOKEN` / `WP_API_KEY` | Optional WordPress REST entry. Omit `WP_URL` for nectarine-only CMS. |
| `KIWIPRESS_CMS_FILE` | Optional JSON persistence path. |
| `KIWIPRESS_PG_DB` / `PG_DB` | Optional Nectarine Postgres persistence. |

If no persistence env is set, the API writes `data/kiwipress-cms.json` under the back cwd (`apps/kiwipress/back/data/` when started via the workspace script).

`DO_TOKEN` and `KIWIPRESS_SECRET_KEY` must never appear in front env, Vite, or browser requests. The bridge routes never return the application password or its ciphertext.

### Front (`apps/kiwipress/front/.env.example`)

| Env | Role |
| --- | --- |
| `KIWIPRESS_API_URL` | Vite proxy target for `/__kiwipress` and `/provision`. Default `http://localhost:8787`. Read by `vite.config.ts`, not `import.meta.env`. |
| `VITE_KIWIPRESS_GATEWAY_TOKEN` | Same value as `KIWIPRESS_GATEWAY_TOKEN` when you set one. Sent as `Authorization: Bearer`. Optional on loopback. |

No other front env is required. Vite also proxies `/wp-json` to `https://wp.local.citrusworx.test` (hardcoded in `vite.config.ts`) and allows hosts `localhost`, `app.local.citrusworx.test`, `frontend.kiwi.local`.

## Run

Two terminals, from the monorepo root:

```bash
# terminal 1 — reads apps/kiwipress/back/.env on startup if present
yarn workspace @citrusworx/kiwipressapp-back dev

# terminal 2
yarn workspace @citrusworx/kiwipressapp-front dev
```

- Front: [http://localhost:5173](http://localhost:5173) (`0.0.0.0:5173`)
- Back: [http://localhost:8787](http://localhost:8787)

The browser calls `/provision/…` and `/__kiwipress/…` on the Vite origin. Vite proxies those paths to `KIWIPRESS_API_URL`. The API sees the proxy as loopback, so a gateway token is optional on a laptop.

Wizard: [http://localhost:5173/wizard](http://localhost:5173/wizard) (Welcome). Steps: Welcome → Blueprints → Configure → Database → Domain → Payment → Provisioning → Live. Payment is a simulated checkout — no processor, no card charge. Confirm & Deploy navigates to Provisioning.

Provisioning mounts, `POST`s the wizard snapshot to `/provision/plan`, paints that timeline, then `POST`s `/provision/apply` and polls `GET /provision/:id`. Live and Projects can `POST /provision/destroy` after a confirm step. The browser never sends `DO_TOKEN`.

## Test paths

### Safe / no DigitalOcean spend

Leave `DO_TOKEN` unset on the back process.

1. Start back and front as above.
2. Open `/wizard` and walk to Provisioning (or Confirm & Deploy on Payment).
3. **Plan** runs: timeline and pack id come from `planGrapeConfig` on the mapped blueprint. No DigitalOcean API calls.
4. **Apply** is blocked. The API returns **503** with:

   > DigitalOcean token is not configured. Set `DO_TOKEN` (or the blueprint `credentials.env` name) on the KiwiPress API server. Apply does not run without it.

   The Provisioning step shows that message and a Retry apply button. Retry stays blocked until the back process has a token.
5. **Destroy** from Live or Projects is blocked the same way (**503**) until `DO_TOKEN` is set.

`databaseType` in the Database step picks the pack even on plan-only: **dedicated** → `kiwipress-managed`; **shared** / **self-hosted** / default → `kiwipress-compose`.

### Real apply (optional, costs money)

Set `DO_TOKEN` on the **back process only** (put it in `back/.env` and restart, or `export DO_TOKEN=dop_v1_…` in the API shell). Do not put it in `front/.env`.

1. Same walk as the safe path.
2. Plan still runs first (no spend).
3. Apply calls `applyGrapeConfig` on the pack from wizard `databaseType`:
   - `dedicated` → `libraries/grapevine/examples/blueprints/kiwipress-managed`
   - otherwise → `libraries/grapevine/examples/blueprints/kiwipress-compose`
4. Pack paths resolve from the **monorepo root**, not cwd. Restart the back after changing env.
5. Success seeds Live (droplet IP / domain) and navigates to `/wizard/live`.

This creates real DigitalOcean resources (droplet; managed also creates two databases). Replace `REPLACE_WITH_YOUR_IP` in those packs before a production-shaped apply — the wizard currently opens SSH to `0.0.0.0/0` and warns.

Tear down from **Live** or **Projects**: confirm, then the dashboard `POST`s `/provision/destroy` with the same wizard snapshot mapping. The API calls GrapeVine `destroyGrapeResources`. DigitalOcean destroy does **not** remove local `.grape/ssh/…` private key files — delete those yourself if you no longer need SSH. Droplet delete is asynchronous; skipped VPCs are normal on the first pass (run destroy again). `grape destroy` still works from a pack directory if you prefer the CLI.

## Routes (do not invent others)

Registered next to `registerKiwiPressGateway` with the same `authorizeKiwiPressGateway` helper.

| Method | Path | Behavior |
| --- | --- | --- |
| `POST` | `/provision/plan` | Wizard snapshot → load/validate pack → `planGrapeConfig` → timeline + public plan. Works without `DO_TOKEN`. |
| `POST` | `/provision/apply` | Same mapping. Missing token → **503**. Otherwise job + async `applyGrapeConfig`. |
| `POST` | `/provision/destroy` | Same mapping and gateway auth. Missing token → **503**. Sync `destroyGrapeResources`. Returns deleted/skipped/failed/warnings (no secrets or key material). |
| `GET` | `/provision/:id` | Job status, step events, apply summary (ids/IPs/hosts/warnings — not passwords or key material). |
| `POST` | `/projects/:id/bridge/probe` | `{ siteUrl }`. Unauthenticated plugin health. `pluginPresent`, version, `paired`, lockdown — or `pluginPresent: false` with `plugin_missing` / `site_unreachable`. |
| `POST` | `/projects/:id/bridge/pair` | `{ siteUrl, username, applicationPassword, frontendUrl }`. Verifies `manage_options`, writes plugin settings, reads them back, then stores the password encrypted. Nothing is stored if any step fails. **503** without `KIWIPRESS_SECRET_KEY`. |
| `GET` | `/projects/:id/bridge/status` | Health plus a short GET of `frontendUrl`. `connected`, `disconnected` (no stored pairing), or `needs_attention`. Updates `lastHealth`. |
| `POST` | `/projects/:id/bridge/unpair` | Best-effort `paired: false` on the plugin, then always deletes the local credential. |
| `*` | `/__kiwipress/…` | CMS gateway. See [Dashboard](../../docs/kiwipress/kiwipress-dashboard.md) and [Gateway](../../docs/kiwipress/kiwipress-gateway.md). |

Wizard snapshot fields the front actually posts: `databaseType`, `dropletSize`, `region`, `domainName`, `domainOption`, `cdnEnabled`, `loadBalancer`, `sslEnabled`, `blueprintId`, `autoScaling`, `backupFrequency`.

## Connect WordPress

The project screen (`/app/projects`) pairs the current project (`my-wordpress-app`) with a site that has the [KiwiPress Bridge](../../plugins/kiwipress-bridge/README.md) plugin. The dashboard is still one project; the bridge record is stored beside the CMS file at `data/kiwipress-bridges.json` under the back cwd, keyed by project id. The record holds `siteUrl`, `username`, the encrypted application password, `frontendUrl`, `pairedAt`, and `lastHealth` (`at` plus the status result). It does not hold preview tokens or webhook subscriptions.

1. **Site.** Enter the WordPress URL and probe. The API calls `GET /wp-json/kiwipress/v1/health` with no credentials. A hit shows plugin version, lockdown, and whether the plugin already says paired. A 404 tells you to install and activate KiwiPress Bridge. A connection failure says the site is unreachable.
2. **Account.** Username and an application password from **Users → Profile → Application Passwords**. The account must be an administrator (`manage_options`). The API checks that with one call to `GET /wp/v2/users/me?context=edit`.
3. **Frontend.** Confirm the URL lockdown should send logged-out visitors to (it starts as this app's origin), then pair.

Pairing writes `{ frontend_url, paired: true, project_label }` to the plugin and reads settings back. The password is encrypted with AES-256-GCM (`node:crypto`) only after that confirmation. The key is `KIWIPRESS_SECRET_KEY`. The browser never receives the password or the ciphertext.

The status card then shows **Connected**, **Disconnected**, or **Needs attention**:

| Status | When |
| --- | --- |
| Disconnected | This project has no stored pairing. |
| Needs attention | A pairing is stored, and the frontend URL did not answer, or the plugin version is below `0.1.0` (`MIN_BRIDGE_VERSION`), or the plugin reports `paired: false`, or health itself failed (site down or plugin missing). |
| Connected | A pairing is stored, health succeeded, the plugin is at least `0.1.0` and still paired, and the frontend URL returned an HTTP response. |

Any HTTP response from the frontend counts as reachable, including errors and redirects. A timeout or network error does not. **Check again** re-runs that and updates `lastHealth`. **Disconnect** asks you to confirm, tells the plugin `paired: false` when it can, and always deletes the local credential.

Restart the back after setting `KIWIPRESS_SECRET_KEY`. The Vite dev server proxies `/projects` to `KIWIPRESS_API_URL` along with `/provision` and `/__kiwipress`.

## Local stack preview (secondary)

For a local Docker WordPress / Traefik / MinIO look — **not** the platform app and **not** a second compose fork — use the existing blueprint stack:

[`libraries/grapevine/examples/blueprints/kiwipress-compose/stack`](../../libraries/grapevine/examples/blueprints/kiwipress-compose/stack)

Copy `stack/.env.example` → `stack/.env`, replace `REPLACE_ME`, then `docker compose` from that `stack/` directory. Details: [`kiwipress-compose/README.md`](../../libraries/grapevine/examples/blueprints/kiwipress-compose/README.md). The `kiwipress-app` Compose profile is an image hook; it does not start `apps/kiwipress` from this repo.

Do not copy or fork `apps/blackwatersound/docker`.
