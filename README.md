# WebEngine

## 🚀 Overview
WebEngine is the CitrusWorx full-stack framework ecosystem. It defines the canonical project shape for any application built on the stack — a monorepo with prebuilt slots for libraries, engines, packages, and apps — and ships a CLI (`kiwi`) that populates those slots on demand.

The architecture splits into four tiers:

- **Libraries** — reusable building blocks (UI, HTTP, config parsing, DNS, infrastructure)
- **Engines** — runtime orchestrators that compose libraries into application lifecycles
- **Packages** — opinionated integrations targeting specific product domains (WordPress, mail, chat, storefront), pulled in via the CLI
- **Apps** — end-user products and demos that consume the stack, scaffolded via the CLI

## 🧭 Developer Experience

The monorepo layout below is the **default project shape** for any WebEngine project. A fresh `kiwi init` produces this skeleton with `apps/` and `packages/` empty.

- `kiwi add <package>` — pulls a package (e.g. `kiwipress`, `mail`, `webstore`) into `packages/`
- `kiwi new app <name>` — scaffolds a new app under `apps/<name>`
- `kiwi init --services` — opts into the `services/` tier (platform-specific infrastructure; not part of default projects)

Libraries are consumed as workspace dependencies (`@citrusworx/*`) — they don't live inside a user's project tree.

The directory tree below reflects the *full* CitrusWorx monorepo, which is also the framework's reference implementation. In a generated project, only the slot structure exists by default; everything inside `packages/`, `apps/`, and `services/` arrives through the CLI.

## 📁 Repository Layout

```
/libraries          (consumed as @citrusworx/* workspace deps; not in user projects)
  /sig          - signal-based reactive UI engine + custom JSX runtime
  /juice        - attribute-driven CSS framework (ships compiled CSS + bundled JS)
  /seltzer      - HTTP routing + execution environment (request lifecycle, route contracts)
  /nectarine    - YAML config + schema parsing (routes, models, query metadata)
  /grapevine    - DigitalOcean provisioning (droplets, firewalls, VPCs, SSH, monitoring)
  /dns          - multi-registrar/host DNS abstraction (ResellerClub adapter first; Namecheap, OpenSRS scaffolded)
  /stenzil      - templating layer
  /types        - shared types (Blueprint, Environment, DeploymentManifest)

/engines
  /webengine    - runtime orchestrator: parse → build → secure → deploy → monitor → scale → kill → cleanup → teardown
  /kiwiengine
  /kiwisys

/packages           (empty in fresh projects; populated by `kiwi add <package>`)
  /kiwipress    - WordPress integration layer built on Seltzer + Nectarine (WPCore/WPClient + CRUD axes)
  /chat
  /mail
  /webstore

/apps               (empty in fresh projects; populated by `kiwi new app <name>`)
  /citrusworx   - example multi-tenant app
  /citrode      - admin / managed-services UI
  /kiwipress
  /drewwinkles
  /miamakes

/services           (opt-in via `kiwi init --services`; platform-specific)
  /DNS
  /kiwimail

/tooling
  /Sugar
  /cli          - the `kiwi` CLI
  /vscode-stenzil

/blueprints     - reusable infrastructure blueprints
/infra          - auxiliary scripts and provider blueprints
/docs           - per-package guides
```

## 📦 Why It Matters
- One repo, one stack, end-to-end: data layer → HTTP → UI → infra → DNS → deploy
- Generate backend APIs from YAML, provision real cloud infrastructure, ship UI from a shared design system
- Adapter patterns throughout (DNS providers, infra providers, WordPress engines) so swapping vendors is local, not architectural

## 🛠️ Key Capabilities
- **WebEngine Runtime** — orchestrates the full application lifecycle through library calls (no per-step library logic lives in WER itself)
- **Config-driven backend (Nectarine)** — schemas, queries, routes in YAML
- **Attribute-driven UI (Juice)** — spacing, color, layout primitives via element attributes; one compiled stylesheet, no consumer build step
- **Reactive UI runtime (Sig.js)** — signal-based rendering, custom JSX runtime
- **Cloud provisioning (GrapeVine)** — DigitalOcean: droplets, firewalls, VPCs, SSH keys, monitoring, networking
- **Domain lifecycle (DNS)** — Registrar / DnsHost split with per-vendor adapters
- **HTTP layer (Seltzer)** — route contracts, request lifecycle, used inbound (servers) and as a transport-shape carrier outbound (e.g. KiwiPress)
- **WordPress integration (KiwiPress)** — `WPCore` config, `WPClient` execution, separated `WPRead` / `WPCreate` / `WPUpdate` / `WPDelete` axes

## 🛠️ Getting Started

1. Clone repository
```bash
git clone https://github.com/citrusworx/WebEngine.git
git checkout master
git submodule update --init --recursive
```

2. Install dependencies
```bash
yarn install
```

3. Build all packages
```bash
yarn turbo run build
```

4. Run example app
```bash
yarn workspace @citrusworx/citrusworx dev
```

## 📘 Documentation
Docs live in `/docs`:
- `/docs/juice` — Juice design system attributes & docs
- `/docs/sig` — Sig.js engine guides
- `/docs/grapevine` — DigitalOcean provider docs
- `/docs/nectarine` — backend YAML schema docs
- `/docs/stenzil` — templating layer docs

Per-package architecture specs also live in their own folders (e.g. `packages/kiwipress/ARCHITECTURE.md`).

## 🧩 Notable tools
- `turbo.json` — monorepo pipelines
- `yarn` workspace dependency graph
- `playwright.config.ts` — e2e framework setup
- `tsconfig.base.json` — shared TS settings

## ⚙️ Workspace Scripts
- `yarn workspace @citrusworx/juiceui build`
- `yarn workspace @citrusworx/grapevine dev`
- `yarn workspace @citrusworx/nectarine test`
- `yarn workspace @citrusworx/kiwipress build`
- `yarn turbo run lint`
- `yarn turbo run test`

## ✅ Contribution
- Read code conventions in `/docs/*` (per-package guides)
- Branch from `master` with `feature/<name>`
- Open PR with change summary + tests

## 👀 You Should Check
- `engines/webengine/src/index.ts` — WebEngine lifecycle skeleton
- `packages/kiwipress/ARCHITECTURE.md` — KiwiPress class hierarchy and design rationale
- `libraries/dns/src/core/provider.ts` — Registrar / DnsHost provider contract
- `libraries/grapevine/src/providers/digitalocean/` — DO provisioning surface
- `libraries/sig/src` — renderer implementation
- `libraries/juice/src` — token and component APIs

## 🪪 License
MIT
