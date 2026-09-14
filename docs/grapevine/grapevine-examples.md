# Grapevine Examples

These match `libraries/grapevine/examples/` and the function exports. They create **real DigitalOcean resources** when applied.

## Progressive YAML starters

From `libraries/grapevine/examples/blueprints/`:

| File | Creates | Cost |
|---|---|---|
| `01-vpc-and-tag.yaml` | tag + VPC | Free |
| `02-droplet-in-vpc.yaml` | tag, generated SSH key, VPC, droplet | Droplet |
| `03-web-firewall.yaml` | firewall on an **existing** droplet id | Free |
| `04-full-web-stack.yaml` | tag + SSH + VPC + droplet + firewall | Droplet |

```bash
export DO_TOKEN=dop_v1_...
grape validate -c ./01-vpc-and-tag.yaml
grape apply -c ./01-vpc-and-tag.yaml
```

Replace `REPLACE_DROPLET_ID` and `REPLACE_WITH_YOUR_IP` in 03/04 before apply. The schema wants numeric `droplet_ids`. See that folder’s README.

## Full resource example

`libraries/grapevine/examples/grape.config.yaml` — tag, SSH, VPC, wrapped droplet, firewall, domain record. Swap the placeholder public key and IPs.

## TypeScript: VPC + droplet + firewall

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

  return { droplet, firewall, vpc };
}
```

Keep `local.keys.privateKey` if you generated a key — Grapevine will not save it.

## TypeScript: apply a config object

```ts
import { applyGrapeConfig, validateGrapeConfig } from "@citrusworx/grapevine";

const config = validateGrapeConfig({
  provider: "digitalocean",
  region: "nyc1",
  resources: {
    tags: ["grapevine"],
    vpcs: [
      {
        name: "grapevine",
        description: "Starter",
        ip_range: "10.120.0.0/16",
      },
    ],
  },
});

const result = await applyGrapeConfig(config);
console.log(result.vpcs[0]?.id);
```

## Blueprint file → one droplet

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

Prefer `applyGrapeConfig` when you also need a VPC and firewall; `deployByBlueprint` is droplet-only.

## What not to copy from older docs

```ts
// Not APIs
import { DigitalOcean } from "@citrusworx/grapevine";
DigitalOcean.Droplet.create("server");
new GrapevineClient().listServices();

// Not applied
services:
  database:
    type: postgres
    version: "15"
```
