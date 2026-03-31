# WebEngine

## 🚀 Overview
WebEngine is the CitrusWorx full-stack framework ecosystem featuring modular libraries, frontend frameworks, and backend tooling aimed at rapid productivity and infrastructure automation.

### Subprojects in this monorepo
- `packages/grapevine`: cloud deployment orchestrator (Terraform/DigitalOcean-focused)
- `packages/juice`: design system + UI framework (React/Babel/Vite)
- `libraries/sig`: lightweight reactive UI engine (custom JSX runtime)
- `libraries/nectarine`: YAML-config backend generator (schema/query/API workflows)
- `apps/citrusworx`: example multi-tenant application
- `apps/citrode`: opinionated retrofit admin UI

## 📦 Why It Matters
- Get an end-to-end product stack in one place
- Generate backend APIs from YAML and deploy infrastructure with opinionated patterns
- Ship UI components consistently with theme tokens and layout utilities
- Bundle runtime frameworks for modern JS apps (React + custom engine)

## 🛠️ Key Features
- **Config-driven backend** (Nectarine): schemas, queries, routes in YAML
- **React + utility UI** (Juice): spacing, colors, typography system
- **Low-level UI runtime** (Sig.js): signal-based rendering
- **Deployment blueprints** (GrapeVine): AWS + DigitalOcean + migration helpers
- **Multi-environment monorepo** with shared tooling and TypeScript configs

## 📁 Repository Layout
```
/apps
  /citrusworx
  /citrode
/libraries
  /sig
  /nectarine
/packages
  /grapevine
  /juice
/docs
  /gathe- specific docs (juice, sig, grapevine, nectarine)
/infra
... (auxiliary scripts and provider blueprints)
```

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
Full docs are in `/docs`:
- `/docs/juice` – Juice design system attributes & docs
- `/docs/sig` – Sig.js engine guides
- `/docs/grapevine` – cloud deployment docs
- `/docs/nectarine` – backend YAML schema docs

## 🧩 Notable tools
- `turbo.json` for monorepo pipelines
- `pnpm`/`yarn` workspace dependency graphs
- `playwright.config.ts` for e2e framework setup
- `tsconfig.base.json` for shared TS settings

## ✅ Contribution
- Read code conventions in `/docs/*` (per-package guides)
- Branch from `master` with `feature/<name>`
- Open PR with change summary + tests

## ⚙️ Workspace Scripts
- `yarn workspace @citrusworx/juice build`
- `yarn workspace @citrusworx/grapevine dev`
- `yarn workspace @citrusworx/nectarine test`
- `yarn turbo run lint`
- `yarn turbo run test`

## 👀 You Should Check
- `docs/nectarine/nectarine-status.md` (roadmap and status)
- `docs/grapevine/digitalocean.md` and provider blueprints
- `libraries/sig/src` for renderer implementation
- `packages/juice/src` for token and component APIs

## 🪪 License
MIT

