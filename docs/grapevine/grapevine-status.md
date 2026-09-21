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
| Apply create order | Stable-ish | tags → SSH → VPC → databases → droplets (+ stack user_data) → firewalls → domains → LBs → alerts → apps → Spaces → certificates (wait until verified) → CDN (wait until hostname) → static site build/upload. Tested with mocks. |
| Same-apply `vpc:` / `droplets:` maps | Stable-ish | Process-local. Easy to misuse; behavior is consistent. |
| `createDroplet` / `createVPC` / `createFireWall` | Stable-ish | Real POSTs through `doRequest`. |
| `DO_TOKEN` / `credentials.env` | Stable-ish | Env only. Live `status`/`destroy` use `credentials.env` when `-c` is passed. |
| CLI `grape apply` | Emerging | Idempotent re-apply: unique name (CDN origin) is adopted; ambiguous names are skipped. Receipt is created / adopted / updated / skipped. `--dry-run` aliases `plan` and does not mutate. No rollback. |
| In-repo blueprints `01`–`06` + KiwiPress packs | Emerging | Honest starters; `grape init` copies files or pack directories. `06-juice-static.yaml` adds the Vite build and Spaces upload. |
| Function CRUD (list/get/update/delete) | Emerging | Broad HTTP surface; `destroy` uses unique-name / tag matching. |
| `grape status` | Emerging | Live tables (droplets/VPCs/firewalls/domains) plus optional config overlap. **Not drift.** |
| App Platform / LB / alerts / domains in apply | Early | Create loops exist; little teaching or tests vs droplets/VPC/firewall. |
| Spaces + CDN + certificates | Emerging | `resources.spaces`, `resources.cdn`, `resources.certificates`. Re-apply adopts a unique Space name, certificate name, or CDN origin. CDN TTL is updated; ACL, custom domain, and certificate material are not. CDN is deleted before certificates and Spaces. Certificates poll until `verified` (`wait` / `wait_seconds`). CDN create that needs `certificate_id` waits even if the certificate set `wait: false`. CDN endpoints poll until the `endpoint` hostname is present. |
| Managed databases + `stack` | Emerging | `resources.databases` POST `/databases`; `stack` generates droplet cloud-init. |
| Images / Insight security | Early | Exported, not applied. |
| `generate: true` SSH | Emerging | Writes OpenSSH private key to `.grape/ssh/<name>` (or `private_key_path`); apply reports the path. |
| Docs as product surface | Emerging to Stable-ish | Tutorial, topics, patterns, anti-patterns now exist next to the API. |
| Wait until cert / CDN hostname | Emerging | Bounded polls (`wait`, `wait_seconds`). Not a DNS check and not a guarantee the edge serves the custom domain. `waitForAppDeployment` exists and is opt-in (`resources.apps[].wait: true`). |
| Drift / reconcile | Draft | Not implemented. |
| Static site build + Spaces sync | Emerging | `resources.static_sites` runs a build from the monorepo root (or `cwd`) and PutObject-syncs `dist/`. `grape publish` does only that. Overwrite by default; `delete_stale: true` removes extra keys. Not multi-cloud. |
| grapeGUI / WebEngine dashboard | Draft | Absent. |
| Second cloud provider | Draft | Schema forbids it. |
| Idempotent apply | Emerging | Second `grape apply` adopts unique names instead of creating them again. Firewall rules and CDN TTL can update. Static sites rebuild and upload again. No state file. Droplet size, user data, ACL, and custom domain are not reconciled. |
| Destroy-from-YAML | Emerging | Same unique-name, CDN-origin, and VPC-region checks as apply. Ambiguous names are skipped. Requires `--yes` off-TTY. Does not empty a Space. |
| Volumes / DOKS | Draft | Not grape resources. Spaces moved to Emerging (see above). |

## What is shipped

