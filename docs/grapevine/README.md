# Grapevine

DigitalOcean provisioning from YAML or TypeScript.

Grapevine is the CitrusWorx infra library: describe droplets, VPCs, firewalls, SSH keys, domains, and a handful of related resources, then create them through the DigitalOcean API. A `grape` CLI loads a config file (or URL) and applies it in dependency order.

The current model is:

- **Provider is DigitalOcean.** The Zod schema’s `provider` field is the literal `"digitalocean"`.
- **Two entry styles:** call exported functions (`createDroplet`, `createVPC`, …) or declare `resources` in a grape config and `applyGrapeConfig` / `grape apply`.
- **Blueprints** are YAML documents that hoist into `resources` (a droplet/VPC/firewall under `blueprint:` is folded in).
- **Credentials** come from an env var (`DO_TOKEN` by default).

Grapevine is strongest when you treat it as a typed DigitalOcean client plus an apply engine. It is not a multi-cloud layer, not Terraform, and not a GUI.

## Who it is for

- People who want droplets / VPCs / firewalls in git without writing `curl` to `api.digitalocean.com`
- App repos that already have `@citrusworx/grapevine` and a token
- Operators following the downloadable starters in `libraries/grapevine/examples/blueprints/`

It is not for AWS/GCP/Azure (those names are roadmap only). It does not deploy your Node app onto the droplet.

## Why it exists

Infrastructure in CitrusWorx should be a file, not a click-path that only one person remembers. Juice put structure in attributes; Nectarine put tables in YAML; Grapevine puts **machines and networks** in YAML.

The alternative in this stack was “SSH into DigitalOcean’s dashboard and hope staging matches prod.” Grapevine exists so:

- the same `resources:` document can be validated without calling the API (`grape validate`)
- apply order is fixed (tags → SSH keys → VPCs → droplets → firewalls → domains → load balancers → alerts → apps)
- TypeScript callers and YAML callers share one schema (`grapeConfigSchema`)

Multi-cloud is a *possible* future if other adapters land. Shipping a fake `provider: aws` today would be a lie — the schema rejects it.

## Current setup shape

```bash
yarn add @citrusworx/grapevine
export DO_TOKEN=dop_v1_...
```

```bash
npx grape validate -c ./grape.config.yaml
npx grape apply -c ./grape.config.yaml
```

```ts
import { loadGrapeConfig, applyGrapeConfig } from "@citrusworx/grapevine";

const config = await loadGrapeConfig("./grape.config.yaml");
const result = await applyGrapeConfig(config);
console.log(result.droplets, result.warnings);
```

## What it can do

### 1. Validate and apply a resource document

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
export DO_TOKEN=dop_v1_...
grape validate -c ./01-vpc-and-tag.yaml
grape apply -c ./01-vpc-and-tag.yaml
```

`validate` only runs Zod. `apply` calls DigitalOcean: `createTag` then `createVPC`.

### 2. One apply: tag, SSH key, VPC, droplet

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

`generate: true` creates a key pair and uploads the **public** key. The private key is **not** written to disk. Use `public_key:` if you need a key you already control.

Droplet `vpc: grapevine` is resolved to the UUID of the VPC created earlier in the same apply.

### 3. Call the DigitalOcean functions directly

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

### 4. Firewall rules with name or id references

On apply, `firewalls[].droplets: [web-01]` looks up droplet ids created in the same run. `droplet_ids: [123]` is the numeric DigitalOcean id.

```yaml
resources:
  firewalls:
    - name: web
      droplets: [web-01]
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

Sources that are plain CIDRs become `addresses`. Prefixes `tag:` and `droplet:` are also recognized when `apply` normalizes rules.

### 5. CLI status

```bash
grape status                 # is DO_TOKEN set? live counts if it is
grape status -c ./grape.config.yaml
```

Commands: `apply`, `validate`, `status`, `help`. There is no `grape gui`, no `grapevine init`.

### 6. Other DigitalOcean surfaces (functions exist)

Exported from the same package, used by apply when present in `resources`:

| Resource | Apply field | Examples of functions |
|---|---|---|
| Tags | `resources.tags` | `createTag`, `tagResource` |
| SSH | `resources.ssh_keys` | `createSSHKey`, `uploadSSHKey` |
| VPCs | `resources.vpcs` | `createVPC`, `createPeering` |
| Droplets | `resources.droplets` | `createDroplet`, `deployByBlueprint`, `NukeDroplet` |
| Firewalls | `resources.firewalls` | `createFireWall`, `addRulesToFirewall` |
| Domains | `resources.domains` | `createDomain`, `createDomainRecord` |
| Load balancers | `resources.load_balancers` | `createLoadBalancer` |
| Alert policies | `resources.alert_policies` | `createAlertPolicy` |
| Apps | `resources.apps` | `createApp`, `createAppFromBlueprint` |

Also exported, **not** driven by `applyGrapeConfig`: images, security scans, deployment-log helpers, `cleanPayload`, `parseYAML`.

## Mental model

```text
grape.config.yaml
        │
 loadGrapeConfig / parseConfigText
        │
 grapeConfigSchema (provider: "digitalocean")
        │
 hoistBlueprintDocument + normalizeResources
        │
 applyGrapeConfig  →  DigitalOcean HTTP (doRequest)
```

Convenience fields `networking.vpc`, `networking.domain`, `firewall`, `ssh` are folded into `resources` during normalize. `services:` is **accepted by Zod and ignored at apply** (a warning is pushed). Put compute under `resources.droplets` or `resources.apps`.

## What is not here

| Claim | Reality |
|---|---|
| AWS / Linode / Azure / GCP | Not in the schema or `src/providers` |
| grapeGUI / `yarn grapevine gui` | No such command |
| WebEngine dashboard edits | Not in this package |
| `DigitalOcean.VPC.create` class | Functions, not a namespace class |
| Apply `services.frontend.type: app` | Warning only |
| SSH into the box and run commands | Not implemented |
| State file / update / destroy plan | Apply creates; deletes are explicit function calls |
| Marketplace of blueprints | Examples folder only |

## Suggested reading order

1. [Getting Started](./grapevine-getting-started.md) — token, first validate/apply
2. [Configuration](./grapevine-config.md) — schema fields that apply actually uses
3. [DigitalOcean guide](./grapevine-digitalocean.md) — regions, droplets, firewalls, SSH
4. [API Reference](./grapevine-api.md) — function list
5. [Examples](./grapevine-examples.md) — starters + TypeScript
6. [Status](./grapevine-status.md) — shipped vs planned
7. In-repo blueprints: `libraries/grapevine/examples/blueprints/`

Practical DigitalOcean notes also live under [infrastructure/digitalocean](./infrastructure/digitalocean/README.md).

## Status

**Active development** (`@citrusworx/grapevine` 0.2.1), DigitalOcean-only. The apply engine and CLI are real. Multi-cloud and GUIs are not.

## Sibling packages

- [Nectarine](../nectarine/README.md) — data on a machine Grapevine created
- [Seltzer](../seltzer/README.md) — HTTP process you still have to run
- [Sig.js](../sigjs/README.md) / [Juice](../juice/README.md) — UI; no Grapevine dashboard
- [Types](../types/README.md) — shared TS types used by some Grapevine payloads
