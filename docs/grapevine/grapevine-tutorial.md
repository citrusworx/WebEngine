# Grapevine Tutorial — Provisioning a Small DigitalOcean Stack

This tutorial walks through provisioning a small DigitalOcean stack with Grapevine the way the library works today.

The goal is to show how Grapevine should be composed in real YAML:

- Zod owns whether the document is a grape config
- `grape validate` owns “is this applyable?” without spending money
- `grape apply` owns create order and same-apply name maps
- `grape status` owns token presence and (optionally) account counts
- function exports own one-off creates and deletes
- DigitalOcean owns billing, uniqueness, and the live account

If you have already built a static page with the [Juice tutorial](../juice/juice-page-tutorial.md) or a live desk with the [Sig tutorial](../sigjs/sig-page-tutorial.md), this is the same kind of guided build — except the “page” is a VPC, a droplet, and a firewall.

## What we are building

A **small web stack** on DigitalOcean, using the files that already live in `libraries/grapevine/examples/blueprints/`:

1. a token and a working `grape` binary
2. validate `01-vpc-and-tag.yaml` (tag + VPC, no compute charge)
3. apply that file, then read `grape status`
4. grow into a droplet with an SSH key you control (`02` shape)
5. attach a firewall in the **same** apply (`04` shape, name resolution)
6. the same stack as a TypeScript `applyGrapeConfig` call

By the end you will have used every public operator primitive that is worth teaching: `grape validate`, `grape apply`, `grape status`, `loadGrapeConfig`, `applyGrapeConfig`, same-apply `vpc:` / `droplets:` maps, and the honest limits (no dry-run, no drift, no destroy CLI).

## Cost and safety

`validate` is free and offline from DigitalOcean’s point of view.

`apply` on `01-vpc-and-tag.yaml` creates a tag and a VPC. Those are not billed as droplets.

`apply` on `02` or `04` creates an `s-1vcpu-1gb` droplet. That **costs money** until you delete it. This tutorial shows the YAML either way: you can stop after step 3 if you only want to learn the CLI.

There is no Grapevine sandbox. Resources land on the account the token belongs to.

## Setup

```bash
yarn add @citrusworx/grapevine
export DO_TOKEN=dop_v1_...
```

Copy the blueprint folder somewhere you can edit:

```bash
cp -R libraries/grapevine/examples/blueprints ./grape-blueprints
cd grape-blueprints
grape help
```

You should see `apply`, `validate`, `status`, and `-c`. If `grape` is missing, run `yarn workspace @citrusworx/grapevine build` in the monorepo and use `npx grape`.

Keep a second terminal for DigitalOcean’s API if you want an independent check:

```bash
curl -s -H "Authorization: Bearer $DO_TOKEN" https://api.digitalocean.com/v2/account
```

Grapevine’s `doRequest` uses the same header. Failures become `DigitalOceanError`.

## Step 1: Confirm the CLI and the token

```bash
grape help
grape status
```

Why this works:

- `help` is the default command when you pass nothing. There is no hidden `init`.
- `status` without `-c` prints `DO_TOKEN is set` or `DO_TOKEN is not set`.
- If the token is set, it then lists live counts of droplets, VPCs, firewalls, and domains.

Best-practice notes:

- `status` always reads the env name `DO_TOKEN`, even if a later config uses `credentials.env: MY_DO_TOKEN`.
- Those counts are **account-wide**. They are not “what this file would create.”
- If the token is invalid, you get `Live status unavailable: …` and exit 0. That is not a schema error.

This is the pattern to reach for whenever you want to know “can this shell talk to DigitalOcean?” — not “does my YAML match production.”

## Step 2: Validate a free stack

Open `01-vpc-and-tag.yaml`. It is already a complete grape config:

```yaml
version: "0.1"
provider: digitalocean
credentials:
  source: env
  env: DO_TOKEN
region: nyc1

resources:
  tags:
    - grapevine
  vpcs:
    - name: grapevine
      description: Grapevine starter VPC
      ip_range: 10.120.0.0/16
```