| Area | Source | Used by `apply`? |
|---|---|---|
| Zod grape config | `config/schema.ts` | yes |
| Load file or HTTP(S) | `config/load.ts` | CLI |
| Normalize + apply | `config/apply.ts` | CLI `apply` |
| `grape` CLI | `bin/cli.ts` + `cli/` | apply / plan / validate / publish / status / destroy / init |
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
| Spaces | `spaces/spaces.ts` | yes (S3 SigV4; bucket create plus object put/list/delete for static publish) |
| CDN endpoints | `cdn/cdn.ts` | yes |
| Certificates | `certificates/certificates.ts` | yes |
| Stack / compose bootstrap | `config/stack.ts` | yes (droplet `user_data`) |
| Static site publish | `config/static-publish.ts` | yes (`resources.static_sites`, also `grape publish`) |
| Images | `images/images.ts` | no |
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
| State file | There is still no state file. Re-apply lists the account |
| Drift detection | `grape status` overlap is name presence, not a diff. Plan's create/adopt/skip is the same kind of check |
| Dry-run without a token | `grape plan` stays local and says so. It does not invent live names |
| Plan that mutates | `grape plan` and `grape apply --dry-run` only list when a token is set. They do not POST, PUT, or DELETE |
| Cost estimation | No |
| Terraform / k8s / Docker drivers | No |
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

- CLI apply (partial failure still stops the run; safe updates are only firewall rules and CDN TTL)
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
- a second provider
- volumes, DOKS
- the site CNAME from the public hostname to the CDN `endpoint` (still operator-owned; Grapevine does not create it)

These can absolutely be valuable later. They should not yet be the center of the Grapevine promise.

## What “apply” actually means

Grapevine adopts unique live names. It does not diff every field.

- `validate` parses a document. It does not call DigitalOcean.
- `plan` lists the account when a token is set and marks create, adopt, or skip. With no token it stays local and says so. Plan does not mutate.
- `apply` creates what is missing, adopts a unique name (CDN: unique origin), updates firewall rules and CDN TTL, and skips ambiguous matches.
- `destroy` deletes with the same unique-name, CDN-origin, and VPC-region checks. Ambiguous names and a VPC in the wrong region are skipped.
- `status` prints token presence, live tables, and optional name overlap. It is not drift.

If you put `vpc: staging` without creating that VPC in the same run and it is not already a unique VPC of that name in the target region, the droplet is created without that `vpc_uuid`. A second apply does not create another tag, droplet, domain, database, app, Space, certificate, or CDN endpoint when one unique match already exists.

## Tests

```bash
yarn workspace @citrusworx/grapevine test
```

Coverage is real and mostly mocked: schema, load, apply order, CLI parse/validate, several provider HTTP payloads. There is no live DigitalOcean integration test in this package. Docs examples were checked against source, not billed from this change.

## Integration (what is real)

**Kiwi.** Optional. The `kiwi` CLI can delegate to `grape` on `PATH`. Grapevine does not import Kiwi.

**Nectarine / Juice / Sig.js / Seltzer.** No special clients. `06-juice-static.yaml` is the Juice template: Space + certificate + CDN, then `yarn workspace @citrusworx/juiceapp build` and an upload of `apps/juice/dist`. Apply waits until the certificate is `verified` and until the CDN object has an `endpoint` hostname. That is not multi-cloud, and it does not create the DNS CNAME from the site hostname to that CDN hostname — the operator still adds `static.example.com` CNAME `<space>.<region>.cdn.digitaloceanspaces.com` at the registrar or in DigitalOcean DNS. App Platform remains a different path (`wait: true` can poll a deployment; Juice does not use it).

**`@citrusworx/types`.** Declared dependency. Unused in `libraries/grapevine/src`. Shared deployment types are not a second config format.

**WebEngine.** Does not invoke `applyGrapeConfig` from this package’s source. There is no dashboard here.

## Recommended positioning right now

If Grapevine is being described externally or internally, the most honest current positioning is:

> Grapevine is a DigitalOcean provisioning library: a Zod grape config, an apply engine that creates missing resources and adopts unique live names, a `grape` CLI (`validate` / `plan` / `apply` / `publish` / `status` / `destroy`), and function wrappers around DigitalOcean HTTP, including Spaces (S3), CDN, and certificates. Static sites can be built and uploaded into a Space. It is not Terraform, not multi-cloud, and not a GUI. It does not create the site CNAME to the CDN hostname.

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
