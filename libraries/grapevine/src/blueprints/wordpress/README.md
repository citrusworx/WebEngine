# WordPress / KiwiPress sketches

The YAML that used to live here (`traditional/blueprint.yaml`, `headless/blueprint.yaml`) was a product sketch — not an executable grape config (`provider: digitalocean` was missing, and Grapevine never applied it).

Executable DigitalOcean packs:

- [`examples/blueprints/kiwipress-compose/`](../../../examples/blueprints/kiwipress-compose/) — droplet + Docker Compose (Traefik, MinIO, WordPress, MariaDB, Postgres)
- [`examples/blueprints/kiwipress-managed/`](../../../examples/blueprints/kiwipress-managed/) — managed MySQL/Postgres + droplet app layer

```bash
export DO_TOKEN=dop_v1_...
grape validate -c libraries/grapevine/examples/blueprints/kiwipress-compose/grape.config.yaml
grape plan     -c libraries/grapevine/examples/blueprints/kiwipress-compose/grape.config.yaml
```

Or `grape init kiwipress-compose` / `grape init kiwipress-managed`.
