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

`grape` loads a YAML or JSON config from a **local path or HTTP(S) URL**, validates it, and optionally applies or tears it down.

```bash
grape help
grape validate -c ./grape.config.yaml
grape plan -c ./grape.config.yaml
grape apply --dry-run -c ./grape.config.yaml
grape apply -c ./grape.config.yaml
grape apply -c https://example.com/grape.config.yaml
grape status
grape status -c ./grape.config.yaml
grape init --list
grape init 02
grape destroy -c ./grape.config.yaml --yes
grape destroy --tag grapevine-smoke --yes
```

Common flags:

| Flag | Meaning |
| --- | --- |
| `-c, --config <path\|url>` | Local YAML/JSON file or HTTP(S) URL (required for `validate`, `plan`, `apply`) |
| `--json` | Machine-readable JSON instead of tables / labeled lines |
| `-y, --yes` | Skip confirmation for `destroy` |
| `--dry-run` | Show what would happen without mutating DigitalOcean (`apply`, `destroy`) |

Human output is the default. Unknown options and validation failures exit non-zero. Every command has `--help`.

`kiwi --grape -c ./grape.config.yaml` still shells out to `grape apply -c …` when `grape` is on `PATH`. Extra flags (`--json`, `--dry-run`, `plan`, `destroy`, `init`) live on the `grape` binary.

### Commands

**`grape validate -c …`** — schema-check only. Prints provider, region, and declared resource names. `--json` includes counts.

**`grape plan -c …`** (same as **`grape apply --dry-run`**) — load and validate, then print the resource graph that *would* be created (counts, names, types, regions). No DigitalOcean API calls.

**`grape apply -c …`** — create resources in dependency order. Prints a labeled receipt. When `generate: true` writes a private key, the absolute path is listed under **Private keys written** (and `private_key_paths` in `--json`). Key material is never printed. `--yes` is accepted but unused unless a future apply step needs confirmation.

**`grape destroy`** — teardown. Requires `-c` and/or `--tag`. Destructive: in a TTY you must confirm, otherwise pass `--yes`. `--dry-run` lists matches without deleting.

v1 matching is conservative:

- From `-c`: unique live names for apps, alert policies, load balancers, firewalls, domains, droplets, SSH keys, non-default VPCs, and tags declared in the config. Duplicate names are skipped with a warning.
- From `--tag`: droplets with that tag, plus firewalls that are clearly attached (firewall has the tag, or every `droplet_ids` entry is in the tagged set). Mixed attachments are skipped.
- Order: apps → alert policies → load balancers → firewalls → domains → droplets → databases → SSH keys → VPCs → tags.
- Default VPCs and ambiguous matches are never deleted. Local `.grape/ssh` private key files are not removed. Droplet delete is asynchronous at DigitalOcean; a VPC or tag may still be busy on the first pass — re-run destroy after droplets finish.

**`grape status`** — live account view (droplets with id/status/region/public+private IPs/tags, VPCs, firewalls with droplet counts, domains). With `-c`, also summarizes the config and notes name overlap with live resources. `--json` dumps the structured inventory.

**`grape init [blueprint]`** — copy a packaged starter. No argument or `--list` lists `01`–`04` plus the KiwiPress packs. File starters write `./grape.config.yaml`. Pack starters (`kiwipress-compose`, `kiwipress-managed`) copy a directory. `--force` overwrites. Blueprints ship in the npm package (`examples/blueprints` and `dist/blueprints`).

**`grape help`** — top-level command list.

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

`validate` only checks this schema. `apply` calls the DigitalOcean API in dependency order: tags → SSH keys → VPCs → **databases** (wait until online) → droplets → firewalls → domains/records → load balancers → alert policies → apps. When a `stack` is present, apply generates droplet `user_data` (cloud-init: install Docker, write compose/env, `docker compose up -d`, health wait) before `POST /droplets`.

### Stack (compose bootstrap)

```yaml
stack:
  name: kiwipress-compose
  droplet: kiwipress-01          # must match a droplet in this config
  workdir: /opt/kiwipress        # default
  compose:
    file: ./stack/docker-compose.yml   # or files: [] or inline: |
  env:
    file: ./stack/.env.example
    keys:
      WP_URL: http://wp.example.test
  files:
    - src: ./scripts/bootstrap.sh
      dest: scripts/bootstrap.sh
  bootstrap:
    script: ./scripts/bootstrap.sh
  health:
    url: http://127.0.0.1/
    wait_seconds: 180
```

Paths resolve relative to the config file. `grape plan` lists the stack plus bootstrap steps (`install-docker`, `write-compose`, `write-env`, `compose-up`, `health-wait`). A top-level `services` map is still warn-only unless it is stack-shaped (`droplet` + `compose` with file/files/inline).

### Managed databases

```yaml
resources:
  databases:
    - name: kiwipress-mysql
      engine: mysql              # pg, mysql, redis, …
      version: "8"
      size: db-s-1vcpu-1gb
      vpc: kiwipress             # same-apply VPC name → private_network_uuid
      wait: true                 # default; poll until status=online
      connection_env:            # baked into stack .env (not printed in apply JSON)
        host: WORDPRESS_DB_HOST
        port: WORDPRESS_DB_PORT
        user: WORDPRESS_DB_USER
        password: WORDPRESS_DB_PASSWORD
        database: WORDPRESS_DB_NAME
```

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
5. `kiwipress-compose/` — KiwiPress compose pack (droplet + Traefik/MinIO/WordPress/MariaDB/Postgres)
6. `kiwipress-managed/` — managed MySQL + Postgres + droplet app layer

Scaffold one into the current directory (no KiwiEngine required):

```bash
grape init --list
grape init 01                    # writes ./grape.config.yaml
grape init kiwipress-compose     # writes ./kiwipress-compose/
grape validate -c ./grape.config.yaml
grape plan -c ./grape.config.yaml
```

Or copy a file from this folder, set `DO_TOKEN`, then `grape validate` / `grape apply`. Details and placeholder rules are in [`examples/blueprints/README.md`](./examples/blueprints/README.md).

## Usage with Kiwi

The Rust `kiwi` CLI does not reimplement DigitalOcean logic. It delegates to `grape` on `PATH`:

```bash
kiwi --grape -c ./grape.config.yaml
kiwi grape -c ./grape.config.yaml
kiwi grape validate -c https://example.com/grape.config.yaml
```

`kiwi grape <action>` always forwards `grape <action> -c <config>`. Flags such as `--json`, `--dry-run`, `init`, and `destroy --tag` are on the `grape` binary.

Install `@citrusworx/grapevine` so `grape` is available, then run those commands from the same environment.

## Development

```bash
yarn workspace @citrusworx/grapevine build
yarn workspace @citrusworx/grapevine test
```