```bash
grape validate -c ./01-vpc-and-tag.yaml
```

Why this works:

- `loadGrapeConfig` reads the file, parses YAML, hoists any `blueprint:` block (none here), then `grapeConfigSchema.parse`.
- `provider: digitalocean` is required. `version` would have defaulted to `"0.1"`.
- Counts are produced by `normalizeResources`, which is the same fold apply uses.

Try a bad provider on a scratch copy:

```yaml
provider: aws
```

Validate exits 1. The schema’s `provider` field is `z.literal("digitalocean")`. That failure is the honest multi-cloud story: there is no adapter to miss — the document is not a grape config.

This is the pattern to reach for whenever the thing you want is **certainty the file is applyable**, not a preview of DigitalOcean’s response.

## Step 3: Apply the VPC

```bash
grape apply -c ./01-vpc-and-tag.yaml
```

You should see `Applied grape config` and JSON that includes a tag name and a VPC id.

Why this works:

- Apply order for this file is tags, then VPCs. SSH, droplets, and firewalls are empty arrays.
- `createTag("grapevine")` POSTs `/tags`. `createVPC({ name: "grapevine", region: "nyc1", ip_range: "10.120.0.0/16" })` POSTs `/vpcs`.
- Region on the VPC comes from the resource, or falls back to config `region`.

Then:

```bash
grape status
grape status -c ./01-vpc-and-tag.yaml
```

Best-practice notes:

- Bare `status` should now show at least one more VPC than before (plus whatever else the account already had).
- `status -c` still prints `{ "tags": 1, "vpcs": 1, … }`. It does **not** fetch that VPC’s id. It is a file summary, not drift.
- Applying `01` a second time will try to create the same tag and VPC again. DigitalOcean may reject the duplicate. Grapevine will not skip “already exists.”

If apply fails halfway (token scope, invalid `ip_range`), whatever succeeded remains. There is no rollback.

## Step 4: Add an SSH key and a droplet

`02-droplet-in-vpc.yaml` is the billed step. Read it before you apply it.

The in-repo file uses `generate: true`. Grapevine uploads the public key and writes the OpenSSH private key to `.grape/ssh/grapevine` (or `private_key_path`). Apply reports that path; it never prints the key. Connect with `ssh -i .grape/ssh/grapevine`. `.grape/` is local-only — do not commit it.

For a stack you intend to SSH into with a key you already keep, copy `02` and replace the key block:

```yaml
version: "0.1"
provider: digitalocean
credentials:
  source: env
  env: DO_TOKEN
region: nyc1

resources:
  tags:
    - grapevine
  ssh_keys:
    - name: grapevine
      public_key: ssh-ed25519 AAAA...your-key
  vpcs:
    - name: grapevine
      description: Grapevine starter VPC
      ip_range: 10.120.0.0/16
  droplets:
    - name: grapevine-web-01
      size: s-1vcpu-1gb
      image: ubuntu-24-04-x64
      vpc: grapevine
      monitoring: true
      tags: [grapevine]
```

```bash
grape validate -c ./02-droplet-in-vpc.yaml
# only when you mean to create a droplet:
grape apply -c ./02-droplet-in-vpc.yaml
```

Why this works:

- SSH keys run before VPCs and droplets. The uploaded key id is remembered in `sshKeyIds`.
- If the droplet omits `ssh_keys`, apply attaches every key uploaded in this run.
- `vpc: grapevine` is **not** sent to DigitalOcean as a name. Apply looks up `vpcIds.get("grapevine")` from VPCs created **in this process** and sets `vpc_uuid`.
- `region` on the droplet falls back to `nyc1` from the document root.

Best-practice notes:

- This file creates **another** tag and **another** VPC named `grapevine` if you already applied `01`. Prefer one document that declares the whole stack (`04`), or delete the first VPC first.
- `vpc: grapevine` cannot see a VPC that already exists in the account unless you pass `vpc_uuid` yourself. The name map is same-apply only.
- `size` and `image` are strings Grapevine does not enum. Wrong slugs fail at the API.

This is the pattern to reach for whenever the changing thing is **a small Linux box on a private network**, not an App Platform spec.

