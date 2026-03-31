# GrapeVine Configuration Reference

Complete reference for `grapevine.config.yaml` configuration files.

## Configuration Structure

GrapeVine configuration is defined in `grapevine.config.yaml` at your project root.

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
  
  backend:
    type: app
    size: basic-s
    entry: apps/back
  
  database:
    type: postgres
    version: "15"

firewall:
  inbound:
    - protocol: tcp
      ports: "80,443"
      sources: ["0.0.0.0/0"]
  
  outbound:
    - protocol: tcp
      ports: "all"
      destinations: ["0.0.0.0/0"]

monitoring:
  enabled: true
  alerts:
    - cpu: 80
    - memory: 90
    - disk: 85
```

---

## Top-Level Fields

### version

**Type**: `string`

**Description**: Configuration format version.

**Current**: `"0.1"`

**Example**:
```yaml
version: "0.1"
```

### provider

**Type**: `string`

**Description**: Cloud provider to use.

**Supported**: 
- `digitalocean` (Active)
- `aws` (Planned)
- `linode` (Planned)
- `azure` (Planned)
- `gcp` (Planned)

**Example**:
```yaml
provider: digitalocean
```

### region

**Type**: `string`

**Description**: Default cloud region for resources.

**DigitalOcean Regions**:
- `nyc1` - New York
- `sfo1` - San Francisco
- `lon1` - London
- `ams3` - Amsterdam
- `fra1` - Frankfurt
- `tor1` - Toronto
- `blr1` - Bangalore
- `sgp1` - Singapore

**Example**:
```yaml
region: nyc1
```

---

## Networking Section

Controls network infrastructure.

```yaml
networking:
  vpc: true
  domain: myapp.com
  ssl: true
  cdn: false
```

### Fields

#### vpc

**Type**: `boolean`

**Description**: Enable Virtual Private Cloud isolation.

**Default**: `false`

**When enabled**:
- Creates private network
- Resources communicate securely
- Isolates from other deployments

**Example**:
```yaml
networking:
  vpc: true
```

#### domain

**Type**: `string`

**Description**: Primary domain name.

**Requirements**:
- Must be registered domain
- DNS must point to provider's nameservers

**Example**:
```yaml
networking:
  domain: myapp.com
```

#### ssl

**Type**: `boolean`

**Description**: Enable automatic SSL certificates.

**Requirements**:
- Requires valid `domain`
- Uses Let's Encrypt

**Default**: `false`

**Example**:
```yaml
networking:
  ssl: true
  domain: example.com
```

#### cdn

**Type**: `boolean`

**Description**: Enable CDN for static assets.

**Default**: `false`

**Example**:
```yaml
networking:
  cdn: true
```

---

## Services Section

Defines application and database services.

```yaml
services:
  frontend:
    type: app
    size: basic-xs
    entry: apps/citrusworx/front

  backend:
    type: app
    size: basic-s
    entry: apps/citrusworx/back

  database:
    type: postgres
    version: "15"

  cache:
    type: redis
    version: "7"
```

### Common Service Types

#### type: app

Application service (any language/framework).

**Fields**:
- `size` - Droplet size (see sizing guide below)
- `entry` - Path to application in repository
- `env` - Environment variables
- `startup` - Startup command
- `health_check` - Health check endpoint

**Example**:
```yaml
frontend:
  type: app
  size: basic-xs
  entry: apps/front
  env:
    REACT_APP_API_URL: https://api.myapp.com
    NODE_ENV: production
  startup: "yarn start"
  health_check: "/"
```

#### type: postgres

PostgreSQL database service.

**Fields**:
- `version` - PostgreSQL version
- `backups` - Enable automated backups
- `replica` - Create read replica

**Supported Versions**: 12, 13, 14, 15, 16

**Example**:
```yaml
database:
  type: postgres
  version: "15"
  backups: true
  replica: true
```

#### type: mysql

MySQL database service.

**Fields**:
- `version` - MySQL version
- `backups` - Enable automated backups

**Supported Versions**: 5.7, 8.0

**Example**:
```yaml
database:
  type: mysql
  version: "8.0"
  backups: true
```

#### type: redis

Redis cache service.

**Fields**:
- `version` - Redis version
- `eviction` - Eviction policy
- `persistence` - Enable RDB/AOF

**Supported Versions**: 6, 7, 8

**Example**:
```yaml
cache:
  type: redis
  version: "7"
  persistence: true
  eviction: "allkeys-lru"
```

#### type: mongodb

MongoDB database service.

**Fields**:
- `version` - MongoDB version
- `replica_set` - Enable replica sets

**Supported Versions**: 4.4, 5.0, 6.0, 7.0

**Example**:
```yaml
datastore:
  type: mongodb
  version: "7.0"
  replica_set: true
```

### Service Sizing Guide

Droplet sizes for `type: app`:

| Size | CPU | RAM | Storage | Cost | Typical Use |
|------|-----|-----|---------|------|------------|
| `basic-xxs` | 1 | 512MB | 10GB | $4/mo | Hobby |
| `basic-xs` | 1 | 1GB | 25GB | $6/mo | Small app |
| `basic-s` | 1 | 2GB | 50GB | $12/mo | Medium app |
| `basic-m` | 2 | 4GB | 80GB | $24/mo | Production |
| `basic-l` | 4 | 8GB | 160GB | $48/mo | High-traffic |
| `basic-xl` | 8 | 16GB | 320GB | $96/mo | Scale |

---

## Firewall Section

Network security rules.

```yaml
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
      sources: ["tag:web"]
  
  outbound:
    - protocol: tcp
      ports: "all"
      destinations: ["0.0.0.0/0"]
