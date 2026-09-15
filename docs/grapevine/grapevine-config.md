# Grapevine Configuration

Reference for documents that pass `grapeConfigSchema` in `libraries/grapevine/src/config/schema.ts`.

The filename is your choice. Examples use `grape.config.yaml` or `0N-*.yaml`. Older docs said `grapevine.config.yaml` at the repo root — that is a convention, not a loader default. Always pass `-c`.

This page is the config-model deep dive. Apply behavior lives in [Apply lifecycle](./grapevine-apply.md). Starter files live in [Blueprints](./grapevine-blueprints.md).

## Minimal valid document

```yaml
provider: digitalocean
```

`version` defaults to `"0.1"`. `credentials` defaults to `{ source: env, env: DO_TOKEN }`. `resources` defaults to `{}`.

`provider` is **only** `"digitalocean"`. `safeValidateGrapeConfig({ provider: "aws" })` fails. There is no other literal in the schema.

An empty resources object validates and applies as a no-op create loop (token is still required for apply).

## How a file becomes a `GrapeConfig`

```text
readConfigSource (fs or axios GET)
        │
parseConfigText (JSON if it looks like JSON, else YAML)
        │
hoistBlueprintDocument
        │
grapeConfigSchema.parse
```

`loadGrapeConfig(source)` is that pipeline. `validateGrapeConfig(input)` is hoist + parse for an already-in-memory value. CLI `validate` / `apply` always go through `loadGrapeConfig`.

Empty files throw. JSON that fails `JSON.parse` falls through to YAML, so some `.json` URLs that actually serve YAML still load.

## Root fields

| Field | Type | Required | Default | Applied? |
|---|---|---|---|---|
| `version` | string | no | `"0.1"` | stored only |
| `grapevine` | string | no | — | stored only |
| `provider` | `"digitalocean"` | **yes** | — | selects the only adapter |
| `credentials` | `{ source: "env", env }` | no | `DO_TOKEN` | apply reads `env` |
| `region` | string | no | — | fallback for VPC / droplet / LB |
| `blueprint` | `{ name?, droplet?, vpc?, firewall? }` | no | — | hoisted into `resources` |
| `resources` | see below | no | `{}` | yes |
| `networking` | `{ vpc?, domain?, ssl?, cdn? }` | no | — | vpc/domain folded; ssl/cdn not applied |
| `firewall` | partial firewall | no | — | folded if it has rules |
| `ssh` | ssh key object | no | — | folded into `ssh_keys` |
| `monitoring` | `{ enabled?, alerts? }` | no | — | **schema only** |
| `services` | `Record<string, unknown>` | no | — | warning, not applied |

Grapevine does not validate DigitalOcean slugs (`nyc1`, `s-1vcpu-1gb`, `ubuntu-24-04-x64`) beyond “non-empty string.” Wrong values fail at the API.

## `credentials`

```yaml
credentials:
  source: env
  env: DO_TOKEN
```

`source` is the literal `"env"`. There is no `file`, `vault`, or `flag` variant in Zod. The token value itself must never appear in YAML — only the **name** of the environment variable.

Apply calls `getDoToken(envName)` and, if `envName !== "DO_TOKEN"`, copies the value onto `process.env.DO_TOKEN` for `doRequest`. See [Secrets and env](./grapevine-secrets.md).

## `resources`

```yaml
resources:
  tags: [prod]                    # or { name, resources: [{ resource_id, resource_type }] }
  ssh_keys:
    - name: laptop
      public_key: ssh-ed25519 …
      # publicKey: …              # alias
      # generate: true
      # private_key_path: .grape/ssh/laptop  # optional; default .grape/ssh/<name>
  vpcs:
    - name: main
      description: Application VPC
      region: nyc1
      ip_range: 10.10.0.0/16
  droplets:
    - name: web-01
      size: s-1vcpu-1gb
      image: ubuntu-24-04-x64
      region: nyc1
      ssh_keys: [123456]
      backups: false
      ipv6: false
      monitoring: true
      tags: [prod]
      user_data: |
        #!/bin/bash
        echo hi
      vpc: main                   # name of a VPC created in this apply
      vpc_uuid: ""                # or a known UUID
      volumes: []                 # forwarded on droplet create if set; no volume API
      with_droplet_agent: true
  firewalls:
    - name: web
      droplets: [web-01]          # names from this apply
      droplet_ids: []
      tags: [prod]
      inbound:
        - protocol: tcp
          ports: "80,443"
          sources: ["0.0.0.0/0"]
      outbound:
        - protocol: tcp
          ports: "all"
          destinations: ["0.0.0.0/0"]
  domains:
    - name: example.com
      ip_address: 203.0.113.20
      records:
        - type: A
          name: www
          data: 203.0.113.20
  load_balancers:
    - name: web-lb
      region: nyc1
      droplet_ids: [111]
      forwarding_rules: []
      health_check: {}
      tag: prod
      vpc_uuid: ""
      redirect_http_to_https: true
  alert_policies:
    - description: High CPU
      type: v1/insights/droplet/cpu
      value: 80
      window: 5m
      compare: GreaterThan
      alerts:
        email: [ops@example.com]
  apps:
    - spec:
        name: my-app
        region: nyc
        services: []
        static_sites: []
        databases: []
        domains: []
```

### Tags

A tag may be a string or `{ name, resources? }`. Apply always `createTag(name)`. If `resources` is present, it then `tagResource(name, resources)` with `{ resource_id, resource_type }` pairs. That attachment is for **already-known** DigitalOcean ids, not names from this apply.

