# Grapevine Apply Lifecycle

What `applyGrapeConfig` actually does, in the order `libraries/grapevine/src/config/apply.ts` does it.

`grape apply -c …` is load + this function + print JSON. There is no other apply engine.

## Picture

```text
config (already validated)
        │
 resolveToken          →  getDoToken(credentials.env)
        │
 normalizeResources    →  fold networking / firewall / ssh
        │
 warn if loose `services` is non-empty (stack-shaped services are applied)
        │
 tags → ssh_keys → vpcs → databases → droplets (+ stack user_data)
      → firewalls → domains → load_balancers → alert_policies → apps
      → spaces → certificates → cdn
        │
 return ApplyResult
```

Each loop lists the live account first (when that resource type is declared) and matches by **unique name**. CDN endpoints match by **unique origin**. Certificates match by **unique name**.

- One exact match: **adopt** (skip create). Firewall rules are replaced to match the config, and a CDN `ttl` is updated when it differs. Droplet and tag attachments on an existing firewall are only added, never removed.
- No match: **create**.
- More than one match, or a VPC whose region does not match: **skip** and warn. Apply does not create a second resource and does not guess. Destroy uses the same checks.

That is idempotent re-apply for the Juice static-hosting set (tags, SSH keys, VPCs, droplets, firewalls, domains, Spaces, certificates, CDN) and for databases, apps, load balancers, and alert policies. It is not a full reconcile. Droplet size, user data, Space ACL, certificate material, custom domain, load-balancer rules, app spec, and alert thresholds are not updated. There is no state file and no rollback.

## 0. Preconditions

The config must already be a `GrapeConfig`. The CLI guarantees that via `loadGrapeConfig`. TypeScript callers should `validateGrapeConfig` or `loadGrapeConfig` first; `applyGrapeConfig` does not re-parse Zod.

A token must exist. `resolveToken` reads `config.credentials.env` (default `DO_TOKEN`) through `getDoToken`. Missing or empty → `DigitalOceanError`. If the env name is not `DO_TOKEN`, the value is copied onto `process.env.DO_TOKEN` so `authHeaders()` can find it.

## 1. Normalize

`normalizeResources` copies `config.resources` arrays, then appends:

| Shortcut | Becomes |
|---|---|
| `networking.vpc === true` | VPC `{ name: "digitalocean-vpc", region, description: "Created by grape apply" }` |
| `networking.vpc` object | that object, with `region` defaulting to config `region` |
| `networking.domain` | a domain `{ name }` unless that name is already in `resources.domains` |
| top-level `firewall` with any rules | a firewall named `firewall.name` or `digitalocean-firewall` |
| top-level `ssh` | pushed onto `ssh_keys` |

`networking.ssl` and `networking.cdn` are deprecated booleans. Plan and apply warn and do not create anything from them. Use `resources.certificates` and `resources.cdn`. Top-level `monitoring` is ignored here.

CLI `validate` and `grape status -c` also call `normalizeResources` for counts. Folding is not apply-only.

## 2. `services` warning vs applied `stack`

If `config.services` has keys and is **not** stack-shaped (`droplet` + `compose`):

```text
services is accepted for validation but is not applied. Declare a top-level stack (or a stack-shaped services section with droplet + compose) instead.
```

A top-level `stack` (or stack-shaped `services`) is applied: assets are resolved relative to the config file, cloud-init `user_data` is generated, and it is merged onto the target droplet before `createDroplet`.

## 3. In-memory maps

Three structures exist for the rest of the run:

- `vpcIds: Map<name, uuid>` — filled as VPCs are created
- `dropletIds: Map<name, number>` — filled as droplets are created
- `sshKeyIds: Array<id>` — filled as keys are uploaded

They are discarded when the function returns. They are not written to disk. A second apply fills them again by listing the account and adopting unique names, not by reading a state file.

## 4. Create loops

### Tags

List `GET /tags`. A unique name is adopted and `POST /tags` is skipped. An object tag with `resources` still calls `tagResource` (additive attach of ids you already have). Ambiguous names are skipped.

String tags have no attachment step. Object tags can attach **existing** DigitalOcean resources by id/type. They cannot attach “the droplet I am about to create” — droplets have no id yet.

### SSH keys

List account keys first.

