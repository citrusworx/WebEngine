# Grapevine Status

Honest snapshot of `@citrusworx/grapevine` against `libraries/grapevine/src`. The dashboard contract is `grape catalog --json` / `catalog/digitalocean.json`. DigitalOcean is the only provider. The catalog shape is how a second cloud would plug in later; AWS and GCP are not implemented.

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
| Apply create order | Stable-ish | tags → SSH → VPC → databases → droplets (+ stack user_data) → firewalls → domains → LBs → alerts → apps → Spaces → certificates → CDN. Tested with mocks. |
| Same-apply `vpc:` / `droplets:` maps | Stable-ish | Process-local. Easy to misuse; behavior is consistent. |
| `createDroplet` / `createVPC` / `createFireWall` | Stable-ish | Real POSTs through `doRequest`. |
| `DO_TOKEN` / `credentials.env` | Stable-ish | Env only. Live `status`/`destroy` use `credentials.env` when `-c` is passed. |
| CLI `grape apply` | Emerging | Create-only; `--dry-run` aliases `plan`; human receipt or `--json`; no rollback. |
| In-repo blueprints `01`–`04` + KiwiPress packs | Emerging | Honest starters; `grape init` copies files or pack directories. |
| Function CRUD (list/get/update/delete) | Emerging | Broad HTTP surface; `destroy` uses unique-name / tag matching. |
| `grape status` | Emerging | Live tables (droplets/VPCs/firewalls/domains) plus optional config overlap. **Not drift.** |
| App Platform / LB / alerts / domains in apply | Early | Create loops exist; little teaching or tests vs droplets/VPC/firewall. |
| Spaces + CDN + certificates | Emerging | `resources.spaces`, `resources.cdn`, `resources.certificates`. Unique-name adopt on apply. CDN is deleted before certificates and Spaces. Let's Encrypt is polled only when a same-apply CDN entry references the cert. No Vite build or `dist/` upload. |
| Managed databases + `stack` | Emerging | `resources.databases` POST `/databases`; `stack` generates droplet cloud-init. |
| Provider catalog | Emerging | `digitalOceanCatalog` plus `catalog/digitalocean.json`. Honest maturity per product. `grape catalog` does not call the API. |
| Offerings | Emerging | `grape offerings` lists regions, sizes, public images, database options, and Kubernetes versions. Requires `DO_TOKEN`. Mocked tests only. |
| Telemetry | Emerging | Alert policies, uptime checks, and droplet bandwidth/CPU/memory. CPU and memory need the monitoring agent. |
| Projects / volumes / DOKS clusters | Emerging | List/get/create/delete. YAML apply adopts a unique name (clusters do not reconcile node pools). No attach, resize, or DOKS day-2. |
| Reserved IPs / registry / account | Emerging | Live list/get for the dashboard. Reserved IPs have no name, so they are not YAML. Registry is get + repository list. Account summary omits the token. |
| Billing | Early | Balance and invoice list. Payment methods and PDF download are not wrapped. A missing billing scope is `billing.error`, not a failed inventory. |
| Images / Insight security | Early | Exported, not applied. |
| `generate: true` SSH | Emerging | Writes OpenSSH private key to `.grape/ssh/<name>` (or `private_key_path`); apply reports the path. |
| Docs as product surface | Emerging to Stable-ish | Tutorial, topics, patterns, anti-patterns now exist next to the API. |
| Idempotent apply / state | Draft | Not implemented. |
| Drift / reconcile | Draft | Not implemented. |
| Destroy-from-YAML | Emerging | Conservative unique-name / `--tag` teardown; requires `--yes` off-TTY. |
| grapeGUI / hosted dashboard | Draft | This package does not serve a UI. The catalog, offerings, and live inventory are what a WebEngine dashboard should read. |
| Second cloud provider | Draft | Not implemented. `ProviderCatalog` / `catalog/digitalocean.json` is the extension point. Schema `provider` is still the literal `digitalocean`. |
| Volumes / DOKS | Emerging | Cluster and volume create/list/delete. Day-2 and attach are still missing. See the catalog. |
| Functions | Draft | Catalog product `functions` is `missing`. |

## What is shipped

| Area | Source | Used by `apply`? |
|---|---|---|
| Zod grape config | `config/schema.ts` | yes |
| Load file or HTTP(S) | `config/load.ts` | CLI |
| Normalize + apply | `config/apply.ts` | CLI `apply` |
| `grape` CLI | `bin/cli.ts` + `cli/` | apply / plan / validate / status / destroy / init / catalog / offerings / telemetry |
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
| Spaces | `spaces/spaces.ts` | yes (S3 SigV4; needs Spaces keys) |
| CDN endpoints | `cdn/cdn.ts` | yes |
| Certificates | `certificates/certificates.ts` | yes |
| Stack / compose bootstrap | `config/stack.ts` | yes (droplet `user_data`) |
| Images | `images/images.ts` | no |
| Projects | `projects/projects.ts` | yes (unique-name adopt) |
| Volumes | `volumes/volumes.ts` | yes (unique name in region; no attach) |
| Kubernetes clusters | `kubernetes/kubernetes.ts` | yes (cluster + initial node pools; adopt skips pool reconcile) |
| Reserved IPs | `reserved-ips/reserved-ips.ts` | no |
| Registry | `registry/registry.ts` | no (list/get) |
| Account / billing | `account/account.ts`, `billing/billing.ts` | no |
| Offerings | `offerings/offerings.ts` | no (read-only CLI) |
| Metrics / uptime | `monitoring/metrics.ts`, `monitoring/uptime.ts` | alerts yes; metrics and uptime checks no |
| Snapshots | `snapshots/snapshots.ts` | no (list/get/delete) |
| Provider catalog | `providers/catalog/catalog.ts` | n/a |
| Security (Insight) | `security/security.ts` | no |
| Droplet actions log | `deploy/deployment-log.ts` | no |
| `cleanPayload` / `parseYAML` | utilities | internally |
| Tests | `*.test.ts` + Vitest | CLI, schema, apply, several providers |

