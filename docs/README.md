# CitrusWorx Docs

This docs folder tracks the current workspace reality first: what is published, what is implemented, and what is still mostly design work.

## Status Matrix

| Workspace | Package | Current status | What exists today | Primary docs |
|---|---|---|---|---|
| `libraries/types` | `@citrusworx/types` | Stable core types | Shared deployment, blueprint, project, environment, server, service, and domain types | [Types](./types/README.md) |
| `libraries/sig` | `@citrusworx/sigjs` | Active alpha | Signals, effects, JSX runtime, JSX dev runtime, router, and tests | [Sig.js](./sigjs/README.md) |
| `libraries/juice` | `@citrusworx/juiceui` | Active alpha | Published CSS build, token exports, navigation runtime, early components | [Juice](./juice/README.md) |
| `libraries/seltzer` | `@citrusworx/seltzer` | Early implementation | Core server/client scaffolding and an evolving HTTP runtime design | [Seltzer](./seltzer/README.md) |
| `libraries/nectarine` | `@citrusworx/nectarine` | Active alpha | Compiler plus PostgreSQL, MySQL, and MongoDB adapters with YAML-driven model assets | [Nectarine](./nectarine/README.md) |
| `libraries/grapevine` | `@citrusworx/grapevine` | Active development | DigitalOcean provider surface for droplets, firewalls, VPC, SSH, monitoring, and related utilities | [Grapevine](./grapevine/README.md) |
| `libraries/dns` | `@citrusworx/dns` | Early implementation | Core DNS/registrar abstractions and a ResellerClub adapter | [DNS](./dns/README.md) |
| `libraries/stenzil` | `@citrusworx/stenzil` | Early implementation | Lexer, parser, AST types, and examples for the Stenzil language | [Stenzil](./stenzil/README.md) |
| `engines/webengine` | `@citrusworx/webengine` | Early scaffold | `WebEngine` lifecycle class with parse/init/build/deploy/teardown method stubs and shared type integration | [WebEngine](./webengine/README.md) |

## Notes

- The main source of truth is the workspace code under `libraries/` and `engines/`.
- Some older docs describe planned kernel/module systems or broader product visions. Those are useful for direction, but this index describes what is actually present in the repo now.
- Package-specific deep dives still live in their existing folders, especially for Juice, Sig.js, Nectarine, Grapevine, Seltzer, and KiwiPress.
