# WebEngine

`@citrusworx/webengine` is the workspace orchestration package for the CitrusWorx stack.

This page reflects the current source in `engines/webengine/src/`.

## Current status

WebEngine is an early orchestration package with a working **kiwi config loader** and **kernel module lifecycle**, plus a lifecycle-shaped `WebEngine` class for longer-term deploy/monitor/teardown steps.

What exists today:

- a published package surface at `@citrusworx/webengine`
- a `WebEngine` class in `engines/webengine/src/index.ts`
- constructor wiring for `Blueprint`, `Environment`, and `DeploymentManifest`
- real `parse()` for YAML / TOML / JSON (`js-yaml`, `smol-toml`)
- `init()` that locates `kiwi.config.toml`, validates it, and runs the kernel lifecycle
- kernel modules: `core`, `web`, `native`, `embedded`, `nectarine` (topo-sorted scaffold → bootstrap → health)
- Nectarine data module (`id: nectarine`) hosts `@citrusworx/nectarine` ≥0.3.0 as a library: load `nectarine.config.yaml`, resolve credentials, connect, `applyMigrations` (empty migrations dir is a no-op)
- Nectarine → Seltzer route helper: `createNectarineReadRoutes` / `createNectarineWriteRoutes` / `createNectarineRoutes` and handle `createReadRoutes` / `createWriteRoutes` / `createRoutes` (`listApiOperations` → `generateRoutes`; default execute is named YAML + adapter `query`; writes bind body + path)
- sample configs: `engines/webengine/kiwi.config.toml` + `webengine.config.json5`
- vitest coverage for config find/load, topo-sort, lifecycle health, Nectarine config load + migration no-op, and compiled read/write route generation

What is still mostly scaffold/design:

- Grapevine / provider orchestration in `buildEnvironment` and related lifecycle methods
- dynamic module registration beyond the builtin registry
- production deployment, telemetry, and dashboard workflows

## Public API today

```ts
import {
  WebEngine,
  runKernelLifecycle,
  findKiwiConfigPath,
} from "@citrusworx/webengine";
import type {
  Blueprint,
  DeploymentManifest,
  Environment
} from "@citrusworx/types";

const engine = new WebEngine({
  blueprint,
  environment,
  deploymentManifest,
  cwd: process.cwd(), // directory used to find kiwi.config.toml
});

await engine.init();
const health = engine.getHealthSummary();

// Or call the kernel directly:
const result = await runKernelLifecycle(process.cwd());
```

## Config model

WebEngine uses **`kiwi.config.toml`** as the project root config (not `webengine.toml`).

Typical layout:

```toml
version = "0.1.0"

[kernel]
modules = ["core", "web"]
# Opt in to the Nectarine data module:
# modules = ["core", "web", "nectarine"]

[runtimes.web]
path = "webengine.config.json5"

[webengine]
app_name = "my-app"
host = "localhost"
port = 8080
```

The web runtime module loads `webengine.config.json5` (JSON5 + Zod). Native/embedded modules load YAML runtime files when enabled.

Enable `nectarine` in `kernel.modules` when the project has `nectarine.config.yaml`. The module:

1. Loads config with `loadNectarineConfig` (or `NECTARINE_CONFIG` for an alternate path)
2. Resolves credentials through `NectarineConfig` (YAML names env keys; adapters never read `process.env`)
3. Creates a vendor adapter via `createPgAdapterFromConfig` / MySQL / Mongo factories
4. Connects and runs `applyMigrations` (schemas from `*Schema.yml`, versioned YAML from `<config dir>/migrations`; missing dir is a no-op)
5. Registers a handle on `KernelContext` (`config`, `adapter` / `query`, `listApiOperations`, `createReadRoutes`, `createWriteRoutes`, `createRoutes`)

Partial vendor env is a boot error. Fully unset env takes the host seed-fallback path when `fallback.seed: true` and the process is not production (or `ALLOW_SEED_FALLBACK=1`). HTTP stays in Seltzer. Opt in to generated reads after bootstrap:

```ts
import { Seltzer } from "@citrusworx/seltzer";
import {
  NECTARINE_MODULE_ID,
  createNectarineReadRoutes,
  createNectarineWriteRoutes,
  type NectarineModuleHandle,
} from "@citrusworx/webengine";

const handle = ctx.getModuleHandle<NectarineModuleHandle>(NECTARINE_MODULE_ID);
const app = Seltzer.init();
for (const route of handle.createRoutes({ resources: ["course"] })) {
  app.route(route);
}

// No kernel required — pass a loaded NectarineConfig:
const routes = createNectarineReadRoutes(config, {
  resources: ["course"],
  query: handle.query,
  connected: () => handle.connected,
});
const writes = createNectarineWriteRoutes(config, {
  resources: ["course"],
  query: handle.query,
  connected: () => handle.connected,
});
```

Default execute compiles `*Queries.yml` through CCompiler and runs adapter `query`. Pass `execute` for host-specific reads and writes (Blackwater product JSONB / waitlist join). See [Nectarine kernel contract](./nectarine-kernel-contract.md).

## Reality check

- The kernel/config pipeline is real and builds from `src/`
- Lifecycle methods beyond `init` / `parse` / `teardown` remain stubs awaiting Grapevine and app adapters
- `@citrusworx/types` remains the shared contract layer for blueprints and deployments

## Relationship to the libraries

WebEngine is meant to compose the library layer rather than replace it:

- `@citrusworx/types` provides shared contracts
- `@citrusworx/nectarine` is the backend/data layer ([kernel contract](./nectarine-kernel-contract.md))
- `@citrusworx/seltzer` is the HTTP/runtime layer
- `@citrusworx/juiceui` and `@citrusworx/sigjs` cover UI/runtime concerns
- `@citrusworx/grapevine` and `@citrusworx/dns` cover infrastructure and domain workflows

## Source of truth

- Package: `engines/webengine/package.json`
- Entrypoint: `engines/webengine/src/index.ts`
- Kernel: `engines/webengine/src/kernel/`
- Config: `engines/webengine/src/config/`
- Published README: `engines/webengine/README.md`
