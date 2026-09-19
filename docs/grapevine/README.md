# Grapevine

DigitalOcean provisioning from YAML or TypeScript.

Grapevine is the CitrusWorx infra library: describe droplets, VPCs, firewalls, SSH keys, domains, and a handful of related resources, then create them through the DigitalOcean API. A `grape` CLI loads a config file (or URL) and applies it in dependency order.

The current model is:

- **Provider is DigitalOcean.** The Zod schema’s `provider` field is the literal `"digitalocean"`.
- **Two entry styles:** call exported functions (`createDroplet`, `createVPC`, …) or declare `resources` in a grape config and `applyGrapeConfig` / `grape apply`.
- **Blueprints** are YAML documents that hoist into `resources` (a droplet/VPC/firewall under `blueprint:` is folded in).
- **Credentials** come from an env var (`DO_TOKEN` by default).

Grapevine is strongest when you treat it as a typed DigitalOcean client plus a create-only apply engine. It is not a multi-cloud layer, not Terraform, and not a GUI.

## Who it is for

- People who want droplets, VPCs, and firewalls in git without writing `curl` to `api.digitalocean.com`
- App repos that already have `@citrusworx/grapevine` and a DigitalOcean token
- Operators following the downloadable starters in `libraries/grapevine/examples/blueprints/`

It is not for AWS, GCP, Azure, or Linode (those names are roadmap only). It does not deploy your Node app onto the droplet. It does not open a dashboard.

## Why it exists

Infrastructure in CitrusWorx should be a file, not a click-path that only one person remembers. Juice put structure in attributes; Nectarine put tables in YAML; Grapevine puts **machines and networks** in YAML.

The alternative in this stack was “SSH into DigitalOcean’s control panel and hope staging matches prod.” Grapevine exists so:

- the same `resources:` document can be validated without calling the API (`grape validate`)
- apply order is fixed (tags → SSH keys → VPCs → databases → droplets → firewalls → domains → load balancers → alerts → apps)
- TypeScript callers and YAML callers share one schema (`grapeConfigSchema`)

The design bets:

- **DigitalOcean first** — one real adapter, not a fake provider interface
- **Schema before HTTP** — Zod decides whether a document is a grape config
- **Create in order** — later resources can name earlier ones from the same apply
- **Functions, not a namespace class** — `createDroplet()`, not `DigitalOcean.Droplet.create`
- **Env for secrets** — the token never belongs in YAML

Multi-cloud is a *possible* future if other adapters land. Shipping a fake `provider: aws` today would be a lie — the schema rejects it.

If you have already written a Juice page or a Sig desk, Grapevine is a different layer: it does not style or animate anything. It talks to DigitalOcean so the app has a machine to run on.

## Current setup shape

```bash
yarn add @citrusworx/grapevine
export DO_TOKEN=dop_v1_...
```

```bash
npx grape validate -c ./grape.config.yaml
npx grape apply -c ./grape.config.yaml
npx grape status
```

```ts
import { loadGrapeConfig, applyGrapeConfig } from "@citrusworx/grapevine";

const config = await loadGrapeConfig("./grape.config.yaml");
const result = await applyGrapeConfig(config);
console.log(result.droplets, result.warnings);
```

Package version today: **0.2.1**. The binary is `grape` (`dist/bin/cli.js`). Commands: `apply`, `validate`, `status`, `help`. There is no `grape gui`, no `grape destroy`, no `grapevine init`.

## What it can do

The sections below are the capability showcase. Every snippet matches `libraries/grapevine/src` and the in-repo blueprints. If a pattern is not here, it is probably not in the library — check [Status](./grapevine-status.md) before assuming Terraform, drift, or another cloud.

### 1. Validate a document without calling DigitalOcean

Checked-in starter (`libraries/grapevine/examples/blueprints/01-vpc-and-tag.yaml`) — no droplet, no compute charge:

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

`validate` only runs Zod after load. It prints `Valid grape config for provider digitalocean` and a JSON count of normalized resources. Wrong `provider` values fail here. DigitalOcean is not contacted.

### 2. Apply that document: tag, then VPC

```bash
export DO_TOKEN=dop_v1_...
grape apply -c ./01-vpc-and-tag.yaml
```

`apply` calls DigitalOcean in order: `createTag("grapevine")` then `createVPC({ name: "grapevine", … })`. The CLI prints `Applied grape config` and the `ApplyResult` JSON (ids, names, `warnings`).

There is no `--dry-run`. If a later step fails, earlier creates stay. Re-applying the same file issues **another** create; Grapevine does not look up existing names.

### 3. One apply: tag, SSH key, VPC, droplet

From `02-droplet-in-vpc.yaml`:

