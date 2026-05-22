# WebEngine

`@citrusworx/webengine` is the workspace orchestration package for the CitrusWorx stack.

This page reflects the current source in `engines/webengine/`, not older aspirational notes about a fully realized kernel/module runtime.

## Current status

WebEngine exists today as an early scaffold with a clear direction, but it is not yet the fully implemented kernel system previously described in this docs folder.

What exists today:

- a published package surface at `@citrusworx/webengine`
- a `WebEngine` class in `engines/webengine/src/index.ts`
- constructor wiring for `Blueprint`, `Environment`, and `DeploymentManifest`
- lifecycle-shaped methods for `init`, `buildEnvironment`, `buildApplication`, `secureEnvironment`, `deployApplication`, `monitorApplication`, `scaleApplication`, `killApplication`, `cleanupEnvironment`, and `teardown`
- package dependencies on `@citrusworx/types`, `js-yaml`, `json5`, `smol-toml`, and `zod`

What is still mostly scaffold/design:

- real config loading and validation in the current source entrypoint
- actual provider orchestration across Juice, Sig.js, Nectarine, Grapevine, and related workspaces
- a working kernel/module registry exposed from the current source tree
- blueprint/module resolution beyond shared types and lifecycle placeholders
- production deployment, telemetry, and dashboard workflows

## Public API today

```ts
import { WebEngine } from "@citrusworx/webengine";
import type {
  Blueprint,
  DeploymentManifest,
  Environment
} from "@citrusworx/types";

const engine = new WebEngine({
  blueprint,
  environment,
  deploymentManifest
});

engine.init();
await engine.buildEnvironment();
await engine.buildApplication();
await engine.deployApplication();
await engine.teardown();
```

## Reality check

The current `WebEngine` class is best understood as a lifecycle skeleton and integration point, not a finished runtime.

That means:

- the class shape is useful for aligning the long-term orchestration model
- `@citrusworx/types` is already doing real work as the contract layer
- the richer WebEngine vision is still ahead of the implementation in `src/`

## Relationship to the libraries

WebEngine is meant to compose the library layer rather than replace it:

- `@citrusworx/types` provides shared contracts
- `@citrusworx/nectarine` is the backend/data layer
- `@citrusworx/seltzer` is the HTTP/runtime layer
- `@citrusworx/juiceui` and `@citrusworx/sigjs` cover UI/runtime concerns
- `@citrusworx/grapevine` and `@citrusworx/dns` cover infrastructure and domain workflows

That composition model is the direction. The code in `engines/webengine/src/index.ts` is the current implementation baseline.

## Source of truth

- Package: `engines/webengine/package.json`
- Current source entrypoint: `engines/webengine/src/index.ts`
- Published README: `engines/webengine/README.md`
