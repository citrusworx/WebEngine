# GrapeVine DigitalOcean Guide

Complete guide to using GrapeVine with DigitalOcean cloud infrastructure.

## Overview

DigitalOcean is the primary cloud provider supported by GrapeVine. It offers:
- Simple, predictable pricing
- Developer-friendly API
- Global data centers
- Excellent documentation
- Strong performance

## Getting Started with DigitalOcean

### 1. Create Account

Visit https://www.digitalocean.com and sign up for an account.

### 2. Generate API Token

1. Log into DigitalOcean dashboard
2. Navigate to **Account → Settings → API → Tokens/Keys**
3. Click **Generate New Token**
4. Name it (e.g., `grapevine-deploy`)
5. Select scopes:
   - ☑ Read & Write (required)
   - ☑ For Applications (recommended)
6. Copy the token immediately (won't show again!)

### 3. Set Up Environment

```bash
# Export token for GrapeVine
export DO_TOKEN=dop_v1_xxxxxxxxxxxxx

# Verify token works
curl -X GET "https://api.digitalocean.com/v2/account" \
  -H "Authorization: Bearer $DO_TOKEN"
```

### 4. Configure for Deployment

Add to your shell profile (`~/.bashrc`, `~/.zshrc`, or `.env`):

```bash
export DO_TOKEN=dop_v1_xxxxxxxxxxxxx
export DO_REGION=nyc1  # Optional default region
```

## DigitalOcean Regions

GrapeVine supports all DigitalOcean regions:

### North America

| Code | Location | Latency from NYC |
|------|----------|------------------|
| `nyc1` | New York 1 | 0ms (reference) |
| `nyc3` | New York 3 | ~3ms |
| `sfo1` | San Francisco | ~50ms |
| `sfo2` | San Francisco 2 | ~50ms |
| `sfo3` | San Francisco 3 | ~50ms |
| `tor1` | Toronto | ~10ms |

### Europe

| Code | Location | Latency from NYC |
|------|----------|------------------|
| `lon1` | London | ~60ms |
| `ams3` | Amsterdam | ~85ms |
| `fra1` | Frankfurt | ~95ms |

### Asia-Pacific

| Code | Location | Latency from NYC |
|------|----------|------------------|
| `blr1` | Bangalore | ~180ms |
| `sgp1` | Singapore | ~180ms |

## Droplets

Virtual machines in DigitalOcean.

### Droplet Sizes

**CPU Optimized** (for computing):
- `c-2` - 2 vCPU, 4GB RAM
- `c-4` - 4 vCPU, 8GB RAM
- `c-8` - 8 vCPU, 16GB RAM

**Memory Optimized** (for caching/databases):
- `m-4gb` - 2 vCPU, 4GB RAM
- `m-8gb` - 4 vCPU, 8GB RAM
- `m-16gb` - 8 vCPU, 16GB RAM

**General Purpose** (for apps):
- `s-1vcpu-512mb-10gb` - 1 vCPU, 512MB RAM
- `s-1vcpu-1gb` - 1 vCPU, 1GB RAM
- `s-2vcpu-2gb` - 2 vCPU, 2GB RAM
- `s-4vcpu-8gb` - 4 vCPU, 8GB RAM
- `s-8vcpu-16gb` - 8 vCPU, 16GB RAM

### Available Images

**Linux Distributions**:
- `ubuntu-22-04-x64` - Ubuntu 22.04 LTS (recommended)
- `ubuntu-20-04-x64` - Ubuntu 20.04 LTS
- `debian-12-x64` - Debian 12
- `centos-7-x64` - CentOS 7
- `rocky-9-x64` - Rocky Linux 9
- `fedora-39-x64` - Fedora 39

**Marketplace Apps** (pre-configured):
- WordPress, Docker, NodeJS, Ruby on Rails, etc.

### Creating a Droplet

```typescript
import { deployByBlueprint } from "@citrusworx/grapevine";

const dropletBlueprint = {
  blueprint: {
    name: "web-server",
    droplet: {
      name: "my-app-web-01",
      region: "nyc1",
      size: "s-2vcpu-2gb",
      image: "ubuntu-22-04-x64",
      backups: true,
      monitoring: true,
      ipv6: true,
      tags: ["web", "production"],
      ssh_keys: ["your-ssh-key-id"] // Optional, add if already uploaded
    }
  }
};

const droplet = await deployByBlueprint(dropletBlueprint);

console.log(`Droplet created: ${droplet.name}`);
console.log(`IP Address: ${droplet.networks.v4[0].ip_address}`);
console.log(`Region: ${droplet.region.slug}`);
```

## VPCs (Virtual Private Clouds)

Create isolated network environments.

### Creating a VPC

```typescript
import { createVPC } from "@citrusworx/grapevine";

const vpc = await createVPC({
  name: "production",
  description: "Production environment",
  region: "nyc1",
  ip_range: "10.0.0.0/16" // 65,536 IP addresses
});

console.log(`VPC created: ${vpc.id}`);
```

### Common CIDR Ranges

| Range | Available IPs | Best For |
|-------|--------------|----------|
| `10.0.0.0/8` | 16,777,216 | Large deployments |
| `10.0.0.0/16` | 65,536 | Medium deployments |
| `10.0.0.0/24` | 256 | Small deployments |
| `10.0.0.0/25` | 128 | Minimal setup |
| `10.0.0.0/26` | 64 | Test environments |

### VPC Subnets

Subdivide your VPC into subnets:

- **Public subnet** (10.0.1.0/24) - Load balancers, Bastion host
- **Private subnet** (10.0.2.0/24) - Apps, services
- **Database subnet** (10.0.3.0/24) - Databases only

## Firewalls

Network security rule sets.

### Creating a Firewall

```typescript
import { createFireWall } from "@citrusworx/grapevine";

await createFireWall({
  name: "web-firewall",
  tags: ["web"],
  inbound_rules: [
    // Allow HTTPS from anywhere
    {
      protocol: "tcp",
      ports: "443",
      sources: { addresses: ["0.0.0.0/0"] }
    },
    // Allow HTTP from anywhere
    {
      protocol: "tcp",
      ports: "80",
      sources: { addresses: ["0.0.0.0/0"] }
    },
    // Allow SSH from office only
    {
      protocol: "tcp",
      ports: "22",
      sources: { addresses: ["203.0.113.0/24"] }
    }
  ],
  outbound_rules: [
    // Allow all outbound
    {
      protocol: "tcp",
      ports: "all",
      destinations: { addresses: ["0.0.0.0/0"] }
    }
  ]
});
```

### Protocol Support

| Protocol | Port | Use Case |
|----------|------|----------|
| tcp | 22 | SSH |
| tcp | 80 | HTTP |
| tcp | 443 | HTTPS |
| tcp | 3306 | MySQL |
| tcp | 5432 | PostgreSQL |
| tcp | 6379 | Redis |
| tcp | 27017 | MongoDB |
| udp | 53 | DNS |
| icmp | - | Ping |

## SSH Keys

Securely authenticate with droplets.

### Generating SSH Keys

```typescript
import { createSSHKey, uploadSSHKey } from "@citrusworx/grapevine";

// Generate key pair
const sshKey = createSSHKey("production-key");

console.log("Public Key:", sshKey.publicKey);
console.log("Fingerprint:", sshKey.fingerprint);

// Save private key securely
import fs from "fs";
fs.writeFileSync("~/.ssh/production-key", sshKey.keys.privateKey, { mode: 0o600 });
```

### Uploading Keys to DigitalOcean

```typescript
import { uploadSSHKey } from "@citrusworx/grapevine";

const uploaded = await uploadSSHKey({
  name: "production-key",
  public_key: sshKey.publicKey
});

console.log("Key uploaded with ID:", uploaded.id);
```

### Using Keys for SSH

```bash
# Connect to droplet
ssh -i ~/.ssh/production-key root@123.45.67.89

# Alternative: add key to agent
ssh-add ~/.ssh/production-key
ssh root@123.45.67.89
```

## Managed Databases

DigitalOcean offers managed database services:

| Database | Support | Status |
|----------|---------|--------|
| PostgreSQL | Planned | Coming soon |
| MySQL | Planned | Coming soon |
| MongoDB | Planned | Coming soon |
| Redis | Planned | Coming soon |

Currently, deploy databases on droplets using standard installation methods.

### PostgreSQL on Droplet

```bash
# SSH into droplet
ssh root@<droplet-ip>

# Install PostgreSQL
apt update && apt install -y postgresql postgresql-contrib

# Service management
systemctl start postgresql
systemctl enable postgresql

# Connect to database
sudo -u postgres psql
```

## Backups & Snapshots

### Automated Backups

Enable automatic backups when creating droplets:

```typescript
const droplet = {
  blueprint: {
    name: "web-server",
    droplet: {
      name: "app-01",
      // ... other config
      backups: true,
      backup_policy: {
        name: "daily" // Daily backups at 24:00 UTC
      }
    }
  }
};
```

### Manual Snapshots

```bash
# From DigitalOcean dashboard:
# 1. Select droplet
# 2. Click "More" → "Take Snapshot"
# 3. Enter snapshot name and save

# Snapshots can be used to create new droplets
```

## Monitoring & Alerts

### Enable Monitoring

```typescript
const droplet = {
  blueprint: {
    name: "monitored-server",
    droplet: {
      // ... config
      monitoring: true
    }
  }
};
```

### Metrics Available

- CPU utilization
- Memory usage
- Disk I/O
- Bandwidth usage
- Requests (HTTP)

### View Metrics

In DigitalOcean dashboard:
1. Select droplet
2. Click "Monitoring" tab
3. View real-time metrics

## Pricing

Current pricing (as of early 2024):

| Size | vCPU | RAM | Storage | Monthly |
|------|------|-----|---------|---------|
| s-1vcpu-512mb-10gb | 1 | 512MB | 10GB | $4 |
| s-1vcpu-1gb | 1 | 1GB | 25GB | $6 |
| s-2vcpu-2gb | 2 | 2GB | 50GB | $12 |
| s-4vcpu-8gb | 4 | 8GB | 160GB | $24 |
| s-8vcpu-16gb | 8 | 16GB | 320GB | $48 |

Additional costs:
- Backups: 20% of droplet cost
- Snapshots: $0.05 per GB per month
- Data transfer: $0.01 per GB (outbound)

## Best Practices

### Security

1. **Use VPC** - Isolate resources
2. **Restrict SSH** - Only from known IPs
3. **Enable firewalls** - Default deny, allow specific ports
4. **Use SSH keys** - Never use passwords
5. **Rotate keys** - Regularly regenerate keys
6. **Monitor access** - Check audit logs

### Performance

1. **Choose right size** - Match workload to droplet size
2. **Use SSDs** - All DigitalOcean droplets use SSDs
3. **Enable backups** - Automatic protection
4. **Monitor resources** - Watch CPU, memory, disk
5. **Use appropriate region** - Choose nearest to users

### Cost Optimization

1. **Right-size droplets** - Don't over-provision
2. **Delete unused resources** - Stop paying for unused machines
3. **Use snapshots wisely** - Snapshots incur storage costs
4. **Monitor bandwidth** - Outbound data is billable
5. **Use smaller sizes in dev** - Save on dev/test costs

## Troubleshooting

### Can't SSH to Droplet

```bash
# Check if droplet is running
# Verify security group/firewall allows port 22
# Ensure you're using correct SSH key

ssh -vvv -i ~/.ssh/key root@<ip>  # Verbose output
```

### Droplet Not Responding

1. Check droplet status in dashboard
2. Verify firewall rules allow health checks
3. SSH in and check:
   ```bash
   top          # Check CPU/memory
   df -h        # Check disk space
   systemctl status <service>  # Check service status
   ```

### High Costs

1. Check for unneeded snapshots
2. Review outbound bandwidth usage
3. Look for idle droplets
4. Scale down if possible

## Resources

- [DigitalOcean API Docs](https://docs.digitalocean.com/reference/api/)
- [DigitalOcean Community](https://www.digitalocean.com/community)
- [Size Comparison Tool](https://www.digitalocean.com/pricing)
- [Status Page](https://status.digitalocean.com)