## Step 5: Attach a firewall in the same apply

Two in-repo shapes exist. They are not interchangeable.

**Existing droplet** — `03-web-firewall.yaml` uses numeric `droplet_ids`. Fill placeholders **before validate**:

```yaml
resources:
  firewalls:
    - name: grapevine-web
      droplet_ids: [123456789]
      inbound:
        - protocol: tcp
          ports: "22"
          sources: ["203.0.113.10/32"]
```

`REPLACE_DROPLET_ID` is a string. The schema wants `z.array(z.number())`. Validate will fail until you substitute a real id.

**Same-apply droplet** — `04-full-web-stack.yaml` uses names:

```yaml
  firewalls:
    - name: grapevine-web
      droplets: [grapevine-web-01]
      inbound:
        - protocol: tcp
          ports: "22"
          sources: ["REPLACE_WITH_YOUR_IP/32"]
        - protocol: tcp
          ports: "80,443"
          sources: ["0.0.0.0/0"]
        - protocol: icmp
          sources: ["0.0.0.0/0"]
      outbound:
        - protocol: tcp
          ports: "all"
          destinations: ["0.0.0.0/0"]
        - protocol: udp
          ports: "all"
          destinations: ["0.0.0.0/0"]
        - protocol: icmp
          destinations: ["0.0.0.0/0"]
```

Replace `REPLACE_WITH_YOUR_IP` before apply so SSH is not opened to a bogus source. The placeholder is a string, so `04` can still **validate** with it in place.

```bash
grape validate -c ./04-full-web-stack.yaml
grape apply -c ./04-full-web-stack.yaml
```

Why this works:

- Firewalls run after droplets. `droplets: [grapevine-web-01]` is mapped through `dropletIds` filled when `createDroplet` returned.
- String sources become `{ addresses: […] }` unless they start with `tag:` or `droplet:`.
- `inbound` is an alias for `inbound_rules`. Apply concatenates `droplet_ids` and resolved names.

Best-practice notes:

- `03` is the right file when the droplet already exists and you know its id.
- `04` is the right file when you want tag + key + VPC + droplet + firewall from a cold start.
- Mixing “I already have a VPC named grapevine” with `04` will try to create a second VPC. Apply does not import.

This is the pattern to reach for whenever you want **SSH locked to your /32 and HTTP open**, declared next to the droplet rather than clicked in the control panel afterwards.

## Step 6: The same stack in TypeScript

YAML is not required. `validateGrapeConfig` accepts a plain object:

```ts
import { applyGrapeConfig, validateGrapeConfig } from "@citrusworx/grapevine";

const config = validateGrapeConfig({
  provider: "digitalocean",
  region: "nyc1",
  resources: {
    tags: ["grapevine"],
    ssh_keys: [
      {
        name: "grapevine",
        public_key: process.env.GRAPE_SSH_PUBLIC_KEY,
      },
    ],
    vpcs: [
      {
        name: "grapevine",
        description: "Grapevine starter VPC",
        ip_range: "10.120.0.0/16",
      },
    ],
    droplets: [
      {
        name: "grapevine-web-01",
        size: "s-1vcpu-1gb",
        image: "ubuntu-24-04-x64",
        vpc: "grapevine",
        monitoring: true,
        tags: ["grapevine"],
      },
    ],
    firewalls: [
      {
        name: "grapevine-web",
        droplets: ["grapevine-web-01"],
        inbound: [
          {
            protocol: "tcp",
            ports: "22",
            sources: [`${process.env.GRAPE_SSH_CIDR}`],
          },
          {
            protocol: "tcp",
            ports: "80,443",
            sources: ["0.0.0.0/0"],
          },
        ],
        outbound: [
          {
            protocol: "tcp",
            ports: "all",
            destinations: ["0.0.0.0/0"],
          },
        ],
      },
    ],
  },
});

const result = await applyGrapeConfig(config);
console.log(result.droplets[0]?.id, result.firewalls[0]?.id);
if (result.warnings.length) {
  console.warn(result.warnings);
}
```

