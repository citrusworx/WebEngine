# 10 — Deploy with Grapevine

[Previous](./09-production.md) · [Course](./README.md) · [Next](./11-capstone.md)

**Goal:** validate a DigitalOcean config for a droplet and an App Platform static site, using the CLI that `@citrusworx/grapevine` 0.2.2 actually ships. Do not apply it unless the names are yours.

## What you'll build

You will run validate, plan, and status against `grape.config.yaml`. Apply is described and not run by this lesson.

## Steps

### 1. The file matches the published schema

`@citrusworx/grapevine` 0.2.2 accepts these resource kinds: `tags`, `ssh_keys`, `vpcs`, `droplets`, `firewalls`, `domains`, `load_balancers`, `alert_policies`, and `apps`. The package ships blueprints `01` through `04` under `node_modules/@citrusworx/grapevine/examples/blueprints/`. Blueprint 04 is a tag, an SSH key, a VPC, a droplet, and a firewall. There is no Spaces blueprint in that tarball.

`resources.databases`, `spaces`, `certificates`, and a CDN endpoint are not in the schema. Zod strips unknown keys. `grape validate` still says valid and counts only the keys it kept. Putting a Space in this file would not create a Space. `networking.cdn` is a boolean the applier does not read. There is no `stack` section and no `connection_env`.

The static site is `resources.apps[].spec.static_sites`. Apply forwards that spec to App Platform. The inner keys are not checked by the Zod schema.

The whole file:

```yaml
# ToDo course — droplet for the Seltzer API, App Platform static site for
# the Vite build. Shape matches the resources in @citrusworx/grapevine 0.2.2
# (see examples/blueprints/04-full-web-stack.yaml in that package) plus an
# `apps` entry. That package's resource list is tags, ssh_keys, vpcs,
# droplets, firewalls, domains, load_balancers, alert_policies, and apps.
#
# Spaces, certificates, a CDN endpoint, and `resources.databases` are not
# in the schema. Unknown keys are dropped. `grape validate` still says
# valid. `networking.cdn` is a boolean the applier does not read.
# There is no `stack` section and no `connection_env`.
#
# grape validate / grape plan / grape status do not call DigitalOcean.
# grape apply does. Do not apply this file until the placeholders below are
# yours. Apply creates the droplet and sends `apps[].spec` to App Platform.
# It does not run npm, upload web/dist, install Node on the droplet, or
# copy PG_* onto that droplet.
#
# Replace before apply:
#   REPLACE_WITH_YOUR_IP      your public IPv4, SSH /32
#   REPLACE_WITH_GITHUB_REPO  owner/name App Platform can clone
#   REPLACE_WITH_API_ORIGIN   API origin baked into the static build
#
#   export DO_TOKEN=dop_v1_...
#   npm run validate:grape
#   npm run plan:grape
#   npm run status:grape

version: "0.1"
provider: digitalocean
credentials:
  source: env
  env: DO_TOKEN
region: nyc1

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
  droplets:
    - name: todo-api-01
      size: s-1vcpu-1gb
      image: ubuntu-24-04-x64
      vpc: todo
      monitoring: true
      tags: [todo]
  firewalls:
    - name: todo-api
      droplets: [todo-api-01]
      inbound:
        - protocol: tcp
          ports: "22"
          sources: ["REPLACE_WITH_YOUR_IP/32"]
        - protocol: tcp
          ports: "80"
          sources: ["0.0.0.0/0"]
        - protocol: tcp
          ports: "443"
          sources: ["0.0.0.0/0"]
        - protocol: tcp
          ports: "3001"
          sources: ["0.0.0.0/0"]
        - protocol: icmp
          sources: ["0.0.0.0/0"]
      outbound:
        - protocol: tcp
          ports: "all"
          destinations: ["0.0.0.0/0"]
        - protocol: udp
          ports: "all"
          destinations: ["0.0.0.0/0"]
        - protocol: icmp
          destinations: ["0.0.0.0/0"]
  apps:
    - spec:
        name: todo-web
        region: nyc
        static_sites:
          - name: web
            github:
              repo: REPLACE_WITH_GITHUB_REPO
              branch: master
              deploy_on_push: false
            build_command: npm run build:web
            output_dir: web/dist
            index_document: index.html
        envs:
          - key: VITE_API_BASE
            value: REPLACE_WITH_API_ORIGIN
            scope: BUILD_TIME
```

