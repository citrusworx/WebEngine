# @citrusworx/grapevine

## 0.3.0

### Minor Changes

- 91400e1: Make over the `grape` CLI: Commander parsing, plan/dry-run, destroy, richer status, init from shipped blueprints, and human-friendly output with `--json`.
- 12b851d: Harden the DigitalOcean adapter with a shared auth client, implement remaining API stubs, and add a standalone `grape` CLI for config-driven apply/validate.
- e2656d0: Publish a DigitalOcean provider catalog (`grape catalog --json`) plus offerings, telemetry, and live clients for projects, volumes, reserved IPs, Kubernetes clusters, registry, and account so a dashboard can show real coverage. No second cloud is implemented.
- 230236d: Add an applied `stack` section (compose/env/bootstrap → droplet cloud-init) and `resources.databases` for DigitalOcean managed databases, plus executable `kiwipress-compose` and `kiwipress-managed` blueprint packs.
- b0b5563: Persist generated SSH private keys on `grape apply` (`generate: true`) to `private_key_path` or `.grape/ssh/<name>`, report the path in the apply result, and never include key material in JSON output.
- changeset overdue

### Patch Changes

- 8b24819: Normalize DigitalOcean firewall ports on apply (`all`/`*` → `1-65535`, comma lists → one rule each, omit icmp ports) and ship KiwiPress / example blueprints with DO-valid port values.

## 0.2.1

### Patch Changes

- Replace monorepo-only internal dependency ranges with published semver ranges so consumers outside the workspace can install these packages correctly.

## 0.2.0

### Minor Changes

- Added READMEs to each

### Patch Changes

- Updated dependencies
  - @citrusworx/types@0.2.0

## 0.1.1

### Patch Changes

- e7a1584: Release preparation
- e7a1584: Standardize library package manifests for independent publishing, align build outputs with published entrypoints, and add Changesets-based release automation for the monorepo.
- Updated dependencies [e7a1584]
- Updated dependencies [e7a1584]
  - @citrusworx/types@0.1.1