Why this works:

- The object is the same document the YAML parser would have produced.
- Secrets stay in the environment (`DO_TOKEN` for the API, your public key / SSH CIDR for the firewall). They are not hard-coded in a committed file.
- `applyGrapeConfig` is what `grape apply` calls after load.

You can also skip the schema and call `createVPC` / `createDroplet` / `createFireWall` yourself. That is better for one-offs and for deletes. It is worse for “this repo’s staging stack” because you lose the single document and the name maps.

## Full example

A compact YAML that matches the tutorial’s intended stack (swap the public key and SSH CIDR):

```yaml
version: "0.1"
provider: digitalocean
credentials:
  source: env
  env: DO_TOKEN
region: nyc1

resources:
  tags:
    - grapevine
  ssh_keys:
    - name: grapevine
      public_key: ssh-ed25519 AAAA...your-key
  vpcs:
    - name: grapevine
      description: Grapevine starter VPC
      ip_range: 10.120.0.0/16
  droplets:
    - name: grapevine-web-01
      size: s-1vcpu-1gb
      image: ubuntu-24-04-x64
      vpc: grapevine
      monitoring: true
      tags: [grapevine]
  firewalls:
    - name: grapevine-web
      droplets: [grapevine-web-01]
      inbound:
        - protocol: tcp
          ports: "22"
          sources: ["203.0.113.10/32"]
        - protocol: tcp
          ports: "80,443"
          sources: ["0.0.0.0/0"]
      outbound:
        - protocol: tcp
          ports: "all"
          destinations: ["0.0.0.0/0"]
```

```bash
grape validate -c ./grape.config.yaml
grape apply -c ./grape.config.yaml
grape status
```

## What to notice

- **Validate is the rehearsal.** It cannot tell you the VPC name is taken.
- **Apply is create-only.** The YAML is a request, not a desired-state document.
- **Names resolve in one process.** `vpc: grapevine` and `droplets: [grapevine-web-01]` only see what this apply just created.
- **Status is not drift.** File counts and account counts are different questions.
- **The private key from `generate: true` is on disk** at `.grape/ssh/<name>` (or `private_key_path`). Apply JSON has the path, not the PEM. Use `ssh -i`.
- **Deletes are extra.** `NukeDroplet`, `deleteFirewall`, `deleteVPC` exist. `grape destroy` does not.

## What this tutorial does not pretend

- A second provider. `provider: aws` fails Zod.
- Updating the droplet size by editing YAML and re-applying. That would try to create a second droplet.
- Importing a VPC you clicked together in the DigitalOcean UI, unless you paste its `vpc_uuid`.
- Running apt, docker, or Juice on the box. `user_data` is the only boot hook; there is no SSH runner.
- App Platform, load balancers, domains, or alert policies. Those fields apply if you add them; this tutorial stays with the four progressive blueprints.
- grapeGUI or a WebEngine dashboard. Neither is in this package.
- `DigitalOcean.Droplet.create`. Use `createDroplet`.
- WordPress files under `libraries/grapevine/src/blueprints/wordpress/`. They are not grape configs.

## Tear-down when you are done

From TypeScript, with ids from the apply JSON or the DigitalOcean UI:

```ts
import { NukeDroplet, deleteFirewall, deleteVPC } from "@citrusworx/grapevine";

await NukeDroplet(dropletId);
await deleteFirewall(firewallId);
await deleteVPC(vpcId);
```

Or delete the droplet (and related resources) in the DigitalOcean control panel. Leaving `grapevine-web-01` running will bill.

## Next steps

- [Apply lifecycle](./grapevine-apply.md) — every step `apply.ts` actually runs
- [Blueprints](./grapevine-blueprints.md) — `01`–`04`, hoist, droplet-only YAML
- [Patterns](./grapevine-patterns.md) — named recipes
- [Anti-Patterns](./grapevine-anti-patterns.md) — dashboard drift, re-apply, `services:`
- [Secrets and env](./grapevine-secrets.md)
- [Status](./grapevine-status.md) / [Roadmap](./grapevine-roadmap.md)