```

### Inbound Rules

**Format**:
```yaml
inbound:
  - protocol: tcp|udp
    ports: "22,80,443" | "3000" | "all"
    sources: ["0.0.0.0/0"] | ["tag:web"] | ["10.0.0.0/16"]
```

**Common Protocols**:
- `tcp` - TCP traffic
- `udp` - UDP traffic
- `icmp` - Ping/diagnostics

**Port Formats**:
- `"22"` - Single port
- `"80,443"` - Multiple ports
- `"8000-9000"` - Port range
- `"all"` - All ports

**Source Types**:
- `"0.0.0.0/0"` - Anywhere (any IPv4)
- `"::/0"` - Anywhere (any IPv6)
- `"203.0.113.0/32"` - Specific IP
- `"203.0.113.0/24"` - CIDR range
- `"tag:web"` - Resources tagged "web"
- `"droplet:12345"` - Specific droplet

### Outbound Rules

**Format**:
```yaml
outbound:
  - protocol: tcp
    ports: "all"
    destinations: ["0.0.0.0/0"]
```

**Destination Types**: Same as source types above

---

## Monitoring Section

Application and infrastructure monitoring.

```yaml
monitoring:
  enabled: true
  alerts:
    - type: cpu
      threshold: 80
      duration: 5m
    - type: memory
      threshold: 90
      duration: 5m
    - type: disk
      threshold: 85
      duration: 10m
```

### Alert Types

| Type | Threshold Range | Unit | Description |
|------|-----------------|------|-------------|
| `cpu` | 0-100 | percentage | CPU usage |
| `memory` | 0-100 | percentage | Memory usage |
| `disk` | 0-100 | percentage | Disk usage |
| `network_in` | 0-∞ | Mbps | Inbound bandwidth |
| `network_out` | 0-∞ | Mbps | Outbound bandwidth |
| `uptime` | 0-100 | percentage | Service availability |

---

## Environment Variables

Services can define environment variables accessible at runtime.

```yaml
services:
  backend:
    type: app
    entry: apps/back
    env:
      NODE_ENV: production
      DATABASE_URL: postgres://...
      API_PORT: "3000"
      DEBUG: "false"
```

### Secrets Management

For sensitive values, use secret references:

```yaml
services:
  backend:
    env:
      DATABASE_PASSWORD: ${{ secrets.db_password }}
      API_KEY: ${{ secrets.api_key }}
```

Secrets are injected at deployment time and never stored in config.

---

## Examples

### Small SaaS App

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
    size: basic-s
    entry: apps/front
    env:
      REACT_APP_API: https://api.myapp.com
  
  backend:
    type: app
    size: basic-s
    entry: apps/back
    env:
      NODE_ENV: production
  
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
  outbound:
    - protocol: tcp
      ports: "all"
      destinations: ["0.0.0.0/0"]

monitoring:
  enabled: true
```

### High-Traffic Production

```yaml
version: "0.1"
provider: digitalocean
region: nyc1

networking:
  vpc: true
  domain: enterprise.com
  ssl: true
  cdn: true

services:
  frontend:
    type: app
    size: basic-l
    entry: apps/front
  
  backend-api:
    type: app
    size: basic-l
    entry: apps/api
  
  backend-workers:
    type: app
    size: basic-m
    entry: apps/workers
  
  database:
    type: postgres
    version: "15"
    backups: true
    replica: true
  
  cache:
    type: redis
    version: "7"
    persistence: true

firewall:
  inbound:
    - protocol: tcp
      ports: "80,443"
      sources: ["0.0.0.0/0"]
    - protocol: tcp
      ports: "22"
      sources: ["203.0.113.0/24"]
  outbound:
    - protocol: tcp
      ports: "all"
      destinations: ["0.0.0.0/0"]

monitoring:
  enabled: true
  alerts:
    - type: cpu
      threshold: 75
    - type: memory
      threshold: 85
```

### Multi-Environment (Dev/Prod)

`grapevine.config.prod.yaml`:
```yaml
version: "0.1"
provider: digitalocean
region: nyc1

services:
  frontend:
    type: app
    size: basic-l
    entry: apps/front
  
  backend:
    type: app
    size: basic-m
    entry: apps/back
  
  database:
    type: postgres
    version: "15"
    backups: true
```

`grapevine.config.dev.yaml`:
```yaml
version: "0.1"
provider: digitalocean
region: sfo1

services:
  frontend:
    type: app
    size: basic-xs
    entry: apps/front
  
  backend:
    type: app
    size: basic-xs
    entry: apps/back
  
  database:
    type: postgres
    version: "15"
    backups: false
```

---

## Validation

GrapeVine validates configuration using Zod schemas:

```typescript
import { parseYAML } from "@citrusworx/grapevine";

try {
  const config = parseYAML("grapevine.config.yaml");
  console.log("Configuration valid");
} catch (error) {
  console.error("Configuration error:", error.message);
}
```