# Types

`@citrusworx/types` is the shared type package used by the CitrusWorx workspaces.

## Current status

This is one of the more complete and stable foundations in the repo.

What exists today:

- a published package surface at `@citrusworx/types`
- top-level exports for shared workspace models
- typed modules for blueprints, deployments, environments, projects, servers, services, domains, modules, extensions, and databases
- selected subpath exports for deployment and environment definitions

This package is intentionally narrow. It is not trying to be a runtime library; it is the contract layer other workspaces build on.

## Usage

```ts
import type {
  Blueprint,
  DeploymentManifest,
  Environment
} from "@citrusworx/types";
```

## Source of truth

- Package: `libraries/types/package.json`
- Entry point: `libraries/types/src/index.ts`
- Shared model folders: `libraries/types/src/*`
