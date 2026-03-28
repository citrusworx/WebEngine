# DigitalOcean Provider

GrapeVine's DigitalOcean provider allows you to provision and manage DigitalOcean resources via YAML blueprints.

---

## Configuration

Set the following environment variables:

```env
DO_TOKEN=your_digitalocean_personal_access_token
```

Your token must have **write** access to provision resources.

---

## Resources

### Droplet

A Droplet is a DigitalOcean virtual machine.

#### Blueprint Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Hostname for the Droplet |
| `region` | string | ✅ | Region slug (e.g. `nyc3`, `sfo3`) |
| `size` | string | ✅ | Size slug (e.g. `s-1vcpu-1gb`) |
| `image` | string | ✅ | Image slug (e.g. `ubuntu-24-04-x64`) |
| `ssh_keys` | string[] | ❌ | SSH key IDs or fingerprints |
| `backups` | boolean | ❌ | Enable automated backups |
| `backup_policy` | object | ❌ | Backup schedule configuration |
| `backup_policy.plan` | string | ❌ | `weekly` or `daily` |
| `backup_policy.weekday` | string | ❌ | Day of week (e.g. `SUN`) |
| `backup_policy.hour` | number | ❌ | Hour of day (0–23) |
| `ipv6` | boolean | ❌ | Enable IPv6 |
| `monitoring` | boolean | ❌ | Enable DigitalOcean monitoring agent |
| `tags` | string[] | ❌ | Tags to apply to the Droplet |
| `user_data` | string | ❌ | Cloud-init user data script |
| `volumes` | string[] | ❌ | Volume IDs to attach |
| `vpc_uuid` | string | ❌ | VPC UUID to place the Droplet in |
| `with_droplet_agent` | boolean | ❌ | Install the DigitalOcean agent |

#### Example

```yaml
grapevine: "1.0"
provider: digitalocean
blueprint:
  name: "create-single-droplet"
  droplet:
    name: "my-app.com"
    region: "nyc3"
    size: "s-1vcpu-1gb"
    image: "ubuntu-24-04-x64"
    backups: true
    backup_policy:
      plan: "weekly"
      weekday: "SUN"
      hour: 0
    monitoring: true
    tags: ["production"]
```

---

## API Reference

### `deployByBlueprint(blueprintPath)`

Reads a GrapeVine blueprint YAML file and provisions the described Droplet on DigitalOcean.

```typescript
import { deployByBlueprint } from "@citrusworx/grapevine";

const droplet = await deployByBlueprint("./blueprints/create-droplet.yaml");
console.log(droplet.id); // DigitalOcean Droplet ID
```

**Parameters**

| Parameter | Type | Description |
|---|---|---|
| `blueprintPath` | string | Absolute or relative path to the blueprint YAML file |

**Returns** `Promise<DropletResource>`

---

## Available Regions

| Slug | Location |
|---|---|
| `nyc1` | New York 1 |
| `nyc3` | New York 3 |
| `sfo2` | San Francisco 2 |
| `sfo3` | San Francisco 3 |
| `ams3` | Amsterdam 3 |
| `sgp1` | Singapore 1 |
| `lon1` | London 1 |
| `fra1` | Frankfurt 1 |
| `tor1` | Toronto 1 |
| `blr1` | Bangalore 1 |
| `syd1` | Sydney 1 |

---

## Common Image Slugs

| Slug | Description |
|---|---|
| `ubuntu-24-04-x64` | Ubuntu 24.04 LTS |
| `ubuntu-22-04-x64` | Ubuntu 22.04 LTS |
| `debian-12-x64` | Debian 12 |
| `fedora-39-x64` | Fedora 39 |