1. If `generate` and a private key file already exists, reuse its public key (fingerprint can adopt an account key whose name differs).
2. A unique name, or a unique fingerprint, is adopted. `uploadSSHKey` is not called.
3. Ambiguous names or fingerprints are skipped. Apply does not upload another key.
4. Otherwise `public_key ?? publicKey`, or `generate` writes a new key, then `uploadSSHKey`.

When `generate` creates a new key, the OpenSSH private key is written (mode `0600`) to `private_key_path` or `.grape/ssh/<name>` under the process cwd **before** upload. Existing files are reused, not overwritten. The uploaded or adopted resource is pushed to `result.ssh_keys`. A newly written path is appended to `result.private_key_paths`. Key material is never added to `ApplyResult`.

### VPCs

List VPCs. A unique name in the target region (`vpc.region` or `config.region`) is adopted. `ip_range` is not changed. A unique name in a different region is skipped (not adopted, not created). Ambiguous names are skipped.

Otherwise `createVPC({ name, description, region, ip_range })`. The `id` is stored under `created.name`.

### Databases

List `GET /databases`. A unique name is adopted. Engine, size, and region are not changed. If `connection_env` is set, apply `GET /databases/:id` so the connection can be mapped. If `status !== "online"` and `wait !== false`, it still polls until online. Passwords stay off `ApplyResult`.

Otherwise `createDatabase` → POST `/databases`, then the same wait.

### Droplets

List droplets. A unique name is adopted. Size, image, region, and `user_data` are not changed. A `stack` that targets an adopted droplet is skipped: cloud-init is sent only on create.

Otherwise:

1. `unwrapDropletEntry` (flat or `{ blueprint: { droplet } }`)
2. `vpc_uuid` from the field, or `vpcIds.get(vpc)` if `vpc` was a name created or adopted in this run
3. `region` from the droplet or `config.region` or `""`
4. `ssh_keys` from the droplet, or **all** `sshKeyIds` from this run if the droplet omitted the field
5. If a `stack` targets this droplet, generate cloud-init `user_data` and merge it
6. `createDroplet(blueprint)` → POST `/droplets`

Ambiguous droplet names are skipped, and the stack for that droplet is skipped with them.

Unresolved `vpc: some-name` (not created or adopted in this run) becomes `vpc_uuid: undefined`.

### Firewalls

List firewalls. A unique name is adopted.

- Inbound and outbound rules are replaced with the config’s full normalized lists when they differ (`PUT /firewalls/:id`).
- `droplet_ids` and `tags` are a union of the live firewall and this config. Attachments are added, never removed.
- The firewall name is not changed.
- If rules and attachments already match, the PUT is skipped.

Ambiguous names are skipped. There is no create in that case.

On create, `droplet_ids` is the union of numeric `droplet_ids` and names in `droplets` that exist in `dropletIds`. Unknown names are dropped. Rules go through `normalizeFirewallRules` (`ports` expanded; string sources split into `addresses` / `tag:` / `droplet:`). Then `createFireWall` (capital W — that is the export).

### Domains

List domains. A unique name is adopted and `POST /domains` is skipped. The apex `ip_address` is not changed.

Records are matched by type + name + data:

- one exact record: adopt, no POST
- several exact records: skip, no POST
- same type and name with different data: skip, and do not update the data
- otherwise `createDomainRecord`

### Load balancers

List load balancers. A unique name is adopted. Forwarding rules and other fields are not changed. Otherwise `createLoadBalancer`. No name→id map for later steps. Firewalls have already run, so they cannot auto-attach this LB’s uid in the same apply.

### Alert policies

List policies and match `description` (the same key destroy uses). A unique description is adopted. Thresholds are not changed. Otherwise `createAlertPolicy`, with `alerts` defaulting to `{ email: [] }` if omitted.

### Apps

List apps and match `spec.name`. A unique name is adopted. The spec is not updated (that would redeploy). Otherwise `createApp({ spec })`. Waiting for a deployment is opt-in: `wait: true` calls `waitForAppDeployment` until `active_deployment.phase` is `ACTIVE` (default off; `wait_seconds` defaults to 600). Juice static hosting does not use App Platform.

### Spaces

