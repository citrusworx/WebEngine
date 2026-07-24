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
- kernel modules: `core`, `web`, `native`, `embedded` (topo-sorted scaffold → bootstrap → health)
- sample configs: `engines/webengine/kiwi.config.toml` + `webengine.config.json5`
- vitest coverage for config find/load, topo-sort, and lifecycle health

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

[runtimes.web]
path = "webengine.config.json5"

[webengine]
app_name = "my-app"
host = "localhost"
port = 8080
```

The web runtime module loads `webengine.config.json5` (JSON5 + Zod). Native/embedded modules load YAML runtime files when enabled.

## Reality check

- The kernel/config pipeline is real and builds from `src/`
- Lifecycle methods beyond `init` / `parse` / `teardown` remain stubs awaiting Grapevine and app adapters
- `@citrusworx/types` remains the shared contract layer for blueprints and deployments

## Relationship to the libraries

WebEngine is meant to compose the library layer rather than replace it:

- `@citrusworx/types` provides shared contracts
- `@citrusworx/nectarine` is the backend/data layer
- `@citrusworx/seltzer` is the HTTP/runtime layer
- `@citrusworx/juiceui` and `@citrusworx/sigjs` cover UI/runtime concerns
- `@citrusworx/grapevine` and `@citrusworx/dns` cover infrastructure and domain workflows

## Source of truth

- Package: `engines/webengine/package.json`
- Entrypoint: `engines/webengine/src/index.ts`
- Kernel: `engines/webengine/src/kernel/`
- Config: `engines/webengine/src/config/`
- Published README: `engines/webengine/README.md`
