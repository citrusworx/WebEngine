# Getting Started With WebEngine

This page is what you can do with `@citrusworx/webengine` **from `engines/webengine/src/index.ts`**. It is not a "create an app" guide. For that path, compose the libraries on [Make A Web App](./make-a-web-app.md).

## Install

```bash
yarn add @citrusworx/webengine @citrusworx/types
```

In this monorepo:

```bash
yarn workspace @citrusworx/webengine build
```

The only export is `WebEngine`.

## Construct it

The constructor requires three objects from `@citrusworx/types`. It assigns them to private fields. It does not read a file, load modules, or look for `kiwi.config.toml`.

```ts
import { WebEngine } from "@citrusworx/webengine";
import { Environment } from "@citrusworx/types";
import type { Blueprint, DeploymentManifest } from "@citrusworx/types";

const blueprint: Blueprint = {
  name: "catalog",
  version: "0.1.0",
  description: "Catalog app",
  modules: ["nectarine", "seltzer"],
  adapters: { cms: "kiwipress" },
  services: ["api", "web"]
};

const environment = Environment.DEVELOPMENT;

const deploymentManifest: DeploymentManifest = {
  id: "man-1",
  createdAt: new Date(),
  projectId: "proj-1",
  blueprint,
  environment,
  modules: blueprint.modules,
  services: blueprint.services,
  adapters: blueprint.adapters,
  infrastructure: { server: true, database: true }
};

const engine = new WebEngine({
  blueprint,
  environment,
  deploymentManifest
});

engine.initialized;  // false
engine.initializing; // false
```

There is no getter for the stored blueprint. After construction the instance is just a bag of lifecycle methods plus two public flags.

## `parse` — JSON only

`parse<T>(input, method?)` is documented in comments as a YAML / TOML / JSON helper that would use `js-yaml` and a TOML library. The body is:

1. If `method === "yaml"` — empty block, no return
2. If `method === "toml"` — empty block, no return
3. If `method === "json"` — `return JSON.parse(input)`
4. Otherwise — `return JSON.parse(input)`

So every path that does not return in the JSON branch still hits `JSON.parse`.

```ts
engine.parse<{ port: number }>('{"port":3000}', "json");
// { port: 3000 }

engine.parse<{ port: number }>('{"port":3000}');
// { port: 3000 } — default is JSON

engine.parse("name: catalog", "yaml");
// throws SyntaxError — yaml block does nothing, then JSON.parse runs
```

`json5` and `zod` are package dependencies and are unused. Do not pass TOML or YAML and expect structured output.

## `init` — flags, then a footgun

```ts
init() {
  this.initializing = true;
  this.parse(this.blueprint.name, "yaml");
  this.initialized = true;
  this.initializing = false;
  return this;
}
```

What that means in practice:

- It does **not** load `kiwi.config.toml`
- It does **not** start a kernel or register modules
- It parses **`blueprint.name`**, not a config document
- Because YAML is unimplemented, that call is `JSON.parse(blueprint.name)`

```ts
// blueprint.name === "catalog"
engine.init();
// SyntaxError: Unexpected token 'c', "catalog" is not valid JSON
// engine.initializing === true  (never reset — the throw happens first)
// engine.initialized === false
```

`init()` only survives if `blueprint.name` is already valid JSON (for example `"{}"` or `"true"`), which is not how you name an app. Treat `init()` as unsafe scaffolding, not as bootstrap. A failed `init()` also leaves `initializing` stuck `true`.

If you need the flags without throwing, set them yourself — they are public:

```ts
engine.initialized = true;
```

That is not an official API. It is the honest workaround until `init` parses real config.

## `kiwi.config.toml` and the kernel

**Not in current source.**

`engines/webengine/src/` contains only `index.ts`. There is no `find-kiwi-config`, no `load-kiwi-config`, no `kiwi-schema`, and no `kernel/` directory.

Stale declarations under `engines/webengine/dist/config/` and `dist/kernel/` describe a previous or parallel design (TOML config, module toposort, web/native/embedded runtimes). They are not compiled from today's `src/` and they are not exported from the package entry in a way you should call.

Stenzil's architecture notes mention a future `[stenzil]` table in `kiwi.config.toml` for codegen. That is also planned, not implemented.

## Lifecycle stubs

Every method below returns `Promise<void>` and resolves immediately, except `teardown`.

| Method | Comment in source says | Code does |
|---|---|---|
| `buildEnvironment` | Provision via Grapevine / cloud APIs | `resolve()` |
| `buildApplication` | Compile, package, Docker-ish artifacts from a blueprint `app:` section | `resolve()` — and `Blueprint` has no `app:` field |
| `secureEnvironment` | Firewalls, VPCs, access control | `resolve()` |
| `deployApplication` | Upload artifacts, verify running | `resolve()` |
| `monitorApplication` | Metrics and alerts | `resolve()` |
| `scaleApplication` | Autoscale | `resolve()` |
| `killApplication` | Stop the app | `resolve()` |
| `cleanupEnvironment` | Deprovision | `resolve()` |
| `teardown` | Cleanup + reset | `cleanupEnvironment()` then `WebEngine.metadata = {}` |

```ts
await engine.buildEnvironment();
await engine.buildApplication();
await engine.secureEnvironment();
await engine.deployApplication();
await engine.monitorApplication();
await engine.scaleApplication();
await engine.killApplication();
await engine.cleanupEnvironment();
await engine.teardown();
```

This is a valid call sequence and a useful sketch of order. It is not a deployment.

`WebEngine.metadata` is a private static `Record<string, unknown>`. Nothing in `src/` writes to it except `teardown` clearing it. Comments on `buildEnvironment` say metadata *should* record provisioned resources later.

## What to do instead of waiting on the engine

Compose the libraries the course already documents:

1. [Juice getting started](../juice/juice-getting-started.md)
2. [Sig.js getting started](../sigjs/sig-getting-started.md)
3. [Nectarine getting started](../nectarine/nectarine-getting-started.md)
4. [Seltzer](../seltzer/README.md)
5. [Grapevine getting started](../grapevine/grapevine-getting-started.md) and [DNS getting started](../dns/dns-getting-started.md) if you need infra

Use `@citrusworx/types` when you want those objects to match WebEngine's constructor for the day the stubs fill in.

## Pitfalls

- **`init()` throws on a normal `blueprint.name` and leaves `initializing === true`.** See above.
- **`parse(..., "yaml"|"toml")` is not implemented.** Both fall through to `JSON.parse`.
- **Leftover `dist/` is not `src/`.** Kernel and kiwi-config types in `dist/` are not a getting-started path.
- **Unused dependencies.** Seeing `zod` and `smol-toml` in `package.json` does not mean `parse` validates TOML.
- **Comments overstate the present.** JSDoc checkmarks ("Scaffold done") mean the method *exists*, not that it provisions anything.

## Where to go next

- [WebEngine README](./README.md)
- [Types examples](../types/types-examples.md)
- [Make A Web App](./make-a-web-app.md)
