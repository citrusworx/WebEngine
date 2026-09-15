# Grapevine Anti-Patterns

## Purpose

This document collects the most common ways to fight Grapevine instead of working with it.

These are useful because most “it created a second droplet,” “vpc wasn’t attached,” and “I thought AWS was supported” failures come from a few repeated mistakes — usually Terraform, dashboard, or multi-cloud habits brought into a DigitalOcean **create-only** apply engine.

## 1. Editing live infra by hand, then expecting `grape apply` to catch up

Bad:

1. Apply `04-full-web-stack.yaml`
2. In the DigitalOcean UI, resize the droplet, open port 3000, rename the VPC
3. Change the YAML to match and `grape apply` again

Why it is bad:

- apply does not read live state
- apply does not update or delete
- the second apply tries to **create** another tag, key, VPC, droplet, and firewall
- `grape status` will not show a diff; it will show account totals or file counts

Better:

- Treat the UI as read-only for grape-managed resources
- Need a change? Delete with `NukeDroplet` / `deleteFirewall` / `deleteVPC` (or the UI), then apply a new document
- Need to attach a firewall to an existing box? Use `03` with `droplet_ids`, or `addRulesToFirewall` in TypeScript

The file is a create request, not Terraform state.

## 2. Re-applying the same file to “converge”

Bad:

```bash
grape apply -c ./01-vpc-and-tag.yaml
grape apply -c ./01-vpc-and-tag.yaml
```

Why it is bad:

- there is no idempotency
- DigitalOcean may reject duplicate tag/VPC names
- you may get a second resource with a disambiguated name, or a hard error after a partial create

Better:

```bash
grape validate -c ./01-vpc-and-tag.yaml
grape apply -c ./01-vpc-and-tag.yaml   # once
grape status                           # account glance, not a reconcile
```

## 3. Assuming `vpc: grapevine` finds last week’s VPC

Bad:

```yaml
# applied yesterday
resources:
  vpcs:
    - name: grapevine
---
# applied today, droplets only
resources:
  droplets:
    - name: web-02
      vpc: grapevine
```

Why it is bad:

- `vpcIds` is filled only from VPCs created in **this** process
- unresolved names become omitted `vpc_uuid`

Better:

```yaml
droplets:
  - name: web-02
    vpc_uuid: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
```

or include the `vpcs:` entry in the same file you apply (and do not already have that VPC).

The same bug exists for `firewalls[].droplets: [web-01]`.

## 4. Treating Grapevine like Terraform / Pulumi / CDK

Bad:

```text
grape plan -c ./grape.config.yaml
grape apply -c ./grape.config.yaml --auto-approve
grape destroy -c ./grape.config.yaml
```

Why it is bad:

- those flags and commands do not exist
- there is no state backend
- deletes are `deleteDroplet` / `NukeDroplet` / UI

Better:

```bash
grape validate -c ./grape.config.yaml
grape apply -c ./grape.config.yaml
```

```ts
await NukeDroplet(id);
```

## 5. Setting `provider: aws` (or gcp, azure, linode)

Bad:

```yaml
provider: aws
region: us-east-1
```

Why it is bad:

- `provider` is `z.literal("digitalocean")`
- there is no `src/providers/aws`
- validate fails; nothing is “not implemented yet” at runtime — the document is invalid

Better:

```yaml
provider: digitalocean
region: nyc1
```

If you need another cloud, you are outside this package. See [Roadmap](./grapevine-roadmap.md).

## 6. Expecting `DigitalOcean.Droplet.create`

Bad:

```ts
import { DigitalOcean } from "@citrusworx/grapevine";
DigitalOcean.Droplet.create("server");
new GrapevineClient().listServices();
```

Why it is bad:

- `DigitalOcean.ts` is `export *` from modules
- there is no namespace class and no `GrapevineClient`

Better:

```ts
import { createDroplet } from "@citrusworx/grapevine";

await createDroplet({
  name: "server",
  region: "nyc1",
  size: "s-1vcpu-1gb",
  image: "ubuntu-24-04-x64",
});
```

## 7. Putting compute under `services:`

Bad:

```yaml
services:
  frontend:
    type: app
    entry: apps/front
  database:
    type: postgres
    version: "15"
```

Why it is bad:

