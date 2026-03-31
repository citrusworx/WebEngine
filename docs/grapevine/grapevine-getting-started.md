# GrapeVine Getting Started

Quick introduction to GrapeVine infrastructure provisioning and deployment.

## What is GrapeVine?

GrapeVine is a cloud infrastructure and deployment library that provides a unified, config-driven interface for provisioning and managing cloud resources across multiple providers.

**Key Philosophy**:
- Infrastructure should not be tied to your application framework
- Define infrastructure once, deploy anywhere
- Works with any tech stack: Node.js, PHP, Python, Ruby, Go, etc.
- Whether you're using Next.js, Django, or a monolith, GrapeVine handles the cloud

## Installation

```bash
yarn add @citrusworx/grapevine
```

GrapeVine requires Node.js 20+ and access to your cloud provider's API credentials.

## Prerequisites

### DigitalOcean (Current Provider)

1. Create a DigitalOcean account at https://www.digitalocean.com
2. Generate an API token:
   - Go to Account → Settings → API → Tokens/Keys
   - Create a new Personal Access Token
   - Copy the token
3. Set environment variable:
   ```bash
   export DO_TOKEN=your_token_here
   ```

### Environment Setup

```bash
# Store your token securely
export DO_TOKEN=dop_v1_... # Your DigitalOcean token

# Optional: Set default region
export DO_REGION=nyc1
```

## Your First Deployment

### Step 1: Create a Configuration File

Create `grapevine.config.yaml` at your project root:

```yaml
version: "0.1"
provider: digitalocean
region: nyc1

services:
  frontend:
    type: app
    size: basic-xs
    name: my-frontend
  
  backend:
    type: app
    size: basic-s
    name: my-backend
  
  database:
    type: postgres
    version: "15"
    name: my-database

networking:
  vpc: true
  domain: myapp.com
  ssl: true

firewall:
  inbound:
    - protocol: tcp
      ports: "80"
      sources: ["0.0.0.0/0"]
    - protocol: tcp
      ports: "443"
      sources: ["0.0.0.0/0"]
```

### Step 2: Create Infrastructure via Blueprint

Create a YAML blueprint file for a simple droplet:

```yaml
blueprint:
  name: "web-server"
  droplet:
    name: "my-app-web-01"
    region: "nyc1"
    size: "s-1vcpu-1gb"
    image: "ubuntu-22-04-x64"
    ssh_keys: ["your-key-id"]
    backups: true
    monitoring: true
    ipv6: true
    tags:
      - "web"
      - "production"
```

### Step 3: Deploy Programmatically

```typescript
import { deployByBlueprint, createVPC } from "@citrusworx/grapevine";

// Create a VPC for networking
const vpc = await createVPC({
  name: "my-vpc",
  description: "Production VPC",
  region: "nyc1",
  ip_range: "10.10.0.0/16"
});

console.log("VPC created:", vpc.id);
```

## Basic Concepts

### Blueprints

Blueprints are YAML templates that define cloud resources. Each blueprint:
- Specifies resource type (droplet, database, etc.)
- Defines configuration (size, region, networking)
- Includes provider-specific settings

```yaml
blueprint:
  name: "my-resource"
  # Resource-specific config
```

### Droplets

Virtual machines in DigitalOcean. Start with:
- `s-1vcpu-1gb` (1 vCPU, 1GB RAM) - Development
- `s-2vcpu-2gb` (2 vCPU, 2GB RAM) - Production
- `s-4vcpu-8gb` (4 vCPU, 8GB RAM) - High-traffic

### VPCs (Virtual Private Clouds)

Private networks that isolate your infrastructure:
- Create network boundaries
- Control internal traffic
- Secure communication between resources

### Firewalls

Network security rules that control:
- **Inbound**: Traffic INTO your resources
- **Outbound**: Traffic OUT of your resources

### SSH Keys

Secure authentication for droplets:
- Generate key pairs
- Upload public key to provider
- Use private key to connect

## Common Workflows

### Creating a Web Server

```typescript
import { deployByBlueprint, createSSHKey, uploadSSHKey } from "@citrusworx/grapevine";

// 1. Create SSH key pair
const sshKey = createSSHKey("my-key");
console.log("Public key:", sshKey.publicKey);
console.log("Fingerprint:", sshKey.fingerprint);

// 2. Upload public key to DigitalOcean
await uploadSSHKey({
  name: "my-key",
  public_key: sshKey.publicKey
});

// 3. Deploy droplet with the key
await deployByBlueprint("./blueprint.yaml");
```

### Setting Up Networking

```typescript
import { createVPC, createFireWall } from "@citrusworx/grapevine";

// Create isolated network
const vpc = await createVPC({
  name: "production",
  description: "Main production network",
  region: "nyc1",
  ip_range: "10.0.0.0/16"
});

// Apply firewall rules
await createFireWall({
  name: "production-firewall",
  inbound_rules: [
    {
      protocol: "tcp",
      ports: "22",
      sources: { addresses: ["YOUR_IP/32"] } // SSH from your IP
    },
    {
      protocol: "tcp",
      ports: "80,443",
      sources: { addresses: ["0.0.0.0/0"] } // HTTPS from anywhere
    }
  ],
  outbound_rules: [
    {
      protocol: "tcp",
      ports: "all",
      destinations: { addresses: ["0.0.0.0/0"] }
    }
  ],
  droplet_ids: [],
  tags: ["web"]
});
```

## Next Steps

1. **Read the API Reference** - [grapevine-api.md](./grapevine-api.md)
2. **Explore DigitalOcean Guide** - [grapevine-digitalocean.md](./grapevine-digitalocean.md)
3. **See Real Examples** - [grapevine-examples.md](./grapevine-examples.md)
4. **Learn Configuration** - [grapevine-config.md](./grapevine-config.md)

## Troubleshooting

### "DO_TOKEN not set"

Make sure your DigitalOcean token is in environment variables:

```bash
export DO_TOKEN=dop_v1_...
```

### "Unauthorized" errors

- Verify token is correct
- Check token hasn't expired
- Ensure token has full API access

### Resource already exists

- Check if resource was already created in previous run
- Use unique names for resources
- Check DigitalOcean dashboard for existing resources