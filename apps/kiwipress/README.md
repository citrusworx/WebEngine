# KiwiPress Cloud (`apps/kiwipress`)

Product app that consumes `@citrusworx/kiwipress`. This is the only platform app — do not add a second stack or fork Blackwater compose.

| Workspace | Package | Role |
| --- | --- | --- |
| `apps/kiwipress/front` | `@citrusworx/kiwipressapp-front` | Vite + Juice + Sig. Wizard, marketing, dashboard chrome. |
| `apps/kiwipress/back` | `@citrusworx/kiwipressapp-back` | Seltzer process: CMS gateway (`/__kiwipress`) + GrapeVine provision (`/provision/*`). |

There is no root `apps/kiwipress/package.json`. Library docs live in [`docs/kiwipress`](../../docs/kiwipress/README.md); this file is how to run the app locally and walk the wizard against real plan/apply.

## Install

From the monorepo root:

```bash
yarn install
```

`@citrusworx/kiwipress` and `@citrusworx/grapevine` export from `dist`. This checkout already includes those builds. Rebuild them only if you changed those packages (`yarn workspace @citrusworx/grapevine build`, `yarn workspace @citrusworx/kiwipress build`).

## Env

Copy the examples. **Never commit a real `.env` or a DigitalOcean token.**

```bash
cp apps/kiwipress/back/.env.example apps/kiwipress/back/.env
cp apps/kiwipress/front/.env.example apps/kiwipress/front/.env
```

Vite loads `apps/kiwipress/front/.env` automatically.

The API reads `process.env` only (no dotenv). Export keys in the **same shell** that starts the back:

```bash
set -a
source apps/kiwipress/back/.env
set +a
```

Or export individual keys (`export KIWIPRESS_API_PORT=8787`). Shell values win over a file you have not sourced.

### Back (`apps/kiwipress/back/.env.example`)

| Env | Role |
| --- | --- |
| `KIWIPRESS_API_PORT` | Listen port. Default `8787`. |
| `KIWIPRESS_GATEWAY_TOKEN` | When set, `/__kiwipress` (except health) and `/provision/*` require `Authorization: Bearer …` or `X-KiwiPress-Token`. Leave unset for loopback-only laptop use. |
| `DO_TOKEN` | **Server-only.** Required for `POST /provision/apply`. Plan works without it. Blueprints use `credentials.env: DO_TOKEN`. |
| `WP_URL` / `WP_API` / `WP_USER` / `WP_APP_PASSWORD` / `WP_TOKEN` / `WP_API_KEY` | Optional WordPress REST entry. Omit `WP_URL` for nectarine-only CMS. |
| `KIWIPRESS_CMS_FILE` | Optional JSON persistence path. |
| `KIWIPRESS_PG_DB` / `PG_DB` | Optional Nectarine Postgres persistence. |

If no persistence env is set, the API writes `data/kiwipress-cms.json` under the back cwd (`apps/kiwipress/back/data/` when started via the workspace script).

`DO_TOKEN` must never appear in front env, Vite, or browser requests.

### Front (`apps/kiwipress/front/.env.example`)

| Env | Role |
| --- | --- |
| `KIWIPRESS_API_URL` | Vite proxy target for `/__kiwipress` and `/provision`. Default `http://localhost:8787`. Read by `vite.config.ts`, not `import.meta.env`. |
| `VITE_KIWIPRESS_GATEWAY_TOKEN` | Same value as `KIWIPRESS_GATEWAY_TOKEN` when you set one. Sent as `Authorization: Bearer`. Optional on loopback. |

No other front env is required. Vite also proxies `/wp-json` to `https://wp.local.citrusworx.test` (hardcoded in `vite.config.ts`) and allows hosts `localhost`, `app.local.citrusworx.test`, `frontend.kiwi.local`.

## Run

Two terminals, from the monorepo root:

```bash
# terminal 1 — after sourcing back/.env if you use one
yarn workspace @citrusworx/kiwipressapp-back dev

# terminal 2
yarn workspace @citrusworx/kiwipressapp-front dev
```

