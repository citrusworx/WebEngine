# Make A Web App With WebEngine

A planned book/course for learning the CitrusWorx stack by composing the libraries that actually exist today. WebEngine is the long-term orchestration story — not the thing you ship an app through yet.

## The promise

Learn to build a web app by stacking Juice (structure), Sig.js (reactivity), Nectarine (data), Seltzer (HTTP), and Grapevine/DNS (infra) as independent libraries. When WebEngine grows past a lifecycle skeleton, it should become the glue. Until then, you compose the libraries yourself.

This page is a hub and outline. It is not the book, and it is not an end-to-end tutorial.

## Prerequisites

- Comfortable with HTML, CSS, and TypeScript
- Node.js and yarn workspaces
- Can read a REST request and response without a framework doing it for you
- Optional later: a DigitalOcean account if you follow the Grapevine chapters

You do not need prior WebEngine, Juice, or Sig.js experience.

## What works today vs scaffold

Read this before you treat any chapter as a finished product.

**You can study and use today**

- [Juice](../juice/README.md) — published CSS, attributes, themes
- [Sig.js](../sigjs/README.md) — signals, effects, JSX runtime, router
- [Nectarine](../nectarine/README.md) — compiler plus PostgreSQL, MySQL, and MongoDB adapters
- [Seltzer](../seltzer/README.md) — early HTTP runtime; design is ahead of the code
- [Grapevine](../grapevine/README.md) — DigitalOcean provider surface
- [DNS](../dns/README.md) — core abstractions and a ResellerClub availability adapter ([getting started](../dns/dns-getting-started.md))
- [Types](../types/README.md) — shared contracts (`Blueprint`, `Environment`, `DeploymentManifest`)

**Still scaffold or not ready**

- [WebEngine](./README.md) — a `WebEngine` class with lifecycle-shaped method stubs, not a working orchestrator ([getting started](./webengine-getting-started.md) for what `init` / `parse` actually do)
- A single “make me an app” CLI path that wires the stack for you
- Sugar — visual blueprint editor; do not plan coursework around it

The [docs status matrix](../README.md) is the workspace-wide scoreboard. This hub does not replace it.

## Proposed learning path

Chapters below are a reading order, not written lessons. Every link is a page that already exists.

### 1. Juice — structure first

Start with markup and layout. Juice is CSS-first; it is not a component framework.

- [Getting Started](../juice/juice-getting-started.md)
- [Attributes](../juice/juice-attributes.md)
- [Layout](../juice/juice-layout.md) and [Layout Flow](../juice/juice-layout-flow.md)
- [Styles](../juice/juice-styles.md)
- [Theme Authoring](../juice/juice-theme-authoring.md) and [Theme Manual](../juice/juice-theme-manual.md)
- [Best Practices](../juice/juice-best-practices.md)

### 2. Sig.js — reactivity on top of static HTML

Add state only where the DOM needs to change. Pair it with Juice; do not replace Juice with a virtual DOM.

- [Getting Started](../sigjs/sig-getting-started.md)
- [API Reference](../sigjs/sig-api.md)
- [Router](../sigjs/sig-router.md)
- [Sig.js + Juice](../sigjs/sig-juice-integration.md)
- [Examples](../sigjs/sig-examples.md)
- [Project Status](../sigjs/sig-status.md)

### 3. Nectarine — data and YAML-driven backends

Define models and queries in YAML. Use the guides that exist; there is no separate MySQL chapter yet.

- [Getting Started](../nectarine/nectarine-getting-started.md)
- [Schema Guide](../nectarine/nectarine-schema-guide.md)
- [Query DSL](../nectarine/nectarine-query-dsl.md)
- [API Reference](../nectarine/nectarine-api.md)
- [Examples](../nectarine/nectarine-examples.md)
- [PostgreSQL](../nectarine/nectarine-postgresql.md) and [MongoDB](../nectarine/nectarine-mongodb.md)
- [Project Status](../nectarine/nectarine-status.md)

### 4. Seltzer — HTTP as a pipeline

Seltzer is the request runtime. The design doc and study guide are the honest start; the implementation is still early.

- [Design Overview](../seltzer/README.md)
- [Node study guide](../seltzer/courses.md)
- [Exercises](../seltzer/exercises/README.md)

### 5. Grapevine and DNS — infra and domains

Provision cloud resources and talk to a registrar. These are independent libraries, not WebEngine plugins yet.

- [Grapevine](../grapevine/README.md)
- [Getting Started](../grapevine/grapevine-getting-started.md)
- [Configuration](../grapevine/grapevine-config.md)
- [DigitalOcean](../grapevine/grapevine-digitalocean.md)
- [Grapevine status](../grapevine/grapevine-status.md)
- [DNS](../dns/README.md) — deploy appendix / elective; [getting started](../dns/dns-getting-started.md) if you have ResellerClub credentials

### 6. Types and WebEngine — contracts, then future glue

Learn the shared types, then look at the engine as a lifecycle sketch — not a finished runtime.

- [Types](../types/README.md) — [contracts](../types/types-contracts.md) · [examples](../types/types-examples.md)
- [WebEngine reality check](./README.md) — [getting started](./webengine-getting-started.md) for constructor, `parse`, and lifecycle stubs

## The first end-to-end app

There is no full app tutorial in this hub yet. When it lands, it will compose the libraries above in application code: Juice + Sig.js in the browser, Nectarine + Seltzer on the server, Grapevine/DNS if you need infra.

WebEngine is future glue for that composition. It is not the current bootstrap. Do not wait for `engine.init()` to become a working app.

## Electives and orphans

These are real docs, but they are not on the main path.

| Track | What it is | Start |
|---|---|---|
| KiwiPress | Standalone WordPress client and Nectarine-shaped CMS. WebEngine may orchestrate it later; the library does not require the kernel. | [KiwiPress](../kiwipress/README.md) · [Getting started](../kiwipress/kiwipress-getting-started.md) · [Tutorial](../kiwipress/kiwipress-tutorial.md) · [Transfer](../kiwipress/kiwipress-transfer.md) · [Status](../kiwipress/kiwipress-status.md) |
| Stenzil | Advanced elective compiler track, not required to ship a web app | [Stenzil](../stenzil/README.md) · [Getting started](../stenzil/stenzil-getting-started.md) · [Architecture](../stenzil/architecture.md) · [Courses](../stenzil/courses.md) |
| Stencil folder | Legacy name only | [Redirect](../Stencil/README.md) |
| Sugar | Visual editor under `tooling/sugar/` — not ready, not documented here | Do not promise it |

KiwiPress is the WordPress elective and a standalone CMS library, not a core WebEngine module. Use it when you have WordPress content — or a native Nectarine store — you want to run in any Node project.
