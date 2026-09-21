# Grapevine Anti-Patterns

## Purpose

This document collects the most common ways to fight Grapevine instead of working with it.

These are useful because most “it created a second droplet,” “vpc wasn’t attached,” and “I thought AWS was supported” failures come from a few repeated mistakes — usually Terraform, dashboard, or multi-cloud habits brought into a DigitalOcean apply engine that adopts unique names and does not diff every field.

## 1. Editing live infra by hand, then expecting `grape apply` to catch up

Bad:

1. Apply `04-full-web-stack.yaml`
2. In the DigitalOcean UI, resize the droplet, open port 3000, rename the VPC
3. Change the YAML to match and `grape apply` again

Why it is bad:

- a second apply adopts the unique name and does not resize the droplet, change the VPC, or delete the extra port you opened
- firewall rules in the file replace the live rule list; droplet attachments are only added
- `grape status` will not show a diff; it will show account totals or file counts

Better:

- Treat the UI as read-only for grape-managed resources
- Need a resize or a rebuild? Do that in the DigitalOcean UI or with the function helpers. Apply will not
- `grape plan` (with a token) shows create vs adopt. It does not show a field diff

The file is an apply request, not Terraform state.

## 2. Re-applying the same file to “converge”

Bad:

```bash
grape apply -c ./01-vpc-and-tag.yaml
grape apply -c ./01-vpc-and-tag.yaml
```

What happens:

- a unique tag or VPC name is adopted. Apply does not POST another one
- two live resources with that name are skipped, with a warning. Apply does not pick one
- fields apply does not update (droplet size, user data, and the rest listed in the apply doc) stay as they are

Better:

```bash
grape validate -c ./01-vpc-and-tag.yaml
grape plan -c ./01-vpc-and-tag.yaml    # create vs adopt when DO_TOKEN is set
grape apply -c ./01-vpc-and-tag.yaml
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

or include the `vpcs:` entry in the same file. A unique live VPC of that name in the target region is adopted, and the droplet uses its id.

The same limit exists for `firewalls[].droplets: [web-01]` when that droplet is not declared or adopted in this file. A numeric `droplet_ids` entry still works.

## 4. Treating Grapevine like Terraform / Pulumi / CDK

Bad:

```text
grape plan -c ./grape.config.yaml
grape apply -c ./grape.config.yaml --auto-approve
grape destroy -c ./grape.config.yaml
```

Why it is bad:

- `--auto-approve` is not a flag. Destroy asks, or takes `--yes` when stdin is not a TTY
- there is no state backend. Apply adopts unique names; it does not store Terraform state
- plan with a token shows create vs adopt. It is not a field-level diff

Better:

```bash
grape validate -c ./grape.config.yaml
grape plan -c ./grape.config.yaml
grape apply -c ./grape.config.yaml
grape destroy -c ./grape.config.yaml --yes
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

## 14. Inventing volume / Kubernetes resources

Bad:

```yaml
resources:
  volumes:
    - name: data
  kubernetes:
    - name: prod
```

Why it is bad:

- `resourcesSchema` has no those keys (unknown keys are stripped by Zod object default behavior — they will not apply)
- droplet `volumes: ["vol-id"]` only forwards ids
- firewall `kubernetes_ids` is payload shape, not a cluster factory

Spaces, CDN endpoints, and certificates **are** grape resources (`resources.spaces`, `resources.cdn`, `resources.certificates`). See `examples/blueprints/05-static-site-spaces.yaml`. That blueprint still does not build or upload a Vite `dist/`.

Better: leave volumes and DOKS outside Grapevine. Check [DigitalOcean guide](./grapevine-digitalocean.md).

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
