# Grapevine Blueprints

A blueprint in Grapevine is a YAML (or JSON) document the schema accepts. Apply it with `grape apply -c <path>` or `applyGrapeConfig`.

This page is about **which files are real grape configs**, how they progress, and what to ignore.

The product schema lives in `libraries/grapevine/src/config/schema.ts`. Field list: [Configuration](./grapevine-config.md).

## What “blueprint” means here

Three different things in this repo use the word. All three below apply.

| Thing | Path | `grape apply`? |
|---|---|---|
| Resource document | `examples/blueprints/0N-*.yaml`, `examples/grape.config.yaml` | Yes |
| Hoisted `{ blueprint: { droplet, vpc?, firewall? } }` | same schema, optional top-level key | Yes, after hoist |
| KiwiPress packs | `examples/blueprints/kiwipress-compose/`, `kiwipress-managed/` | **Yes** |

There is no marketplace, no `grape blueprint pull`, and no GUI picker.

## Progressive starters

`libraries/grapevine/examples/blueprints/` is the supported teaching path. Grapevine-only — KiwiEngine is not required.

| File | What it creates | Cost | Notes |
|---|---|---|---|
| `01-vpc-and-tag.yaml` | Tag `grapevine` + VPC `grapevine` (`10.120.0.0/16`, `nyc1`) | Free | Start here |
| `02-droplet-in-vpc.yaml` | Tag, generated SSH key, VPC, droplet `grapevine-web-01` | Droplet (`s-1vcpu-1gb`) | `generate: true` |
| `03-web-firewall.yaml` | Firewall on an **existing** droplet | Free | Numeric `droplet_ids` |
| `04-full-web-stack.yaml` | Tag + SSH + VPC + droplet + firewall | Droplet | `droplets: [grapevine-web-01]` |
| `kiwipress-compose/` | Droplet + Compose (Traefik, MinIO, WP, MariaDB, Postgres) | Droplet (`s-2vcpu-4gb`) | `stack:` + assets |
| `kiwipress-managed/` | Managed MySQL + Postgres + droplet app layer | Droplet + 2 DBs | `resources.databases` |

```bash
export DO_TOKEN=dop_v1_...
grape validate -c ./01-vpc-and-tag.yaml
grape apply -c ./01-vpc-and-tag.yaml
```

`validate` checks the Grapevine schema only. `apply` calls DigitalOcean in dependency order (for these files: tags → SSH keys → VPCs → droplets → firewalls).

The folder README is the operator source for placeholders. Summary:

| Placeholder | Used in | Replace with | When |
|---|---|---|---|
| `REPLACE_DROPLET_ID` | `03` | Numeric DigitalOcean droplet id | **Before validate** (schema is `number[]`) |
| `REPLACE_WITH_YOUR_IP` | `03`, `04` | Your public IPv4 for SSH `/32` | Before apply (`04` can still validate) |

Do not commit real IPs, droplet ids, or VPC UUIDs.

## Why the four files exist

They are a smoke-test ladder, not four ways to update one stack.

1. **`01`** proves load + Zod + tag/VPC create without a compute bill.
2. **`02`** proves SSH upload, VPC name → `vpc_uuid`, and droplet create.
3. **`03`** proves a firewall against an id you already have (the name map cannot see yesterday’s droplet).
4. **`04`** proves the name map in one process: droplet name → firewall `droplet_ids`.

Applying `01` then `02` then `04` against the same account will try to create **multiple** `grapevine` VPCs and tags. Pick one document per intended create.

## Two document shapes that work

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
  vpc:
    name: grapevine
    region: nyc1
```

`hoistBlueprintDocument` also defaults missing `provider` to `"digitalocean"` on this shape.

Droplet **entries** inside `resources.droplets` may themselves be wrapped:

```yaml
droplets:
  - blueprint:
      name: web
      droplet:
        name: web-01
        size: s-1vcpu-1gb
        image: ubuntu-24-04-x64
```

That is `examples/grape.config.yaml`. `unwrapDropletEntry` handles it at apply time.

## Droplet-only helper

`src/providers/digitalocean/droplet/create-single-droplet.yaml` is a `{ blueprint: { name, droplet } }` template for `deployByBlueprint(path)`. Empty placeholder fields are stripped by `cleanPayload` before POST `/droplets`.

```ts
import { deployByBlueprint } from "@citrusworx/grapevine";

const droplet = await deployByBlueprint("./web.yaml");
```

For VPC + firewall + keys, use `applyGrapeConfig` / `grape apply`. `deployByBlueprint` does not walk `resources`.

## Full resource example

`libraries/grapevine/examples/grape.config.yaml` — tag, SSH (`public_key` placeholder), VPC, wrapped droplet, firewall, domain record. Swap the public key and IPs before apply.

It is a catalog of fields, not a better starter than `01`–`04`. Prefer the numbered files until you need a domain.

## KiwiPress packs are Grapevine IaC

`examples/blueprints/kiwipress-compose/` and `kiwipress-managed/` are executable grape configs plus compose/scripts. `src/blueprints/wordpress/` is only a README that points at those packs. The old aspirational `blueprint.yaml` sketches are gone.

```bash
grape init kiwipress-compose
grape validate -c ./kiwipress-compose/grape.config.yaml
grape plan -c ./kiwipress-compose/grape.config.yaml
```

`apps/kiwipress` wizard wiring is not part of these packs.

## SSH keys in `02` and `04`

Both create an account SSH key with `generate: true`. Grapevine uploads the public key and writes the matching OpenSSH private key to `private_key_path` or `.grape/ssh/<name>`. Apply reports the path, not the key. `.grape/` is local-only. Use an existing key (`public_key: ssh-ed25519 …`) if you already control a keypair. See [Secrets and env](./grapevine-secrets.md).

## Authoring a new blueprint

1. Start from `01`, `04`, or a KiwiPress pack directory.
2. Keep `provider: digitalocean` and `credentials.source: env`.
3. Put everything you need in **one** file if names must resolve (`vpc:`, `droplets:`).
4. `grape validate -c` until counts look right (remember shortcuts fold in).
5. Apply once. Do not re-apply to “converge.”
6. Save `ApplyResult` ids if you will delete later.

Optional keys can be omitted. `cleanPayload` strips empty strings, empty arrays, and empty objects on some POST paths (`deployByBlueprint`); applying a grape config still sends what `create*` builds after unwrap.

## Related

- [Tutorial](./grapevine-tutorial.md)
- [Examples](./grapevine-examples.md)
- [infrastructure/digitalocean/blueprints.md](./infrastructure/digitalocean/blueprints.md)
