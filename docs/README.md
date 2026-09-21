# CitrusWorx Docs

This docs folder tracks the current workspace reality first: what is published, what is implemented, and what is still mostly design work.

**Start here if you are new to the stack:** [Make A Web App With WebEngine](./webengine/make-a-web-app.md) — a course outline and reading path. **New to Juice?** Start with the [CSS & design systems course](./juice/course/README.md). Neither page replaces the status matrix below.

## Status Matrix

| Workspace | Package | Current status | What exists today | Primary docs |
|---|---|---|---|---|
| `libraries/types` | `@citrusworx/types` | Stable core types | Shared deployment, blueprint, project, environment, server, service, and domain types | [Types](./types/README.md) |
| `libraries/sig` | `@citrusworx/sigjs` | Active alpha | Signals, effects, JSX runtime, JSX dev runtime, router, and tests | [Sig.js](./sigjs/README.md) |
| `libraries/juice` | `@citrusworx/juiceui` | Active alpha | Published CSS build, token exports, navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, and slider runtimes, early components | [Juice](./juice/README.md) · [CSS/DS course](./juice/course/README.md) |
| `libraries/seltzer` | `@citrusworx/seltzer` | Implemented HTTP core (0.8.1) | Object routes, structured responses, named pipeline, generated routes, and HTTP client | [Seltzer](./seltzer/README.md) · [HTTP course](./seltzer/http-course/README.md) · [Study guide](./seltzer/courses.md) |
| `libraries/nectarine` | `@citrusworx/nectarine` | Active alpha | Compiler plus PostgreSQL, MySQL, and MongoDB adapters with YAML-driven model assets | [Nectarine](./nectarine/README.md) |
| `libraries/grapevine` | `@citrusworx/grapevine` | Active development | DigitalOcean provider surface for droplets, firewalls, VPC, SSH, monitoring, and related utilities | [Grapevine](./grapevine/README.md) |
| `libraries/dns` | `@citrusworx/dns` | Early implementation | Core DNS/registrar abstractions and a ResellerClub adapter | [DNS](./dns/README.md) |
| `libraries/stenzil` | `@citrusworx/stenzil` | Early implementation | Lexer, parser, AST types, and examples for the Stenzil language | [Stenzil](./stenzil/README.md) |
| `engines/webengine` | `@citrusworx/webengine` | Early scaffold | `WebEngine` lifecycle class with parse/init/build/deploy/teardown method stubs and shared type integration | [WebEngine](./webengine/README.md) |
| `packages/kiwipress` | `@citrusworx/kiwipress` **0.4.3** | Standalone WordPress + native CMS | WP REST client, WPAuth, WPSync transfer, file/Postgres persistence, optional Seltzer gateway + `apps/kiwipress` dashboard | [KiwiPress](./kiwipress/README.md) · [Getting started](./kiwipress/kiwipress-getting-started.md) · [Tutorial](./kiwipress/kiwipress-tutorial.md) · [Status](./kiwipress/kiwipress-status.md) |

## Notes

- Learn databases with [Ask the data: SQL through Nectarine](./nectarine/database-course/README.md), a question-first course with an executable PostgreSQL lab and a companion to the Seltzer HTTP course.

- The main source of truth is the workspace code under `libraries/` and `engines/`.
- Some older docs describe planned kernel/module systems or broader product visions. Those are useful for direction, but this index describes what is actually present in the repo now.
- Package-specific deep dives still live in their existing folders, especially for Juice, Sig.js, Nectarine, Grapevine, Seltzer, and KiwiPress.
- Seltzer contributors: start with the [design overview](./seltzer/README.md), then follow the [Node study guide & course journey](./seltzer/courses.md) before extending the HTTP pipeline.
