# Grapevine Roadmap

## Current position

Grapevine is no longer just an idea for “YAML that might talk to a cloud.”

It is a DigitalOcean provisioning library with five visible layers:

- `grapeConfigSchema` in `config/schema.ts` (`provider` literal `"digitalocean"`)
- load from path or HTTP(S) in `config/load.ts`
- `applyGrapeConfig` create loops in `config/apply.ts`
- `grape` CLI (`validate` / `apply` / `status`) in `bin/cli.ts`
- HTTP helpers under `src/providers/digitalocean/`

The strongest part of Grapevine today is still the DigitalOcean-first model: one real adapter, a schema that refuses other clouds, and an apply order that makes `vpc:` / `droplets:` work **inside one process**. The next strongest areas are the function exports (list/get/delete) and the in-repo `01`–`04` blueprints.

The weakest areas are still:

- apply is create-only (no idempotency, no rollback, no plan)
- `grape status` is not drift
- several schema fields (`services`, `monitoring`, boolean `networking.ssl` / `networking.cdn`) look like product and do not provision. Spaces, CDN endpoints, and certificates are real resources; full re-apply and static upload are not
- tests beyond mocked HTTP

Active development is the honest label. The DigitalOcean create path is real enough to teach in depth; it is not Terraform and not frozen.

---

## What is already true

### 1. DigitalOcean is a finished idea, not a sketch

The schema’s `provider` field is a literal. Tests reject `aws`. There is one provider directory. That loop is small, tested, and the identity of the library.

What that means for the roadmap: Grapevine does not need a fake multi-cloud interface. It needs better *edges* (idempotency, receipts) around this one adapter. A second provider is a later folder under `providers/`, not a YAML string.

### 2. Validate and apply are different jobs

`grape validate` never calls DigitalOcean. `grape apply` always creates. That split is enough to CI-check documents and to keep billed calls explicit.

A future `--dry-run` that pretends to know DigitalOcean uniqueness would be a step sideways unless it actually GETs live names. Teaching `validate` as the rehearsal is cheaper and already true.

### 3. Same-apply name maps are the composition model

`vpc: name` and `droplets: [name]` are not inventory queries. They are maps filled by earlier creates in `applyGrapeConfig`. That limitation is currently a feature: the runtime stays readable.

The roadmap should not “fix” this by silently searching the account unless that lookup is explicit (`vpc_uuid`, `droplet_ids`, or a new, documented `resolve: existing` field). Silent import is how people get attached to the wrong VPC.

### 4. Functions are a larger surface than YAML

List/get/update/delete exist for droplets, VPCs, firewalls, domains, LBs, apps, keys, tags, and more. Apply only POSTs.

That is a real SDK kernel for operators who outgrow a one-shot stack. It is not a second config format.

### 5. The CLI is three verbs

`apply`, `validate`, `status`, `help`. Kiwi may delegate. grapeGUI does not exist. WebEngine does not drive this package.

The product story is a file plus a token. The roadmap should deepen that story (docs, blueprints, safer apply), not grow a control plane in this library.

---

## What is still holding Grapevine back

### 1. Create-only apply surprises people

Re-apply as converge is the first habit from Terraform. Duplicate creates and partial failures are the first production scars.

Until there is either skip-if-exists (opt-in, tested) or even stronger teaching (tutorial + anti-patterns — this docs pass), this will keep generating extra droplets.

### 2. Generated SSH keys need an operator habit

`generate: true` writes the private key to `.grape/ssh/<name>` (or `private_key_path`) and reports the path. Authors who SSH without `-i` still fail. The remaining work is teaching, not missing writes.

### 3. `grape status` looks like drift

Account counts and file counts are both useful. Naming the command `status` invites a Terraform reading. Custom `credentials.env` is ignored.

That is teachable. It is also easy to make less sharp: print that live mode is account-wide; honor `credentials.env` when `-c` is passed; never claim a diff until a diff exists.

### 4. Schema fields that do not apply

`services`, top-level `monitoring`, `networking.ssl` / `cdn` validate and then sit. They are honesty hazards in every README.

Either map them to real POSTs or reject them. A warning on `services` is already better than silent drop; it is not as good as Zod `.strict()` on the root.

### 5. Tests do not cover live DigitalOcean

`apply.test.ts` and provider tests mock HTTP. That is correct for CI. A 1.0 claim that “apply provisions a VPC” cannot rest on mocks alone — at least one optional integration job (or a recorded contract) belongs on the far side of this list.

Docs can be honest without those tests. A 1.0 claim cannot.