```yaml
resources:
  tags:
    - grapevine
  ssh_keys:
    - name: grapevine
      generate: true
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

`generate: true` creates an RSA 4096 key pair in process, uploads the **public** key, and writes the OpenSSH **private** key (mode `0600`) to `private_key_path` or `.grape/ssh/<name>` under the process cwd. Apply reports the saved path; it never prints key material. `.grape/` is local-only — do not commit it. Use `public_key:` if you already control a keypair.

Droplet `vpc: grapevine` is resolved to the UUID of the VPC created earlier in the **same** apply. Names from a previous apply are not in that map.

This creates a billed droplet. Destroy it in the DigitalOcean UI or call `deleteDroplet` / `NukeDroplet`. `grape apply` has no destroy plan.

### 4. Firewall rules with name or id references

On apply, `firewalls[].droplets: [grapevine-web-01]` looks up droplet ids created in the same run. `droplet_ids: [123]` is the numeric DigitalOcean id (required by `03-web-firewall.yaml` for an already-existing box).

```yaml
resources:
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

Sources that are plain CIDRs become `addresses`. Prefixes `tag:` and `droplet:` are recognized when apply normalizes rules. That is the `04-full-web-stack.yaml` shape: one file, one apply, name resolution in-process.

### 5. Call the DigitalOcean functions directly

There is no `DigitalOcean.Droplet.create("server")` object API. Exports are functions:

```ts
import {
  createSSHKey,
  uploadSSHKey,
  createVPC,
  createDroplet,
  createFireWall,
  deployByBlueprint,
} from "@citrusworx/grapevine";

const key = createSSHKey("laptop");
const uploaded = await uploadSSHKey({
  name: key.name,
  public_key: key.publicKey,
});

const vpc = await createVPC({
  name: "production",
  description: "App VPC",
  region: "nyc1",
  ip_range: "10.0.0.0/16",
});

const droplet = await createDroplet({
  name: "web-01",
  region: "nyc1",
  size: "s-1vcpu-1gb",
  image: "ubuntu-24-04-x64",
  ssh_keys: [uploaded.id],
  vpc_uuid: vpc.id,
  monitoring: true,
  tags: ["prod"],
});

console.log(droplet.id, droplet.status);
```

`deployByBlueprint(path)` reads a `{ blueprint: { droplet } }` YAML file and POSTs `/droplets`. Prefer `applyGrapeConfig` for multi-resource docs.

### 6. Load YAML or JSON from a path or URL

```bash
grape validate -c ./grape.config.yaml
grape apply -c https://example.com/grape.config.yaml
```

```ts
import { loadGrapeConfig } from "@citrusworx/grapevine";

const fromDisk = await loadGrapeConfig("./grape.config.yaml");
const fromUrl = await loadGrapeConfig("https://example.com/grape.config.yaml");
```

`loadGrapeConfig` reads the source, parses JSON if it looks like JSON else YAML, then `validateGrapeConfig` (hoist + Zod). Always pass `-c`; there is no implicit `grapevine.config.yaml` at the repo root.

### 7. Ask `grape status` what it actually knows

```bash
grape status                 # is DO_TOKEN set? live counts if it is
grape status -c ./grape.config.yaml
```

Without `-c`, if `DO_TOKEN` is set, Grapevine lists **account-wide** counts via `listAllDroplets`, `listAllVPCs`, `listAllFirewalls`, and `listAllDomains`. That is not drift detection: it does not compare the file to live resources, and it does not count load balancers, apps, tags, or SSH keys.

With `-c`, status loads the file and prints provider, region, and **normalized resource counts** — the same counts `validate` prints. It does not call DigitalOcean for that summary.

### 8. Fold convenience sections into `resources`

These shortcuts are real. `normalizeResources` copies them into the arrays apply walks:

```yaml
provider: digitalocean
region: nyc1
networking:
  vpc: true                 # → VPC named digitalocean-vpc
  domain: example.com       # → resources.domains unless already present
firewall:
  name: web
  inbound: […]
ssh:
  name: laptop
  public_key: ssh-ed25519 …
```

`networking.ssl` and `networking.cdn` are stored by the schema and **not** applied. Loose `services:` maps still warn. Use top-level `stack` (or a stack-shaped `services` object) for compose bootstrap, and `resources.databases` for DigitalOcean managed databases.

### 9. Tear down with functions, not `grape destroy`

Deletes exist as HTTP helpers. They are not a CLI plan and not the inverse of apply.

```ts
import {
  deleteDroplet,
  NukeDroplet,
  deleteVPC,
  deleteFirewall,
} from "@citrusworx/grapevine";

await NukeDroplet(dropletId);
await deleteFirewall(firewallId);
await deleteVPC(vpcId);
```

