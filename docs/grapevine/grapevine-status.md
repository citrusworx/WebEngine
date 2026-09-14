# Grapevine Status

Honest snapshot of `@citrusworx/grapevine` **0.2.1** against `libraries/grapevine/src`.

## Maturity

**Active development**, DigitalOcean-only. Create/list/update/delete helpers for the resources below are implemented. There is no multi-cloud abstraction layer and no GUI.

Workspace index: “Active development” — agreed. Older docs that listed AWS/Linode as “coming soon” in a support table implied a provider interface that does not exist.

## What is shipped

| Area | Source | Used by `apply`? |
|---|---|---|
| Zod grape config | `config/schema.ts` | yes |
| Load file or HTTP(S) | `config/load.ts` | CLI |
| Normalize + apply | `config/apply.ts` | CLI `apply` |
| `grape` CLI | `bin/cli.ts` | apply / validate / status |
| Droplets | `droplet/droplet.ts` | yes |
| VPC + peering | `vpc/vpc.ts` | VPC create yes; peering no |
| Firewalls | `firewall/firewall.ts` | yes |
| SSH keys | `ssh/ssh.ts` | yes |
| Tags | `tags/tags.ts` | yes |
| Domains + records | `networking/domains.ts` | yes |
| Load balancers | `networking/load-balancer.ts` | yes |
| Alert policies | `monitoring/monitoring.ts` | yes |
| App Platform | `apps/apps.ts` | yes |
| Images | `images/images.ts` | no |
| Security (Insight) | `security/security.ts` | no |
| Droplet actions log | `deploy/deployment-log.ts` | no |
| `cleanPayload` / `parseYAML` | utilities | internally |
| Tests | `*.test.ts` + Vitest | CLI, schema, apply, several providers |

## What is accepted but not applied

| Config field | Behavior |
|---|---|
| `services` | Zod allows `record`; apply pushes a warning |
| `networking.ssl` / `networking.cdn` | Schema only — no certificate or CDN calls |
| `monitoring.enabled` / `monitoring.alerts` | Not mapped to `createAlertPolicy` (use `resources.alert_policies`) |
| `blueprint` at top level | Hoisted into `resources`, then applied |

## What is not shipped

| Claim | Reality |
|---|---|
| AWS, Linode, Azure, GCP | No `src/providers/<name>` |
| grapeGUI / `yarn grapevine gui` | No binary |
| WebEngine dashboard | Not this package |
| `DigitalOcean` class with `.Droplet.create` | Flat function exports |
| SSH provisioning (run scripts over SSH) | `user_data` on droplet create only |
| State / plan / destroy | Create-oriented apply; deletes are manual APIs |
| Cost estimation | No |
| Terraform / k8s / Docker drivers | No |
| `grapevine init --config` | Invented CLI in an old infra README |

`NukeDroplet` / `deleteDroplet` exist as functions. They are not `grape destroy`.

## Integration honesty

**Nectarine / Juice / Sig.js.** No special clients. You may put a Juice app on a droplet you created; Grapevine does not know what Juice is.

**`@citrusworx/types`.** A dependency. Shared deployment types are not a second config format.

**WebEngine.** Does not invoke `applyGrapeConfig` from this package’s source.

## Tests

```bash
yarn workspace @citrusworx/grapevine test
```

## Roadmap (direction)

Useful if built, in this order:

1. Persist generated SSH private keys (or refuse `generate` without a write path)
2. Destroy / reconcile against live account
3. Apply images and security scans from config if that stays in scope
4. A second provider — only when a real adapter exists

Do not schedule “v0.3 Azure” in app docs until there is a folder under `providers/`.