### SSH keys

Required: `name`. You must supply `public_key` / `publicKey` or `generate: true`. Missing both throws at apply, not at Zod (`public_key` is optional in the schema).

`generate: true` calls `createSSHKey(name)` (RSA 4096), writes the OpenSSH private key to `private_key_path` or `.grape/ssh/<name>`, then uploads `publicKey`. The apply result reports the saved path (`ssh_keys[].private_key_path`, `private_key_paths`, and a warning). It never includes private key material.

### VPCs

Required: `name`. `region` falls back to config `region`. `ip_range` is optional at schema; DigitalOcean may still require a usable range.

### Droplets

Required on the blueprint: `name`, `size`, `image`. `region` is optional on the object because apply fills `config.region`.

Two on-disk shapes are valid entries:

**Flat** (preferred in the numbered blueprints):

```yaml
droplets:
  - name: web-01
    size: s-1vcpu-1gb
    image: ubuntu-24-04-x64
    vpc: main
```

**Wrapped** (used in `examples/grape.config.yaml`):

```yaml
droplets:
  - blueprint:
      name: web
      droplet:
        name: web-01
        size: s-1vcpu-1gb
        image: ubuntu-24-04-x64
```

`unwrapDropletEntry` pulls `.blueprint.droplet` out. `volumes` is `string[]` — DigitalOcean volume **ids** you already have. Grapevine does not `POST /volumes`.

### Firewalls

Required: `name`. Attach with `droplets` (names from this apply), `droplet_ids` (numbers), and/or `tags`.

Rules accept `inbound` / `outbound` or `inbound_rules` / `outbound_rules`. `sources` / `destinations` may be:

- a string list (`"0.0.0.0/0"`, `tag:prod`, `droplet:123`)
- a DigitalOcean object (`addresses`, `droplet_ids`, `load_balancer_uids`, `kubernetes_ids`, `tags`)

`kubernetes_ids` and `load_balancer_uids` are payload shape only. Apply does not create DOKS clusters, and load balancers are created **after** firewalls, so a same-apply LB uid will not be available yet.

### Domains, load balancers, alerts, apps

All four arrays are first-class apply resources. Domain records require `type`, `name`, `data`. Alert policies require `description`, `type`, `value` (`window` defaults `"5m"`, `enabled` defaults `true`). Apps require `spec.name`; the rest of `spec` is passed through to App Platform.

Grapevine does not compile a Juice/Sig app into `spec`. You write the App Platform document yourself.

## Top-level shortcuts (folded into `resources`)

```yaml
networking:
  vpc: true                       # creates { name: digitalocean-vpc, region }
  # vpc: { name: main, ip_range: 10.10.0.0/16 }
  domain: example.com             # appends resources.domains unless already present
  ssl: true                       # stored, not applied
  cdn: false                      # stored, not applied

firewall:
  name: main
  inbound: […]
  outbound: […]

ssh:
  name: main
  public_key: ssh-ed25519 …
```

Folding happens in `normalizeResources` **after** schema parse, during apply (and during CLI count). A document that only uses shortcuts still needs `provider: digitalocean`.

Top-level `firewall` is pushed only if at least one of `inbound`, `outbound`, `inbound_rules`, `outbound_rules` is present. A name-only firewall block is ignored.

`networking.vpc: true` names the VPC `${provider}-vpc` → `digitalocean-vpc`. Prefer an explicit `resources.vpcs` entry so droplet `vpc:` can use a name you chose.

## `blueprint` (legacy hoist)

```yaml
provider: digitalocean
blueprint:
  name: web
  droplet:
    name: web-01
    size: s-1vcpu-1gb
    image: ubuntu-24-04-x64
    region: nyc1
  vpc:
    name: main
    region: nyc1
  firewall:
    name: web
    inbound: []
```

`hoistBlueprintDocument` copies these into `resources.droplets/vpcs/firewalls` **before** parse. If `provider` is missing on a hoisted document, the hoist inserts `"digitalocean"`.

Hoist is not recursive into WordPress-shaped YAML. A file with `runtime:` and `services.database` is not this `blueprint` object and will not become a grape config.

## Fields that do not provision

```yaml
services:
  frontend:
    type: app
    entry: apps/front
```

Valid enough to parse. `applyGrapeConfig` adds:

`services is accepted for validation but is not applied. Declare droplets or apps under resources instead.`

Do not write `type: postgres` under `services` and expect a managed database. Managed DBs are not an apply resource (App Platform `spec.databases` is opaque passthrough only).

Top-level `monitoring.enabled` / `monitoring.alerts` are also unused. Alert policies belong under `resources.alert_policies`.

## JSON is allowed

The loader does not require YAML:

```json
{
  "provider": "digitalocean",
  "region": "nyc1",
  "resources": {
    "tags": ["grapevine"]
  }
}
```

`parseConfigText` treats a trimmed document that starts with `{` or `[`, or a source ending in `.json`, as JSON first.

## CLI

```text
grape apply    -c <path|url>
grape validate -c <path|url>
grape status   [-c <path|url>]
grape help
```

`kiwi --grape -c ./grape.config.yaml` is mentioned in the CLI help as an alternate entry; the grape binary itself is `apply|validate|status`.

## Related

- [Apply lifecycle](./grapevine-apply.md)
- [Tutorial](./grapevine-tutorial.md)
- [API Reference](./grapevine-api.md)
