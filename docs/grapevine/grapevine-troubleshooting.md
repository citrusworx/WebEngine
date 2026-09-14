# Grapevine Troubleshooting

Symptom → cause → fix, for the failures the current CLI and apply engine actually produce.

Related: [Anti-Patterns](./grapevine-anti-patterns.md), [Live status](./grapevine-live-status.md), [Secrets](./grapevine-secrets.md).

## Token

### `DO_TOKEN is not set`

Cause: `getDoToken` found an empty or missing env var.

Fix:

```bash
export DO_TOKEN=dop_v1_...
```

`validate` does not need this. `apply` and live `status` do.

### `grape status` says the token is missing, but apply works

Cause: config uses `credentials.env: MY_DO_TOKEN`. Status always checks `DO_TOKEN`.

Fix: `export DO_TOKEN="$MY_DO_TOKEN"` or also export `DO_TOKEN`.

### `Live status unavailable: …`

Cause: token present but DigitalOcean rejected the list calls (401, 429, network). Status still exits 0.

Fix: curl `https://api.digitalocean.com/v2/account` with the same bearer token. Check scope and expiry.

### `DigitalOceanError` on apply with status 401 / 403

Cause: token missing write scope, or wrong account.

Fix: generate a **read/write** personal access token. Grapevine does not do OAuth.

## Validate / schema

### `provider` error / invalid enum

Cause: `provider: aws` (or anything but `digitalocean`).

Fix: `provider: digitalocean`. There is no other adapter.

### `Expected number, received string` on `droplet_ids`

Cause: `03-web-firewall.yaml` still has `REPLACE_DROPLET_ID`.

Fix: substitute a numeric id **before** validate.

### File empty / did not contain YAML or JSON

Cause: blank `-c` target, or a URL that returned nothing.

Fix: check the path; `readConfigSource` uses `path.resolve` for local files and axios for `http(s)://`.

### Unknown option / unknown argument

Cause: `grape apply --dry-run`, `grape destroy`, extra flags.

Fix: only `-c` / `--config` and `apply|validate|status|help`. Validate is the dry-run you have.

### Missing `-c`

Cause: `grape apply` or `grape validate` without a config.

Fix: `grape apply -c ./grape.config.yaml`. There is no default filename.

## Apply

### SSH key `"name"` is missing `public_key`

Cause: no `public_key` / `publicKey` and no `generate: true`. Zod allowed it.

Fix: add one of those fields. Validate will not catch this.

### Cannot SSH after `generate: true`

Cause: private key was never written.

Fix: use `public_key` you control, or generate in TypeScript and save `keys.privateKey`.

### Droplet not on the VPC I named

Cause: `vpc: grapevine` but that VPC was not created in **this** apply (or the name map used DigitalOcean’s returned name).

Fix: put the `vpcs:` entry in the same file, or set `vpc_uuid`. Do not expect account-wide name lookup.

### Firewall not attached to the droplet

Cause: `droplets: [web-01]` but `web-01` was created in a previous apply; unknown names are dropped.

Fix: `droplet_ids: [123]` (`03` shape) or one-shot `04` shape.

### Duplicate name / already exists from DigitalOcean

Cause: second `grape apply` of the same document.

Fix: do not re-apply. Delete leftovers, or change names. Grapevine will not skip.

### Apply died after the droplet was created

Cause: later POST failed (firewall, domain, …). No rollback.

Fix: `NukeDroplet` / UI for the leftover, fix the YAML, apply a document that will not recreate the droplet (use ids) — or accept a new droplet.

### `services` warning in ApplyResult

Cause: top-level `services:` is non-empty.

Fix: move compute to `resources.droplets` or `resources.apps`. The warning is expected otherwise.

### Wrong size / image / region slug

Cause: Grapevine does not enum DigitalOcean catalogs.

Fix: use current slugs from DigitalOcean. Failure is an API error, not Zod.

## Status confusion

### `status -c` shows one VPC, the account has twelve

Cause: `-c` counts the file after normalize, not live resources.

Fix: `grape status` without `-c` for account totals. Neither is drift. See [Live status](./grapevine-live-status.md).

### Counts include a VPC I did not put under `resources.vpcs`

Cause: `networking.vpc: true` folded in.

Fix: expected. `validate` uses the same fold.

## WordPress / GUI / class API

### WordPress blueprint will not validate

Cause: `src/blueprints/wordpress/**` is not a grape config.

Fix: `examples/blueprints/`.

### `grape gui` / `DigitalOcean.Droplet.create`

Cause: invented APIs.

Fix: `grape help`; `createDroplet()`.

## Tests

If you think the library itself is wrong:

```bash
yarn workspace @citrusworx/grapevine test
```

Apply tests mock HTTP. They will not reproduce live 422s from DigitalOcean.