Treat them as destructive. Grapevine does not record what the last apply created, so it cannot “destroy this stack” from the YAML alone.

## Mental model

```text
grape.config.yaml  (or URL)
        │
 loadGrapeConfig / parseConfigText
        │
 hoistBlueprintDocument
        │
 grapeConfigSchema (provider: "digitalocean")
        │
 normalizeResources
        │
 applyGrapeConfig  →  DigitalOcean HTTP (doRequest)
        │
 ApplyResult JSON
```

| You want… | Use |
|---|---|
| Check a file without spending money | `grape validate -c …` |
| Create what the file declares | `grape apply -c …` / `applyGrapeConfig` |
| Token + account counts | `grape status` |
| File summary only | `grape status -c …` |
| One droplet from TypeScript | `createDroplet({ … })` |
| One droplet from a droplet-only YAML | `deployByBlueprint(path)` |
| Name a VPC created in this apply | droplet `vpc: that-name` |
| Attach a firewall to this apply’s droplet | `droplets: [that-name]` |
| Attach a firewall to an existing box | `droplet_ids: [123]` |
| A secret | env var (`DO_TOKEN` or `credentials.env`) |

Convenience fields `networking.vpc`, `networking.domain`, `firewall`, `ssh` are folded into `resources` during normalize. Same-apply maps (`vpcIds`, `dropletIds`) live only for that process. There is no state file.

## What is not here

| Claim | Reality |
|---|---|
| AWS / Linode / Azure / GCP | Not in the schema or `src/providers` |
| grapeGUI / `yarn grapevine gui` | No such command |
| WebEngine dashboard edits | Not in this package |
| `DigitalOcean.VPC.create` class | Functions, not a namespace class |
| Apply `services.frontend.type: app` | Warning only |
| SSH into the box and run commands | Not implemented (`user_data` at create only) |
| State file / update / destroy plan | Apply creates; deletes are explicit function calls |
| Drift / reconcile | `grape status` counts; it does not diff |
| Dry-run / `grape plan` | Not implemented |
| Volumes / DOKS / Spaces as grape resources | No first-class apply types |
| Marketplace of blueprints | `examples/blueprints/` only |
| WordPress YAML under `src/blueprints/` | Not a grape config — will not validate |

## Suggested reading order

1. [Getting Started](./grapevine-getting-started.md) — token, first validate/apply
2. [Tutorial](./grapevine-tutorial.md) — guided stack: validate → apply → status on real blueprints
3. [Configuration](./grapevine-config.md) — schema fields that apply actually uses
4. [Apply lifecycle](./grapevine-apply.md) — order, name maps, no rollback, no idempotency
5. [Blueprints](./grapevine-blueprints.md) — in-repo starters vs hoist vs WordPress sketches
6. [DigitalOcean guide](./grapevine-digitalocean.md) — regions, droplets, firewalls, SSH, provider surface
7. [Secrets and env](./grapevine-secrets.md) — `DO_TOKEN`, custom env names, generated keys
8. [Live status](./grapevine-live-status.md) — what `grape status` reports, and what it is not
9. [Patterns](./grapevine-patterns.md) — truthful cookbook for common DigitalOcean stacks
10. [Best Practices](./grapevine-best-practices.md) — how to compose grape configs so they stay honest
11. [Anti-Patterns](./grapevine-anti-patterns.md) — dashboard edits, re-apply, fake clouds, `services:`
12. [Examples](./grapevine-examples.md) — starters + TypeScript
13. [API Reference](./grapevine-api.md) — the public surface, one page
14. [Troubleshooting](./grapevine-troubleshooting.md) — token, placeholders, name resolution
15. [Status](./grapevine-status.md) — Active development maturity matrix
16. [Roadmap](./grapevine-roadmap.md) — what would move Grapevine upward, and what would not

Practical DigitalOcean notes also live under [infrastructure/digitalocean](./infrastructure/digitalocean/README.md).

## Status

**Active development** (`@citrusworx/grapevine` 0.2.1), DigitalOcean-only. The apply engine, CLI, and DO HTTP helpers are real. Multi-cloud, GUIs, drift, and destroy-from-YAML are not.

Active development here means the DigitalOcean create path is real and documented, not that the API is frozen or that other clouds are waiting behind a flag. See [Status](./grapevine-status.md) for the area-by-area matrix and [Roadmap](./grapevine-roadmap.md) for what is worth building next.

## Sibling packages

- [Nectarine](../nectarine/README.md) — data on a machine Grapevine created
- [Seltzer](../seltzer/README.md) — HTTP process you still have to run
- [Sig.js](../sigjs/README.md) / [Juice](../juice/README.md) — UI; no Grapevine dashboard
- [Types](../types/README.md) — shared TS types; declared as a Grapevine dependency, unused in `src/`
