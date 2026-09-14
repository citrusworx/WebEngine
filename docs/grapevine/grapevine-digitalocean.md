# Grapevine + DigitalOcean

DigitalOcean is the **only** provider in source. This page is the practical guide for tokens, droplets, networks, and the functions Grapevine wraps.

## Account and token

1. Sign up at [digitalocean.com](https://www.digitalocean.com)
2. API → Tokens/Keys → generate a **read and write** personal access token
3. `export DO_TOKEN=dop_v1_...`

Verify outside Grapevine if you want:

```bash
curl -s -H "Authorization: Bearer $DO_TOKEN" https://api.digitalocean.com/v2/account
```

Grapevine’s `doRequest` uses the same header. Failures become `DigitalOceanError`.

## Regions

Pass a slug DigitalOcean accepts (`nyc1`, `nyc3`, `sfo3`, `ams3`, `fra1`, `lon1`, `sgp1`, `blr1`, `tor1`, …). Grapevine does not validate slugs beyond “non-empty string.” Wrong slugs fail at the API.

Put `region` on the grape config and/or on each VPC/droplet/load balancer.

## Droplets

Required blueprint fields: `name`, `region`, `size`, `image`.

Common sizes: `s-1vcpu-1gb`, `s-2vcpu-2gb`, … — current catalog is DigitalOcean’s, not a Grapevine enum.

Images: slugs like `ubuntu-24-04-x64` or a numeric snapshot id.

Optional fields Grapevine forwards: `ssh_keys`, `backups`, `backup_policy`, `ipv6`, `monitoring`, `tags`, `user_data`, `volumes`, `vpc_uuid`, `with_droplet_agent`.

```ts
import { createDroplet, getDropletStatus, listAllDroplets, deleteDroplet } from "@citrusworx/grapevine";

const droplet = await createDroplet({
  name: "web-01",
  region: "nyc1",
  size: "s-1vcpu-1gb",
  image: "ubuntu-24-04-x64",
});

await getDropletStatus(droplet.id!);
await listAllDroplets();
// await deleteDroplet(droplet.id!);
```

`user_data` is the supported “run something at boot” mechanism. There is no post-create SSH runner.

## VPC

```ts
import { createVPC, listAllVPCs, deleteVPC } from "@citrusworx/grapevine";

const vpc = await createVPC({
  name: "app",
  description: "App network",
  region: "nyc1",
  ip_range: "10.10.0.0/16",
});
```

On apply, droplet `vpc: app` maps to this VPC’s id. Peering helpers exist (`createPeering`) but apply does not create peerings from YAML.

## Firewall

```ts
import { createFireWall } from "@citrusworx/grapevine";

await createFireWall({
  name: "web",
  droplet_ids: [123],
  inbound_rules: [
    { protocol: "tcp", ports: "443", sources: { addresses: ["0.0.0.0/0"] } },
  ],
  outbound_rules: [
    { protocol: "tcp", ports: "all", destinations: { addresses: ["0.0.0.0/0"] } },
  ],
});
```

Note the export spelling: `createFireWall`.

## SSH keys

```ts
import { createSSHKey, uploadSSHKey, listSSHKeys } from "@citrusworx/grapevine";

const generated = createSSHKey("ci");
await uploadSSHKey({ name: generated.name, public_key: generated.publicKey });
await listSSHKeys();
```

Apply with `generate: true` uploads the public key only.

## Domains, LBs, apps, alerts

These are real DigitalOcean products and real Grapevine functions. Apply will create them if you declare `resources.domains` / `load_balancers` / `apps` / `alert_policies`. See [config](./grapevine-config.md) and [API](./grapevine-api.md).

App Platform `spec` is passed through; Grapevine does not compile a Juice/Sig app into an app spec for you.

## Images and security

`listAllImages`, Insight scans, etc. are exported and tested in places, but **not** part of `applyGrapeConfig`. Call them from TypeScript if you need them.

## Limits and cost

DigitalOcean rate-limits API calls. Grapevine does not implement a client-side quota manager.

Droplets and load balancers cost money. Start with `01-vpc-and-tag.yaml` when you are testing the CLI.

## Practices

- Validate before apply
- Keep tokens in the environment, not in YAML
- Prefer `public_key` you control over `generate: true` until private-key persistence exists
- Name VPCs/droplets you will reference later in the same file (`vpc:`, `droplets:`)
- Delete what you create; apply will not
- Do not set `provider: aws`

## Related

- [Getting Started](./grapevine-getting-started.md)
- [infrastructure/digitalocean](./infrastructure/digitalocean/README.md) — extra DO how-tos in this docs tree
- In-repo blueprints README
