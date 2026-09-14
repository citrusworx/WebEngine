# Grapevine Patterns

Reusable DigitalOcean stacks built from current Grapevine primitives. These are not new APIs. They are recommended compositions you can copy and adapt.

Each pattern follows the same general rules:

- one grape document per intended create
- Zod owns validity (`grape validate`)
- apply owns create order and same-apply name maps
- env owns the token and any key material you must keep
- DigitalOcean owns uniqueness and billing
- function exports own deletes and one-off GET/PUT

Related:

- [Tutorial](./grapevine-tutorial.md) — these patterns composed into one ladder
- [Best practices](./grapevine-best-practices.md)
- [Examples](./grapevine-examples.md) — longer TypeScript showcases
- In-repo files: `libraries/grapevine/examples/blueprints/`

## Cheap prove-out (tag + VPC)

Use this when you want to learn the CLI or CI-check a document without a droplet bill.

```yaml
version: "0.1"
provider: digitalocean
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
grape apply -c ./01-vpc-and-tag.yaml
```

This is `01-vpc-and-tag.yaml`. Re-applying it is not a health check; it is a second create.

## Staging VPC you will put a droplet on

Use this when the VPC name must be referenced as `vpc: …` later **in the same file**.

```yaml
resources:
  vpcs:
    - name: staging
      description: Staging network
      region: nyc1
      ip_range: 10.130.0.0/16
  droplets:
    - name: staging-web-01
      size: s-1vcpu-1gb
      image: ubuntu-24-04-x64
      vpc: staging
```

`vpc: staging` does not search the account. If the VPC already exists, pass `vpc_uuid` instead of `vpc`, and omit the `vpcs:` create (or accept that apply will try another VPC).

## Web box with a key you already have

Use this for any droplet you will SSH into.

```yaml
resources:
  ssh_keys:
    - name: operator
      public_key: ssh-ed25519 AAAA...
  vpcs:
    - name: grapevine
      ip_range: 10.120.0.0/16
  droplets:
    - name: grapevine-web-01
      size: s-1vcpu-1gb
      image: ubuntu-24-04-x64
      vpc: grapevine
      monitoring: true
      tags: [grapevine]
```

Apply uploads the public key, then attaches every uploaded key id to droplets that omitted `ssh_keys`. Prefer an explicit `ssh_keys: [uploaded-id]` in TypeScript once you have the id.

Do not use `generate: true` here unless you only need DigitalOcean to store a public key you will never log in with.

## Generated key for a throwaway smoke test

Use this when matching `02-droplet-in-vpc.yaml` / `04-full-web-stack.yaml`.

```yaml
ssh_keys:
  - name: grapevine
    generate: true
```

Upload happens; private key does not hit disk. Fine for “did POST /droplets work?” Not fine for an on-call box.

## Web firewall on a droplet created in this apply

Use this when the droplet name is in the same document (`04` shape).

```yaml
resources:
  droplets:
    - name: grapevine-web-01
      size: s-1vcpu-1gb
      image: ubuntu-24-04-x64
      vpc: grapevine
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

String CIDRs become `addresses`. Lock SSH to a `/32`. Open HTTP only if you mean it.

## Web firewall on a droplet that already exists

Use this when you have a numeric id (`03` shape).

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

Fill the id **before** `grape validate`. Names from last week’s apply are not in this process’s `dropletIds` map.

## Tag prefixes and droplet prefixes in rules

Use this when sources are not CIDRs.

```yaml
inbound:
  - protocol: tcp
    ports: "22"
    sources:
      - tag:bastion
      - droplet:111222
      - 203.0.113.10/32
```

Apply splits those strings into `tags`, `droplet_ids`, and `addresses`. Object form also works:

```yaml
sources:
  addresses: ["203.0.113.10/32"]
  tags: ["bastion"]
```

`tag:bastion` does not create the tag. Create tags in `resources.tags` earlier in the same file if they must exist first — tags run before firewalls, but attaching a tag to a firewall is a firewall field, not `tagResource`.

## Convenience VPC without listing `resources.vpcs`

Use this when you want the shortcut, knowing the name will be `digitalocean-vpc`.

```yaml
provider: digitalocean
region: nyc1
networking:
  vpc: true
```

Prefer an explicit VPC if a droplet needs `vpc: my-name`. The boolean shortcut cannot choose that name.

## Domain records next to a droplet

Use this when you already know the public IP you will point at (often **after** the droplet exists). Same-apply domain create does not wait for the droplet to have an IPv4.

```yaml
resources:
  domains:
    - name: example.com
      records:
        - type: A
          name: www
          data: 203.0.113.20
