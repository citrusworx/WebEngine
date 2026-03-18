# WebEngine

WebEngine is a kernel-based, config-driven orchestration engine for web applications. It manages your entire stack--from design to deployment--while giving developer and creators the freedoms to use the tools they prefer.

WebEngine does not lock you into a specific framework or language. It reads your configuration, builds a dependency graph, and orchestrates everything together--build pipeline, dev server, deployment, and telemetry--regardless of what's in your stack.

---

## Philosophy

Modern web development is fragmented. Developers spend more time wiring tools together than building their applications. WebEngine exists to solve that--providing structure, automation, and standards so your focus stays on what matters.

- Stack agnostic--use React, Next.js, Vue, PHP, Python or WebEngine's own modules.
- Config driven--your entire application is defined in webengine.toml
- Modular--every piece is optional and replaceable
- Accessible--developers work in code, creators work in Sugar.

---

## How It Works

WebEngine reads `webengine.toml` at the root of your project and:

1. Parses your stack definition
2. Builds a dependency graph of modules and blueprints
3. Starts and orchestrates each piece in the correct order
4. Wires telemetry across all modules
5. Exposes a kernel API for blueprints and tooling to communicate.

---

## The Stack

```toml
[webengine]
version = "0.1"
name = "myapp"
schematic = "default"

[kernel]
port = 9009
telemetry = true

[rendering]
mode = "SSR"

[stack]
frontend = {lib = "juice", entry = "apps/front"}
reactivity = {lib = "sigjs"}
backend = {lib = "nectarine", entry="app/server"}
infra = {lib = "grapevine"}

[blueprints]
installed = []

[telemetry]
enabled = true
endpoint = ""
interval = 30
```

WebEngine supports any combination of tools in the stack. The following are valid:
- Next.js frontend + PHP backend + GrapeVine infra
- React frontend + Python backend + AWS
- Juice + Sig.js + Nectarine + GrapeVine (native stack)

---

## Rendering Modes

WebEngine configures your build and deployment based on your declared rendering mode.

| Mode | Description|
|--------|-------------|
| CSR | Client-Side rendering--static HTML shell, JS handles everything |
|SSG| Static site generation--pages pre-rendered at build time |
|SSR| Server-side rendering--pages rendered on each request|
|Edge| Edge runtime deployment-- Cloudflare workers and similar|

---

## Modules

WebEngine's native modules are independently usable outside of WebEngine. Each has its own config and can be swapped for any equivalent tool.

|Module|Purpose|Config|
|------|-------|------|
|Juice|UI Component library|`juice.config.yaml`|
|Sig.js|Signals-based DOM reactivity|TDB|
|Nectarine|Backend models, schemas, SQL-generation, and APIs|`nectarine.config.yaml`|
|GrapeVine|Cloud infrastructure and deployment|`grapevine.config.yaml`|
|KiwiPress|Headless WordPress schematic|`kiwipress.config.yaml`|

## Schematics

Schematics are application type templates that define the structure and standard for a specific kind of web applcation. A schematic gives your project its shape.

Available schematics:
- `default`--general purpose web application
- `kiwipress`--headless and traditional headless WordPress
- `pizzeria`--restaurant and food service
- `health-rx`--health and pharmacy
- `webstore`--ecommerce
- `api-app`--API-first application
- `convenience`--convenience and retail

---

## Blueprints

Blueprints are installable business function modules. They are language-agnostic and communicate with the WebEngine's kernal via API. A blueprint declares what it needs, what it exposes, and registers itself with the kernel on startup.

Available blueprints:
- Email
- CRM
- ERM
- Inventory
- Warehouse
- Logistics
- Delivery
- Online Marketing

Blueprints compose together. A pizzeria schematic might use delivery, inventory, and online marketing blueprints. A health app might use ERM and CRM blueprints.

---

## Tooling

|Tooling|Description|
|--|--|
|WebEngine CLI|Command line interface for creating and managing projects|
|WebEngine Dashboard|Web UI for managing deployed applications|
|WebEngine Wizard|GUI app creation experience powered by Sugar|
|Sugar|Visual and node-based editor for low and no-node environments|

---

## Status

WebEngine is currently in active design and development. The kernel is in design phase and being developed against the CitrusWorx reference implementation.
|Component|Status|
|--|--|
|Kernel|Design phase|
|Juice|Active Development|
|Sig.js|Active Development| 
|GrapeVine|Active Development|
|Nectarine|Active Development|
|KiwiPress|Active Development|
|Sugar|Planned|
|Dashboard|Planned|
|Wizard|Planned|
|||
---
