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
  deployByBlueprint,
  type DropletBlueprint,
  type VPCBlueprint
} from "@citrusworx/grapevine";

const vpcBlueprint: VPCBlueprint = {
  name: "production",
  description: "Main network",
  region: "nyc1",
  ip_range: "10.0.0.0/16"
};
const vpc = await createVPC(vpcBlueprint);

const dropletBlueprint: DropletBlueprint = {
  name: "web-01",
  region: "nyc1",
  size: "s-1vcpu-1gb",
  image: "ubuntu-24-04-x64",
  vpc_uuid: vpc.id
};
const droplet = await createDroplet(dropletBlueprint);

// Or a YAML blueprint document: { blueprint: { name, droplet } }
await deployByBlueprint("./src/providers/digitalocean/droplet/create-single-droplet.yaml");
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
    # or: generate: true  (creates a key pair, uploads the public key,
    # and writes an OpenSSH private key to private_key_path or .grape/ssh/<name>)
    #   private_key_path: .grape/ssh/grapevine   # optional; relative to cwd
  vpcs:
    - name: main
      ip_range: 10.10.0.0/16
  droplets:
    # Flat DropletBlueprint fields, or a classic `{ blueprint: { name, droplet } }` document
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

A single-resource YAML blueprint is also valid:

```yaml
grapevine: "1.0"
provider: digitalocean
blueprint:
  name: create-single-droplet
  droplet:
    name: web-01
    region: nyc3
    size: s-1vcpu-1gb
    image: ubuntu-24-04-x64
```

See `examples/grape.config.yaml` and `src/providers/digitalocean/droplet/create-single-droplet.yaml`. Convenience sections from earlier docs (`networking.vpc`, top-level `firewall`, `ssh`) are accepted and folded into `resources` before apply.

When `generate: true`, Grapevine writes the **private** key (OpenSSH format, mode `0600` on POSIX) and reports the absolute path on `ApplyResult.ssh_keys[].private_key_path`, `private_key_paths`, and a warning. Apply JSON never includes key material. Default path is `.grape/ssh/<name>` under the process cwd (create parent dirs as needed). That directory is local-only — do not commit it. Connect with `ssh -i <path>`.

## Downloadable blueprints

Progressive DigitalOcean starters live in [`examples/blueprints/`](./examples/blueprints/). They are Grapevine-only (KiwiEngine is not required):

1. `01-vpc-and-tag.yaml` — tag + VPC (no droplet cost)
2. `02-droplet-in-vpc.yaml` — tag, generated SSH key, VPC, and a droplet
3. `03-web-firewall.yaml` — firewall for an existing droplet (replace placeholders first)
4. `04-full-web-stack.yaml` — one-shot tag + SSH + VPC + droplet + firewall

Copy a file, set `DO_TOKEN`, then `grape validate -c …` / `grape apply -c …`. Details and placeholder rules are in [`examples/blueprints/README.md`](./examples/blueprints/README.md).

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