## What is accepted but not applied

| Config field | Behavior |
|---|---|
| `services` | Zod allows `record`; apply warns unless the object is stack-shaped |
| `networking.ssl` / `networking.cdn` | Deprecated flags. Plan and apply warn. They do not create certificates or CDN endpoints — use `resources.certificates` and `resources.cdn` |
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
| State / plan / destroy | `grape plan` is a local dry-run. `grape destroy` matches unique live names. There is still no state file. Re-apply adopts Spaces, CDN origins, and certificate names; it does not update ACL, TTL, or custom domains |
| Drift detection | `grape status` overlap is name presence, not a diff |
| Dry-run | `grape plan` and `grape apply --dry-run` are local. They do not GET DigitalOcean |
| Cost estimation | No |
| Terraform / Docker drivers | No |
| DigitalOcean Functions | No client |
| Full DOKS day-2 (kubeconfig, upgrade, autoscale) | No |
| AWS, GCP as catalog entries | No. The catalog shape is the extension point; those ids are not listed |
| `grapevine init --config` | Invented CLI in an old infra README |
| WordPress YAML as grape apply | Use `examples/blueprints/kiwipress-*` packs; `src/blueprints/wordpress/` is a pointer README |

`NukeDroplet` / `deleteDroplet` still exist as functions. `grape destroy` is the YAML / `--tag` path; it is conservative and it does not empty Spaces.

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
- `grape destroy` (unique-name / tag teardown; not a full inverse of every create)

These areas are what will most directly move Grapevine from “active development” toward a calmer 1.0 story — still DigitalOcean-first.

## Early or draft areas

These should be treated more carefully in positioning:

- `grape status` as inventory
- images and Insight scans from YAML
- drift / state / plan
- grapeGUI
- a second provider (catalog shape only; do not add a fake AWS/GCP entry)
- DOKS day-2, volume attach, Functions
- full idempotent re-apply, Vite `dist/` sync, and CDN edge wait (Spaces/CDN/certs exist; those gaps do not)

These can absolutely be valuable later. They should not yet be the center of the Grapevine promise.

## What “apply” actually means

Grapevine does not reconcile a desired state.

- `validate` parses a document.
- `apply` creates in order, and adopts a unique live name for some types (VPC, droplet, firewall, SSH key, Space, certificate, CDN origin).
- `status` prints token presence, live tables, and optional name overlap. It is not drift.

If you put `vpc: staging` without creating that VPC in the same run and it is not already a unique VPC of that name, you get a droplet without that `vpc_uuid`. A second apply still creates another tag, domain, database, or app. It skips a Space, certificate, or CDN origin that already matches uniquely, without updating it.

## Tests

```bash
yarn workspace @citrusworx/grapevine test
```

Coverage is real and mostly mocked: schema, load, apply order, CLI parse/validate, several provider HTTP payloads. There is no live DigitalOcean integration test in this package. Docs examples were checked against source, not billed from this change.

## Integration (what is real)

**Kiwi.** Optional. The `kiwi` CLI can delegate to `grape` on `PATH`. Grapevine does not import Kiwi.

**Nectarine / Juice / Sig.js / Seltzer.** No special clients. `05-static-site-spaces.yaml` can provision the DigitalOcean side of a public Juice static site (Space + CDN + certificate). Grapevine still does not build `@citrusworx/juiceapp` or upload `dist/`. What's next for Juice: idempotent re-apply across resource types, a general certificate/CDN wait (today's wait only covers Let's Encrypt when a same-apply CDN entry needs the id), and a build-and-sync step. App Platform is a different path and is not the Juice static-site choice.

**`@citrusworx/types`.** Declared dependency. Unused in `libraries/grapevine/src`. Shared deployment types are not a second config format.

**WebEngine.** Does not invoke `applyGrapeConfig` from this package’s source. There is no dashboard here.

## Recommended positioning right now

If Grapevine is being described externally or internally, the most honest current positioning is:

> Grapevine is a DigitalOcean provisioning library: a Zod grape config, an apply engine (create, plus unique-name adopt for some types), a `grape` CLI (`validate` / `plan` / `apply` / `status` / `destroy` / `catalog` / `offerings` / `telemetry`), and function wrappers around DigitalOcean HTTP. `grape catalog --json` is the dashboard contract for offerings, inventory, and telemetry coverage. It is not Terraform, not multi-cloud, and not a GUI. A second provider is not implemented. It does not build or upload the Juice static site.

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
