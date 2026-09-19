# Grapevine Status

Honest snapshot of `@citrusworx/grapevine` **0.2.1** against `libraries/grapevine/src`.

The goal is the same as Juice’s and Sig’s maturity writing: make it easy to answer what is ready today, what is usable but still evolving, and what is still early.

**Active development**, DigitalOcean-only. The apply engine, CLI, and DO HTTP helpers are implemented. There is no multi-cloud abstraction layer, no GUI, no state file, and no drift reconciler.

Workspace index: “Active development” — agreed. Older docs that listed AWS/Linode as “coming soon” in a support table implied a provider interface that does not exist.

Related: [Roadmap](./grapevine-roadmap.md) for direction. [API](./grapevine-api.md) for the surface as it exists.

## Maturity levels

### `Stable-ish`

The feature is usable today, central to the Grapevine experience, and unlikely to change dramatically in basic concept. Active development still means the package version can move; the *idea* is settled.

### `Emerging`

The feature is useful and present, but the API, conventions, or implementation details are still likely to evolve.

### `Early`

The feature exists, but it is still exploratory, incomplete, or not yet something Grapevine should strongly promise as a finished public surface.

### `Draft`

The feature is more of a direction than a hardened part of the runtime.

## Matrix

| Area | Maturity | Notes |
|---|---|---|
| `provider: digitalocean` schema | Stable-ish | Literal only. Rejecting `aws` is the identity of the config. |
| `loadGrapeConfig` path / URL | Stable-ish | YAML or JSON. Always pass `-c`. |
| `grape validate` | Stable-ish | Zod + normalized counts. No DigitalOcean. |
| Apply create order | Stable-ish | tags → SSH → VPC → databases → droplets (+ stack user_data) → firewalls → domains → LBs → alerts → apps. Tested with mocks. |
| Same-apply `vpc:` / `droplets:` maps | Stable-ish | Process-local. Easy to misuse; behavior is consistent. |
| `createDroplet` / `createVPC` / `createFireWall` | Stable-ish | Real POSTs through `doRequest`. |
| `DO_TOKEN` / `credentials.env` | Stable-ish | Env only. Live `status`/`destroy` use `credentials.env` when `-c` is passed. |
| CLI `grape apply` | Emerging | Create-only; `--dry-run` aliases `plan`; human receipt or `--json`; no rollback. |
| In-repo blueprints `01`–`04` + KiwiPress packs | Emerging | Honest starters; `grape init` copies files or pack directories. |
| Function CRUD (list/get/update/delete) | Emerging | Broad HTTP surface; `destroy` uses unique-name / tag matching. |
| `grape status` | Emerging | Live tables (droplets/VPCs/firewalls/domains) plus optional config overlap. **Not drift.** |
| App Platform / LB / alerts / domains in apply | Early | Create loops exist; little teaching or tests vs droplets/VPC/firewall. |
| Managed databases + `stack` | Emerging | `resources.databases` POST `/databases`; `stack` generates droplet cloud-init. |
| Images / Insight security | Early | Exported, not applied. |
| `generate: true` SSH | Emerging | Writes OpenSSH private key to `.grape/ssh/<name>` (or `private_key_path`); apply reports the path. |
| Docs as product surface | Emerging to Stable-ish | Tutorial, topics, patterns, anti-patterns now exist next to the API. |
| Idempotent apply / state | Draft | Not implemented. |
| Drift / reconcile | Draft | Not implemented. |
| Destroy-from-YAML | Emerging | Conservative unique-name / `--tag` teardown; requires `--yes` off-TTY. |
| grapeGUI / WebEngine dashboard | Draft | Absent. |
| Second cloud provider | Draft | Schema forbids it. |
| Volumes / DOKS / Spaces | Draft | Not grape resources. |

## What is shipped

| Area | Source | Used by `apply`? |
|---|---|---|
| Zod grape config | `config/schema.ts` | yes |
| Load file or HTTP(S) | `config/load.ts` | CLI |
| Normalize + apply | `config/apply.ts` | CLI `apply` |
| `grape` CLI | `bin/cli.ts` + `cli/` | apply / plan / validate / status / destroy / init |
| Droplets | `droplet/droplet.ts` | yes |
| VPC + peering | `vpc/vpc.ts` | VPC create yes; peering no |
| Firewalls | `firewall/firewall.ts` | yes |
| SSH keys | `ssh/ssh.ts` | yes |
| Tags | `tags/tags.ts` | yes |
| Domains + records | `networking/domains.ts` | yes |
| Load balancers | `networking/load-balancer.ts` | yes |
| Alert policies | `monitoring/monitoring.ts` | yes |
| App Platform | `apps/apps.ts` | yes |
| Managed databases | `databases/databases.ts` | yes |
| Stack / compose bootstrap | `config/stack.ts` | yes (droplet `user_data`) |
| Images | `images/images.ts` | no |
| Security (Insight) | `security/security.ts` | no |
| Droplet actions log | `deploy/deployment-log.ts` | no |
| `cleanPayload` / `parseYAML` | utilities | internally |
| Tests | `*.test.ts` + Vitest | CLI, schema, apply, several providers |

