# Grapevine API Reference

Public exports from `@citrusworx/grapevine` (`libraries/grapevine/src/index.ts`).

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

`ApplyResult` includes arrays of created tags, keys, VPCs, droplets, firewalls, domains, load balancers, alert policies, apps, plus `warnings: string[]`.

## YAML helpers

```ts
import { parseYAML, parseYAMLString } from "@citrusworx/grapevine";
```

`parseYAML(file)` reads a path. Used by `deployByBlueprint`.

## DigitalOcean client

```ts
import { getDoToken, doRequest, DigitalOceanError, authHeaders, client } from "@citrusworx/grapevine";
```

`doRequest` is the Axios wrapper all resource functions use. `getDoToken(envName?)` reads the env var (default `DO_TOKEN`).

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
| Apps | `createApp`, `createAppFromBlueprint`, `listApps`, `updateApp`, `deleteApp`, `createDeployment` |
| Images | `listAllImages`, `createCustomImage`, `updateImage`, `deleteImage` |
| Security | `createScan`, `listScans`, `getLatestScans`, `createSuppression`, … |
| Actions | `getDropletActions`, `getAction`, `logDropletActions` |

## Not exported

- A `DigitalOcean` namespace object
- `grapeGUI`
- Config apply for `services`
- Any AWS/GCP SDK

## CLI (not an import)

```ts
import { parseCliArgs, runCli } from "@citrusworx/grapevine"; // not exported from package root
```

Use the `grape` binary. `parseCliArgs` / `runCli` live on the bin module.