---

## Revised status

If Grapevine is viewed as an IaC platform, its current maturity looks roughly like this:

- DigitalOcean schema and client: strong
- validate CLI: strong
- apply as ordered creates: strong, with a sharp re-apply model
- function CRUD: useful and unevenly documented
- status CLI: useful and easy to over-read
- Docs as product surface: much stronger after the tutorial and topic pages
- State / drift: not started. `grape destroy` exists and is still conservative. Spaces/CDN/certs are emerging, not a finished Juice host
- Multi-cloud / GUI: not started, and not the current goal

In practical terms:

- Grapevine already feels like a real DigitalOcean provisioning layer for CitrusWorx
- Grapevine does not yet feel like a complete alternative to Terraform, and it should not try to until DigitalOcean create/delete is boring

That is a strong place to be.

---

## Priorities

### Priority 1. Keep the DigitalOcean-only model obvious

The next work that helps the most is not a new cloud. It is:

- examples that look like stacks, not invented OOP
- anti-patterns for dashboard and Terraform habits
- a guided tutorial that includes validate → apply → status on real blueprints

This docs set is that work. Keep it aligned with `libraries/grapevine/src` when the code moves.

### Priority 2. Make apply safer to re-run *or* louder when you must not

If the core is opened, pick one:

1. opt-in “skip existing tag/VPC by name” (narrow, tested)
2. refuse duplicates with a Grapevine error that says “this is create-only” before DigitalOcean does

Do not add a hidden state file in `~/.grapevine` unless it is versioned, documented, and optional. A surprise backend is worse than create-only.

### Priority 3. Persist or refuse generated SSH keys

Shipped: `generate: true` writes an OpenSSH private key to `private_key_path` or `.grape/ssh/<name>` (mode `0600`), reports the path, and never prints key material. Remaining: keep `.grape/` gitignored and teach `ssh -i`.

### Priority 4. Decide the story for status

Two honest options:

1. **Never** add drift. Rename docs (already) and maybe the help text: “token and counts.”
2. Add an explicit `grape diff -c` that GETs by name/id and prints a table — after apply is boring.

What would be a mistake: `grape status` that *looks* like `terraform plan` but still only prints `{ droplets: 3 }`.

### Priority 5. Trim or honor schema ghosts

Highest value schema work:

- fail `services` instead of warning, **or** document it as deprecated and remove it
- map `resources.alert_policies` only (already) and remove unused top-level `monitoring`
- boolean `networking.ssl` / `networking.cdn` now warn. Real resources are `resources.certificates` and `resources.cdn`. Still open: idempotent updates, CDN-edge wait, and uploading a Vite `dist/` (Juice follow-ups)

### Priority 6. Stay complementary to CitrusWorx

Grapevine should not grow a dashboard, a Juice theme, or a Nectarine compiler. If a pattern needs a UI, the answer is DigitalOcean’s UI or a future app — not grapeGUI in this package.

A second provider only when a real adapter exists.

---

## Recommended build order

1. Keep docs and examples locked to source (ongoing).
2. SSH generate persistence or removal from apply YAML.
3. Status help text / `credentials.env` consistency.
4. Schema ghosts: `services` fail-closed or gone.
5. Narrow skip-if-exists **or** a clearer duplicate error.
6. Only then: `grape diff`, destroy-from-YAML, or a second provider — not all at once.

---

## What would not move Grapevine upward

- Shipping `provider: aws` in docs or schema without `src/providers/aws`
- grapeGUI before apply is idempotent-or-explicit
- a WebEngine dashboard that pretends to drive Grapevine without calling `applyGrapeConfig`
- inventing `DigitalOcean.Droplet.create` in documentation
- Terraform state compatibility as a 0.3 headline
- WordPress sketches treated as applyable blueprints
- Multi-cloud tables that list “coming soon” clouds

Those would blur the split that justifies this library: **honest DigitalOcean creates from a file.**

---

## Summary

Grapevine is in a meaningfully stronger place than a provider stub.

It now has:

- a credible DigitalOcean schema and HTTP client
- an apply engine with a documented order
- a CLI that validates without spending money
- in-repo blueprints that match that engine
- a documented split with Terraform, GUIs, and other clouds

The next stage is not inventing Grapevine from scratch.

The next stage is refinement:

- make apply less surprising to re-run
- make generated keys usable
- make status unable to pose as drift
- keep DigitalOcean-only until another adapter is real

That is a strong place to be. Until those land, the docs stay with [Status](./grapevine-status.md) and the APIs in `libraries/grapevine/src`.