- Zod allows `Record<string, unknown>`
- apply pushes a warning and creates nothing
- there is no managed-database apply resource

Better: `resources.droplets` or `resources.apps[].spec`. App Platform `spec.databases` is opaque passthrough, not Nectarine and not a first-class grape type.

## 8. Committing a generated SSH private key

Bad: checking in `.grape/ssh/…` or pasting PEM into chat / apply logs.

`generate: true` writes an OpenSSH private key (mode `0600`) to `private_key_path` or `.grape/ssh/<name>`. Apply JSON reports the **path**, not the key. That file is as secret as `~/.ssh/id_rsa`.

Better: keep `.grape/` gitignored, use `ssh -i <path>`, or upload `public_key` from a keypair you already keep outside the repo.

## 9. Leaving placeholders in `03` / `04`

Bad:

```yaml
droplet_ids: [REPLACE_DROPLET_ID]
sources: ["REPLACE_WITH_YOUR_IP/32"]
```

Why it is bad:

- `REPLACE_DROPLET_ID` fails **validate** (`number[]`)
- `REPLACE_WITH_YOUR_IP` can **validate** on `04` and then lock SSH to a bogus address

Better: substitute a real numeric id before validate on `03`; substitute your IPv4 before apply on both.

## 10. Trusting `grape status` as drift

Bad:

```bash
grape apply -c ./grape.config.yaml
# teammate opens port 22 to the world in the UI
grape status -c ./grape.config.yaml
# “vpcs: 1, droplets: 1” — ship it
```

Why it is bad:

- `-c` never fetches live resources
- bare `status` counts the account, not the file, and not firewall rule bodies

Better: [Live status](./grapevine-live-status.md). Inspect rules with `getFirewall` / the UI. Do not use status as a compliance check.

## 11. Expecting grapeGUI or a WebEngine dashboard

Bad:

```bash
yarn grapevine gui
grape gui
```

Why it is bad:

- no such command in `bin/cli.ts`
- WebEngine does not invoke `applyGrapeConfig` from Grapevine’s source
- Juice/Sig have no Grapevine screen

Better: YAML + `grape` + DigitalOcean’s own UI.

## 12. Applying WordPress YAML under `src/blueprints/`

Bad:

```bash
grape apply -c libraries/grapevine/src/blueprints/wordpress/traditional/blueprint.yaml
```

Why it is bad:

- no `provider: digitalocean`
- `runtime` / `storage.provider: citrode-object` is not `grapeConfigSchema`
- the CLI does not reference that folder

Better: `examples/blueprints/01-vpc-and-tag.yaml`.

## 13. Dry-run folklore

Bad:

```bash
grape apply -c ./grape.config.yaml --dry-run
grape plan -c ./grape.config.yaml
```

Why it is bad:

- unknown options throw (`Unknown option: --dry-run`)
- validate is the closest thing: schema only, no HTTP

Better: `grape validate -c …`. Read the YAML. Assume creates will happen on apply.

## 14. Inventing volume / k8s / Spaces resources

Bad:

```yaml
resources:
  volumes:
    - name: data
  kubernetes:
    - name: prod
  spaces:
    - name: assets
```

Why it is bad:

- `resourcesSchema` has no those keys (unknown keys are stripped by Zod object default behavior — they will not apply)
- droplet `volumes: ["vol-id"]` only forwards ids
- firewall `kubernetes_ids` is payload shape, not a cluster factory

Better: create those products outside Grapevine, or call whatever helper actually exists (none, today, for Spaces/DOKS/volumes). Check [DigitalOcean guide](./grapevine-digitalocean.md).

## 15. Relying on rollback

Bad: “If the firewall POST fails, the droplet will be deleted.”

Why it is bad: the loops are sequential `await`s with no catch-and-compensate.

Better: apply in small files when you are unsure (`01` then a droplet file with `vpc_uuid`), and be ready to `NukeDroplet` leftovers.

## Summary

Grapevine will not become Terraform because you use Terraform verbs in docs or in muscle memory.

Work with it:

- validate, apply **once**, save ids, delete with functions
- resolve names only inside one process
- keep `provider: digitalocean`
- keep secrets in env
- do not confuse account counts with drift

Work against it, and you get duplicate droplets, unattached VPCs, ignored `services:`, and commands that do not exist.
