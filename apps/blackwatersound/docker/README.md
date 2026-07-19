# Blackwater Sound — local KiwiEngine Docker stack

Traefik routes `*.blackwatersound.local` to the Blackwater Sound front, API, WordPress (KiwiPress), Postgres, and MinIO.

KiwiStage (Artist Hub) is a **separate product** and is not part of this stack.

## Prerequisites

- Docker Desktop (Windows) with Compose v2
- Yarn 4 at the monorepo root (`d:\CitrusWorx`)
- Admin access to edit the hosts file

## 1. Hosts file (Windows)

Add to `C:\Windows\System32\drivers\etc\hosts`:

```
127.0.0.1 blackwatersound.local
127.0.0.1 www.blackwatersound.local
127.0.0.1 api.blackwatersound.local
127.0.0.1 wp.blackwatersound.local
127.0.0.1 minio.blackwatersound.local
127.0.0.1 minio-console.blackwatersound.local
127.0.0.1 traefik.blackwatersound.local
127.0.0.1 courses.blackwatersound.local
127.0.0.1 gear.blackwatersound.local
127.0.0.1 software.blackwatersound.local
127.0.0.1 studio.blackwatersound.local
127.0.0.1 songwriting.blackwatersound.local
127.0.0.1 blog.blackwatersound.local
```

Future subdomains (`courses`, `gear`, `software`, `studio`, `songwriting`, `blog`) temporarily redirect to `www` until dedicated apps exist.

## 2. Environment

```powershell
cd d:\CitrusWorx\apps\blackwatersound\docker
copy .env.example .env
# Edit .env — set passwords at minimum
```

After the first stack boot, `wp-bootstrap` writes a KiwiPress application password to the `wp_secrets` volume. The back container reads it from `/secrets/wp-app-password` automatically.

## 3. Start the stack

From monorepo root:

```powershell
yarn stack:up
```

Or from this folder:

```powershell
docker compose --env-file .env up -d --build
```

## 4. URLs

| URL | Service |
|-----|---------|
| http://www.blackwatersound.local | Front (nginx SPA, `/api` proxied to back) |
| http://api.blackwatersound.local | Back API |
| http://wp.blackwatersound.local | WordPress admin & REST |
| http://minio.blackwatersound.local | MinIO S3 API |
| http://minio-console.blackwatersound.local | MinIO console |
| http://traefik.blackwatersound.local:8080 | Traefik dashboard |

WordPress admin: user from `WP_ADMIN_USER` / `WP_ADMIN_PASSWORD` in `.env`.

## 5. Verify health

```powershell
curl http://api.blackwatersound.local/api/health
```

Expect `kiwipress.configured: true` and `database.configured: true` after Postgres migration.

## 6. Stop / logs

```powershell
yarn stack:down
yarn stack:logs
```

## Dev without rebuilding front

Run infrastructure + back in Docker, front via Vite on the host:

```powershell
docker compose --env-file .env up -d traefik postgres mariadb wordpress wp-bootstrap minio minio-init back
yarn workspace @citrusworx/blackwater-sound dev
```

Vite proxies `/api` → `localhost:3001`; publish back port temporarily or use `api.blackwatersound.local` with `VITE_API_BASE`.

## Docker vs bare-metal env

| Variable | Docker | Local `yarn dev` |
|----------|--------|------------------|
| `WP_URL` | `http://wp.blackwatersound.local` | Your WP URL or omit for seed |
| `PG_USER` / `PG_PASS` / `PG_HOST` / `PG_PORT` / `PG_DB` | Nectarine vendor keys → `postgres` service | Omit for seed JSON + in-memory products |
| `NECTARINE_CONFIG` | `/repo/apps/blackwatersound/back/nectarine.config.yaml` | Defaults next to back package |
| `VITE_API_BASE` | Empty (nginx proxies `/api`) | Empty (Vite proxy) |
| `RUNTIME_DATA_DIR` | `/repo/apps/blackwatersound/back/runtime` volume | Default `back/src/data/runtime` |

## MinIO buckets

Created on first boot by `minio-init`:

- `blackwater-media` — product & lesson media
- `blackwater-uploads` — studio deliverables (future)
- `blackwater-public` — public-read assets

## Postgres / Nectarine

The API loads [nectarine.config.yaml](../back/nectarine.config.yaml) via `loadNectarineConfig` and connects with vendor env keys (`PG_*`). Schema is applied on back startup when those credentials resolve. Products seed from `SEED_PRODUCTS` once; waitlist entries persist in Postgres.

Compose Postgres matches [grapevine.config.yaml](../grapevine.config.yaml) `database.name: blackwater_sound`.

## Future subdomains

See [traefik/dynamic/future-routes.yml](./traefik/dynamic/future-routes.yml) for redirects and commented router stubs. Names match [nectarine.config.yaml](../back/nectarine.config.yaml) apps:

- `courses` / `songwriting` → education + coaching
- `gear` / `software` → commerce catalogs
- `studio` → recording / mixing
- `blog` → KiwiPress publishing
