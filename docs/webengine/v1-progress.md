# WebEngine -> v1 progress

Living %-based scorecard toward a honest WebEngine v1. Recompute from [library-release-gates.md](./library-release-gates.md), package manifests, status docs, and npm. Prefer conservative scores when gate checkboxes are still open or docs/version drift exists. Do not invent green checkboxes.

**As-of:** 2026-10-04 (manual refresh PT; master `b937099d`)

## Weights (stable)

| Component | Weight |
|---|---|
| Juice | 14 |
| Sig | 14 |
| Seltzer | 14 |
| Nectarine | 16 |
| Grapevine | 10 |
| Shared (`@citrusworx/types`) | 8 |
| Kernel (`@citrusworx/webengine`) | 24 |
| **Total** | **100** |

## Scoreboard

| Component | Score | Evidence (this pass) |
|---|---|---|
| Juice | ~95% | npm `@citrusworx/juiceui@0.9.1` published 2026-10-04 09:59 PT. Tarball exports all ten retro themes (`retro-afterburn` through `retro-violet-parlor`) plus aquaflux / kiwipress / citrusmint / tide. No `_draft` files in the tarball. Pagination is in `dist/index.js` (and `pagination-runtime.d.ts`). That closes the 2026-09-30 "unpublished vs 0.9.0" gap. **Not on master:** `HEAD` `package.json` is still `0.9.0`; the worktree is dirty at `0.9.1` plus rebuilt `dist/themes`. [juice-beta.md](../juice/juice-beta.md) still calls 0.9.0 the public cut and still says retro + pagination are unpublished. Gates still **0/7** open. |
| Sig | 100% | Gates **7/7**. npm `@citrusworx/sigjs@0.3.0` matches workspace + [sig-status.md](../sigjs/sig-status.md). |
| Seltzer | ~74% | npm + workspace `@citrusworx/seltzer@0.8.1`. Status matrix Stable-ish core; `generateRoutes` Emerging. Gates still **0/8** open. |
| Nectarine | ~78% | npm `@citrusworx/nectarine@0.5.0` published 2026-10-04 09:50 PT. Published `dist/compiler/sql.js` includes INSERT `onConflict` (`DO NOTHING` / `DO UPDATE`). **Hostable alpha** still fits. Gates **7/8**; only master CI `yarn verify:nectarine` still open per gates doc. **CI re-check this pass:** local `gh` not installed; Cursor GitHub App cannot see `citrusworx/CitrusWorx` — leave the box open. **Drift:** `HEAD` manifest is still `0.4.0`; worktree is dirty at `0.5.0` with untracked `.changeset/wide-flies-happen.md` ("ON CONFLICT merge"). [nectarine-status.md](../nectarine/nectarine-status.md) and the gates prose still say published **0.4.0** and onConflict git-only. Held at ~78% because the CI gate is still open and the docs now lag npm. |
| Grapevine | ~82% | npm + workspace `@citrusworx/grapevine@0.2.2`. No commits since `b937099d`. CLI still validate / plan / apply / destroy / status / init. [grapevine-roadmap.md](../grapevine/grapevine-roadmap.md) still stale (claims validate/apply/status only). Gates **0/7** open. A fuller DigitalOcean push (catalog, offerings, projects, volumes, reserved IPs, Kubernetes, account summary) is **not** in this tree — only `kubernetes_ids` on the firewall schema. |
| Shared | ~45% | `@citrusworx/types@0.2.0` npm = workspace. Contracts exist; not a full shared-bar audit. Shared bar in gates still **0/6**. |
| Kernel | ~52% | `@citrusworx/webengine@0.2.1` (npm matches). Real `init()` + kernel modules under `engines/webengine/src/`. PaaS lifecycle methods still silent `Promise.resolve()` (`buildEnvironment`, `buildApplication`, `secureEnvironment`, `deployApplication`, `monitorApplication`, `scaleApplication`, `killApplication`, `cleanupEnvironment`). [docs/webengine/README.md](./README.md) still claims stubs / no kernel in `src/` — **docs drift**. |
| **Overall** | **~74%** | Weighted ~74.4 vs ~74.1 on 2026-09-30. Rounded overall unchanged. Juice is the only component that moved. |

### Weighted check

`14x0.95 + 14x1.00 + 14x0.74 + 16x0.78 + 10x0.82 + 8x0.45 + 24x0.52 = 74.42`

## What moved since 2026-09-30

- **Tip:** still `b937099d` (2026-09-22 09:57 PT, merge #214). `git log b937099d..HEAD` is empty. `master...origin/master` has no unpushed commits. Working tree is dirty (not scored as landed): Juice version `0.9.1` + theme dist, Nectarine version `0.5.0` + dist, `yarn.lock`, `.vscode/settings.json`, untracked `.changeset/wide-flies-happen.md`, `libraries/juice/plans/`, `packages/pulse/README.MD`.
- **npm this morning (PT):** `@citrusworx/juiceui@0.9.1` (09:59) and `@citrusworx/nectarine@0.5.0` (09:50). Others unchanged: sigjs 0.3.0, seltzer 0.8.1, grapevine 0.2.2, types 0.2.0, webengine 0.2.1.
- **Gates:** checkbox counts unchanged — Shared 0/6, Juice 0/7, Sig 7/7, Seltzer 0/8, Nectarine 7/8, Grapevine 0/7. Gate prose for Nectarine is now stale (still describes npm 0.4.0).
- Sig / Seltzer / Grapevine / Shared / Kernel scores: held.

## Biggest blocker left to v1

**Seltzer release-gate close-out (still 0/8)** — freeze the Seltzer ↔ Nectarine join before treating kernel scaffolding as product-ready. Same-day publishes did not close a gate. Next: commit the 0.9.1 / 0.5.0 manifests and fix status docs so they match npm, land a green **master** Nectarine Package CI run (still unverified — no `gh` / no GitHub App repo grant), then start checking Juice gate boxes against `yarn workspace @citrusworx/juiceui verify` without inventing greens.

## Method notes

- Gate checkboxes are evidence, not aspiration. Open boxes cap the score even when the code looks strong.
- npm vs workspace vs status-doc disagreement is an honesty penalty until fixed in-repo. A publish that is not committed on `master` counts as drift, not as a landed tip.
- Kernel weight stays high because v1 is "honest glue," not library feature count alone.
- This file may be local/untracked; last copies were wiped by master resets — rebuild from gates + manifests when missing.
- 2026-10-04 pass: machine `Drew` connected; tip unchanged; npm `view` plus tarball inspect for juiceui 0.9.1 and nectarine 0.5.0; CI status for Nectarine on master **not re-verified** (tooling gap).

## Related

- [library-release-gates.md](./library-release-gates.md)
- [nectarine-kernel-contract.md](./nectarine-kernel-contract.md)
- [README.md](./README.md) (reality check — currently drifts vs `engines/webengine/src`)