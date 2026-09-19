# Getting Started With Grapevine

This is the best starting point if you want to use Grapevine the way the library works today.

After this page, the [tutorial](./grapevine-tutorial.md) is the guided build — validate a free VPC, apply it, read `grape status`, then grow into a droplet and firewall using the in-repo blueprints — analogous to [Sig’s operator desk](../sigjs/sig-page-tutorial.md) and [Juice’s page tutorial](../juice/juice-page-tutorial.md).

## What Grapevine is

Grapevine is a DigitalOcean client plus an apply engine.

It gives you:

- `grapeConfigSchema` — Zod, `provider` must be `"digitalocean"`
- `loadGrapeConfig(source)` — local path or HTTP(S) URL, YAML or JSON
- `applyGrapeConfig(config)` — create resources in a fixed order
- `grape` CLI — `validate`, `apply`, `status`, `help`
- function exports — `createDroplet`, `createVPC`, `createFireWall`, …

It is not Terraform. There is no state file, no plan, no destroy command, and no other cloud.

## Install

```bash
yarn add @citrusworx/grapevine
```

The package bins `grape` (`dist/bin/cli.js`). In the monorepo you can also run the workspace build and call `grape` from `node_modules/.bin`. `npx grape` works after install.

Package version today: **0.2.1**.

Node 20+ and a DigitalOcean personal access token are required for `apply` and live `status`. `validate` needs neither a token nor network to DigitalOcean.

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

`applyGrapeConfig` copies that value onto `process.env.DO_TOKEN` before API calls so the shared HTTP client can read it. `getDoToken()` throws if the var is missing.

`grape status` without `-c` checks `DO_TOKEN`. With `-c`, it uses `credentials.env` from that config. If you renamed the variable, export it (and `DO_TOKEN` if you run status without a config).

There is no `DO_REGION` reader in the client. Put `region:` on the config or on each resource.

## The mental model

1. Write `provider: digitalocean` plus `resources` (or a hoistable `blueprint:`).
2. `grape validate -c …` until Zod is quiet.
3. `export DO_TOKEN` and `grape apply -c …` when you intend to create.
4. `grape status` to see whether the token works and how many droplets/VPCs/firewalls/domains the **account** has.
5. Use function APIs when you need a single droplet, a one-off firewall, or an explicit delete.

Skip loose `services:`, grapeGUI, and other-cloud providers. KiwiPress packs under `examples/blueprints/kiwipress-*` do apply.

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

`provider` must be the string `digitalocean`. Anything else fails Zod. `credentials` defaults to `{ source: env, env: DO_TOKEN }` if omitted.

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

Expected validate output shape:

```text
Valid grape config for provider digitalocean
{
  "tags": 1,
  "ssh_keys": 0,
  "vpcs": 1,
  "droplets": 0,
  "firewalls": 0,
  "domains": 0,
  "load_balancers": 0,
  "alert_policies": 0,
  "apps": 0
}
```

Those counts come from `normalizeResources`, so a top-level `networking.vpc: true` shows up as a VPC here even though it was not written under `resources.vpcs`.

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

If you use `generate: true` instead of `public_key`, the private key is written to `.grape/ssh/<name>` (or `private_key_path`). Apply JSON reports that path only. Prefer a key you already control when the workstation already has one.

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

`validateGrapeConfig` throws on Zod failure. `safeValidateGrapeConfig` returns the Zod safe-parse result.

## Check the token and account

```bash
grape status
```

If `DO_TOKEN` is set, this lists live counts of droplets, VPCs, firewalls, and domains. With `-c` it only summarizes the file. Details: [Live status](./grapevine-live-status.md).

## Kiwi is optional

The Rust `kiwi` CLI can delegate to `grape` on `PATH`:

```bash
kiwi --grape -c ./grape.config.yaml
kiwi grape validate -c ./01-vpc-and-tag.yaml
```

KiwiEngine is **not required**. Grapevine is a standalone npm package. The `grape` help text mentions kiwi as an alternate entry; the grape binary itself is still `apply | validate | status`.

## Where to go next

- [Tutorial](./grapevine-tutorial.md) — the guided DigitalOcean stack
- [Configuration](./grapevine-config.md)
- [Apply lifecycle](./grapevine-apply.md)
- [Patterns](./grapevine-patterns.md)
- [Examples](./grapevine-examples.md)
- [API](./grapevine-api.md)
