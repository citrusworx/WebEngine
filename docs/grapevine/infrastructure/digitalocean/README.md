# Blueprint

GrapeVine is a modular, developer-friendly Infrastructure-as-Code (IaC) framework that lets developers and creators easily create, deploy, and manage their
cloud environments--without writing a single line of infrastructure code.

---

## Why GrapeVine?

Managing cloud infrastructure has historically meant choosing between complex, code-heavy tools built for platform engineers, or expensive managed services that
lock you in. GrapeVine was built for everyone else--the developer who just wants their app running, the creator who wants their environment reproducible, and the
team that wants a single source of truth for their infrastructure.

With GrapeVine, your infrastructure lives in a YAML blueprint. You describe what you want. GrapeVine handles the rest.

---

## Core Philosophy

### Blueprints as Single Source of Truth

SSoT is a major philosophy of the WebEngine ecosystem and GrapeVine follows that philosophy. Your infrastructure is defined once, in a blueprint. No clicking through
dashboards, no hunting through CLI history, no drift between environments. The blueprint *is* the environment.

### No Code Required

GrapeVine is designed to be approachable. If you can write YAML, you can provision infrastructure. Blueprints are human-readable, version-controllable, and shareable.

### Provider Agnostic

GrapeVine abstracts over cloud prodivers. Switch from DigitalOcean to AWS by changing one line in your config--your blueprint stays the same.

### Modular by Design

GrapeVine is built around discrete, single-resonsibility utilities. Each function does one thing well. There are no monolithic abstractions hiding complexity from you.

---

## Getting Started

```bash
grapevine init --config
```

Point GrapeVine at a blueprint and it handles provisioning:

```bash
grapevine change --providerTo digitalocean --config path/to/config.yaml
```

## Blueprint Marketplace

GrapeVine blueprints are designed to be shared. The marketplace features:
- **Verified Blueprints** - reviewed, tested, and approved by the GrapeVine team.
- **Community Blueprints** - contributed by the community, clearly marked and rated.

Whether you want to share your blueprints openly or sell them, GrpaeVine supports both.

---

## Supported Providers

|Provider|Status
|---|---|
|DigitalOCean|Active|
|AWS|Coming Soon|

## Packages

|Package|Description|
|---|---|
|`@citrusworx/grapevine`|Core IaC framework|
|`@citrusworx/nectarine`|YAML-driven data engine|

## License

Part of the CitrusWorx ecosystem.
