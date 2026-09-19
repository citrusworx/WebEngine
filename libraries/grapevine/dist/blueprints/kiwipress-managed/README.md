# KiwiPress managed blueprint

Classic DigitalOcean shape: **managed MySQL + managed Postgres** in a VPC, plus a droplet that runs WordPress, Traefik, and MinIO via Compose. Local MariaDB/Postgres containers are intentionally omitted.

Apply waits for each database to become `online`, then injects the **private** connection into the droplet `.env` (`connection_env`). Apply JSON reports database id/name/engine/status/host only — never passwords.

The `apps/kiwipress` wizard is not wired. KiwiPress back/front remain optional image hooks (`COMPOSE_PROFILES=kiwipress-app`).

## Commands

```bash
export DO_TOKEN=dop_v1_...

grape validate -c ./grape.config.yaml
grape plan     -c ./grape.config.yaml
grape apply    -c ./grape.config.yaml
```

`validate` / `plan` do not call DigitalOcean. `apply` creates tags → SSH key → VPC → **databases (wait)** → droplet with stack `user_data` → firewall.

```bash
grape init kiwipress-managed
grape validate -c ./kiwipress-managed/grape.config.yaml
```

## Placeholders (replace before apply)

| Placeholder | Where | Replace with |
| --- | --- | --- |
| `REPLACE_WITH_YOUR_IP` | `grape.config.yaml` firewall SSH source | Your public IPv4 (`/32`) |
| `REPLACE_ME` | `stack/.env.example` (MinIO, WP admin, etc.) | Local secrets — do not commit |
| `example.test` hosts | `.env.example` | Your domain |
| `db-s-1vcpu-1gb` / `s-2vcpu-2gb` / `nyc1` | databases + droplet | Size and region |

`WORDPRESS_DB_*` and `PG_*` in `.env.example` are placeholders. Apply overwrites them from the managed database API before writing droplet user_data.

## Stack on the droplet

`/opt/kiwipress` receives compose + env + Traefik/MinIO assets. Bootstrap installs Docker, renders Traefik routes, `docker compose up -d`, then waits on `http://127.0.0.1/`.

WordPress talks to DigitalOcean managed MySQL over the VPC (SSL flags in `WORDPRESS_CONFIG_EXTRA`). The optional KiwiPress back image would use managed Postgres (`PG_HOST` / `PG_PASS` injected the same way).

## After apply

```bash
ssh -i .grape/ssh/kiwipress root@DROPLET_IP
docker compose -f /opt/kiwipress/docker-compose.yml ps
```

Destroy includes `resources.databases` by unique name (`grape destroy -c ./grape.config.yaml --yes`). Droplets finish asynchronously; re-run destroy if a VPC is still busy.

## Deferred

- `apps/kiwipress` wizard / API
- Billing, multi-region HA, trusted sources / DB firewall extras beyond VPC
- Let's Encrypt production certificates
