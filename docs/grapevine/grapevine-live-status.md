# Grapevine Live Status

What `grape status` reports, and why that is not a full drift reconciler.

Source: `libraries/grapevine/src/cli/`. There is no state file. With `-c`, status prints a name-overlap table against live resources (present / missing / ambiguous). That is not a field-level diff.

## Commands

```bash
grape status
grape status -c ./grape.config.yaml
grape status -c https://example.com/grape.config.yaml
grape status --json
```

`-c` is optional for status. It is required for `apply`, `validate`, and `plan`.

Exit code is 0 on the happy path. Missing token with no config exits 1. Schema/load errors still exit 1.

## Without `-c`: live inventory

Status lists droplets (name, id, status, region, public/private IPs, tags), VPCs, firewalls (including droplet counts), and domains. `--json` includes the full structured inventory.

1. Check `process.env` for `DO_TOKEN` (or `credentials.env` when `-c` is passed). Print `{env} is set` or `{env} is not set`.
2. If the token can be read, fetch live inventory (`listAllDroplets`, `listAllVPCs`, `listAllFirewalls`, `listAllDomains`, plus LBs/SSH keys/apps/alerts/tags for overlap and `--json`).
3. Print human tables (or `--json` with the structured objects).

Those rows are **the whole account**, not a stack, not a tag filter, not “resources Grapevine created” — except the optional name-overlap section when `-c` is passed.

If the API throws, print `Live status unavailable: …` and still exit 0 when a config was also provided. With no config and no token, exit 1.

`getDropletStatus(id)` exists as a TypeScript helper and is **not** used here.

## With `-c`: config summary plus optional overlap

After the token line:

1. `loadGrapeConfig` (so the file must be a valid grape config)
2. Print the declared resource names (same graph `validate` / `plan` uses)
3. If live inventory loaded, print a name-overlap table: present / missing / ambiguous for droplets, VPCs, firewalls, domains, SSH keys, and tags

Overlap is name equality only. Changing a firewall rule in the DigitalOcean control panel will not show up here.

Folded shortcuts count. `networking.vpc: true` increments `vpcs`.

## What this is good for

- Confirming the shell has a token before apply
- A coarse “does this account already have droplets?” glance
- Seeing whether declared names exist live (`status -c`) without treating that as drift

## What this is not

| Claim | Reality |
|---|---|
| Drift detection | Name overlap only; no field-level YAML vs live diff |
| Desired-state refresh | Apply will not update in-place to match the file |
| “Did my last apply succeed?” | No state; use apply JSON or the DigitalOcean UI |
| Per-droplet health | Use `getDropletStatus(id)` in TypeScript, or the UI |
| Tag-filtered inventory | Live tables are account-wide (`destroy --tag` is the tag filter) |
| Custom `credentials.env` | Honored when `-c` is passed; without `-c`, status looks at `DO_TOKEN` |
| A substitute for `validate` | `validate` does not mention the token; prefer it in CI |

If you change a firewall rule in the DigitalOcean control panel, `grape status` will not notice. `grape apply` will not patch it. That is the core anti-pattern: [editing live infra by hand vs grape apply](./grapevine-anti-patterns.md).

## TypeScript equivalent

There is no `grapeStatus()` export from the package root. Reproduce live counts with the same four list helpers:

```ts
import {
  listAllDroplets,
  listAllVPCs,
  listAllFirewalls,
  listAllDomains,
} from "@citrusworx/grapevine";

const [droplets, vpcs, firewalls, domains] = await Promise.all([
  listAllDroplets(),
  listAllVPCs(),
  listAllFirewalls(),
  listAllDomains(),
]);

console.log({
  droplets: droplets.length,
  vpcs: vpcs.length,
  firewalls: firewalls.length,
  domains: domains.length,
});
```

File counts:

```ts
import { loadGrapeConfig, normalizeResources } from "@citrusworx/grapevine";

const config = await loadGrapeConfig("./grape.config.yaml");
const resources = normalizeResources(config);
console.log({
  tags: resources.tags?.length ?? 0,
  vpcs: resources.vpcs?.length ?? 0,
  droplets: resources.droplets?.length ?? 0,
});
```

## Related

- [Apply lifecycle](./grapevine-apply.md)
- [Troubleshooting](./grapevine-troubleshooting.md)
- [Status (maturity)](./grapevine-status.md)