## What is accepted but not applied

| Config field | Behavior |
|---|---|
| `services` | Zod allows `record`; apply warns unless the object is stack-shaped |
| `networking.ssl` / `networking.cdn` | Schema only — no certificate or CDN calls |
| `monitoring.enabled` / `monitoring.alerts` | Not mapped to `createAlertPolicy` (use `resources.alert_policies`) |
| `blueprint` at top level | Hoisted into `resources`, then applied |

## What is not shipped

| Claim you may have seen | Reality |
|---|---|
| AWS, Linode, Azure, GCP | No `src/providers/<name>` |
| grapeGUI / `yarn grapevine gui` | No binary |
| WebEngine dashboard | Not this package |
| `DigitalOcean` class with `.Droplet.create` | Flat function exports |
| SSH provisioning (run scripts over SSH) | `user_data` on droplet create only |
| State / plan / destroy | Create-oriented apply; deletes are manual APIs |
| Drift detection | `grape status` counts only |
| Dry-run | No |
| Cost estimation | No |
| Terraform / k8s / Docker drivers | No |
| `grapevine init --config` | Invented CLI in an old infra README |
| WordPress YAML as grape apply | Use `examples/blueprints/kiwipress-*` packs; `src/blueprints/wordpress/` is a pointer README |

`NukeDroplet` / `deleteDroplet` exist as functions. They are not `grape destroy`.

## Strongest areas

These are the parts of Grapevine that are already carrying real value:

- DigitalOcean-only schema that refuses to lie about other clouds
- `grape validate` without HTTP
- apply order plus same-apply name maps
- in-repo `01`–`04` blueprints
- function exports that match DigitalOcean HTTP

These form the strongest case for Grapevine as a typed DO client plus a create engine.

## Most promising emerging areas

These are already useful, but still need refinement before they feel fully settled:

- CLI apply (receipts, partial failure, duplicate creates)
- applying domains / LBs / apps with the same teaching depth as droplets
- documentation as a product surface
- delete helpers wired to a real operator story (still not YAML destroy)

These areas are what will most directly move Grapevine from “active development” toward a calmer 1.0 story — still DigitalOcean-first.

## Early or draft areas

These should be treated more carefully in positioning:

- `grape status` as inventory
- images and Insight scans from YAML
- drift / state / plan
- grapeGUI
- a second provider
- volumes, DOKS, Spaces

These can absolutely be valuable later. They should not yet be the center of the Grapevine promise.

## What “apply” actually means

Grapevine does not reconcile a desired state.

- `validate` parses a document.
- `apply` POSTs creates in order.
- `status` prints token presence and counts.

If you put `vpc: staging` without creating that VPC in the same run, you get a droplet without that `vpc_uuid`. If you apply twice, you get two create attempts.

## Tests

```bash
yarn workspace @citrusworx/grapevine test
```

Coverage is real and mostly mocked: schema, load, apply order, CLI parse/validate, several provider HTTP payloads. There is no live DigitalOcean integration test in this package. Docs examples were checked against source, not billed from this change.

## Integration (what is real)

**Kiwi.** Optional. The `kiwi` CLI can delegate to `grape` on `PATH`. Grapevine does not import Kiwi.

**Nectarine / Juice / Sig.js / Seltzer.** No special clients. You may put a Juice app on a droplet you created; Grapevine does not know what Juice is.

**`@citrusworx/types`.** Declared dependency. Unused in `libraries/grapevine/src`. Shared deployment types are not a second config format.

**WebEngine.** Does not invoke `applyGrapeConfig` from this package’s source. There is no dashboard here.

## Recommended positioning right now

If Grapevine is being described externally or internally, the most honest current positioning is:

> Grapevine 0.2.1 is a DigitalOcean provisioning library: a Zod grape config, a create-only apply engine, a `grape` CLI (`validate` / `apply` / `status`), and function wrappers around DigitalOcean HTTP. It is not Terraform, not multi-cloud, and not a GUI.

That framing matches the strongest current reality.

Less accurate positioning right now would be:

- a multi-cloud IaC platform
- desired-state / drift-aware infrastructure
- a WebEngine control plane
- a blueprint marketplace
- `DigitalOcean.Droplet.create` OOP

## Practical interpretation

If you are building with Grapevine today:

- confidently use `01`–`04`, `grape validate` / `apply`, `createDroplet` / `createVPC` / `createFireWall`
- use `grape status` only as token + counts
- use function deletes when you are done
- treat state, destroy-from-YAML, other clouds, and GUIs as things you live without

That is the cleanest adoption model for the current state of the system.

## Suggested reading

- [README](./README.md) — model and showcase
- [Tutorial](./grapevine-tutorial.md) — guided stack
- [Getting Started](./grapevine-getting-started.md)
- [Roadmap](./grapevine-roadmap.md)
- [Troubleshooting](./grapevine-troubleshooting.md)
