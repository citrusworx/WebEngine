# WebEngine

WebEngine is a kernel-based, config-driven orchestration engine for web applications. It manages your entire stack--from design to deployment--while giving developers and creators the freedom to use the tools they prefer.

WebEngine does not lock you into a specific framework or language. It reads your configuration, builds a dependency graph, and orchestrates everything together--build pipeline, dev server, deployment, and telemetry--regardless of what's in your stack.

---

## Philosophy

Modern web development is fragmented. Developers spend more time wiring tools together than building their applications. WebEngine exists to solve that--providing structure, automation, and standards so your focus stays on what matters.

- Stack agnostic--use React, Next.js, Vue, PHP, Python, or WebEngine's own modules.
- Config driven--your application's runtime is defined in `kiwi.config.toml`
- Modular--every piece is optional and replaceable
- Accessible--developers work in code, creators work in Sugar.

---

## How It Works

WebEngine searches upward from the current working directory for `kiwi.config.toml` and:

1. Parses and validates the project config
2. Resolves the list of kernel modules and computes their dependency order
3. Runs `scaffold → bootstrap → health` for each module in dependency order
4. Exposes a `KernelContext` for modules and blueprints to share handles and config
5. Supports graceful shutdown in reverse dependency order

---

## Configuration

WebEngine uses two config files.

### `kiwi.config.toml`

The main project config. WebEngine walks upward from the working directory to find it.

```toml
version = "0.1"

[kernel]
modules = ["core", "web"]   # built-in: core, web, native, embedded

[webengine]
app_name  = "myapp"
host      = "localhost"
port      = 8080

# optional
description         = "My application"
debug_mode          = false
log_level           = "info"

[webengine.database]
url = "postgres://localhost/mydb"

[webengine.security]
enable_https = true
cert_file    = "certs/server.crt"
key_file     = "certs/server.key"

[webengine.features]
enable_caching     = true
enable_compression = true

[runtimes]
# paths to per-runtime config files (optional -- defaults shown)
web.path      = "webengine.config.json5"
native.path   = "native.config.yaml"
embedded.path = "embedded.config.yaml"
```

### `webengine.config.json5`

The web runtime config. Read and validated by the `web` kernel module during bootstrap.

```json5
{
    name: "myapp",
    description: "My application",
    version: "0.1.0",
    network: {
        host: "localhost",
        port: 8080,
        dns: {
            enabled: false,
            provider: "cloudflare",
            domain: "example.com"
        }
    },
    development: {},
    staging: {},
    deployment: {}
}
```

---

## Kernel API

The kernel is the core of WebEngine. It is fully implemented and used internally by the `WebEngine` class.

### `WebEngine` class

```ts
import { WebEngine } from "@citrusworx/webengine";

const engine = new WebEngine();

// Start: finds kiwi.config.toml, runs full scaffold → bootstrap → health lifecycle
await engine.start();

// Access the live kernel context and health
const ctx = engine.getKernelContext();
engine.assertHealthy();  // throws if any module failed

// Load a blueprint and resolve its modules
engine.loadBlueprint({ name: "myapp", modules: ["core", "web"], ... });
engine.resolveModules();

// Deploy to an environment
engine.deploy("production");

// Graceful shutdown (reverse dependency order)
await engine.shutdown();
```

### `KernelContext`

`KernelContext` is the shared runtime object passed to every kernel module. It holds the validated config, resolved paths, and a map of module handles for inter-module communication.

```ts
ctx.kiwi          // parsed kiwi.config.toml
ctx.projectRoot   // directory containing kiwi.config.toml
ctx.webRuntime    // parsed webengine.config.json5 (set by web module)

ctx.registerModuleHandle("mymodule", { ready: true });
ctx.getModuleHandle("mymodule");
```

### Kernel module lifecycle

Each kernel module implements up to four lifecycle hooks:

| Hook | Required | Description |
|---|---|---|
| `scaffold(ctx)` | No | One-time filesystem or resource setup |
| `bootstrap(ctx)` | Yes | Load config, register module handle |
| `health(ctx)` | Yes | Return `{ ok: boolean, detail?: string }` |
| `shutdown(ctx)` | No | Cleanup on graceful exit |

Modules run in topological dependency order. `shutdown` runs in reverse order.

### Built-in kernel modules

| ID | Dependencies | Description |
|---|---|---|
| `core` | — | Base infrastructure, always required |
| `web` | `core` | Loads and validates `webengine.config.json5` |
| `native` | — | Desktop/mobile runtime (YAML config) |
| `embedded` | — | IoT/embedded runtime (YAML config) |

---

## Modules

WebEngine's native modules are independently usable outside of WebEngine. Each has its own config and can be swapped for any equivalent tool.

| Module | Purpose | Config |
|---|---|---|
| Juice | UI component library | `juice.config.yaml` |
| Sig.js | Signals-based DOM reactivity | TBD |
| Nectarine | Backend models, schemas, SQL generation, and APIs | `nectarine.config.yaml` |
| GrapeVine | Cloud infrastructure and deployment | `grapevine.config.yaml` |
| KiwiPress | Headless WordPress client | `kiwipress.config.yaml` |

---

## Schematics

Schematics are application type templates that define the structure and standards for a specific kind of web application. A schematic gives your project its shape.

Available schematics:
- `default` -- general purpose web application
- `kiwipress` -- headless and traditional WordPress
- `pizzeria` -- restaurant and food service
- `health-rx` -- health and pharmacy
- `webstore` -- ecommerce
- `api-app` -- API-first application
- `convenience` -- convenience and retail

---

## Blueprints

Blueprints are installable business function modules. They declare what they need, what they expose, and register themselves with the kernel on startup. Blueprints are language-agnostic and communicate via the kernel API.

The `Blueprint` type is defined and `loadBlueprint()` / `resolveModules()` are implemented. Full blueprint installation and inter-blueprint composition are planned.

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

| Tooling | Description |
|---|---|
| WebEngine CLI | Command line interface for creating and managing projects |
| WebEngine Dashboard | Web UI for managing deployed applications |
| WebEngine Wizard | GUI app creation experience powered by Sugar |
| Sugar | Visual and node-based editor for low and no-code environments |

---

## Status

WebEngine is in active development. The kernel lifecycle, config loading, and module system are implemented. Higher-level features (schematics, stack composition, telemetry, tooling) are in design.

| Component | Status |
|---|---|
| WebEngine engine class | Early implementation -- skeleton with open design questions in source |
| Kernel lifecycle (scaffold / bootstrap / health / shutdown) | Implemented |
| Config loading (`kiwi.config.toml`) | Implemented |
| `KernelContext` | Implemented |
| Built-in modules (core, web, native, embedded) | Implemented |
| Types library (`@citrusworx/types`) | Implemented |
| Blueprint loading | Partially implemented |
| Schematics | Design phase |
| Stack composition (`[stack]` config) | Design phase |
| Rendering modes (CSR / SSG / SSR / Edge) | Design phase |
| Telemetry | Design phase |
| Juice | Active development |
| Sig.js | Active development |
| Nectarine | Active development |
| GrapeVine | Active development |
| KiwiPress | Active development |
| Sugar | Planned |
| Dashboard | Planned |
| Wizard | Planned |

---
