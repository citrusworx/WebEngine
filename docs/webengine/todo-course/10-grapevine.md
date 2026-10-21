# 10 — Deploy with Grapevine

[Previous](./09-production.md) · [Course](./README.md) · [Next](./11-capstone.md)

**Goal:** validate a real DigitalOcean config for a droplet, a managed Postgres, and a static site. Do not apply it unless the names are yours.

## What you'll build

You will run `grape validate`, `grape plan`, and `grape status` against `apps/todo/grape.config.yaml`. Apply is described and not run by this lesson.

## Steps

### 1. The file is a Grapevine config, not a sketch

Blackwater's `grapevine.config.yaml` uses a `services:` map (`type: static`, `type: app`). Current Grapevine stores that map as a legacy blob and does not apply it. The ToDo file uses `resources:`, the same shape as `libraries/grapevine/examples/blueprints/04-full-web-stack.yaml` and `05-static-site-spaces.yaml`.

The resource list:

```yaml
resources:
  tags:
    - todo
  ssh_keys:
    - name: todo
      generate: true
  vpcs:
    - name: todo
      description: ToDo API VPC
      ip_range: 10.130.0.0/16
  databases:
    - name: todo-pg
      engine: pg
      version: "16"
      size: db-s-1vcpu-1gb
      num_nodes: 1
      vpc: todo
      tags: [todo]
      wait: true
      private: true
      connection_env:
        host: PG_HOST
        port: PG_PORT
        user: PG_USER
        password: PG_PASS
        database: PG_DB
  droplets:
    - name: todo-api-01
      size: s-1vcpu-1gb
      image: ubuntu-24-04-x64
      vpc: todo
      monitoring: true
      tags: [todo]
```

| Block | What apply would create |
|---|---|
| `tags`, `ssh_keys`, `vpcs` | A tag, a generated SSH key, and a VPC. `generate: true` writes the private key under `.grape/ssh/` on the machine that applies. That directory is gitignored. Do not commit it |
| `databases` | Managed Postgres 16 named `todo-pg`. `connection_env` names the env keys the API already uses (`PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASS`, `PG_DB`) |
| `droplets` | `todo-api-01`, the machine that should run `yarn workspace @citrusworx/todo-back start` |
| `firewalls` | SSH from `REPLACE_WITH_YOUR_IP/32`, plus 80, 443, and 3001 from the internet. 3001 is the Seltzer port because nothing in this file puts a proxy in front of it |
| `spaces`, `certificates`, `cdn` | A public Space, a Let's Encrypt name for `todo.example.com`, and a CDN endpoint. This is the static site. Region `nyc3` is the Spaces region from blueprint 05. The droplet stays in `nyc1` |
| `domains` | Zone `example.com`, which must already be a zone you can delegate. The file does not create DNS records for the CDN |

Read the header comments in the yaml before you change a name. Placeholders:

- `REPLACE_WITH_YOUR_IP`
- `example.com`
- `todo.example.com`
- `todo-static-example`

`validate` accepts `REPLACE_WITH_YOUR_IP` because it is a string. Replace it before any apply, or SSH will allow a source that is not your address.

### 2. validate, plan, status

From the repository root. No token required for these three:

```bash
yarn workspace @citrusworx/todo-app validate:grape
yarn workspace @citrusworx/todo-app plan:grape
yarn workspace @citrusworx/todo-app status:grape
```

Those scripts run `grape validate`, `grape plan`, and `grape status` with `-c grape.config.yaml`, cwd `apps/todo`. The package `@citrusworx/todo-app` depends on `@citrusworx/grapevine` so the `grape` bin exists.

`validate` checks the schema. A valid file prints the provider, region, and resource counts.

`plan` is a dry run. It lists what apply would create. It does not call DigitalOcean.

`status` tells you whether `DO_TOKEN` is set. Without a token it prints the file summary and skips the live account. With a token it counts live resources. It does not diff the file against the account. Overlap is name presence, not drift.

### 3. What apply would do, and what it will not

`grape apply -c apps/todo/grape.config.yaml` calls the DigitalOcean API in dependency order: tags, SSH keys, VPCs, databases, droplets, firewalls, domains, Spaces, certificates, CDN. This lesson does not run it.

Apply would not:

- run `yarn workspace @citrusworx/todo-back build`
- copy `apps/todo/back` onto the droplet or install Node
- run `yarn workspace @citrusworx/todo build`
- upload `apps/todo/front/dist` into the Space

`connection_env` is collected while the database is created and written into a droplet only when a `stack` section targets that droplet. This file has no `stack`. After a real apply you would still copy `PG_*` onto the API host yourself, from the managed database's connection screen, and you would upload the Vite build to the Space yourself. Blueprint 05 says the same thing about Spaces: the config creates the bucket and the CDN. It does not upload `dist/`.

Spaces calls need `DO_SPACES_ACCESS_KEY_ID` and `DO_SPACES_SECRET_ACCESS_KEY` in addition to `DO_TOKEN`. `validate` and `plan` do not.

**Coming soon:** a stack or an upload step that installs this API and publishes `front/dist`. It is not in this config, because a compose file that pretends the build is already on the droplet would be a fiction.

## Checkpoint

From a clean shell with `DO_TOKEN` unset:

1. `yarn workspace @citrusworx/todo-app validate:grape` prints `Valid grape config` and 10 resources.
2. `plan:grape` says dry-run and lists `todo-api-01`, `todo-pg`, and the CDN host `todo.example.com`.
3. `status:grape` prints `DO_TOKEN is not set` and `Live account skipped`.

If validate fails, the message is the schema, not DigitalOcean. Fix the yaml. Do not apply to "see if it works."

[Answers](./answers.md#lesson-10).

## What's happening

Grapevine loads the yaml, parses it with the Zod schema in `libraries/grapevine/src/config/schema.ts`, and plans resources in provider order. `provider` must be `digitalocean`. Credentials default to env `DO_TOKEN`.

The firewall, droplet, and Space blocks are the same objects the KiwiPress and blueprint examples use. The ToDo file is those objects pointed at this app's ports and env names.

The API you deploy is still `server.ts`. Grapevine does not import Seltzer. You put the process on the machine after the machine exists.

## Gap

**Apply does not ship the app.** Documented above. The workaround is: build with lesson 09, copy the API and env onto the droplet, upload `dist/` to the Space, set `CORS_ORIGIN` to the CDN origin and `VITE_API_BASE` to the API origin, rebuild the front end if the API origin changed.

**`grape status` is not a reconcile.** Do not read a quiet status as "the droplet matches this file."

**No stack.** `connection_env` without `stack` does not inject `PG_*`. That is easy to miss because the keys are in the file. They are inputs to a step this config does not run.

## Next

[11 — Capstone](./11-capstone.md)
