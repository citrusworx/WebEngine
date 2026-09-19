# KiwiPress compose blueprint

Service-based DigitalOcean pack: one droplet in a VPC, firewall, generated SSH key, and cloud-init that installs Docker and brings up a Compose stack.

The stack shape follows the Blackwater reference (Traefik + MinIO + WordPress + MariaDB + Postgres) with **KiwiPress-generic** names. KiwiPress back/front are image hooks behind the `kiwipress-app` Compose profile — this pack does not wire `apps/kiwipress`.

## Commands

```bash
export DO_TOKEN=dop_v1_...

# From this directory, or after: grape init kiwipress-compose
grape validate -c ./grape.config.yaml
grape plan     -c ./grape.config.yaml
grape apply    -c ./grape.config.yaml
```

`validate` / `plan` do not call DigitalOcean. `apply` creates tags → SSH key → VPC → droplet (with generated `user_data`) → firewall.

Scaffold from the packaged copy:

```bash
grape init kiwipress-compose
grape validate -c ./kiwipress-compose/grape.config.yaml
```

## Placeholders (replace before apply)

| Placeholder | Where | Replace with |
| --- | --- | --- |
| `REPLACE_WITH_YOUR_IP` | `grape.config.yaml` firewall SSH source | Your public IPv4 (`/32`) |
| `REPLACE_ME` | `stack/.env.example` passwords | Secrets you generate locally — do not commit them |
| `example.test` hosts | `.env.example` / Traefik routes | Your domain or `/etc/hosts` names |
| `s-2vcpu-4gb` / `nyc1` | droplet + region | Size and region you want to pay for |

Copy `stack/.env.example` if you want a local `.env` to edit; apply reads the example file from this pack and writes it onto the droplet as `/opt/kiwipress/.env`. Edit keys in the example (or add `stack.env.keys` in the grape config) before apply.

## What lands on the droplet

Cloud-init writes `/opt/kiwipress/` then runs `scripts/bootstrap.sh`:

1. Install Docker (Compose plugin)
2. Render Traefik route templates from `.env`
3. `docker compose up -d`
4. Wait for `http://127.0.0.1/` (Traefik)

Default services: Traefik, Postgres (KiwiPress app DB), MariaDB (WordPress), WordPress, WP CLI bootstrap, MinIO + bucket init.

Optional KiwiPress app containers (not started unless you set images and enable the profile):

```bash
# in stack/.env.example before apply
KIWIPRESS_BACK_IMAGE=your-registry/kiwipress-back:tag
KIWIPRESS_FRONT_IMAGE=your-registry/kiwipress-front:tag
COMPOSE_PROFILES=kiwipress-app
```

## After apply

Connect with the generated key path printed by apply (`ssh -i <path> root@<droplet-ip>`). Key material is never printed.

```bash
ssh -i .grape/ssh/kiwipress root@DROPLET_IP
docker compose -f /opt/kiwipress/docker-compose.yml ps
```

## Deferred

- Billing, multi-region HA, Let's Encrypt production wiring
- Re-apply / drift (Grapevine apply is create-oriented)

Wizard plan/apply is `apps/kiwipress` (see that README). This pack does not start the platform app.
