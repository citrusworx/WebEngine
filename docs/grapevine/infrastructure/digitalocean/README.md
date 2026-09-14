# DigitalOcean notes (Grapevine)

Practical DigitalOcean pages next to the Grapevine library. Grapevine’s product docs start at [../../README.md](../../README.md).

## What this folder is

Operator notes for droplets and blueprints on DigitalOcean. They should stay specific and checkable.

- [digitalocean.md](./digitalocean.md) — account / API orientation
- [create-droplet.md](./create-droplet.md) — creating a droplet
- [blueprints.md](./blueprints.md) — blueprint files Grapevine can apply

## What Grapevine actually runs

```bash
export DO_TOKEN=dop_v1_...
grape validate -c ./grape.config.yaml
grape apply -c ./grape.config.yaml
```

There is no `grapevine init --config`, no provider switch CLI, and no blueprint marketplace in this repo. Starters live in `libraries/grapevine/examples/blueprints/`.

`provider` is DigitalOcean only. Changing one YAML line to `aws` will fail schema validation.

## Related

- [Getting Started](../../grapevine-getting-started.md)
- [Configuration](../../grapevine-config.md)
- [DigitalOcean guide](../../grapevine-digitalocean.md)
- [Status](../../grapevine-status.md)
