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

`init()` looks upward for `kiwi.config.toml`, validates it, and runs builtin kernel modules (`core`, `web`, …). See [docs/webengine/README.md](../../docs/webengine/README.md).

## Development

```bash
yarn workspace @citrusworx/webengine build
yarn workspace @citrusworx/webengine test
```
