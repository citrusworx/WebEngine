# GrapeVine API Reference

Complete API reference for GrapeVine infrastructure provisioning.

## Table of Contents

- [Droplets](#droplets)
- [VPCs](#vpcs)
- [Firewalls](#firewalls)
- [SSH Keys](#ssh-keys)
- [Monitoring](#monitoring)
- [Deploy Functions](#deploy-functions)

---

## Droplets

Droplets are virtual machines in your cloud infrastructure.

### Interface: DropletBlueprint

```typescript
interface DropletBlueprint {
  blueprint: {
    name: string;
    droplet: {
      name: string;
      region: string;
      size: string;
      image: string;
      ssh_keys?: string[];
      backups: boolean;
      backup_policy?: {
        name: string;
      };
      ipv6?: boolean;
      monitoring?: boolean;
      tags?: string[];
      user_data?: string;
      volumes?: string[];
      vpc_uuid?: string;
      with_droplet_agent?: boolean;
    };
  };
}
```

### Resource: DropletResource

```typescript
interface DropletResource {
  id: number;
  name: string;
  memory: number;
  vcpus: number;
  disk: number;
  disk_info: object[];
  locked: boolean;
  status: string;
  kernel: object | null;
  created_at: string;
  features: string[];
  backup_ids: number[];
  next_backup_window: object | null;
  snapshot_ids: number[];
  image: Record<string, unknown>;
  volume_ids: string[];
  size: Record<string, unknown>;
  size_slug: string;
  networks: Record<string, unknown>;
  region: Record<string, unknown>;
  tags: string[];
}
```

### Common Droplet Sizes

| Size | vCPU | RAM | Storage | Use Case |
|------|------|-----|---------|----------|
| `s-1vcpu-512mb-10gb` | 1 | 512MB | 10GB | Hobby/Dev |
| `s-1vcpu-1gb` | 1 | 1GB | 25GB | Small app |
| `s-2vcpu-2gb` | 2 | 2GB | 50GB | Medium app |
| `s-4vcpu-8gb` | 4 | 8GB | 160GB | Production |
| `s-8vcpu-16gb` | 8 | 16GB | 320GB | High-traffic |

### Common Images

- `ubuntu-22-04-x64` - Ubuntu 22.04 LTS
- `ubuntu-20-04-x64` - Ubuntu 20.04 LTS
- `debian-12-x64` - Debian 12
- `centos-7-x64` - CentOS 7
- `rocky-9-x64` - Rocky Linux 9

### Example: Deploy Droplet

```typescript
import { deployByBlueprint, parseYAML } from "@citrusworx/grapevine";

const droplet = await deployByBlueprint("./droplet-blueprint.yaml");

console.log(`Droplet created: ${droplet.name} (${droplet.id})`);
console.log(`IP Address: ${droplet.networks.v4[0].ip_address}`);
```

---

## VPCs

Virtual Private Clouds provide isolated network environments for your infrastructure.

### Interface: VPCBlueprint

```typescript
interface VPCBlueprint {
  name: string;
  description: string;
  region: string;
  ip_range: string; // CIDR notation, e.g., "10.10.0.0/16"
}
```

### Resource: VPCResponse

```typescript
interface VPCResponse {
  name: string;
  description: string;
  region: string;
  ip_range: string;
  default: boolean;
  id: string;
  urn: string;
  created_at: string;
}
```

### createVPC()

Create a new VPC.

**Signature**:
```typescript
async function createVPC(blueprint: VPCBlueprint): Promise<VPCResponse>
```

**Parameters**:
- `blueprint` - VPC configuration

**Returns**: Created VPC resource

**Example**:
```typescript
import { createVPC } from "@citrusworx/grapevine";

const vpc = await createVPC({
  name: "production",
  description: "Main production VPC",
  region: "nyc1",
  ip_range: "10.0.0.0/16"
});

console.log(`VPC created: ${vpc.id}`);
```

### deleteVPC()

Delete a VPC by ID.

**Signature**:
```typescript
async function deleteVPC(id: string): Promise<void>
```

**Parameters**:
- `id` - VPC ID to delete

**Example**:
```typescript
import { deleteVPC } from "@citrusworx/grapevine";

await deleteVPC("vpc-uuid");
console.log("VPC deleted");
```

### CIDR Ranges Reference

Common IP ranges for VPCs:

| Range | Hosts | Typical Use |
|-------|-------|-------------|
| `10.0.0.0/8` | 16M | Large deployments |
| `10.0.0.0/16` | 65K | Medium deployments |
| `10.0.0.0/24` | 256 | Small deployments |
| `172.16.0.0/12` | 1M | Alternative range |
| `192.168.0.0/16` | 65K | Alternative range |

---

## Firewalls

Network security rules for controlling traffic to/from resources.

### Interface: FireWall

```typescript
interface FireWall {
  name: string;
  droplet_ids: number[];
  tags: string[];
  inbound_rules: object[];
  outbound_rules: object[];
}
```

### Resource: FireWallResponse

```typescript
interface FireWallResponse {
  id: string;
  name: string;
  status: string;
  inbound_rules: object[];
  outbound_rules: object[];
}
```

### createFireWall()

Create a firewall with inbound/outbound rules.

**Signature**:
```typescript
async function createFireWall(blueprint: FireWall): Promise<void>
```

**Parameters**:
- `blueprint` - Firewall configuration with rules

**Example**:
```typescript
import { createFireWall } from "@citrusworx/grapevine";

await createFireWall({
  name: "web-server-firewall",
  droplet_ids: [12345],
  tags: ["web"],
  inbound_rules: [
    {
      protocol: "tcp",
      ports: "22",
      sources: {
        addresses: ["203.0.113.0/24"] // Your office IP
      }
    },
    {
      protocol: "tcp",
      ports: "80",
      sources: {
        addresses: ["0.0.0.0/0", "::/0"] // HTTP from anywhere
      }
    },
    {
      protocol: "tcp",
      ports: "443",
      sources: {
        addresses: ["0.0.0.0/0", "::/0"] // HTTPS from anywhere
      }
    }
  ],
  outbound_rules: [
    {
      protocol: "tcp",
      ports: "all",
      destinations: {
        addresses: ["0.0.0.0/0", "::/0"]
      }
    }
  ]
});

console.log("Firewall created");
```

### Common Firewall Rules

**SSH Access**:
```typescript
{
  protocol: "tcp",
  ports: "22",
  sources: { addresses: ["YOUR_IP/32"] }
}
```

**HTTP/HTTPS**:
```typescript
{
  protocol: "tcp",
  ports: "80,443",
  sources: { addresses: ["0.0.0.0/0"] }
}
```

**Database Access (Internal Only)**:
```typescript
{
  protocol: "tcp",
  ports: "5432",
  sources: { tags: ["web"] } // From droplets tagged "web"
}
```

**DNS**:
```typescript
{
  protocol: "udp",
  ports: "53",
  sources: { addresses: ["0.0.0.0/0"] }
}
```

---

## SSH Keys

Secure cryptographic key pairs for authentication.

### Interface: SSHKey

```typescript
interface SSHKey {
  public_key: string;
  name: string;
}
```

### Interface: SSHKeyPair

```typescript
interface SSHKeyPair {
  publicKey: string;
  privateKey: string;
}
```

### createKeyPair()

Generate a new RSA 4096-bit key pair.

**Signature**:
```typescript
function createKeyPair(): SSHKeyPair
```

**Returns**: Object with publicKey and privateKey

**Example**:
```typescript
import { createKeyPair } from "@citrusworx/grapevine";

const keyPair = createKeyPair();

console.log("Public Key:");
console.log(keyPair.publicKey);

console.log("\nPrivate Key (keep secret!):");
console.log(keyPair.privateKey);
```

### toOpenSSH()

Convert public key to OpenSSH format.

**Signature**:
```typescript
function toOpenSSH(publickey: string): string
```

**Parameters**:
- `publickey` - Public key in PEM format

**Returns**: OpenSSH formatted public key

**Example**:
```typescript
import { createKeyPair, toOpenSSH } from "@citrusworx/grapevine";

const keyPair = createKeyPair();
const opensshKey = toOpenSSH(keyPair.publicKey);

console.log(opensshKey); // ssh-rsa AAAA...
```

### hashRSA()

Generate SHA256 fingerprint of key pair.

**Signature**:
```typescript
function hashRSA(keyPair: SSHKeyPair): string
```

**Parameters**:
- `keyPair` - Key pair object

**Returns**: SHA256 fingerprint

**Example**:
```typescript
import { createKeyPair, hashRSA } from "@citrusworx/grapevine";

const keyPair = createKeyPair();
const fingerprint = hashRSA(keyPair);

console.log(fingerprint); // SHA256:abc123...
```

### createSSHKey()

Create SSH key with conversions applied.

**Signature**:
```typescript
function createSSHKey(name: string): {
  name: string;
  publicKey: string;
  keys: SSHKeyPair;
  fingerprint: string;
}
```

**Parameters**:
- `name` - Name for this key

**Returns**: Complete SSH key object

**Example**:
```typescript
import { createSSHKey } from "@citrusworx/grapevine";

const sshKey = createSSHKey("production-key");

console.log(`Name: ${sshKey.name}`);
console.log(`Public Key: ${sshKey.publicKey}`);
console.log(`Fingerprint: ${sshKey.fingerprint}`);
```

### uploadSSHKey()

Upload SSH public key to DigitalOcean.

**Signature**:
```typescript
async function uploadSSHKey(key: SSHKey): Promise<any>
```

**Parameters**:
- `key` - SSH key with name and public_key

**Returns**: Uploaded key resource from DigitalOcean

**Example**:
```typescript
import { uploadSSHKey, createSSHKey } from "@citrusworx/grapevine";

const key = createSSHKey("ci-deploy-key");

const uploaded = await uploadSSHKey({
  name: key.name,
  public_key: key.publicKey
});

console.log(`Key uploaded: ${uploaded.id}`);
```

---

## Deploy Functions

### deployByBlueprint()

Deploy a resource from a YAML blueprint file.

**Signature**:
```typescript
async function deployByBlueprint(blueprint: string): Promise<DropletResource>
```

**Parameters**:
- `blueprint` - Path to YAML blueprint file

**Returns**: Deployed droplet resource

**Example**:
```typescript
import { deployByBlueprint } from "@citrusworx/grapevine";

const droplet = await deployByBlueprint("./blueprint.yaml");

console.log(`Deployed: ${droplet.name}`);
console.log(`Droplet ID: ${droplet.id}`);
console.log(`Region: ${droplet.region.slug}`);
```

### parseYAML()

Parse YAML blueprint files.

**Signature**:
```typescript
function parseYAML<T>(file: string): T
```

**Type Parameters**:
- `T` - Expected TypeScript type

**Parameters**:
- `file` - Path to YAML file

**Returns**: Parsed object as type T

**Example**:
```typescript
import { parseYAML, DropletBlueprint } from "@citrusworx/grapevine";

const blueprint = parseYAML<DropletBlueprint>("./droplet.yaml");

console.log(blueprint.blueprint.droplet.name);
```

### cleanPayload()

Remove undefined/null fields from API payload.

**Signature**:
```typescript
function cleanPayload(payload: object): object
```

**Parameters**:
- `payload` - Object with possibly undefined fields

**Returns**: Cleaned object with nulls/undefined removed

**Example**:
```typescript
import { cleanPayload } from "@citrusworx/grapevine";

const payload = {
  name: "my-droplet",
  tags: undefined,
  backups: true,
  description: null
};

const clean = cleanPayload(payload);
// Result: { name: "my-droplet", backups: true }
```

---

## Utilities

### Configuration

**Environment Variables**:
- `DO_TOKEN` - DigitalOcean API token (required)
- `DO_REGION` - Default region (optional)

### API Client

GrapeVine uses Axios for HTTP requests with:
- Base URL: `https://api.digitalocean.com/v2`
- Authorization header: `Bearer ${DO_TOKEN}`
- Content-Type: `application/json`

### Type Imports

```typescript
import {
  DropletBlueprint,
  DropletResource,
  VPCBlueprint,
  VPCResponse,
  FireWall,
  SSHKey,
  SSHKeyPair
} from "@citrusworx/grapevine";
```