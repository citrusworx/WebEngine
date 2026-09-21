# Grapevine + DigitalOcean

DigitalOcean is the **only** provider in source. This page is the practical guide for tokens, droplets, networks, and the functions Grapevine wraps.

`src/providers/digitalocean/` is the whole provider tree. There is no `aws/`, `gcp/`, or `azure/` directory. `DigitalOcean.ts` is a barrel of re-exports, not a class.

## Account and token

1. Sign up at [digitalocean.com](https://www.digitalocean.com)
2. API → Tokens/Keys → generate a **read and write** personal access token
3. `export DO_TOKEN=dop_v1_...`

Verify outside Grapevine if you want:

```bash
curl -s -H "Authorization: Bearer $DO_TOKEN" https://api.digitalocean.com/v2/account
```

Grapevine’s `doRequest` uses `https://api.digitalocean.com/v2` and `Authorization: Bearer …`. Failures become `DigitalOceanError` with DigitalOcean’s `message`, `status`, `id`, and `request_id` when present.

Token handling in grape configs: [Secrets and env](./grapevine-secrets.md).

## Regions

Pass a slug DigitalOcean accepts (`nyc1`, `nyc3`, `sfo3`, `ams3`, `fra1`, `lon1`, `sgp1`, `blr1`, `tor1`, …). Grapevine does not validate slugs beyond “non-empty string.” Wrong slugs fail at the API.

Put `region` on the grape config and/or on each VPC/droplet/load balancer. Apply fills missing resource regions from the document root.

There is no `DO_REGION` env reader.

## What apply will create

These DigitalOcean products have both HTTP helpers **and** a loop in `applyGrapeConfig`:

| Product | Apply field | Create helper | HTTP |
|---|---|---|---|
| Tags | `resources.tags` | `createTag`, `tagResource` | `POST /tags` |
| SSH keys | `resources.ssh_keys` | `uploadSSHKey` | `POST /account/keys` |
| VPCs | `resources.vpcs` | `createVPC` | `POST /vpcs` |
| Droplets | `resources.droplets` | `createDroplet` | `POST /droplets` |
| Firewalls | `resources.firewalls` | `createFireWall` | `POST /firewalls` |
| Domains / records | `resources.domains` | `createDomain`, `createDomainRecord` | `POST /domains` |
| Load balancers | `resources.load_balancers` | `createLoadBalancer` | `POST /load_balancers` |
| Alert policies | `resources.alert_policies` | `createAlertPolicy` | `POST /monitoring/alerts` |
| App Platform | `resources.apps` | `createApp` | `POST /apps` |
| Spaces | `resources.spaces` | `createSpace` | S3 `PUT /` on `{bucket}.{region}.digitaloceanspaces.com` |
| Certificates | `resources.certificates` | `createCertificate` | `POST /certificates` |
| CDN endpoints | `resources.cdn` | `createCdnEndpoint` | `POST /cdn/endpoints` |

That is the apply surface. If it is not in this table, YAML will not provision it.

Spaces bucket calls do **not** use `DO_TOKEN`. They use a Spaces key pair (`DO_SPACES_ACCESS_KEY_ID` and `DO_SPACES_SECRET_ACCESS_KEY`, or `credentials.spaces_access_key_env` / `spaces_secret_key_env`) and AWS Signature Version 4. The key needs DigitalOcean's **All (Buckets and Objects)** permission to create, list, and delete buckets. CDN and certificates use the API token.

## Droplets

Required blueprint fields: `name`, `size`, `image`. `region` is required by DigitalOcean; Grapevine fills it from the droplet or the config.

Common sizes: `s-1vcpu-1gb`, `s-2vcpu-2gb`, … — current catalog is DigitalOcean’s, not a Grapevine enum.

Images: slugs like `ubuntu-24-04-x64` or a numeric snapshot id.

Optional fields Grapevine forwards: `ssh_keys`, `backups`, `backup_policy`, `ipv6`, `monitoring`, `tags`, `user_data`, `volumes`, `vpc_uuid`, `with_droplet_agent`.

```ts
import {
  createDroplet,
  getDropletStatus,
  listAllDroplets,
  deleteDroplet,
} from "@citrusworx/grapevine";

const droplet = await createDroplet({
  name: "web-01",
  region: "nyc1",
  size: "s-1vcpu-1gb",
  image: "ubuntu-24-04-x64",
});

await getDropletStatus(droplet.id!);
await listAllDroplets();
// await deleteDroplet(droplet.id!);
```

`createDroplet` accepts a flat `DropletBlueprint`, `{ droplet }`, or `{ blueprint: { droplet } }`.

`user_data` is the supported “run something at boot” mechanism. There is no post-create SSH runner.

`getDropletStatus(id)` is a function export. The CLI does not call it.

`NukeDroplet` / `NukeDropletLite` / `deleteDroplet` / `deleteDropletsByTag` are destructive deletes. They are not `grape destroy`.

## VPC

```ts
import { createVPC, listAllVPCs, deleteVPC } from "@citrusworx/grapevine";

const vpc = await createVPC({
  name: "app",
  description: "App network",
  region: "nyc1",
  ip_range: "10.10.0.0/16",
});
```

On apply, droplet `vpc: app` maps to this VPC’s id **if it was created in the same apply**. Peering helpers exist (`createPeering`, list/update peering) but apply does not create peerings from YAML.

`createVPC` requires `name` and `region` (`ip_range` optional in Grapevine’s type).

## Firewall

```ts
import { createFireWall } from "@citrusworx/grapevine";

await createFireWall({
  name: "web",
  droplet_ids: [123],
  inbound_rules: [
    { protocol: "tcp", ports: "443", sources: { addresses: ["0.0.0.0/0"] } },
  ],
  outbound_rules: [
    { protocol: "tcp", ports: "all", destinations: { addresses: ["0.0.0.0/0"] } },
  ],
});
```

Note the export spelling: `createFireWall`.

Also exported: `getFirewall`, `listFirewall`, `listAllFirewalls`, `updateFirewall`, `deleteFirewall`, add/remove droplets, rules, and tags.

YAML `inbound` is normalized to `inbound_rules` during apply. Direct function callers pass DigitalOcean’s object shape (`sources: { addresses }`), not a string CIDR list, unless they normalize themselves.

## SSH keys

```ts
import { createSSHKey, uploadSSHKey, listSSHKeys } from "@citrusworx/grapevine";

const generated = createSSHKey("ci");
await uploadSSHKey({ name: generated.name, public_key: generated.publicKey });
await listSSHKeys();
```

`createSSHKey` is **local**. It does not call DigitalOcean. Keep `generated.keys.privateKey` if you need to log in from TypeScript.

Apply with `generate: true` uploads the public key and writes the OpenSSH private key to `private_key_path` or `.grape/ssh/<name>`.

## Domains, LBs, apps, alerts

These are real DigitalOcean products and real Grapevine functions. Apply will create them if you declare the matching `resources.*` arrays. See [Configuration](./grapevine-config.md) and [API](./grapevine-api.md).

App Platform `spec` is passed through; Grapevine does not compile a Juice/Sig app into an app spec for you. `spec.databases` is not a managed-database product wrapper.

## Implemented but not applied

Programmatic SDK-style helpers exist beyond the create loops:

| Area | Examples | In `applyGrapeConfig`? |
|---|---|---|
| Droplet extras | backups, snapshots, firewalls-on-droplet, nuke | no (create yes) |
| VPC extras | peering, members, update, delete | no (create yes) |
| Images | `createCustomImage`, `listAllImages` | no |
| Security (Insight) | scans, settings, suppressions | no |
| Deploy log | `getDropletActions`, `logDropletActions` | no |
| Full CRUD | list/get/update/delete on most resources | no |

Call them from TypeScript if you need them. Do not invent YAML keys for them.

## Spaces, CDN, and certificates

Emerging, and the chosen path for a public static site such as Juice (`apps/juice`, `@citrusworx/juiceapp`). Starter: `examples/blueprints/05-static-site-spaces.yaml`.

| Product | YAML | Notes |
|---|---|---|
| Space | `resources.spaces[]` with `name`, `region`, optional `acl` (`private` or `public-read`) | Create is `PUT /` with `x-amz-acl`. List is `GET /` on `{region}.digitaloceanspaces.com` (account-wide). Delete requires an empty bucket; Grapevine does not delete objects. |
| Certificate | `resources.certificates[]` | `lets_encrypt` needs `dns_names`. `custom` needs PEM material inline or via `private_key_env` / `leaf_certificate_env` / `certificate_chain_env`. Key material is not copied onto `ApplyResult`. |
| CDN | `resources.cdn[]` | `origin`, or `space` plus region. Optional `ttl` (60, 600, 3600, 86400, 604800), `custom_domain`, and `certificate` (name) or `certificate_id`. |

Apply order for these three is Spaces, then certificates, then CDN. A same-apply CDN reference polls `GET /certificates/:id` until `verified` (or `error` / timeout) before `POST /cdn/endpoints`. Certificates that nothing references are left `pending`. This is not a general "wait until the CDN edge is live" helper, and it is not `waitForAppDeployment`.

Destroy order removes the CDN endpoint before the certificate and the Space. A certificate still attached to a load balancer is removed only after load balancers in the same plan. Re-apply adopts a unique Space name, a unique certificate name, and a unique CDN origin. It updates CDN TTL only. It does not change ACL or custom domain.

`networking.ssl` and `networking.cdn` still do nothing except warn. Declare the resource arrays.

Juice follow-ups that this layer does not pretend to finish: waiting until the certificate and CDN edge are live, the CNAME from the site hostname to the CDN endpoint, `yarn workspace @citrusworx/juiceapp build`, and uploading `dist/`.

## Not implemented as Grapevine resources

| Area | Reality |
|---|---|
| Block storage volumes | Droplet field `volumes?: string[]` may be sent; no `POST /volumes` |
| Kubernetes (DOKS) | No cluster APIs; `kubernetes_ids` only on firewall payload shape |
| Projects, floating IPs | Not grape resources |
| Object upload / static sync | Spaces exist; putting files in them does not |
| Other clouds | Schema rejects anything but `digitalocean` |

## Client primitives

```ts
import {
  getDoToken,
  doRequest,
  DigitalOceanError,
  authHeaders,
  client,
  DO_API_BASE,
} from "@citrusworx/grapevine";
```

`client` is `{ get, post, put, patch, delete }` returning `{ data }`. Resource modules use `doRequest` directly.

`cleanPayload` strips empty values before some POSTs (`deployByBlueprint`). See [utilities/cleanPayload.md](./utilities/cleanPayload.md).

## Limits and cost

DigitalOcean rate-limits API calls. Grapevine does not implement a client-side quota manager.

Droplets and load balancers cost money. Start with `01-vpc-and-tag.yaml` when you are testing the CLI.

## Related

- [Getting Started](./grapevine-getting-started.md)
- [Apply lifecycle](./grapevine-apply.md)
- [infrastructure/digitalocean](./infrastructure/digitalocean/README.md) — extra DO how-tos in this docs tree
- In-repo blueprints README
