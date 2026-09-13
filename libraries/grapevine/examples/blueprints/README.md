# Downloadable DigitalOcean blueprints

Progressive Grapevine starters for DigitalOcean. **Grapevine-only** — KiwiEngine is not required.

They follow a live smoke-test path: tag and VPC first (no droplet cost), then a droplet in that VPC, then a firewall for an existing droplet, then a one-shot full stack.

| File | What it creates | Cost |
| --- | --- | --- |
| [`01-vpc-and-tag.yaml`](./01-vpc-and-tag.yaml) | Tag `grapevine` + VPC `grapevine` (`10.120.0.0/16`, `nyc1`) | Free |
| [`02-droplet-in-vpc.yaml`](./02-droplet-in-vpc.yaml) | Tag, generated SSH key, VPC, droplet `grapevine-web-01` | Droplet (`s-1vcpu-1gb`) |
| [`03-web-firewall.yaml`](./03-web-firewall.yaml) | Firewall attached to an **existing** droplet | Free |
| [`04-full-web-stack.yaml`](./04-full-web-stack.yaml) | Tag + SSH + VPC + droplet + firewall in one apply | Droplet (`s-1vcpu-1gb`) |

## Prerequisites

1. Install `@citrusworx/grapevine` so the `grape` CLI is on your `PATH` (`npx grape` also works).
2. Export a DigitalOcean personal access token:

   ```bash
   export DO_TOKEN=dop_v1_...
   ```

3. Validate, then apply:

   ```bash
   grape validate -c ./01-vpc-and-tag.yaml
   grape apply -c ./01-vpc-and-tag.yaml
   ```

`validate` checks the Grapevine schema only. `apply` calls the DigitalOcean API in dependency order (tags → SSH keys → VPCs → droplets → firewalls).

## Placeholders

`03-web-firewall.yaml` and `04-full-web-stack.yaml` include values you must replace with your own:

| Placeholder | Used in | Replace with |
| --- | --- | --- |
| `REPLACE_DROPLET_ID` | `03` | Numeric DigitalOcean droplet id (not a name) |
| `REPLACE_WITH_YOUR_IP` | `03`, `04` | Your public IPv4 address for SSH (`/32`) |

Fill **`REPLACE_DROPLET_ID` before `grape validate`**. The schema expects `droplet_ids` to be numbers, so the placeholder string will fail validation until you substitute a real id.

`REPLACE_WITH_YOUR_IP` is a string, so `04` can validate with the placeholder still in place — replace it before `apply` so SSH is not opened to a bogus source.

Do not commit real IPs, droplet ids, or VPC UUIDs.

## SSH keys (`generate: true`)

Blueprints `02` and `04` create an account SSH key with `generate: true`. Grapevine uploads the public key; **the matching private key is not persisted to disk yet**. Use an existing key (`public_key: ssh-ed25519 …`) if you need a key you already control.
