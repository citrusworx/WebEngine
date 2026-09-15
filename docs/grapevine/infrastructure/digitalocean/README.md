# DigitalOcean notes (Grapevine)

Practical DigitalOcean pages next to the Grapevine library. Grapevine’s product docs start at [../../README.md](../../README.md).

## What this folder is

Operator notes for droplets and blueprints on DigitalOcean. They should stay specific and checkable.

- [digitalocean.md](./digitalocean.md) — account / API orientation
- [create-droplet.md](./create-droplet.md) — creating a droplet
- [blueprints.md](./blueprints.md) — blueprint files Grapevine can apply

The teaching stack lives one level up:

- [Tutorial](../../grapevine-tutorial.md)
- [Blueprints](../../grapevine-blueprints.md)
- [DigitalOcean guide](../../grapevine-digitalocean.md)
- [Apply lifecycle](../../grapevine-apply.md)

## What Grapevine actually runs

```bash
export DO_TOKEN=dop_v1_...
grape init --list
grape validate -c ./grape.config.yaml
grape plan -c ./grape.config.yaml
grape apply -c ./grape.config.yaml
grape status
grape destroy -c ./grape.config.yaml --yes
```

`grape init` copies packaged starters from `libraries/grapevine/examples/blueprints/`. There is no provider switch CLI.

`provider` is DigitalOcean only. Changing one YAML line to `aws` will fail schema validation.

## Related

- [Getting Started](../../grapevine-getting-started.md)
- [Configuration](../../grapevine-config.md)
- [Anti-Patterns](../../grapevine-anti-patterns.md)
- [Status](../../grapevine-status.md)
- [Roadmap](../../grapevine-roadmap.md)
