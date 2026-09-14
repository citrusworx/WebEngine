# Grapevine Live Status

What `grape status` reports, and why that is not drift detection.

Source: `libraries/grapevine/src/bin/cli.ts`. There is no reconciler, no state file, and no “config vs cloud” diff.

## Commands

```bash
grape status
grape status -c ./grape.config.yaml
grape status -c https://example.com/grape.config.yaml
```

`-c` is optional for status. It is required for `apply` and `validate`.

Exit code is 0 on the happy path, including “token missing” and “live status unavailable.” Schema/load errors still exit 1.

## Without `-c`: token + account counts

1. Check `process.env.DO_TOKEN` (hardcoded name). Print `DO_TOKEN is set` or `DO_TOKEN is not set`.
2. If the token can be read, in parallel:
   - `listAllDroplets()` → `GET /droplets`
   - `listAllVPCs()` → `GET /vpcs`
   - `listAllFirewalls()` → `GET /firewalls`
   - `listAllDomains()` → `GET /domains`
3. Print JSON `{ droplets, vpcs, firewalls, domains }` as **array lengths**.

Those numbers are **the whole account**, not a stack, not a tag filter, not “resources Grapevine created.”

Not counted: load balancers, apps, tags, SSH keys, alert policies, images.

If the API throws `DigitalOceanError`, print `Live status unavailable: …` and still exit 0.

`getDropletStatus(id)` exists as a TypeScript helper and is **not** used here.

## With `-c`: file summary, no live API

After the same `DO_TOKEN is set/not set` line:

1. `loadGrapeConfig` (so the file must be a valid grape config)
2. Print `Config: provider=digitalocean region=nyc1` (or `(none)`)
3. Print the same JSON counts `validate` prints, from `normalizeResources`

DigitalOcean is not queried for this summary. A file that declares one VPC always shows `"vpcs": 1`, even if apply never ran, and even if the account has twelve VPCs.

Folded shortcuts count. `networking.vpc: true` increments `vpcs`.

## What this is good for

- Confirming the shell has `DO_TOKEN` before apply
- A coarse “does this account already have droplets?” glance
- Double-checking that a document **parses** as the resource mix you think it does (`status -c` ≡ validate counts plus a token line)

## What this is not

| Claim | Reality |
|---|---|
| Drift detection | No comparison of YAML to live objects |
| Desired-state refresh | Apply will not update in-place to match the file |
| “Did my last apply succeed?” | No state; use apply JSON or the DigitalOcean UI |
| Per-droplet health | Use `getDropletStatus(id)` in TypeScript, or the UI |
| Tag-filtered inventory | Lists are account-wide |
| Custom `credentials.env` | Status still looks at `DO_TOKEN` |
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