```

`networking.domain: example.com` only appends `{ name }` if missing — no records.

A more honest flow: apply the droplet, read `networks.v4` from `ApplyResult` or `getDroplet`, then apply a **second** document that only declares the domain — understanding that the second apply is another create, so the domain must not already exist.

## Load balancer in front of known droplet ids

Use this when you already have droplet ids. Apply creates LBs **after** firewalls and does not resolve LB names back into firewall `load_balancer_uids`.

```yaml
resources:
  load_balancers:
    - name: web-lb
      region: nyc1
      droplet_ids: [111, 222]
      redirect_http_to_https: true
      forwarding_rules:
        - entry_protocol: http
          entry_port: 80
          target_protocol: http
          target_port: 80
```

`forwarding_rules` is `z.array(z.record(...))` — Grapevine does not type-check DigitalOcean’s rule schema. Wrong keys fail at the API.

## Alert policy (not top-level `monitoring`)

```yaml
resources:
  alert_policies:
    - description: High CPU
      type: v1/insights/droplet/cpu
      value: 80
      window: 5m
      compare: GreaterThan
      alerts:
        email: [ops@example.com]
```

Do not set `monitoring.enabled: true` on the document root and expect this. That field is schema-only.

## App Platform spec passthrough

```yaml
resources:
  apps:
    - spec:
        name: my-app
        region: nyc
        services:
          - name: web
            github:
              repo: example/web
              branch: main
```

Grapevine POSTs `spec`. It does not build from a Juice repo path. `services:` at the **grape document root** is a different field and is ignored.

## TypeScript: VPC + droplet + firewall

Use this when you want ids in variables and you will delete them in the same script.

```ts
import {
  createTag,
  createSSHKey,
  uploadSSHKey,
  createVPC,
  createDroplet,
  createFireWall,
} from "@citrusworx/grapevine";

export async function stack() {
  await createTag("prod");

  const local = createSSHKey("deploy");
  const ssh = await uploadSSHKey({
    name: local.name,
    public_key: local.publicKey,
  });

  const vpc = await createVPC({
    name: "prod",
    description: "Production",
    region: "nyc1",
    ip_range: "10.10.0.0/16",
  });

  const droplet = await createDroplet({
    name: "web-01",
    region: "nyc1",
    size: "s-1vcpu-1gb",
    image: "ubuntu-24-04-x64",
    ssh_keys: [ssh.id],
    vpc_uuid: vpc.id,
    monitoring: true,
    tags: ["prod"],
  });

  const firewall = await createFireWall({
    name: "web",
    droplet_ids: droplet.id !== undefined ? [droplet.id] : [],
    inbound_rules: [
      {
        protocol: "tcp",
        ports: "22",
        sources: { addresses: ["203.0.113.10/32"] },
      },
      {
        protocol: "tcp",
        ports: "80,443",
        sources: { addresses: ["0.0.0.0/0"] },
      },
    ],
    outbound_rules: [
      {
        protocol: "tcp",
        ports: "all",
        destinations: { addresses: ["0.0.0.0/0"] },
      },
    ],
  });

  return { droplet, firewall, vpc, privateKey: local.keys.privateKey };
}
```

Keep `privateKey` if you generated a key — Grapevine will not save it.

## Droplet-only YAML via `deployByBlueprint`

```yaml
# web.yaml
blueprint:
  name: web
  droplet:
    name: web-01
    region: nyc1
    size: s-1vcpu-1gb
    image: ubuntu-24-04-x64
```

```ts
import { deployByBlueprint } from "@citrusworx/grapevine";

const droplet = await deployByBlueprint("./web.yaml");
```

Prefer `applyGrapeConfig` when you also need a VPC and firewall.

## Tear-down script next to a create

Use this when apply JSON (or function returns) still have ids.

```ts
import { NukeDroplet, deleteFirewall, deleteVPC, deleteSSHKey } from "@citrusworx/grapevine";

await NukeDroplet(dropletId);
await deleteFirewall(firewallId);
await deleteVPC(vpcId);
await deleteSSHKey(sshKeyId);
```

There is no “destroy this YAML.” If you lost the ids, use the DigitalOcean UI or `listAll*` helpers and match by name yourself — and remember names are not unique guarantees once creates have failed and been retried.

## Pattern notes

- **One create document.** Split files only when the second file does not need the first file’s in-memory maps (or uses numeric ids).
- **Validate is cheap.** Run it in CI. Apply is not CI-safe without an account you intend to mutate.
- **Names are for this process.** Ids are for the account.
- **Functions are the escape hatch** for list/get/update/delete. YAML is the escape hatch for a reviewed create.

## How to adapt

Copy a pattern, change names, region, size, and SSH source. Do not add `provider: aws`, `services.database`, or a `grape destroy` step — those are not in the library. Check [Status](./grapevine-status.md) if a DigitalOcean product you need is missing from apply.