- Front: [http://localhost:5173](http://localhost:5173) (`0.0.0.0:5173`)
- Back: [http://localhost:8787](http://localhost:8787)

The browser calls `/provision/…` and `/__kiwipress/…` on the Vite origin. Vite proxies those paths to `KIWIPRESS_API_URL`. The API sees the proxy as loopback, so a gateway token is optional on a laptop.

Wizard: [http://localhost:5173/wizard](http://localhost:5173/wizard) (Welcome). Steps: Welcome → Blueprints → Configure → Database → Domain → Payment → Provisioning → Live. Payment is a simulated checkout — no processor, no card charge. Confirm & Deploy navigates to Provisioning.

Provisioning mounts, `POST`s the wizard snapshot to `/provision/plan`, paints that timeline, then `POST`s `/provision/apply` and polls `GET /provision/:id`. The browser never sends `DO_TOKEN`.

## Test paths

### Safe / no DigitalOcean spend

Leave `DO_TOKEN` unset on the back process.

1. Start back and front as above.
2. Open `/wizard` and walk to Provisioning (or Confirm & Deploy on Payment).
3. **Plan** runs: timeline and pack id come from `planGrapeConfig` on the mapped blueprint. No DigitalOcean API calls.
4. **Apply** is blocked. The API returns **503** with:

   > DigitalOcean token is not configured. Set `DO_TOKEN` (or the blueprint `credentials.env` name) on the KiwiPress API server. Apply does not run without it.

   The Provisioning step shows that message and a Retry apply button. Retry stays blocked until the back process has a token.

`databaseType` in the Database step picks the pack even on plan-only: **dedicated** → `kiwipress-managed`; **shared** / **self-hosted** / default → `kiwipress-compose`.

### Real apply (optional, costs money)

Set `DO_TOKEN` on the **back process only** (`export DO_TOKEN=dop_v1_…` in the API shell, or source `back/.env` after filling the placeholder). Do not put it in `front/.env`.

1. Same walk as the safe path.
2. Plan still runs first (no spend).
3. Apply calls `applyGrapeConfig` on the pack from wizard `databaseType`:
   - `dedicated` → `libraries/grapevine/examples/blueprints/kiwipress-managed`
   - otherwise → `libraries/grapevine/examples/blueprints/kiwipress-compose`
4. Pack paths resolve from the **monorepo root**, not cwd. Restart the back after changing env.
5. Success seeds Live (droplet IP / domain) and navigates to `/wizard/live`.

This creates real DigitalOcean resources (droplet; managed also creates two databases). Replace `REPLACE_WITH_YOUR_IP` in those packs before a production-shaped apply — the wizard currently opens SSH to `0.0.0.0/0` and warns. There is no destroy UI in this app; tear down with `grape destroy` if you apply.

## Routes (do not invent others)

Registered next to `registerKiwiPressGateway` with the same `authorizeKiwiPressGateway` helper.

| Method | Path | Behavior |
| --- | --- | --- |
| `POST` | `/provision/plan` | Wizard snapshot → load/validate pack → `planGrapeConfig` → timeline + public plan. Works without `DO_TOKEN`. |
| `POST` | `/provision/apply` | Same mapping. Missing token → **503**. Otherwise job + async `applyGrapeConfig`. |
| `GET` | `/provision/:id` | Job status, step events, apply summary (ids/IPs/hosts/warnings — not passwords or key material). |
| `*` | `/__kiwipress/…` | CMS gateway. See [Dashboard](../../docs/kiwipress/kiwipress-dashboard.md) and [Gateway](../../docs/kiwipress/kiwipress-gateway.md). |

Wizard snapshot fields the front actually posts: `databaseType`, `dropletSize`, `region`, `domainName`, `domainOption`, `cdnEnabled`, `loadBalancer`, `sslEnabled`, `blueprintId`, `autoScaling`, `backupFrequency`.

## Local stack preview (secondary)

For a local Docker WordPress / Traefik / MinIO look — **not** the platform app and **not** a second compose fork — use the existing blueprint stack:

[`libraries/grapevine/examples/blueprints/kiwipress-compose/stack`](../../libraries/grapevine/examples/blueprints/kiwipress-compose/stack)

Copy `stack/.env.example` → `stack/.env`, replace `REPLACE_ME`, then `docker compose` from that `stack/` directory. Details: [`kiwipress-compose/README.md`](../../libraries/grapevine/examples/blueprints/kiwipress-compose/README.md). The `kiwipress-app` Compose profile is an image hook; it does not start `apps/kiwipress` from this repo.

Do not copy or fork `apps/blackwatersound/docker`.
