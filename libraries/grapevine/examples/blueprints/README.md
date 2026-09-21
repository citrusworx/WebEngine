# Downloadable DigitalOcean blueprints

Progressive Grapevine starters for DigitalOcean. **Grapevine-only** — KiwiEngine is not required.

They follow a live smoke-test path: tag and VPC first (no droplet cost), then a droplet in that VPC, then a firewall for an existing droplet, then a one-shot full stack.

| File | What it creates | Cost |
| --- | --- | --- |
| [`01-vpc-and-tag.yaml`](./01-vpc-and-tag.yaml) | Tag `grapevine` + VPC `grapevine` (`10.120.0.0/16`, `nyc1`) | Free |
| [`02-droplet-in-vpc.yaml`](./02-droplet-in-vpc.yaml) | Tag, generated SSH key, VPC, droplet `grapevine-web-01` | Droplet (`s-1vcpu-1gb`) |
| [`03-web-firewall.yaml`](./03-web-firewall.yaml) | Firewall attached to an **existing** droplet | Free |
| [`04-full-web-stack.yaml`](./04-full-web-stack.yaml) | Tag + SSH + VPC + droplet + firewall in one apply | Droplet (`s-1vcpu-1gb`) |
| [`05-static-site-spaces.yaml`](./05-static-site-spaces.yaml) | Space + Let's Encrypt certificate + CDN endpoint for a static site (Juice-style) | Space storage + CDN (no droplet) |
| [`kiwipress-compose/`](./kiwipress-compose/) | KiwiPress compose: VPC + droplet + firewall + Docker Compose stack | Droplet (`s-2vcpu-4gb`) |
| [`kiwipress-managed/`](./kiwipress-managed/) | Managed MySQL + Postgres + droplet compose app layer | Droplet + 2× managed DB |

## Prerequisites

1. Install `@citrusworx/grapevine` so the `grape` CLI is on your `PATH` (`npx grape` also works).
2. Export a DigitalOcean personal access token:

   ```bash
   export DO_TOKEN=dop_v1_...
   ```

3. Copy a starter into the current directory, or validate a file in place:

   ```bash
   grape init --list
   grape init 01                    # writes ./grape.config.yaml
   grape init kiwipress-compose     # writes ./kiwipress-compose/
   grape validate -c ./grape.config.yaml
   grape plan -c ./grape.config.yaml
   grape apply -c ./grape.config.yaml
   ```

   Or:

   ```bash
   grape validate -c ./01-vpc-and-tag.yaml
   grape apply -c ./01-vpc-and-tag.yaml
   ```

`validate` checks the Grapevine schema only. `apply` calls the DigitalOcean API in dependency order (tags → SSH keys → VPCs → databases → droplets → firewalls → domains → load balancers → alerts → apps → Spaces → certificates → CDN). KiwiPress packs also generate droplet `user_data` from the `stack` section.

`05-static-site-spaces.yaml` is the static-site path (Spaces + CDN + a certificate), aimed at a public Vite build such as `apps/juice` (`@citrusworx/juiceapp`). It does **not** run `yarn workspace @citrusworx/juiceapp build` and it does **not** upload `dist/`. Replace `replace-space-name`, `example.com`, and `static.example.com` before apply. Spaces calls need `DO_SPACES_ACCESS_KEY_ID` and `DO_SPACES_SECRET_ACCESS_KEY` in addition to `DO_TOKEN`. `grape validate` and `grape plan` do not need those tokens.

Each KiwiPress pack has its own README (`kiwipress-compose/README.md`, `kiwipress-managed/README.md`) for compose assets, env placeholders, and what is deferred (wizard API).

## Placeholders

`03-web-firewall.yaml` and `04-full-web-stack.yaml` include values you must replace with your own:

| Placeholder | Used in | Replace with |
| --- | --- | --- |
| `REPLACE_DROPLET_ID` | `03` | Numeric DigitalOcean droplet id (not a name) |
| `REPLACE_WITH_YOUR_IP` | `03`, `04`, KiwiPress packs | Your public IPv4 address for SSH (`/32`) |
| `REPLACE_ME` | KiwiPress `stack/.env.example` | Local secrets (never commit real passwords) |

Fill **`REPLACE_DROPLET_ID` before `grape validate`**. The schema expects `droplet_ids` to be numbers, so the placeholder string will fail validation until you substitute a real id.

`REPLACE_WITH_YOUR_IP` is a string, so `04` can validate with the placeholder still in place — replace it before `apply` so SSH is not opened to a bogus source.

Do not commit real IPs, droplet ids, or VPC UUIDs.

## SSH keys (`generate: true`)

Blueprints `02` and `04` create an account SSH key with `generate: true`. Grapevine uploads the public key and writes the matching OpenSSH private key (mode `0600`) to `private_key_path`, or to `.grape/ssh/<name>` under the process cwd when that field is omitted. Apply JSON reports the saved path (`private_key_path` / `private_key_paths` / a warning) and never includes key material.

`.grape/` is local-only — do not commit it. Connect with `ssh -i <saved-path>`. Use an existing key (`public_key: ssh-ed25519 …`) if you already control a keypair.
