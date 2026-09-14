# Grapevine Best Practices

This guide focuses on how to compose Grapevine well in real repo code. The goal is not to list every export, but to show the habits that keep DigitalOcean creates small, honest, and easy to tear down.

## Core principle

Use grape YAML (or `validateGrapeConfig` objects) to express:

- the DigitalOcean resources you intend to **create together**
- names that must resolve in that one apply (`vpc:`, `droplets:`)
- firewall CIDRs and droplet size/image as reviewed text

Use the environment for:

- `DO_TOKEN` (or `credentials.env`)
- public keys you already control
- operator SSH source IPs if you do not want them in git

Use function exports for:

- list / get / update / delete
- one-off droplets
- anything apply does not loop (`createPeering`, images, Insight scans)

Use DigitalOcean’s control panel only as a viewer — or accept that you have left the grape document behind.

Grapevine is strongest when it is a thin create layer on top of a file you could already read without TypeScript.

## Validate before apply

`grape validate -c` is the rehearsal. It does not spend money and does not need a token.

Good:

```bash
grape validate -c ./04-full-web-stack.yaml
grape apply -c ./04-full-web-stack.yaml
```

Less ideal: applying from a URL you have never validated locally, or applying `03-web-firewall.yaml` while `REPLACE_DROPLET_ID` is still a string.

CI should run **validate**. CI should not run **apply** against a shared production token unless that is an explicit, billed job.

## One document per intended create

Same-apply maps are the feature. Split files only when the second file uses numeric ids or does not need names from the first.

Good: `04-full-web-stack.yaml` — tag, key, VPC, droplet, firewall.

Less ideal: apply `01`, then `02`, then `04` and hope the VPC name merges. Each apply creates again.

If a VPC already exists, either pass `vpc_uuid` on the droplet and omit `vpcs:`, or delete the old VPC first.

## Put compute under `resources`, not `services`

Good:

```yaml
resources:
  droplets:
    - name: web-01
      size: s-1vcpu-1gb
      image: ubuntu-24-04-x64
```

or `resources.apps[].spec` for App Platform.

`services:` will validate and warn. It will not create a database, an app, or a droplet.

## Keep secrets in the environment

Good:

```yaml
credentials:
  source: env
  env: DO_TOKEN
```

```bash
export DO_TOKEN=dop_v1_...
```

The YAML names the variable. The shell holds the value.

If you rename the variable, remember `grape status` still looks at `DO_TOKEN`. Apply will copy the custom name onto `DO_TOKEN` for the HTTP client.

Never commit `dop_v1_…` or a private key. Prefer `public_key` you already have over `generate: true` until Grapevine persists private keys.

## Name things you will reference

Good:

```yaml
vpcs:
  - name: grapevine
droplets:
  - name: grapevine-web-01
    vpc: grapevine
firewalls:
  - name: grapevine-web
    droplets: [grapevine-web-01]
```

Less ideal: `networking.vpc: true` plus `vpc: grapevine` on the droplet. The shortcut VPC is named `digitalocean-vpc`.

Tags you want on the droplet belong on `droplets[].tags` as well as `resources.tags`. Creating a tag does not attach it to a droplet unless you also set the droplet’s `tags` or later call `tagResource` with an id.

## Lock SSH; know HTTP is public

Good inbound SSH: your `/32`. Good inbound HTTP: `0.0.0.0/0` only if that is the product.

Replace `REPLACE_WITH_YOUR_IP` before apply. Leaving the placeholder opens SSH to a nonsense source that is not you — fail closed, not “we’ll fix the firewall in the UI.”

## Treat apply JSON as the receipt

`ApplyResult` is the only structured record Grapevine gives you. Save droplet ids, VPC ids, firewall ids if you will call `NukeDroplet` / `deleteVPC` / `deleteFirewall`.

`grape status` will not remind you which resources were yours.

## Delete what you create

Apply will not. Droplets bill. When the experiment is over:

```ts
await NukeDroplet(id);
```

or the DigitalOcean UI.

Do not “clean up” by editing YAML and re-applying. That creates more resources or errors on duplicates.

## Prefer explicit functions when YAML name maps cannot help

Existing droplet id, existing VPC uuid, a peering, a scan, a custom image — call the helper. Do not invent a grape field.

## Let DigitalOcean fail loudly

Grapevine does not retry, does not quota-manage, and does not remap error codes. Read `DigitalOceanError.message` and `status`. Duplicate names, bad slugs, and insufficient token scope are API problems; changing `provider` will not fix them.

## Stay complementary to the rest of CitrusWorx

Grapevine should not grow a Juice theme, a Sig component, or a Nectarine schema. If the app needs a database, that is Nectarine (or a DigitalOcean product you wire yourself). If the app needs a page, that is Juice + Sig on a process you still have to run (Seltzer, or whatever you install via `user_data`).

## Mental model

```text
file  →  validate  →  apply once  →  save ids  →  delete with functions
                ↘ status -c (counts)
token →  status (account counts)
```

If you find yourself using the control panel to *change* what the file described, the file is no longer the source of truth. Either import ids into a new create document, or stop pretending apply will catch up.

## Related

- [Patterns](./grapevine-patterns.md)
- [Anti-Patterns](./grapevine-anti-patterns.md)
- [Apply lifecycle](./grapevine-apply.md)
