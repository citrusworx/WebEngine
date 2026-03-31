# GrapeVine Examples

Real-world infrastructure deployment examples with GrapeVine.

## Table of Contents

1. [Basic Web Server](#basic-web-server)
2. [Full Stack Application](#full-stack-application)
3. [Microservices Setup](#microservices-setup)
4. [Database with Backups](#database-with-backups)
5. [Secure Internal Network](#secure-internal-network)

---

## Basic Web Server

Simplest setup: single app droplet with automatic backups.

### Blueprint: single-server.yaml

```yaml
blueprint:
  name: "basic-web-server"
  droplet:
    name: "web-001"
    region: "nyc1"
    size: "s-1vcpu-1gb"
    image: "ubuntu-22-04-x64"
    backups: true
    monitoring: true
    ipv6: true
    tags:
      - "web"
      - "production"
```

### Deploy Script

```typescript
import { deployByBlueprint, createSSHKey, uploadSSHKey } from "@citrusworx/grapevine";

async function deployBasicServer() {
  // 1. Create SSH key
  const sshKey = createSSHKey("web-server-key");
  console.log("SSH Fingerprint:", sshKey.fingerprint);
  
  // 2. Save private key locally (keep secure!)
  import fs from "fs";
  fs.writeFileSync("~/.ssh/web-key", sshKey.keys.privateKey, { mode: 0o600 });
  
  // 3. Upload public key to DigitalOcean
  const uploaded = await uploadSSHKey({
    name: sshKey.name,
    public_key: sshKey.publicKey
  });
  
  console.log("SSH Key uploaded:", uploaded.id);
  
  // 4. Deploy droplet
  const droplet = await deployByBlueprint("./single-server.yaml");
  
  console.log(`\n✓ Server deployed!`);
  console.log(`  Name: ${droplet.name}`);
  console.log(`  IP: ${droplet.networks.v4[0].ip_address}`);
  console.log(`  SSH: ssh root@${droplet.networks.v4[0].ip_address}`);
}

deployBasicServer().catch(console.error);
```

### Post-Deployment

After deployment, connect and configure:

```bash
# Connect to server
ssh root@<ip_address>

# Update system
apt update && apt upgrade -y

# Install Node.js and tools
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs git

# Clone application
git clone https://github.com/yourusername/myapp.git
cd myapp

# Install dependencies and start
npm install
npm start
```

---

## Full Stack Application

Complete setup with frontend, backend, and database.

### Configuration: grapevine.config.yaml

```yaml
version: "0.1"
provider: digitalocean
region: nyc1

networking:
  vpc: true
  domain: myapp.com
  ssl: true

services:
  frontend:
    type: app
    size: basic-xs
    entry: apps/front
    env:
      REACT_APP_API: https://api.myapp.com
      NODE_ENV: production

  backend:
    type: app
    size: basic-s
    entry: apps/back
    env:
      NODE_ENV: production
      DATABASE_URL: postgres://user:pass@db:5432/myapp
      REDIS_URL: redis://cache:6379

  database:
    type: postgres
    version: "15"
    backups: true

  cache:
    type: redis
    version: "7"

firewall:
  inbound:
    - protocol: tcp
      ports: "80,443"
      sources: ["0.0.0.0/0"]
    - protocol: tcp
      ports: "22"
      sources: ["203.0.113.0/24"]
    - protocol: tcp
      ports: "5432"
      sources: ["tag:app"]
    - protocol: tcp
      ports: "6379"
      sources: ["tag:app"]

  outbound:
    - protocol: tcp
      ports: "all"
      destinations: ["0.0.0.0/0"]

monitoring:
  enabled: true
  alerts:
    - type: cpu
      threshold: 80
    - type: memory
      threshold: 85
```

### Deployment Script

```typescript
import {
  createVPC,
  createFireWall,
  deployByBlueprint,
  parseYAML
} from "@citrusworx/grapevine";

async function deployFullStack() {
  console.log("🚀 Starting full stack deployment...\n");

  // 1. Create VPC
  console.log("📦 Creating VPC...");
  const vpc = await createVPC({
    name: "myapp-vpc",
    description: "Production VPC for myapp",
    region: "nyc1",
    ip_range: "10.10.0.0/16"
  });
  console.log(`✓ VPC created: ${vpc.id}\n`);

  // 2. Create firewall rules
  console.log("🔒 Creating firewall...");
  await createFireWall({
    name: "myapp-firewall",
    tags: ["myapp"],
    inbound_rules: [
      // HTTP/HTTPS from anywhere
      {
        protocol: "tcp",
        ports: "80",
        sources: { addresses: ["0.0.0.0/0"] }
      },
      {
        protocol: "tcp",
        ports: "443",
        sources: { addresses: ["0.0.0.0/0"] }
      },
      // SSH from office
      {
        protocol: "tcp",
        ports: "22",
        sources: { addresses: ["203.0.113.0/24"] }
      },
      // Database access from app servers only
      {
        protocol: "tcp",
        ports: "5432",
        sources: { tags: ["app"] }
      },
      // Redis access from app servers only
      {
        protocol: "tcp",
        ports: "6379",
        sources: { tags: ["app"] }
      }
    ],
    outbound_rules: [
      {
        protocol: "tcp",
        ports: "all",
        destinations: { addresses: ["0.0.0.0/0"] }
      }
    ]
  });
  console.log("✓ Firewall rules configured\n");

  // 3. Deploy frontend
  console.log("🖥️  Deploying frontend...");
  const frontendBlueprint = {
    blueprint: {
      name: "myapp-frontend",
      droplet: {
        name: "myapp-frontend-01",
        region: "nyc1",
        size: "s-1vcpu-1gb",
        image: "ubuntu-22-04-x64",
        backups: true,
        monitoring: true,
        tags: ["frontend", "myapp"],
        vpc_uuid: vpc.id
      }
    }
  };

  // 4. Deploy backend
  console.log("⚙️  Deploying backend...");
  const backendBlueprint = {
    blueprint: {
      name: "myapp-backend",
      droplet: {
        name: "myapp-backend-01",
        region: "nyc1",
        size: "s-1vcpu-2gb",
        image: "ubuntu-22-04-x64",
        backups: true,
        monitoring: true,
        tags: ["backend", "myapp"],
        vpc_uuid: vpc.id
      }
    }
  };

  console.log("\n✅ Full stack deployment complete!\n");
  console.log("Next steps:");
  console.log("1. Deploy applications to frontend and backend droplets");
  console.log("2. Run database migrations");
  console.log("3. Configure DNS to point to load balancer");
  console.log("4. Monitor application health");
}

deployFullStack().catch(console.error);
```

---

## Microservices Setup

Distributed system with multiple backend services.

### Architecture

```
Load Balancer (nginx)
├── API Service (3 instances)
├── Worker Service (2 instances)
├── Cache Service (Redis cluster)
├── Database (PostgreSQL primary + replica)
└── Message Queue (Redis Queues)
```

### Deployment Script

```typescript
import { createVPC, createFireWall } from "@citrusworx/grapevine";

async function deployMicroservices() {
  console.log("🚀 Deploying microservices architecture...\n");

  // 1. Create VPC
  const vpc = await createVPC({
    name: "microservices-vpc",
    description: "Production microservices network",
    region: "nyc1",
    ip_range: "10.20.0.0/16"
  });

  // 2. Firewall rules for microservices
  await createFireWall({
    name: "microservices-firewall",
    tags: ["microservices"],
    inbound_rules: [
      // Public endpoints
      { protocol: "tcp", ports: "80,443", sources: { addresses: ["0.0.0.0/0"] } },
      // Admin SSH
      { protocol: "tcp", ports: "22", sources: { addresses: ["203.0.113.0/24"] } },
      // Inter-service communication
      { protocol: "tcp", ports: "3000-3999", sources: { tags: ["service"] } },
      // Database cluster
      { protocol: "tcp", ports: "5432", sources: { tags: ["service"] } },
      // Message queue
      { protocol: "tcp", ports: "6379", sources: { tags: ["service"] } }
    ],
    outbound_rules: [
      { protocol: "tcp", ports: "all", destinations: { addresses: ["0.0.0.0/0"] } }
    ]
  });

  // 3. Deploy services
  const services = [
    // API Services
    { name: "api-01", port: "3001", tag: "api-service" },
    { name: "api-02", port: "3002", tag: "api-service" },
    { name: "api-03", port: "3003", tag: "api-service" },
    // Worker Services
    { name: "worker-01", port: "4001", tag: "worker-service" },
    { name: "worker-02", port: "4002", tag: "worker-service" }
  ];

  for (const service of services) {
    console.log(`📦 Deploying ${service.name}...`);
    // Deploy each service
  }

  console.log("\n✅ Microservices deployment complete!");
}

deployMicroservices().catch(console.error);
```

---

## Database with Backups

Production database setup with automated backups and replicas.

### Configuration

```typescript
import { createVPC } from "@citrusworx/grapevine";

async function deployProductionDatabase() {
  const vpc = await createVPC({
    name: "database-vpc",
    description: "Database only VPC",
    region: "nyc1",
    ip_range: "10.30.0.0/16"
  });

  // Primary database configuration
  const primaryDb = {
    blueprint: {
      name: "db-primary",
      droplet: {
        name: "postgres-primary-01",
        region: "nyc1",
        size: "s-4vcpu-8gb", // Larger instance for database
        image: "ubuntu-22-04-x64",
        backups: true,
        monitoring: true,
        tags: ["database", "primary"],
        vpc_uuid: vpc.id,
        user_data: `#!/bin/bash
# Install PostgreSQL
apt update
apt install -y postgresql postgresql-contrib
# Configure for replication
sed -i "s/#wal_level = replica/wal_level = replica/" /etc/postgresql/15/main/postgresql.conf
systemctl restart postgresql`
      }
    }
  };

  // Read replica configuration
  const replicaDb = {
    blueprint: {
      name: "db-replica",
      droplet: {
        name: "postgres-replica-01",
        region: "nyc1",
        size: "s-2vcpu-4gb",
        image: "ubuntu-22-04-x64",
        backups: true,
        monitoring: true,
        tags: ["database", "replica"],
        vpc_uuid: vpc.id
      }
    }
  };

  return {
    vpc,
    primaryDb,
    replicaDb
  };
}

deployProductionDatabase().catch(console.error);
```

### Backup Strategy

```typescript
interface BackupStrategy {
  frequency: "hourly" | "daily" | "weekly";
  retention_days: number;
  automated: boolean;
  snapshots: number; // Keep N most recent
}

const backups: BackupStrategy = {
  frequency: "daily",
  retention_days: 30, // Keep 30 days of backups
  automated: true,
  snapshots: 5 // Keep 5 daily snapshots
};
```

---

## Secure Internal Network

Setup with bastion host and completely isolated services.

### Architecture

```
Internet
    ↓
Bastion Host (Public)
    ↓
VPC (10.0.0.0/16)
├── Public Subnet (10.0.1.0/24) - Load Balancer
├── Private Subnet (10.0.10.0/24) - Applications
├── Private Subnet (10.0.20.0/24) - Databases
└── Private Subnet (10.0.30.0/24) - Services
```

### Deployment

```typescript
import { createVPC, createFireWall } from "@citrusworx/grapevine";

async function deploySecureNetwork() {
  console.log("🔐 Deploying secure internal network...\n");

  // Create VPC
  const vpc = await createVPC({
    name: "secured-vpc",
    description: "Isolated production environment",
    region: "nyc1",
    ip_range: "10.0.0.0/16"
  });

  console.log(`✓ VPC created: ${vpc.id}`);

  // Bastion host firewall (public)
  await createFireWall({
    name: "bastion-firewall",
    tags: ["bastion"],
    inbound_rules: [
      // SSH only from office
      {
        protocol: "tcp",
        ports: "22",
        sources: { addresses: ["203.0.113.0/24"] }
      }
    ],
    outbound_rules: [
      // Can reach internal network
      {
        protocol: "tcp",
        ports: "all",
        destinations: { addresses: ["10.0.0.0/16"] }
      }
    ]
  });

  // Internal services firewall (private)
  await createFireWall({
    name: "internal-firewall",
    tags: ["internal"],
    inbound_rules: [
      // Only from bastion
      {
        protocol: "tcp",
        ports: "all",
        sources: { tags: ["bastion"] }
      },
      // Inter-service communication
      {
        protocol: "tcp",
        ports: "all",
        sources: { tags: ["internal"] }
      }
    ],
    outbound_rules: [
      // Can reach internet
      {
        protocol: "tcp",
        ports: "all",
        destinations: { addresses: ["0.0.0.0/0"] }
      }
    ]
  });

  console.log("\n✅ Secure network deployed!");
  console.log("\nAccess pattern:");
  console.log("  Local Machine");
  console.log("    → SSH to Bastion (public)");
  console.log("    → SSH from Bastion to Internal Services");
}

deploySecureNetwork().catch(console.error);
```

---

## Best Practices

### 1. Always Use VPC

```typescript
// ✓ Good - isolated network
const vpc = await createVPC({
  name: "production",
  region: "nyc1",
  ip_range: "10.0.0.0/16"
});

// ✗ Avoid - resources on public internet
```

### 2. Enable Backups

```typescript
// ✓ Good - protected against data loss
backups: true,
backup_policy: {
  name: "daily"
}

// ✗ Dangerous - no backups
backups: false
```

### 3. Use Proper Firewall Rules

```typescript
// ✓ Good - restrictive
inbound_rules: [
  {
    protocol: "tcp",
    ports: "22",
    sources: { addresses: ["office-ip/32"] } // Only from office
  }
]

// ✗ Dangerous - too open
inbound_rules: [
  {
    protocol: "tcp",
    ports: "all",
    sources: { addresses: ["0.0.0.0/0"] } // Anywhere!
  }
]
```

### 4. Monitor Production

```typescript
// ✓ Good - alerts enabled
monitoring: true,
alerts: [
  { type: "cpu", threshold: 80 },
  { type: "memory", threshold: 85 }
]

// ✗ Missing - silently fails
monitoring: false
```

### 5. Tag Resources

```typescript
// ✓ Good - organized and findable
tags: ["production", "web", "critical"]

// ✗ Hard to manage - no organization
tags: []
```