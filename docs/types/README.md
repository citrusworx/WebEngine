# Types

`@citrusworx/types` is the shared contract layer for the CitrusWorx stack.

It is not a runtime. It does not parse YAML, talk to a cloud, or validate a deployment. It is the set of TypeScript shapes that let WebEngine, Grapevine, DNS, and application code agree on what a project, a blueprint, an environment, and a deployment *are* — without each workspace inventing its own slightly different version.

The current model is:

- Types owns the names and fields of shared workspace objects
- WebEngine holds those objects and (eventually) acts on them
- Grapevine, DNS, and the rest of the stack should consume the same shapes instead of growing private copies

Types is strongest when you treat it as a contract, not as a framework and not as a place to hide business logic.

## Who this is for

- Anyone writing or reading a `Blueprint`, `Environment`, or `DeploymentManifest`
- Library authors who need a stable import instead of a local interface
- Readers of [Make A Web App With WebEngine](../webengine/make-a-web-app.md) who have reached chapter 6 (contracts, then future glue)

This is a **contract reference**, not a tutorial track. You do not learn Types by building a page. You learn it by reading the three objects WebEngine already constructs with, then the supporting models around them.

## Why it exists

CitrusWorx is a stack of independent libraries. Juice styles markup. Sig.js owns reactivity. Nectarine owns data. Grapevine owns cloud. DNS owns registrars. WebEngine is meant to orchestrate those libraries later.

Orchestration only works if those libraries share a vocabulary. Without a shared package, every workspace ends up with its own `Project`, its own `Environment` string union, and its own idea of what a deployment record contains. Those copies drift. Deployments become untranslatable.

`@citrusworx/types` exists so the vocabulary lives in one place:

- **Blueprint** — what the app is (modules, adapters, services)
- **Environment** — which stage it is aimed at (`development` / `staging` / `preview` / `production`)
- **DeploymentManifest** — the plan that binds a blueprint to a project, an environment, and infrastructure flags

That split is the same kind of decision Juice makes with attributes vs theme CSS. Types owns the shared structure. Each library owns what it *does* with that structure.

What Types is not:

- a Zod schema layer (WebEngine depends on Zod, but Types does not)
- a config file format
- a module registry
- runtime validation of the objects you construct

If you need those, they belong in the consumer — today, mostly as comments and stubs in `engines/webengine/src/index.ts`.

## Mental model

Think of three objects you hand to WebEngine, plus a small constellation of records those objects mention.

```
Project
  └── DeploymentManifest
        ├── Blueprint   (what to build)
        ├── Environment (where it is aimed)
        ├── modules / services / adapters
        └── infrastructure { server, database }
              └── Server, Domain, Database (source models; see contracts)
```

`Environment` is an enum of stage names, not a description of machines. A DigitalOcean droplet, a VPC, and a domain live in other types (`Server`, `Domain`) or in other packages (Grapevine, DNS). The manifest only records whether the plan includes a server and a database.

`Blueprint.modules` and `Blueprint.services` are `string[]` today — names, not loaded implementations. There is a `Module` interface in source, but it is **not** on the public export surface yet.

## What it can do today

Import the public contracts and construct values that compile against them. That is the whole usable surface.

```ts
import type {
  Blueprint,
  DeploymentManifest,
  Environment
} from "@citrusworx/types";
import { Environment as EnvironmentEnum } from "@citrusworx/types";

const blueprint: Blueprint = {
  name: "catalog",
  version: "0.1.0",
  description: "Product catalog",
  modules: ["nectarine", "seltzer"],
  adapters: { cms: "kiwipress", storage: "s3" },
  services: ["api", "web"]
};

const manifest: DeploymentManifest = {
  id: "dep-1",
  createdAt: new Date(),
  projectId: "proj-1",
  blueprint,
  environment: EnvironmentEnum.DEVELOPMENT,
  modules: blueprint.modules,
  services: blueprint.services,
  adapters: blueprint.adapters,
  infrastructure: { server: true, database: true }
};

const stage: Environment = EnvironmentEnum.DEVELOPMENT;
```

`Environment` is a TypeScript enum. Import the enum (value) when you need `Environment.DEVELOPMENT`. Import `import type { Environment }` when you only need the type.

The same objects are what `WebEngine` stores in its constructor. Types does not run `init()`. It only makes the constructor type-check.

```ts
import { WebEngine } from "@citrusworx/webengine";

const engine = new WebEngine({
  blueprint,
  environment: EnvironmentEnum.DEVELOPMENT,
  deploymentManifest: manifest
});
```

That composition is the current real capability: **shared compile-time contracts that WebEngine already consumes**. See [Examples](./types-examples.md) for a full object set, and [Contracts](./types-contracts.md) for every exported field.

## Status

**Stable** core types.

The public entrypoint has been narrow and consistent: deployment, environment, server, project, domain, and blueprint models. Field names are simple and unlikely to churn in concept.

What is shipped:

- package `@citrusworx/types` (`libraries/types`)
- top-level exports from `libraries/types/src/index.ts`
- subpath exports for `./environment/environment.js` and `./deployment/deployment-manifest.js`

What exists in source but is **not** re-exported from the package entry:

- `Module`, `Extension`, `Service`, `Database` — files under `libraries/types/src/`, not listed in `src/index.ts`
- `CloudProvider` — used by `Server`, but not re-exported; you cannot import it from `@citrusworx/types` today
- `ServerStatus` — same situation; it is the type of `Server.status` but is not a public export

What Types does not do:

- runtime checks
- loading `kiwi.config.toml` or any other config file
- resolving module names to implementations

## Placement in the ecosystem

On the [Make A Web App](../webengine/make-a-web-app.md) path, Types is **chapter 6** — after you can build with Juice, Sig.js, Nectarine, Seltzer, and Grapevine/DNS as libraries. It is the contract chapter, not the first coding chapter.

- Course hub: [Make A Web App With WebEngine](../webengine/make-a-web-app.md)
- The only current consumer in `src/`: [WebEngine](../webengine/README.md)
- Infra types sit next to [Grapevine](../grapevine/README.md) and [DNS](../dns/README.md), but those packages do not import `@citrusworx/types` yet

## Suggested reading order

1. This README — what / why / what works
2. [Contracts](./types-contracts.md) — every public type, field by field
3. [Examples](./types-examples.md) — importing and composing objects
4. [WebEngine reality check](../webengine/README.md) — the lifecycle class that holds these objects

## Sibling docs

- [WebEngine](../webengine/README.md)
- [DNS](../dns/README.md)
- [Grapevine](../grapevine/README.md)
- [KiwiPress](../kiwipress/README.md) (optional WordPress track; not a Types consumer)

## Source of truth

- Package: `libraries/types/package.json`
- Public entry: `libraries/types/src/index.ts`
- Models: `libraries/types/src/blueprint/`, `deployment/`, `environment/`, `project/`, `server/`, `domain/`
