# Grapevine API Reference

Public exports from `@citrusworx/grapevine` (`libraries/grapevine/src/index.ts`).

This is the one-page surface. Behavior: [Apply lifecycle](./grapevine-apply.md), [DigitalOcean](./grapevine-digitalocean.md), [Configuration](./grapevine-config.md).

## Config

```ts
import {
  grapeConfigSchema,
  validateGrapeConfig,
  safeValidateGrapeConfig,
  hoistBlueprintDocument,
  loadGrapeConfig,
  parseConfigText,
  readConfigSource,
  isRemoteConfigSource,
  applyGrapeConfig,
  normalizeResources,
  unwrapDropletEntry,
  type GrapeConfig,
  type GrapeResources,
  type ApplyResult,
} from "@citrusworx/grapevine";
```

| Function | Role |
|---|---|
| `validateGrapeConfig(input)` | hoist + `parse` — throws on Zod error |
| `safeValidateGrapeConfig(input)` | hoist + `safeParse` |
| `hoistBlueprintDocument(input)` | fold `blueprint.*` into `resources` |
| `loadGrapeConfig(source)` | read file or HTTP(S), parse YAML/JSON, validate |
| `parseConfigText(text, source?)` | JSON if it looks like JSON, else YAML |
| `readConfigSource(source)` | `fs` or `axios.get` |
| `isRemoteConfigSource(source)` | `^https?://` |
| `normalizeResources(config)` | merge shortcuts into `resources` |
| `unwrapDropletEntry(entry)` | blueprint wrap → droplet fields |
| `applyGrapeConfig(config)` | live creates; returns `ApplyResult` |

`ApplyResult` includes arrays of created tags, keys, VPCs, droplets, firewalls, domains, load balancers, alert policies, apps, plus `private_key_paths: string[]` and `warnings: string[]`. Generated SSH keys add `private_key_path` on the matching `ssh_keys` entry (path only, never key material).

`grapeConfigSchema` is the Zod object. `provider` is the literal `"digitalocean"`.

## YAML helpers

```ts
import { parseYAML, parseYAMLString } from "@citrusworx/grapevine";
```

`parseYAML(file)` reads a path. Used by `deployByBlueprint`.

## DigitalOcean client

```ts
import {
  getDoToken,
  doRequest,
  DigitalOceanError,
  authHeaders,
  client,
  DO_API_BASE,
  DEFAULT_TOKEN_ENV,
} from "@citrusworx/grapevine";
```

`doRequest` is the Axios wrapper all resource functions use. `getDoToken(envName?)` reads the env var (default `DO_TOKEN`). `client` is `{ get, post, put, patch, delete }`.

## Droplets

```ts
import {
  createDroplet,
  createDroplets,
  deployByBlueprint,
  getDroplet,
  getDropletStatus,
  listAllDroplets,
  deleteDroplet,
  deleteDropletsByTag,
  NukeDroplet,
  NukeDropletLite,
  listBackups,
  listBackupPolicy,
  listFirewalls,
  listSnapshots,
  resolveDropletBlueprint,
} from "@citrusworx/grapevine";
```

`createDroplet` accepts a flat `DropletBlueprint`, `{ droplet }`, or `{ blueprint: { droplet } }`.

`deployByBlueprint(path)` — file path to a blueprint document, POST `/droplets`.

`NukeDroplet` / `deleteDroplet` — DELETE. Treat as destructive.

## VPC

`createVPC`, `createPeering`, `listAllVPCs`, `listExistingVPC`, `listMemberResources`, `listVPCPeerings`, `updateVPC`, `partialUpdateVPC`, `updateVPCPeering`, `deleteVPC`.

`createVPC` requires `name` and `region` (`ip_range` optional).

## Firewall

`createFireWall` (capital W — that is the export), `getFirewall`, `listFirewall`, `listAllFirewalls`, `updateFirewall`, `deleteFirewall`, `addDropletsToFirewall`, `removeDropletsFromFirewall`, `addRulesToFirewall`, `removeRulesFromFirewall`, `addTagsToFirewall`, `removeTagsFromFirewall`.

## SSH

`createKeyPair`, `hashRSA`, `toOpenSSH`, `createSSHKey(name)`, `uploadSSHKey`, `listSSHKeys`, `getSSHKey`, `updateSSHKey`, `deleteSSHKey`.

`createSSHKey` returns `{ name, publicKey, keys, fingerprint }` locally. Upload separately.

## Tags, domains, load balancers, monitoring, apps

| Area | Create / list (non-exhaustive) |
|---|---|
| Tags | `createTag`, `listAllTags`, `tagResource`, `untagResource`, `deleteTag` |
| Domains | `createDomain`, `listAllDomains`, `createDomainRecord`, `updateDomainRecord`, `deleteDomain` |
| LB | `createLoadBalancer`, `listAllLoadBalancers`, `addDropletsToLoadBalancer`, `deleteLoadBalancer` |
| Monitoring | `createAlertPolicy`, `listAlertPolicies`, `updateAlertPolicy`, `deleteAlertPolicy` |
| Apps | `createApp`, `createAppFromBlueprint`, `listApps`, `updateApp`, `deleteApp`, `createDeployment`, `waitForAppDeployment` |
| Databases | `createDatabase`, `listDatabases`, `getDatabase`, `waitForDatabase`, `deleteDatabase` |
| Spaces objects | `putSpaceObject`, `listSpaceObjects`, `deleteSpaceObject` (bucket create/list/delete stay on `createSpace` / `listSpaces` / `deleteSpace`) |
| CDN / certificates | `createCdnEndpoint`, `waitForCdnEndpoint`, `createCertificate`, `waitForCertificate` |
| Images | `listAllImages`, `createCustomImage`, `updateImage`, `deleteImage` |
| Security | `createScan`, `listScans`, `getLatestScans`, `createSuppression`, … |
| Actions | `getDropletActions`, `getAction`, `logDropletActions` |
| Payload | `cleanPayload` |

## Not exported

- A `DigitalOcean` namespace object with `.Droplet.create`
- `grapeGUI`
- Config apply for a loose (non-stack) `services` map
- Any AWS/GCP SDK
- `runCli` from the package root (it lives on the bin module)

## CLI (not an import)

Use the `grape` binary:

```text
grape validate -c <path|url>
grape plan     -c <path|url>
grape apply    -c <path|url> [--dry-run] [--json]
grape publish  -c <path|url> [--dry-run] [--json]
grape destroy  [-c <path|url>] [--tag <tag>] [--yes] [--dry-run]
grape status   [-c <path|url>] [--json]
grape init     [blueprint] [--list] [--force]
grape help
```

`kiwi --grape` is documented as a delegate to this binary, not a second implementation.
