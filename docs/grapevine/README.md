# Grapevine

Grapevine is a cloud infrastructure and deployment library. It provides a unified, config-driven interface for provisioning and managing cloud resources across providers — regardless of what is in your application stack.

Grapevine is a WebEngine native module but is fully independent. It can be used in any project with any stack.

---

## Philosophy

Infrastructure should not be tied to your application framework. A Next.js frontend with a PHP backend should be just as easy to deploy as a full WebEngine native stack. Grapevine reads your infrastructure config and handles provisioning, networking, and deployment — without caring what is running inside.

- **Provider agnostic** — define infrastructure once, target any cloud
- **Stack agnostic** — deploys any language or framework
- **Config driven** — infrastructure defined in `grapevine.config.yaml`
- **VPC first** — networking and security are first class concerns
- **WebEngine integrated** — works seamlessly as a WebEngine infra module

---

## Installation

```bash
yarn add @citrusworx/grapevine
```

---

## Supported Providers

| Provider | Status |
|----------|--------|
| DigitalOcean | Active development |
| AWS | Planned |
| Linode | Planned |
| Azure | Planned |
| GCP | Planned |

---

## Configuration

Grapevine infrastructure can be defined three ways:

| Method | Context | Description |
|--------|---------|-------------|
| Hand-written | Any | Directly author `grapevine.config.yaml` |
| grapeGUI | Development | Wizard-like local tool for defining infra visually |
| WebEngine Dashboard | Post-deployment | Edit deployed infrastructure via the WebEngine UI |

All three produce and consume the same `grapevine.config.yaml` — the source of truth regardless of how it was created.

### grapeGUI

grapeGUI is a local dev utility that provides a wizard-like experience for building your infrastructure config without writing YAML by hand. It reads and writes `grapevine.config.yaml` directly.

```bash
yarn grapevine gui
```

### Hand-written Config

Grapevine is configured via `grapevine.config.yaml` at your project root.

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
    size: basic-xxs
    entry: apps/front
  backend:
    type: app
    size: basic-xs
    entry: apps/server
  database:
    type: postgres
    version: "15"
  cache:
    type: redis

firewall:
  inbound:
    - protocol: tcp
      ports: "80"
      sources: ["0.0.0.0/0"]
    - protocol: tcp
      ports: "443"
      sources: ["0.0.0.0/0"]
  outbound:
    - protocol: tcp
      ports: "all"
      destinations: ["0.0.0.0/0"]
```

---

## Usage with WebEngine

When used as a WebEngine module, Grapevine reads both `webengine.toml` and `grapevine.config.yaml`. WebEngine passes the stack definition to Grapevine so it knows what to deploy.

```toml
# webengine.toml
[stack]
frontend = { lib = "next", entry = "apps/front" }
backend = { lib = "php", entry = "apps/server" }
infra = { lib = "grapevine" }
```

```yaml
# grapevine.config.yaml
provider: digitalocean
region: nyc1

networking:
  vpc: true
  domain: myapp.com
  ssl: true
```

Grapevine provisions the environment defined in its config and deploys whatever WebEngine's stack defines — regardless of language or framework.

---

## DigitalOcean Provider

The DigitalOcean provider is the first supported cloud target. It covers the core primitives needed to deploy and manage a production web application.

All values are defined in `grapevine.config.yaml` and referenced by Grapevine at runtime — nothing is hardcoded in application code.

### Droplets

Droplets are DigitalOcean's virtual machines. Grapevine provisions and manages droplets based on your service definitions in config.

```yaml
# grapevine.config.yaml
services:
  server:
    type: droplet
    size: s-1vcpu-1gb
    image: ubuntu-22-04-x64
    region: nyc1
```

```ts
import { DigitalOcean } from "@citrusworx/grapevine";

// Grapevine reads config — no hardcoded values
const droplet = await DigitalOcean.Droplet.create("server");
```

### Firewall

Manage inbound and outbound traffic rules defined in config.

```yaml
# grapevine.config.yaml
firewall:
  name: main
  inbound:
    - protocol: tcp
      ports: "443"
      sources: ["0.0.0.0/0"]
  outbound:
    - protocol: tcp
      ports: "all"
      destinations: ["0.0.0.0/0"]
```

```ts
const firewall = await DigitalOcean.Firewall.create("main");
```

### VPC

Virtual Private Cloud networking defined in config.

```yaml
# grapevine.config.yaml
networking:
  vpc:
    name: main
    region: nyc1
    ipRange: "10.10.10.0/24"
```

```ts
const vpc = await DigitalOcean.VPC.create("main");
```

### SSH

SSH keys defined in config, credentials sourced from environment.

```yaml
# grapevine.config.yaml
ssh:
  name: main
  publicKey: env.SSH_PUBLIC_KEY
```

```ts
const key = await DigitalOcean.SSH.create("main");
```

---

## Deployment Flow

When Grapevine deploys an application it follows this order:

1. Provision VPC and networking
2. Configure firewall rules
3. Register SSH keys
4. Provision compute resources (droplets, app platform)
5. Provision databases and caches
6. Configure domain and SSL
7. Deploy application services

This order ensures networking and security are in place before any compute resources are exposed.

---

## Usage with Non-WebEngine Stacks

Grapevine works independently of WebEngine. Any application can use it for infrastructure management by providing a `grapevine.config.yaml`:

```yaml
# React frontend + Python backend on DigitalOcean
version: "0.1"
provider: digitalocean
region: sfo3

services:
  frontend:
    type: app
    runtime: static
    entry: build/
  backend:
    type: app
    runtime: python
    entry: api/
    version: "3.11"
  database:
    type: postgres
    version: "15"

networking:
  vpc: true
  domain: myapp.com
  ssl: true
```

---

## Roadmap

```
v0.1  ← DigitalOcean provider (Droplets, Firewall, VPC, SSH)  🔧 Active
v0.2  ← AWS + Linode providers
v0.3  ← Azure provider
v0.4  ← GCP provider
v1.0  ← stable multi-cloud API
```

---

## Status

Grapevine is in active development. The DigitalOcean provider is the current focus and is being developed against the CitrusWorx reference implementation.