| Block | What apply would create |
|---|---|
| `tags`, `ssh_keys`, `vpcs` | A tag, a generated SSH key, and a VPC. `generate: true` writes the private key under `.grape/ssh/` on the machine that applies. That directory is gitignored. Do not commit it |
| `droplets` | `todo-api-01`, the machine that should run `npm run start:api` after you install Node and copy the API yourself |
| `firewalls` | SSH from `REPLACE_WITH_YOUR_IP/32`, plus 80, 443, and 3001 from the internet. 3001 is the Seltzer port because nothing in this file puts a proxy in front of it |
| `apps` | An App Platform app named `todo-web`. The static site builds with `npm run build:web`, publishes `web/dist`, and bakes `VITE_API_BASE` at build time |

Read the header comments in the yaml before you change a name. Placeholders:

- `REPLACE_WITH_YOUR_IP`
- `REPLACE_WITH_GITHUB_REPO`
- `REPLACE_WITH_API_ORIGIN`

`validate` accepts those strings because they are strings. Replace them before any apply, or SSH will allow a source that is not your address, and App Platform will try to clone a repository that does not exist.

### 2. Call the CLI file, not the npm symlink

`package.json` names the bin `grape`, and npm links `node_modules/.bin/grape` at `dist/bin/cli.js`. That file runs only when `import.meta.url` is the same path as `process.argv[1]`. The symlink fails the check, prints nothing, and exits 0. These scripts point `node` at the real file:

```json
    "validate:grape": "node ./node_modules/@citrusworx/grapevine/dist/bin/cli.js validate -c grape.config.yaml",
    "plan:grape": "node ./node_modules/@citrusworx/grapevine/dist/bin/cli.js plan -c grape.config.yaml",
    "status:grape": "node ./node_modules/@citrusworx/grapevine/dist/bin/cli.js status -c grape.config.yaml"
```

From the app folder. No token required for these three:

```bash
npm run validate:grape
npm run plan:grape
npm run status:grape
```

`validate` checks the schema. A valid file prints `Valid grape config` and counts 6 resources: the tag, the SSH key, the VPC, the droplet, the firewall, and the app.

`plan` is a dry run. The heading is `Plan  (dry-run, no DigitalOcean mutations)`. It lists those six. It does not call DigitalOcean. The private key path it prints is `<cwd>/.grape/ssh/todo`.

`status` tells you whether `DO_TOKEN` is set. Without a token it prints `DO_TOKEN is not set` and `Live account skipped (token not set).` With a token it counts live resources. It does not diff the file against the account. Overlap is name presence, not drift.

### 3. What apply would do, and what it will not

`node ./node_modules/@citrusworx/grapevine/dist/bin/cli.js apply -c grape.config.yaml` calls the DigitalOcean API in this order: tags, SSH keys, VPCs, droplets, firewalls, domains, load balancers, alert policies, apps. This file uses the first four of those that it lists, then the firewall, then the app. This lesson does not run apply.

Apply would not:

- run `npm run build:api` or `npm run build:web`
- copy `api/` onto the droplet or install Node
- upload `web/dist`
- create Postgres, a Space, a certificate, or a CDN endpoint
- copy `PG_*` onto the droplet

App Platform, if the GitHub repo and the token are real, clones that repo and runs `build_command` itself. That is App Platform, not an upload from this laptop. The droplet still needs the API process installed by you.

**Coming soon:** a database resource and an upload step that installs this API. They are not in 0.2.2. A config that names `resources.databases` and still validates is a silent drop, not a managed Postgres.

## Checkpoint

From the app folder, with `DO_TOKEN` unset:

1. `npm run validate:grape` prints `Valid grape config` and 6 resources.
2. `npm run plan:grape` says dry-run and lists `todo-api-01` and `todo-web`. It does not list a database, a Space, or a CDN host.
3. `npm run status:grape` prints `DO_TOKEN is not set` and `Live account skipped (token not set).`

If validate fails, the message is the schema, not DigitalOcean. Fix the yaml. Do not apply to "see if it works."

[Answers](./answers.md#lesson-10).

## What's happening

Grapevine loads the yaml and parses it with the Zod schema in the published package. Unknown keys disappear before the count. `provider` must be `digitalocean`. Credentials default to env `DO_TOKEN`.

The API you deploy is still `server.ts`. Grapevine does not import Seltzer. You put the process on the machine after the machine exists.

## Gap

**Apply does not ship the app.** The workaround is: build with lesson 09, copy the API and env onto the droplet, let App Platform build the static site from the GitHub repo (or host `web/dist` yourself), set `CORS_ORIGIN` to the static origin and `VITE_API_BASE` to the API origin, and rebuild the front end if the API origin changed.

**`grape status` is not a reconcile.** Do not read a quiet status as "the droplet matches this file."

**Stripped keys still validate.** A Space, a database, or a CDN block you paste from an older example is removed before planning. Count the resources in the plan. Six is the number for this file.

**The npm `grape` symlink is silent.** Use the scripts. A quiet exit 0 from `npx grape` is the gap, not a valid config.

## Next

[11 — Capstone](./11-capstone.md)
