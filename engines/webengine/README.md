# @citrusworx/webengine

Web deployment engine and kiwi kernel for CitrusWorx blueprints and environments.

## Install

```bash
npm install @citrusworx/webengine
```

## Usage

```ts
import { WebEngine, runKernelLifecycle } from "@citrusworx/webengine";
import type { Blueprint, DeploymentManifest, Environment } from "@citrusworx/types";

const engine = new WebEngine({
  blueprint,
  environment,
  deploymentManifest,
  cwd: process.cwd(),
});

await engine.init();
console.log(engine.getHealthSummary());
```

`init()` looks upward for `kiwi.config.toml`, validates it, and runs builtin kernel modules (`core`, `web`, `nectarine`, …). Opt in to Nectarine with `kernel.modules = ["core", "web", "nectarine"]` and a project `nectarine.config.yaml`. After bootstrap, call `startSeltzerFromKernel(ctx)` (or keep wiring `handle.createRoutes` + `Seltzer.init()` / `listen` yourself). Kernel bootstrap still does not auto-listen. See [docs/webengine/README.md](../../docs/webengine/README.md) and [the Nectarine kernel contract](../../docs/webengine/nectarine-kernel-contract.md).

## Development

```bash
yarn workspace @citrusworx/webengine build
yarn workspace @citrusworx/webengine test
```
