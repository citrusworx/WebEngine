# Types Contracts

This is the field-level reference for `@citrusworx/types`.

Every type below is copied from `libraries/types/src/`. If a file exists in that tree but is missing here, it is not on the public export surface — see [Unexported source models](#unexported-source-models).

## How to import

The package entry re-exports these modules:

| Module | Public types |
|---|---|
| `libraries/types/src/blueprint/blueprint.ts` | `Blueprint` |
| `libraries/types/src/environment/environment.ts` | `Environment` |
| `libraries/types/src/deployment/deployment-manifest.ts` | `DeploymentManifest` |
| `libraries/types/src/deployment/deployment.ts` | `Deployment` |
| `libraries/types/src/deployment/deployment-status.ts` | `DeploymentStatus` |
| `libraries/types/src/project/project.ts` | `Project` |
| `libraries/types/src/server/server.ts` | `Server` |
| `libraries/types/src/domain/domain.ts` | `Domain` |

```ts
import type {
  Blueprint,
  Deployment,
  DeploymentManifest,
  DeploymentStatus,
  Domain,
  Environment,
  Project,
  Server
} from "@citrusworx/types";
```

Enums are values as well as types. If you need `Environment.PRODUCTION` or `DeploymentStatus.RUNNING` at runtime, import them as values:

```ts
import { DeploymentStatus, Environment } from "@citrusworx/types";
```

Two subpath exports also exist (`@citrusworx/types/environment/environment.js` and `@citrusworx/types/deployment/deployment-manifest.js`). Prefer the package root unless you have a reason to pin a single file.

---

## Blueprint

**What it is.** The app's structural identity: name, version, the module and service names it claims, and optional third-party adapter slots.

**Why it is a type and not a file format.** A blueprint is the object WebEngine stores as `this.blueprint`. There is no blueprint loader in `engines/webengine/src` today. The type is the contract so that when a loader appears, it has somewhere to land.

```ts
interface Blueprint {
  name: string;
  version: string;
  description: string;
  modules: string[];
  adapters: {
    commerce?: string;
    cms?: string;
    payments?: string;
    storage?: string;
  };
  services: string[];
}
```

| Field | Meaning today |
|---|---|
| `name` | Human/project name. WebEngine `init()` currently passes this string into `parse(..., "yaml")` — see [WebEngine getting started](../webengine/webengine-getting-started.md). |
| `version` | Blueprint version string. Not semver-checked. |
| `description` | Free text. |
| `modules` | Names of WebEngine modules the project intends to use. Strings only — no registry lookup. |
| `adapters` | Optional vendor names for commerce, CMS, payments, and storage. |
| `services` | Names of services the project includes. Strings only. |

There is no `app:` block, no Docker spec, and no Juice/Sig.js section on this interface. Comments in WebEngine mention those as future work.

---

## Environment

**What it is.** A four-value stage enum. It is not a machine list and not a Grapevine config.

```ts
enum Environment {
  DEVELOPMENT = "development",
  STAGING = "staging",
  PREVIEW = "preview",
  PRODUCTION = "production"
}
```

WebEngine stores one `Environment` on the instance. It does not switch providers or load env files from this value.

---

## DeploymentManifest

**What it is.** The plan that says: this project, this blueprint, this environment, these module/service names, these adapter names, and whether the plan includes a server and a database.

**Why it is separate from `Deployment`.** The manifest is the *intent*. `Deployment` is the *record* of an attempt (id, status, timestamps). You can write a manifest before anything is running.

```ts
interface DeploymentManifest {
  id: string;
  createdAt: Date;
  projectId: string;
  blueprint: Blueprint;
  environment: Environment;
  modules: string[];
  services: string[];
  adapters?: {
    commerce?: string;
    cms?: string;
    payments?: string;
    storage?: string;
  };
  infrastructure: {
    server: boolean;
    database: boolean;
  };
}
```

`modules`, `services`, and `adapters` are duplicated on the manifest rather than derived. Nothing in Types or WebEngine keeps them in sync with `blueprint` — that is the caller's job.

`infrastructure.server` and `infrastructure.database` are booleans, not `Server` / `Database` objects. They answer "does this plan include that kind of resource?" not "here is the provisioned host."

---

## Deployment

A lifecycle record for one deploy of a project into an environment.

```ts
interface Deployment {
  id: string;
  projectId: string;
  environment: Environment;
  status: DeploymentStatus;
  createdAt: Date;
  updatedAt?: Date;
}
```

```ts
enum DeploymentStatus {
  PENDING = "pending",
  DEPLOYING = "deploying",
  RUNNING = "running",
  FAILED = "failed"
}
```

WebEngine does not create or update `Deployment` objects. The type exists so status-tracking code has a shared shape when that code is written.

---

## Project

The thinnest identity object in the set.

```ts
interface Project {
  id: string;
  name: string;
  createdAt: Date;
}
```

`DeploymentManifest.projectId` and `Server.projectId` / `Domain.projectId` point here by id, not by nested object.

---

## Server

A provisioned host attached to a project.

```ts
interface Server {
  id: string;
  projectId: string;
  provider: CloudProvider;
  ip: string;
  status: ServerStatus;
}
```

`CloudProvider` and `ServerStatus` live in `libraries/types/src/cloud/cloud-provider.ts` and `libraries/types/src/server/server-status.ts`:

```ts
enum CloudProvider {
  AWS = "aws",
  DIGITALOCEAN = "digitalocean",
  HETZNER = "hetzner",
  VULTR = "vultr"
}

enum ServerStatus {
  PROVISIONING = "provisioning",
  RUNNING = "running",
  ERROR = "error"
}
```

Those enums are **not** re-exported from `@citrusworx/types`. You can type a `Server`, but you cannot `import { CloudProvider } from "@citrusworx/types"` until the entrypoint exports them. Use string literals that match the enum values if you need to construct a `Server` from outside the package.

---

## Domain

A domain name attached to a project.

```ts
interface Domain {
  id: string;
  name: string;
  projectId: string;
  createdAt: Date;
  verified?: boolean;
}
```

This is a record, not a registrar client. Availability checks and nameserver updates belong in [`@citrusworx/dns`](../dns/README.md).

---

## Unexported source models

These files exist beside the public ones. They are **not** in `libraries/types/src/index.ts`. Do not import them from `@citrusworx/types` and expect TypeScript to resolve them.

| File | Shape | Why it is listed |
|---|---|---|
| `libraries/types/src/module/module.ts` | `{ name, version, description, dependencies: string[] }` | Matches the idea of `Blueprint.modules` as real objects. Not wired. |
| `libraries/types/src/extension/extension.ts` | `{ name, version, description, license, verified, signed }` | Marketplace-shaped. Unused by WebEngine. |
| `libraries/types/src/service/service.ts` | `{ name, description }` | `Blueprint.services` is still `string[]`. |
| `libraries/types/src/database/database.ts` | `{ name, type }` | Manifest only has `infrastructure.database: boolean`. |
| `libraries/types/src/cloud/cloud-provider.ts` | `CloudProvider` enum | Required to talk about `Server.provider`. |
| `libraries/types/src/server/server-status.ts` | `ServerStatus` enum | Required to talk about `Server.status`. |

Documenting them here is honesty, not an API promise. When they join the entrypoint, this page should move them above the fold.

## What this reference is not

- Not a runtime validator
- Not a Grapevine or DNS API
- Not the WebEngine lifecycle

For constructing a full set of objects and handing them to `WebEngine`, see [Examples](./types-examples.md).
