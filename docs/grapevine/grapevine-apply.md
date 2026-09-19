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
        │
 return ApplyResult
```

Each resource loop is **create**. There is no get-or-create, no update, no delete, no refresh of live state.

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

`networking.ssl` and `networking.cdn` are ignored here. Top-level `monitoring` is ignored here.

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

They are discarded when the function returns. They are not written to disk. A second apply starts empty.

## 4. Create loops

### Tags

For each entry, `createTag(name)` then, if the entry is an object with `resources`, `tagResource(name, resources)`.

String tags have no attachment step. Object tags can attach **existing** DigitalOcean resources by id/type. They cannot attach “the droplet I am about to create” — droplets have no id yet.

### SSH keys

For each key:

1. `public_key ?? publicKey`
2. else if `generate`, `createSSHKey(name)`, persist the private key, use `publicKey`
3. else throw `SSH key "<name>" is missing public_key (or set generate: true)`
4. `uploadSSHKey({ name, public_key })`

When `generate` is true, the OpenSSH private key is written (mode `0600`) to `private_key_path` or `.grape/ssh/<name>` under the process cwd **before** upload. Existing files are refused. The uploaded resource (id, fingerprint, public_key, name) is pushed to `result.ssh_keys` with `private_key_path` set. The absolute path is also appended to `result.private_key_paths` and a warning. Key material is never added to `ApplyResult`.

### VPCs

`createVPC({ name, description, region, ip_range })` with `region` from the VPC or `config.region` or `""`. The created `id` is stored under `created.name`.

If DigitalOcean returns a different name than you sent, the map key is whatever came back.

### Databases

For each `resources.databases` entry:

1. Resolve `private_network_uuid` from the field, `vpc_uuid`, or `vpcIds.get(vpc)`
2. `createDatabase` → POST `/databases`
3. If `status !== "online"` and `wait !== false`, poll `GET /databases/:id` until online
4. If `connection_env` is set, map the private connection onto stack env keys (passwords stay off `ApplyResult`)

### Droplets

For each entry:

1. `unwrapDropletEntry` (flat or `{ blueprint: { droplet } }`)
2. `vpc_uuid` from the field, or `vpcIds.get(vpc)` if `vpc` was a name
3. `region` from the droplet or `config.region` or `""`
4. `ssh_keys` from the droplet, or **all** `sshKeyIds` from this run if the droplet omitted the field
5. If a `stack` targets this droplet, generate cloud-init `user_data` (compose/env/bootstrap) and merge with any existing `user_data`
6. `createDroplet(blueprint)` → POST `/droplets`
7. if `created.id` is defined, `dropletIds.set(created.name, created.id)`

Unresolved `vpc: some-name` becomes `vpc_uuid: undefined` and the droplet lands on DigitalOcean’s default network behavior for a missing VPC — it does **not** search the account for a VPC with that name.

### Firewalls

`droplet_ids` is the union of numeric `droplet_ids` and names in `droplets` that exist in `dropletIds`. Unknown names are dropped (`.filter` of undefined). Apply will still POST the firewall, possibly attached to fewer droplets than you expected.

Rules: `inbound_rules ?? inbound`, `outbound_rules ?? outbound`, then `normalizeRules`:

- `ports` stringified
- string source lists split into `addresses` / `tags` (`tag:` prefix) / `droplet_ids` (`droplet:` prefix + `Number(...)`)

Then `createFireWall` (capital W — that is the export).

### Domains

`createDomain({ name, ip_address })`, then each `records[]` via `createDomainRecord`. Result records the domain name and a record count, not record ids.

### Load balancers

`createLoadBalancer({ …lb, region: lb.region ?? config.region })`. No name→id map for later steps. Firewalls have already run, so they cannot auto-attach this LB’s uid in the same apply.

### Alert policies

`createAlertPolicy` with `alerts` defaulting to `{ email: [] }` if omitted.

### Apps

`createApp({ spec })`. Grapevine does not wait for a deployment to go active.

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
  stacks: AppliedStack[];
  private_key_paths: string[];
  warnings: string[];
}
```

The CLI prints this as JSON after `Applied grape config`. Keep it if you will call delete helpers later — Grapevine will not.

## What apply does not do

| Expectation | Reality |
|---|---|
| Dry-run / plan | No flag, no code path |
| Idempotent apply | Second run creates again |
| Update an existing droplet | No PUT in this function |
| Delete anything | Use `deleteDroplet` / `NukeDroplet` / … |
| Rollback | Partial failure leaves earlier creates |
| Import existing names | Maps are same-apply only |
| Compare to live | That is not `grape status` either |
| Run SSH commands | `user_data` on create only |
| Provision volumes / DOKS / Spaces | Not in these loops |
| Apply loose `services` / `monitoring` / ssl / cdn | Schema or warning only (`stack` is applied) |

`createDroplet` itself may send a `volumes` id list if you set it. Apply does not create those volumes first.

## Error handling

API failures become `DigitalOceanError` (status, DigitalOcean `id`, `request_id`). The CLI writes the message to stderr and exits 1.

There is no `try` per resource that continues the loop. The first thrown error stops the function. `ApplyResult` is not returned.

SSH misconfiguration throws a plain `Error` before `uploadSSHKey`.

## Apply vs function calls

Use `applyGrapeConfig` when the document is the source of truth for **this create**.

Use `createDroplet` / `createFireWall` / … when you already have ids, when you need GET/PUT/DELETE, or when you are writing a one-off script. Those helpers are a larger surface than apply — list/get/update/delete exist for most resources — but they do not honor grape YAML.

`deployByBlueprint(path)` is droplet-only: parse a `{ blueprint: { droplet } }` file, `cleanPayload`, POST `/droplets`. It does not run the nine-step loop.

## Tests that lock this down

`libraries/grapevine/src/config/apply.test.ts` mocks every create helper and checks:

- `normalizeResources` for `networking` / `firewall`
- order tags → VPC → droplet (`vpc_uuid`, `ssh_keys`) → firewall (name → id, rule normalization) → domain
- classic blueprint hoist before apply

There is no live integration test. Docs examples were checked against this source, not billed on DigitalOcean from this package.

## Related

- [Configuration](./grapevine-config.md)
- [Tutorial](./grapevine-tutorial.md)
- [Live status](./grapevine-live-status.md)
- [Anti-Patterns](./grapevine-anti-patterns.md)