For each `resources.spaces` entry, region comes from the Space or `config.region` (missing region throws). Apply lists buckets with the Spaces key (`DO_SPACES_ACCESS_KEY_ID` / `DO_SPACES_SECRET_ACCESS_KEY`, overridable via `credentials.spaces_*_env`) and adopts a unique name. Otherwise `createSpace` sends `PUT /` to `{name}.{region}.digitaloceanspaces.com` with `x-amz-acl` (`private` when `acl` is omitted, or `public-read`). Re-apply does not change an existing ACL. Ambiguous names are skipped. Listing uses one regional host (the first Space's region, else the config region, else `nyc3`); DigitalOcean documents that list as account-wide.

### Certificates

List `GET /certificates`. A unique name is adopted. PEM material and DNS names are not replaced. Ambiguous names are skipped. Otherwise `POST /certificates`. `lets_encrypt` sends `dns_names`. `custom` sends PEM fields from the document or from the named env vars.

After create or adopt, apply polls `GET /certificates/:id` until `state` is `verified`, unless `wait: false`. `wait_seconds` sets the timeout (default 300). `error` fails immediately. The loop is bounded by that timeout and by the number of polls, so it cannot spin forever. A CDN **create** that needs `certificate_id` waits until the certificate is verified even when that certificate set `wait: false`, because DigitalOcean will not attach an unverified id. This wait does not check DNS and does not mean the custom domain serves traffic.

### CDN endpoints

Origin is `origin`, or `{space}.{region}.digitaloceanspaces.com` using the CDN region, the same-apply Space region, or `config.region`. Apply lists `GET /cdn/endpoints` and adopts a unique origin. If `ttl` is set and differs, apply `PUT`s **only** `ttl`. Custom domain and `certificate_id` are not changed on an existing endpoint. Ambiguous origins are skipped. Otherwise `POST /cdn/endpoints` with optional `ttl`, `certificate_id`, and `custom_domain`.

After create or adopt, if the endpoint object has no usable hostname yet, apply polls `GET /cdn/endpoints/:id` until `endpoint` is set (`wait` defaults true, `wait_seconds` defaults to 300). The documented v2 CDN object has no status field; a non-empty `endpoint` hostname is the ready signal. If a response includes `status`, only `active` or `online` (with a hostname) counts as live, and `error` / `failed` fail immediately. A hostname already present on the create or list payload is treated as live and is not polled again. This does not create the site CNAME.

### Static sites

After the Space exists (created or adopted), each `resources.static_sites` entry:

1. Runs `build` from the working directory described below. If `build` is omitted and `workspace` is set, the command is `yarn workspace <workspace> build`.
2. Reads `dist` (relative to that directory unless absolute) and `PutObject`s each file into the Space. Content-Type comes from the extension. Object ACL follows the site `acl`, else the Space `acl` in this config (`public-read` or `private`).
3. Overwrites keys. `delete_stale: true` lists objects under the optional `prefix` and deletes keys this dist did not upload. Default is overwrite only.

**cwd.** `cwd` on the site, when set, is absolute or relative to the grape config file. When omitted, the build runs in the nearest parent of `process.cwd()` whose `package.json` has a `workspaces` field (the monorepo root). If none is found, the build runs in `process.cwd()`. Run `grape` from the repository root when you want that default to be the monorepo.

`grape publish -c` runs only this build and upload. It does not create the Space, certificate, or CDN endpoint. The Space must already exist (or the upload fails). `--dry-run` prints the command and paths and does not spawn or upload.

Re-apply runs the build and upload again. A Space that was skipped (ambiguous name) fails the static site step instead of uploading to an unclear bucket.

Destroy removes CDN endpoints before certificates and Spaces. DigitalOcean will not delete a certificate or a Space that a CDN endpoint still references. Space delete also fails while the bucket has objects; destroy does not empty it. `delete_stale` is only for publish, not destroy.

## 5. Result

```ts
interface ApplyResult {
  tags: string[];
  ssh_keys: AppliedSSHKey[]; // SSHKeyResource + optional private_key_path
  vpcs: VPCResponse[];
  databases: AppliedDatabase[]; // id, name, engine, status, host — no passwords
  droplets: DropletResource[];
  firewalls: Array<{ id: string; name: string }>;
  domains: Array<{ name: string; records: number }>;
  load_balancers: Array<{ id: string; name?: string }>;
  alert_policies: Array<{ uuid: string; description: string }>;
  apps: Array<{ id: string; name: string }>;
  spaces: AppliedSpace[]; // name, region, origin, optional acl — no Spaces secret
  certificates: AppliedCertificate[]; // id, name, type, state — no PEM material
  cdn: AppliedCdn[]; // id, origin, endpoint, custom_domain
  static_sites: StaticSitePublishResult[]; // name, space, uploaded, deleted — no Spaces secret
  stacks: AppliedStack[];
  private_key_paths: string[];
  receipt: ApplyReceiptItem[]; // created | adopted | updated | skipped
  warnings: string[];
}
```

`receipt` is the created / adopted / updated / skipped list. The typed arrays include created and adopted resources so later steps can use their ids. Skipped resources appear only on `receipt`.

The CLI prints Created, Adopted, Updated, and Skipped sections (or JSON, which includes `receipt`). `grape destroy -c` matches the same unique names, CDN origins, and VPC regions. It still does not read this JSON, and it does not roll back a failed apply.

`grape plan` and `grape apply --dry-run` do not POST, PUT, or DELETE. When `DO_TOKEN` (or `credentials.env`) is set, plan lists the account and marks each resource `action=create`, `action=adopt`, or `action=skip`. When no token is set, plan stays local and says so. `grape validate` stays local and does not list the account.

## What apply does not do

| Expectation | Reality |
|---|---|
| Update droplet size, image, or user data | Adopt skips create. No resize, no rebuild, no second cloud-init |
| Change Space ACL, certificate material, CDN custom domain, app spec, LB rules, or alert thresholds | Not updated. A second apply adopts the unique name and leaves those fields alone |
| Empty a Space, then delete it | Destroy deletes an empty bucket only |
| Rollback | Partial failure leaves earlier creates |
| Guess among duplicate names | Apply and destroy both skip ambiguous matches |
| Drift | `grape status` overlap is not a diff. Plan's create/adopt/skip is name presence, not a field diff |
| Run SSH commands | `user_data` on droplet create only |
| Provision volumes / DOKS | Not in these loops |
| Upload a Vite `dist/` without declaring `static_sites` | `05-static-site-spaces.yaml` still only provisions Space + cert + CDN. `06-juice-static.yaml` and `resources.static_sites` build and upload |
| Create the site CNAME to the CDN hostname | Domain records you declare are created if missing. Apply does not invent the CDN CNAME. Point the hostname at the printed `endpoint` yourself |
| Wait until the custom domain answers HTTPS | Certificate `verified` and a CDN hostname are necessary, not a DNS check. The CNAME is still operator-owned |
| App Platform deploy wait by default | `waitForAppDeployment` runs only when `resources.apps[].wait` is true |
| Apply loose `services` / `monitoring` | Schema or warning only (`stack` is applied) |
| Apply `networking.ssl` / `networking.cdn` | Warning only. Use `resources.certificates` and `resources.cdn` |

`createDroplet` itself may send a `volumes` id list if you set it. Apply does not create those volumes first.

## Error handling

API failures become `DigitalOceanError` (status, DigitalOcean `id`, `request_id`). The CLI writes the message to stderr and exits 1.

There is no `try` per resource that continues the loop. The first thrown error stops the function. `ApplyResult` is not returned.

SSH misconfiguration throws a plain `Error` before `uploadSSHKey`.

## Apply vs function calls

Use `applyGrapeConfig` when the document is the source of truth for this apply. A second run adopts unique names instead of creating them again.

Use `createDroplet` / `createFireWall` / … when you already have ids, when you need GET/PUT/DELETE, or when you are writing a one-off script. Those helpers are a larger surface than apply — list/get/update/delete exist for most resources — but they do not honor grape YAML.

`deployByBlueprint(path)` is droplet-only: parse a `{ blueprint: { droplet } }` file, `cleanPayload`, POST `/droplets`. It does not run the nine-step loop.

## Tests that lock this down

`libraries/grapevine/src/config/idempotent-apply.test.ts` mocks list/get/create and checks that a second apply does not POST create when the unique name (or CDN origin) already exists. `apply.test.ts` still checks:

- `normalizeResources` for `networking` / `firewall`
- order tags → VPC → droplet (`vpc_uuid`, `ssh_keys`) → firewall (name → id, rule normalization) → domain
- classic blueprint hoist before apply

There is no live integration test. Docs examples were checked against this source, not billed on DigitalOcean from this package.

## Related

- [Configuration](./grapevine-config.md)
- [Tutorial](./grapevine-tutorial.md)
- [Live status](./grapevine-live-status.md)
- [Anti-Patterns](./grapevine-anti-patterns.md)
