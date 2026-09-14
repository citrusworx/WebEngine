# Blueprints

A Grapevine blueprint is a YAML (or JSON) document that describes DigitalOcean resources. Apply it with `grape apply -c <path>` or `applyGrapeConfig`.

The product schema lives in `libraries/grapevine/src/config/schema.ts`. Full field list: [grapevine-config.md](../../grapevine-config.md). Teaching page: [Blueprints](../../grapevine-blueprints.md). Downloadable starters: `libraries/grapevine/examples/blueprints/`. WordPress YAML under `src/blueprints/wordpress/` is **not** a grape config.

## Two shapes that work

**Resource document** (preferred):

```yaml
version: "0.1"
provider: digitalocean
region: nyc1
resources:
  vpcs:
    - name: grapevine
      ip_range: 10.120.0.0/16
  droplets:
    - name: web-01
      size: s-1vcpu-1gb
      image: ubuntu-24-04-x64
      vpc: grapevine
```

**Hoisted `blueprint:`** (still valid — folded into `resources` before parse):

```yaml
provider: digitalocean
blueprint:
  name: web
  droplet:
    name: web-01
    region: nyc1
    size: s-1vcpu-1gb
    image: ubuntu-24-04-x64
```

`provider` must be `digitalocean`. Other cloud names fail validation.

## Empty fields

`cleanPayload` strips empty values before some API calls. You can omit optional keys instead of sending `""` / `[]`.

## Droplet-only helper

`deployByBlueprint(path)` reads a `{ blueprint: { droplet } }` file and POSTs `/droplets`. For VPC + firewall + keys, use `applyGrapeConfig` / `grape apply`.

## See also

- [Getting Started](../../grapevine-getting-started.md)
- [Tutorial](../../grapevine-tutorial.md)
- [Examples](../../grapevine-examples.md)
- [create-droplet.md](./create-droplet.md)
