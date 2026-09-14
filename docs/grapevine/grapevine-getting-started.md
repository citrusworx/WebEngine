# Getting Started With Grapevine

Provision DigitalOcean resources with the CLI and TypeScript API that exist in `libraries/grapevine/src`.

## Install

```bash
yarn add @citrusworx/grapevine
```

The package bins `grape` (`dist/bin/cli.js`). In the monorepo you can also run the workspace build and call `grape` from `node_modules/.bin`.

Node 20+ and a DigitalOcean personal access token are required for `apply` / live `status`.

## Token

1. DigitalOcean → API → Personal access tokens → generate **read/write**
2. Export it (do not commit it):

```bash
export DO_TOKEN=dop_v1_...
```

The config can point at another env name:

```yaml
credentials:
  source: env
  env: MY_DO_TOKEN
```

`applyGrapeConfig` copies that value onto `process.env.DO_TOKEN` before API calls. `getDoToken()` throws if the var is missing.

There is no `DO_REGION` reader in the client. Put `region:` on the config or on each resource.

## First config (no droplet)

Copy `libraries/grapevine/examples/blueprints/01-vpc-and-tag.yaml` or write:

```yaml
version: "0.1"
provider: digitalocean
region: nyc1

resources:
  tags:
    - grapevine
  vpcs:
    - name: grapevine
      description: Grapevine starter VPC
      ip_range: 10.120.0.0/16
```

`provider` must be the string `digitalocean`. Anything else fails Zod.

## Validate, then apply

```bash
grape validate -c ./01-vpc-and-tag.yaml
grape apply -c ./01-vpc-and-tag.yaml
```

Remote YAML/JSON works:

```bash
grape validate -c https://example.com/grape.config.yaml
```

`validate` prints resource counts after schema parse. `apply` prints the `ApplyResult` JSON (ids, names, `warnings`).

## First droplet

Use `02-droplet-in-vpc.yaml` from the examples folder, or:

```yaml
version: "0.1"
provider: digitalocean
region: nyc1

resources:
  ssh_keys:
    - name: grapevine
      public_key: ssh-ed25519 AAAA...your-key
  vpcs:
    - name: grapevine
      ip_range: 10.120.0.0/16
  droplets:
    - name: web-01
      size: s-1vcpu-1gb
      image: ubuntu-24-04-x64
      vpc: grapevine
      monitoring: true
```

This **creates a billed droplet**. Destroy it in the DigitalOcean UI or call `deleteDroplet` / `NukeDroplet` when you are done. Grapevine apply does not have a destroy plan.

If you use `generate: true` instead of `public_key`, save the returned public key from the apply JSON if you care — the private key is not persisted.

## Same thing in TypeScript

```ts
import {
  loadGrapeConfig,
  applyGrapeConfig,
  validateGrapeConfig,
} from "@citrusworx/grapevine";

const config = await loadGrapeConfig("./grape.config.yaml");
// or
const config2 = validateGrapeConfig({
  provider: "digitalocean",
  region: "nyc1",
  resources: {
    tags: ["grapevine"],
    vpcs: [{ name: "grapevine", ip_range: "10.120.0.0/16" }],
  },
});

const result = await applyGrapeConfig(config);
if (result.warnings.length) {
  console.warn(result.warnings);
}
```

## Check the token and account

```bash
grape status
```

If `DO_TOKEN` is set, this lists live counts of droplets, VPCs, firewalls, and domains. With `-c` it only summarizes the file.

## Mental model for day one

1. Write `provider: digitalocean` + `resources`
2. `grape validate` until Zod is quiet
3. `export DO_TOKEN` and `grape apply`
4. Use function APIs when you need a single droplet or a one-off firewall

Skip `services:`, grapeGUI, and other-cloud providers. They will not apply.

## Where to go next

- [Configuration](./grapevine-config.md)
- [DigitalOcean](./grapevine-digitalocean.md)
- [Examples](./grapevine-examples.md)
- [API](./grapevine-api.md)
