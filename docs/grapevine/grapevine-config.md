# Grapevine Configuration

Reference for documents that pass `grapeConfigSchema` in `libraries/grapevine/src/config/schema.ts`.

The filename is your choice. Examples use `grape.config.yaml` or `0N-*.yaml`. Older docs said `grapevine.config.yaml` at the repo root — that is a convention, not a loader default. Always pass `-c`.

## Minimal valid document

```yaml
provider: digitalocean
```

`version` defaults to `"0.1"`. `credentials` defaults to `{ source: env, env: DO_TOKEN }`. `resources` defaults to `{}`.

`provider` is **only** `"digitalocean"`.

## Fields the apply engine uses

### `region`

Default region for VPCs, droplets, and load balancers that omit their own `region`.

### `credentials`

```yaml
credentials:
  source: env
  env: DO_TOKEN
```

`source` is the literal `"env"`.

### `resources`

```yaml
resources:
  tags: [prod]                    # or { name, resources: [{ resource_id, resource_type }] }
  ssh_keys:
    - name: laptop
      public_key: ssh-ed25519 …
      # publicKey: …              # alias
      # generate: true
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
```

Droplets also accept the wrapped form used in `examples/grape.config.yaml`:

```yaml
droplets:
  - blueprint:
      name: web
      droplet:
        name: web-01
        size: s-1vcpu-1gb
        image: ubuntu-24-04-x64
```

`unwrapDropletEntry` pulls `.blueprint.droplet` out.

Firewall rules accept `inbound` / `outbound` or `inbound_rules` / `outbound_rules`. `sources` may be a string list or a DigitalOcean source object (`addresses`, `droplet_ids`, `tags`, …).

### Top-level shortcuts (folded into `resources`)

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

### `blueprint` (legacy hoist)

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

`hoistBlueprintDocument` copies these into `resources.droplets/vpcs/firewalls` before parse.

## Fields that do not provision

```yaml
services:
  frontend:
    type: app
    entry: apps/front
```

Valid enough to parse. `applyGrapeConfig` adds:

`services is accepted for validation but is not applied. Declare droplets or apps under resources instead.`

Do not write `type: postgres` under `services` and expect a managed database. Managed DBs are not an apply resource.

## Apply order

From `apply.ts`:

1. tags (then optional `tagResource`)
2. ssh_keys
3. vpcs
4. droplets (resolve `vpc` name → UUID, attach uploaded SSH ids if the droplet omitted `ssh_keys`)
5. firewalls (resolve `droplets` names → ids)
6. domains + records
7. load_balancers
8. alert_policies
9. apps

There is no rollback if step 5 fails after step 4 created a droplet.

## CLI

```text
grape apply    -c <path|url>
grape validate -c <path|url>
grape status   [-c <path|url>]
grape help
```

`kiwi --grape -c ./grape.config.yaml` is mentioned in the CLI help as an alternate entry; the grape binary itself is `apply|validate|status`.
