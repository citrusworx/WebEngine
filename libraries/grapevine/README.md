# @citrusworx/grapevine

Provider integrations used by CitrusWorx infrastructure workflows. Grapevine can be used on its own — **KiwiEngine is not required**.

The current public entrypoint re-exports the DigitalOcean adapter plus a config schema and apply helpers used by the `grape` CLI.

## Install

```bash
npm install @citrusworx/grapevine
# or
yarn add @citrusworx/grapevine
```

The package ships a `grape` binary. After install it is available as `grape` (or `yarn grape` / `npx grape` in this workspace).

Set a DigitalOcean personal access token before any live API call:

```bash
export DO_TOKEN=dop_v1_...
```

## Programmatic usage

```ts
import {
  createVPC,
  createFireWall,
  createDroplet,
  createDomain,
  createTag
} from "@citrusworx/grapevine";

const vpc = await createVPC({
  name: "production",
  description: "Main network",
  region: "nyc1",
  ip_range: "10.0.0.0/16"
});

const droplet = await createDroplet({
  name: "web-01",
  region: "nyc1",
  size: "s-1vcpu-1gb",
  image: "ubuntu-24-04-x64",
  vpc_uuid: vpc.id
});
```

Auth is always `Authorization: Bearer $DO_TOKEN` against `https://api.digitalocean.com/v2`. Requests go through a shared client that wraps DigitalOcean error payloads.

## Standalone `grape` CLI

`grape` loads a YAML or JSON config from a **local path or HTTP(S) URL**, validates it, and optionally applies it.

```bash
grape validate -c ./grape.config.yaml
grape apply -c ./grape.config.yaml
grape apply -c https://example.com/grape.config.yaml
grape status
grape help
```

`-c` / `--config` is required for `apply` and `validate`.

### Config schema

```yaml
version: "0.1"
provider: digitalocean          # required
credentials:
  source: env                   # only env is supported
  env: DO_TOKEN                 # env var that holds the token
region: nyc1                    # default region for resources that omit one

resources:
  tags:
    - prod
  ssh_keys:
    - name: laptop
      public_key: ssh-ed25519 AAAA...
    # or: generate: true  (creates a local key pair and uploads the public key)
  vpcs:
    - name: main
      ip_range: 10.10.0.0/16
  droplets:
    - name: web-01
      size: s-1vcpu-1gb
      image: ubuntu-24-04-x64
      vpc: main                 # resolved from a VPC created in this apply
  firewalls:
    - name: web
      droplets: [web-01]
      inbound:
        - protocol: tcp
          ports: "80,443"
          sources: ["0.0.0.0/0"]
  domains:
    - name: example.com
      records:
        - type: A
          name: www
          data: 203.0.113.10
```

`validate` only checks this schema. `apply` calls the DigitalOcean API in dependency order: tags → SSH keys → VPCs → droplets → firewalls → domains/records → load balancers → alert policies → apps.

See `examples/grape.config.yaml` for a fuller sample. Convenience sections from earlier docs (`networking.vpc`, top-level `firewall`, `ssh`) are accepted and folded into `resources` before apply.

## Usage with Kiwi

The Rust `kiwi` CLI does not reimplement DigitalOcean logic. It delegates to `grape` on `PATH`:

```bash
kiwi --grape -c ./grape.config.yaml
kiwi grape -c ./grape.config.yaml
kiwi grape validate -c https://example.com/grape.config.yaml
```

Install `@citrusworx/grapevine` so `grape` is available, then run those commands from the same environment.

## Development

```bash
yarn workspace @citrusworx/grapevine build
yarn workspace @citrusworx/grapevine test
```
