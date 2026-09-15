# WebEngine

`@citrusworx/webengine` is the workspace orchestration package for the CitrusWorx stack.

It is not a working kernel, not a CLI that scaffolds an app, and not the thing you ship a site through today. It is a `WebEngine` class that **stores** a `Blueprint`, an `Environment`, and a `DeploymentManifest`, then exposes lifecycle-shaped methods whose bodies are still stubs.

This page is the engine **reality check**. If you want a reading path through the libraries WebEngine is *meant* to compose, start with [Make A Web App With WebEngine](./make-a-web-app.md). That hub is the course outline. This page is what `engines/webengine/src/index.ts` actually is.

## Who this is for

- Someone who heard "WebEngine" and needs to know what to use *instead* right now (the libraries)
- Someone implementing future lifecycle methods and needing the intended order
- Readers of the course hub who have reached **chapter 6** â€” contracts, then future glue

You do not need WebEngine to build a web app in this repo. You need Juice, Sig.js, Nectarine, and Seltzer. WebEngine is the intended glue around those libraries.

## Why it exists

CitrusWorx is a stack of independent libraries on purpose. Juice should not talk to DigitalOcean. Nectarine should not own DNS. Grapevine should not parse a WordPress post.

Something still has to own **order**: build the environment, build the app, secure it, deploy it, watch it, scale it, kill it, clean it up. That something is WebEngine.

The philosophy is the same as Juice's attribute-first split:

- **Libraries own capability** (style, signals, data, HTTP, cloud, domains)
- **WebEngine owns sequence** (when those capabilities run, and with which contracts)
- **Types own vocabulary** (`Blueprint` / `Environment` / `DeploymentManifest`)

Until the methods do real work, the honest use of WebEngine is as a **lifecycle sketch** â€” a class whose method names document the intended runtime. The dangerous use is treating `engine.init()` as a bootstrap that loads `kiwi.config.toml` and starts a kernel. That code is not in `engines/webengine/src/`.

## Mental model

Three objects in, a sequence of named stages out:

```
constructor({ blueprint, environment, deploymentManifest })
        â”‚
        â–¼
     init()          â€” flags + a parse call; not a kernel boot
        â”‚
        â–¼
  buildEnvironment() â†’ buildApplication() â†’ secureEnvironment()
        â”‚
        â–¼
  deployApplication() â†’ monitorApplication() â†’ scaleApplication()
        â”‚
        â–¼
  killApplication() â†’ cleanupEnvironment() â†’ teardown()
```

Comments in the source say *what each stage is for* (Grapevine in `buildEnvironment`, Docker-ish artifacts in `buildApplication`, firewalls in `secureEnvironment`). The implementations `resolve()` immediately, except `teardown()`, which calls `cleanupEnvironment()` then clears a private static `metadata` object.

There is no module registry, no provider map, and no config loader in `src/`.

`dist/kernel/` and `dist/config/` (including `kiwi.config.toml` helpers and a Zod `kiwiConfigSchema`) are **compiled leftovers**. They are not produced by the current `src/index.ts`. Do not treat them as the public API. There is no `kiwi.config.toml` in this repository.

## What it can do today

Construct the class with the three Types contracts. Call `parse` for JSON. Inspect `initialized` / `initializing`. Call lifecycle methods that return resolved promises.

```ts
import { WebEngine } from "@citrusworx/webengine";
import { Environment } from "@citrusworx/types";
import type { Blueprint, DeploymentManifest } from "@citrusworx/types";

const blueprint: Blueprint = {
  name: "catalog",
  version: "0.1.0",
  description: "Catalog app",
  modules: ["nectarine"],
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

engine.parse<{ ok: boolean }>('{"ok":true}', "json"); // { ok: true }

await engine.buildEnvironment();
await engine.buildApplication();
await engine.deployApplication();
await engine.teardown();
```

That last block "succeeds" because the methods are empty promises. Nothing is provisioned.

`init()` is **not** safe to call with a normal blueprint name. It runs `this.parse(this.blueprint.name, "yaml")`. YAML is unimplemented, so `parse` falls through to `JSON.parse`. `JSON.parse("catalog")` throws, and `initializing` stays `true`. See [Getting started](./webengine-getting-started.md).

Package dependencies include `js-yaml`, `json5`, `smol-toml`, and `zod`. **None of them are imported in `src/index.ts`.** `parse` uses `JSON.parse` only.

## Status

**Scaffold.**

Shipped:

- package `@citrusworx/webengine`
- `WebEngine` class in `engines/webengine/src/index.ts`
- constructor fields typed against `@citrusworx/types`
- lifecycle method names and comments
- `parse` for JSON
- `teardown` â†’ `cleanupEnvironment` â†’ clear `WebEngine.metadata`

Still scaffold or leftover:

- YAML / TOML / JSON5 parsing
- Zod validation
- `kiwi.config.toml` loading (not in `src/`; leftover `.d.ts` in `dist/config/`)
- kernel, module registry, toposort (`dist/kernel/` leftovers only)
- Grapevine / DNS / Juice / Sig.js / Nectarine / Seltzer orchestration
- production deploy, telemetry, dashboard

## Placement in the ecosystem

WebEngine is meant to compose, not replace:

| Package | Role |
|---|---|
| [Types](../types/README.md) | Contracts the constructor already stores |
| [Juice](../juice/README.md) / [Sig.js](../sigjs/README.md) | UI â€” use them directly |
| [Nectarine](../nectarine/README.md) / [Seltzer](../seltzer/README.md) | Data and HTTP â€” use them directly |
| [Grapevine](../grapevine/README.md) / [DNS](../dns/README.md) | Infra â€” use them directly; comments point Grapevine at `buildEnvironment` |

Course hub: [Make A Web App With WebEngine](./make-a-web-app.md). Do not wait for `engine.init()` to become an app.

## Suggested reading order

1. [Make A Web App With WebEngine](./make-a-web-app.md) â€” the course outline (libraries first)
2. This README â€” engine reality
3. [Getting started](./webengine-getting-started.md) â€” constructor, `parse`, `init`, stubs
4. [Types](../types/README.md) â€” the objects the constructor takes

## Sibling docs

- [Types](../types/README.md)
- [DNS](../dns/README.md) (elective infra)
- [Stenzil](../stenzil/README.md) (advanced compiler elective)
- [KiwiPress](../kiwipress/README.md) (standalone WordPress + native CMS; [transfer](../kiwipress/kiwipress-transfer.md))

## Source of truth

- Package: `engines/webengine/package.json`
- Current source: `engines/webengine/src/index.ts` (the only file under `src/`)
- Published package README: `engines/webengine/README.md`
- Ignore `engines/webengine/dist/kernel/` and `dist/config/` as current API

## Related

- [Library release gates](./library-release-gates.md) — what Juice, Sig, Seltzer, Nectarine, and Grapevine must clear before kernel scaffolding
