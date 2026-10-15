# WebEngine -> v1 progress

Living %-based scorecard toward a honest WebEngine v1. Recompute from [library-release-gates.md](./library-release-gates.md), package manifests, status docs, and npm. Prefer conservative scores when gate checkboxes are still open or docs/version drift exists. Do not invent green checkboxes.

**As-of:** 2026-10-15 (routine refresh ~09:20 PT; scored from `origin/master` `e1a19908` (PR #248) via `git fetch` + `git show` / `git diff`; local `master` is 10 behind at `03cf749c` and was not pulled. Overall unchanged; new Juice npm-ahead-of-repo drift recorded)

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
| Juice | ~95% | npm `@citrusworx/juiceui@0.9.2` (published 2026-10-14 10:26 PT, `gitHead` `03cf749c`), but the `origin/master` manifest still says **0.9.1**, [juice-beta.md](../juice/juice-beta.md) still names 0.9.1 as the public cut and calls disclosure / spinner / select / input / textarea / field and motion core unpublished, and their changesets are still pending -- **new npm-ahead-of-repo drift** (Shared bar: no surprise versions on publish). Tarball check: 0.9.2 does contain the input, textarea, and field runtimes and shared motion, so the 10-06 git-only runtime gap is closed on npm. Master is ahead again: `@citrusworx/juiceui/sig` adapter subpath (PR #248) and `juice:change` events from runtime hosts plus a field `getState` fix (PR #247), both unpublished. Gates still **0/7**. Held at ~95%: one gap closed, one honesty drift opened. |
| Sig | 100% | Gates **7/7**. npm `@citrusworx/sigjs@0.3.0`. No `libraries/sig` changes in `fb9f989f..e1a19908` (only a new Juice-adapter section in `sig-juice-integration.md`). |
| Seltzer | ~74% | npm + workspace `@citrusworx/seltzer@0.8.1`. Gates still **0/8**. No Seltzer changes in `fb9f989f..e1a19908`. |
| Nectarine | ~84% | npm `@citrusworx/nectarine@0.5.0` = manifest. [nectarine-status.md](../nectarine/nectarine-status.md) and `libraries/nectarine/README.md` now say published **0.5.0**, INSERT `onConflict` in the tarball (PR #228). **Master CI:** GitHub Actions run 37223531237, **Nectarine Package**, push to `master` at `9656bd32` (2026-10-04 11:12 PT) concluded **success**; that workflow runs `yarn install --immutable` then `yarn verify:nectarine`. This is the first green master run (the 10:06 PT run on `77d73e1a` failed). Gates doc still shows **7/8** -- the CI box is unticked and gates prose (lines on Nectarine status) still says published **0.4.0**. +6, not to 100%, until the gate box and prose are updated in-repo. Since 10-06, master added UPDATE / DELETE `returning` and first-class `json` / `jsonb` binds (PR #245, changeset pending) plus a MiaMakes second-golden-host audit (PR #246), unpublished versus 0.5.0; gates doc unchanged, held. |
| Grapevine | ~85% | npm + workspace `@citrusworx/grapevine@0.2.2`. DO catalog / offerings / telemetry on master, unpublished. Gates still **0/7**. No Grapevine changes in `fb9f989f..e1a19908`. |
| Shared | ~45% | `@citrusworx/types@0.2.0` npm = workspace. Shared bar **0/6**. No changes in range. The Juice 0.9.2 publish without a repo version bump is a fresh Shared-bar miss (changeset + changelog, no surprise versions). |
| Kernel | ~52% | `@citrusworx/webengine@0.2.1` (npm matches). Only change in range: dependency bumped to `@citrusworx/nectarine@^0.5.0`. PaaS lifecycle methods still silent `Promise.resolve()`. [README.md](./README.md) still claims stubs / no kernel in `src/` -- **docs drift**. |
| **Overall** | **~76%** | Weighted 75.68, unchanged since 2026-10-05. No component moved. |

### Weighted check

`14x0.95 + 14x1.00 + 14x0.74 + 16x0.84 + 10x0.85 + 8x0.45 + 24x0.52 = 75.68`

## What moved since the 2026-10-06 pass (`fb9f989f`)

- **Tip:** `fb9f989f` -> `e1a19908` (2026-10-15 07:40 PT), PRs #235-#248: Juice field runtime + docs, motion tokens / core / docs, `juice:change` events, Juice Sig adapter subpath; Nectarine UPDATE / DELETE `returning` + json binds and the MiaMakes gap audit; the MiaMakes app and the kiwipress-bridge plugin.
- **npm:** `@citrusworx/juiceui` **0.9.1 -> 0.9.2** (2026-10-14 10:26 PT, `gitHead` `03cf749c`). Every other package unchanged (sigjs 0.3.0, seltzer 0.8.1, nectarine 0.5.0, grapevine 0.2.2, types 0.2.0, webengine 0.2.1).
- **Drift opened:** Juice manifest on master is still 0.9.1, juice-beta.md still names 0.9.1, and the field / input / textarea / motion changesets were not consumed -- npm is ahead of the repo.
- **Gates:** `library-release-gates.md` unchanged since 2026-09-22 (`07e9dc32`) -- Nectarine CI box still unticked, prose still says 0.4.0.
- All component scores held; overall ~76% (75.68).

## Earlier: what moved since the 2026-10-05 pass (`14000878`)

- **Tip:** `14000878` -> `fb9f989f` (PR #234, docs-only: textarea runtime docs + changeset; one-line textarea-runtime.ts comment). No package version bumps.
- **npm:** unchanged (juiceui 0.9.1, sigjs 0.3.0, seltzer 0.8.1, nectarine 0.5.0, grapevine 0.2.2, types 0.2.0, webengine 0.2.1); manifests on master match.
- **Gates:** `library-release-gates.md` unchanged since 2026-10-04 -- Nectarine CI box still unticked, prose still says 0.4.0.
- All component scores held; overall ~76% (75.68).

## Earlier: what moved since the 2026-10-04 ~10:07 PT pass (`77d73e1a`)

- **Tip:** `origin/master` `77d73e1a` -> `14000878` (2026-10-04 19:35 PT), PRs #227-#233. Local `master` has not been pulled.
- **npm:** unchanged. juiceui 0.9.1, nectarine 0.5.0, sigjs 0.3.0, seltzer 0.8.1, grapevine 0.2.2, types 0.2.0, webengine 0.2.1.
- **Docs drift closed:** Juice beta doc and Nectarine status/README now match npm 0.9.1 / 0.5.0 (PRs #227, #228). Lockfile refreshed for the 0.5.0 bump.
- **CI:** first green **Nectarine Package** run on `master` (`9656bd32`). Juice Package green on every master push since `bed7ea03`.
- **Juice:** input and textarea runtimes merged (unpublished vs 0.9.1).
- **Gates:** `library-release-gates.md` unchanged -- Shared 0/6, Juice 0/7, Sig 7/7, Seltzer 0/8, Nectarine 7/8 (CI evidence now exists for the eighth box, not yet ticked), Grapevine 0/7.
- Juice / Sig / Seltzer / Grapevine / Shared / Kernel scores: held.

## Biggest blocker left to v1

**Seltzer release-gate close-out (still 0/8)** -- freeze the Seltzer <-> Nectarine join before treating kernel scaffolding as product-ready. Nectarine is effectively gate-complete, so Seltzer is the clear bottleneck on the data/HTTP path. Housekeeping next: land a Juice 0.9.2 version commit (manifest, changelog, consumed changesets, juice-beta.md naming 0.9.2) so npm and master agree again; tick the Nectarine master-CI box (cite run 37223531237) and refresh its 0.4.0 gate prose; fix the kernel README drift; then start checking Juice gate boxes against `yarn workspace @citrusworx/juiceui verify` without inventing greens.

## Method notes

- Gate checkboxes are evidence, not aspiration. Open boxes cap the score even when the code looks strong. Verified external evidence (for example a green master CI run) can lift a score partway, but not to the full gate value until the box is ticked in-repo.
- npm vs workspace vs status-doc disagreement is an honesty penalty until fixed in-repo. A matching manifest on `master` closes version drift. Features on `master` that are absent from the published tarball are not scored as shipped.
- Kernel weight stays high because v1 is "honest glue," not library feature count alone.
- 2026-10-15 ~09:20 PT pass: machine `Drew`; `git fetch` (no pull; local `master` 10 behind with uncommitted Juice `dist/` edits left alone); `git diff fb9f989f origin/master`; npm `view` for all seven packages; `npm pack @citrusworx/juiceui@0.9.2` to inspect tarball contents; gates checkbox scan.
- 2026-10-06 ~09:30 PT pass: machine `Drew`; `git fetch` (master already 0/0 with origin); `git diff 14000878 origin/master`; npm `view` for all seven packages; gates checkbox scan.
- 2026-10-05 ~09:35 PT pass: machine `Drew`; `git fetch` (read-only, no pull); scored from `origin/master` via `git show` / `git diff`; npm `view` for all seven packages; GitHub Actions run list for `master` read via the GitHub connector (Nectarine master CI now verified green).

## Related

- [library-release-gates.md](./library-release-gates.md)
- [nectarine-kernel-contract.md](./nectarine-kernel-contract.md)
- [README.md](./README.md) (reality check -- currently drifts vs `engines/webengine/src`)
