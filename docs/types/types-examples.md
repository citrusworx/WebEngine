# Types Examples

These examples only construct and import types. There is no Types CLI and no Types runtime.

## Install

Inside this monorepo the workspace already depends on `@citrusworx/types`. From another project:

```bash
yarn add @citrusworx/types
```

## Import styles

```ts
// Types only — erased at compile time
import type { Blueprint, DeploymentManifest, Environment } from "@citrusworx/types";

// Enums as values
import { DeploymentStatus, Environment } from "@citrusworx/types";
```

Mixing `import type { Environment }` with a value import of the same name in one file is legal in TypeScript, but it is easier to import the enum as a value and use it both ways.

## A complete object set

This is a catalog app aimed at development, with a server and a database in the plan. Every field is required by the current interfaces.

```ts
import type {
  Blueprint,
  Deployment,
  DeploymentManifest,
  Domain,
  Project,
  Server
} from "@citrusworx/types";
import { DeploymentStatus, Environment } from "@citrusworx/types";

const project: Project = {
  id: "proj-catalog",
  name: "Catalog",
  createdAt: new Date("2026-01-15")
};

const blueprint: Blueprint = {
  name: "catalog",
  version: "0.1.0",
  description: "Public product catalog",
  modules: ["nectarine", "seltzer"],
  adapters: {
    cms: "kiwipress",
    storage: "s3"
  },
  services: ["api", "web"]
};

const manifest: DeploymentManifest = {
  id: "man-catalog-dev",
  createdAt: new Date("2026-01-15"),
  projectId: project.id,
  blueprint,
  environment: Environment.DEVELOPMENT,
  modules: ["nectarine", "seltzer"],
  services: ["api", "web"],
  adapters: {
    cms: "kiwipress",
    storage: "s3"
  },
  infrastructure: {
    server: true,
    database: true
  }
};

const deployment: Deployment = {
  id: "dep-catalog-001",
  projectId: project.id,
  environment: Environment.DEVELOPMENT,
  status: DeploymentStatus.PENDING,
  createdAt: new Date("2026-01-15")
};

const domain: Domain = {
  id: "dom-1",
  name: "catalog.example.com",
  projectId: project.id,
  createdAt: new Date("2026-01-15"),
  verified: false
};

// CloudProvider / ServerStatus are not public exports.
// Construct with the string values those enums use.
const server: Server = {
  id: "srv-1",
  projectId: project.id,
  provider: "digitalocean" as Server["provider"],
  ip: "203.0.113.10",
  status: "provisioning" as Server["status"]
};
```

`server` and `domain` are independent records. Nothing in Types ties them to `manifest.infrastructure`. That join is application code (or, later, WebEngine).

## Hand the contracts to WebEngine

WebEngine's constructor is the only in-repo `src/` consumer of these types.

```ts
import { WebEngine } from "@citrusworx/webengine";
import { Environment } from "@citrusworx/types";
import type { Blueprint, DeploymentManifest } from "@citrusworx/types";

const blueprint: Blueprint = {
  name: "catalog",
  version: "0.1.0",
  description: "Public product catalog",
  modules: ["nectarine", "seltzer"],
  adapters: {},
  services: ["api"]
};

const deploymentManifest: DeploymentManifest = {
  id: "man-1",
  createdAt: new Date(),
  projectId: "proj-1",
  blueprint,
  environment: Environment.DEVELOPMENT,
  modules: blueprint.modules,
  services: blueprint.services,
  infrastructure: { server: false, database: false }
};

const engine = new WebEngine({
  blueprint,
  environment: Environment.DEVELOPMENT,
  deploymentManifest
});
```

This compiles and constructs. It does **not** deploy anything. `engine.init()` currently tries to `JSON.parse` the blueprint name — read [WebEngine getting started](../webengine/webengine-getting-started.md) before calling lifecycle methods.

## Subpath imports

Equivalent to the root import if you want a single module:

```ts
import type { Environment } from "@citrusworx/types/environment/environment.js";
import type { DeploymentManifest } from "@citrusworx/types/deployment/deployment-manifest.js";
```

## Pitfalls

- **No validation.** A `Blueprint` with `modules: []` and an empty `name` still type-checks.
- **Stringly modules.** `"nectarine"` in `modules` does not load `@citrusworx/nectarine`.
- **Duplicated lists.** Manifest `modules` / `services` / `adapters` are not computed from the blueprint.
- **Missing public enums.** `CloudProvider` and `ServerStatus` are source-only. Do not document or import them as if they were on the package root.
- **Unexported models.** `Module`, `Extension`, `Service`, and `Database` are not importable from `@citrusworx/types`.

## Where to go next

- [Contracts](./types-contracts.md)
- [WebEngine](../webengine/README.md)
- [Make A Web App](../webengine/make-a-web-app.md) chapter 6
