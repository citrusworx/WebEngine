# Juice Roadmap

## Current Position

`@citrusworx/juiceui@0.4.0` is on npm. That is the current public Juice Beta cut.

**Master is ahead of 0.4.0.** Tide, surface language A–C, the theme contract plus bind tests, and icon/typography authoring polish all live on master and are not in the published tarball. Do not run `yarn version-packages` or publish from this picture. A future **0.5.0** cut is the publish lane for the pending Juice stack. That cut has not been made.

Pending Juice changesets on master (consume them at 0.5.0; Juice-only if possible):

| Changeset | Bump | What it records |
|---|---|---|
| `juice-ship-tide-theme` | **minor** | Tide as a fourth library theme |
| `juice-surface-tone-roles` | **minor** | Themeable `surfaceTone` `soft\|strong\|muted` |
| `juice-border-strength` | **minor** | Composable `borderStrength` `soft\|bold` |
| `juice-blur-sm-md` | **minor** | Standalone `blur` `sm\|md` (finishes A–C) |
| `juice-theme-contract-tests` | **patch** | Automated `--juice-*` bind tests |
| `juice-icon-authoring-contract` | **patch** | Icon authoring contract (`1rem` default, `iconSize`) |
| `juice-author-type-attrs-beat-theme` | **patch** | Author `font` / `fontColor` / `fontWeight` / `lineHeight` beat theme `h1`–`h6` / `p` defaults |

Juice is a CSS-first, attribute-driven styling and composition system. It is no longer a layout-utility kit, and it is not a finished component framework.

The visible layers today (0.4.0 plus unreleased master):

* layout and spacing primitives
* token-driven color, font, gradient, and motion systems
* four shipped modular themes (`aquaflux`, `kiwipress`, `citrusmint`, `tide`), with core CSS separate from theme identity
* surface language A–C: themeable `surfaceTone="soft|strong|muted"`, `borderStrength="soft|bold"`, standalone `blur="sm|md"`
* Emerging browser runtimes: navigation, accordion, and tabs auto-enhance when the JS entry is imported
* a Sig Accordion factory plus create/init/start/stop helpers
* contracts for themes, icons, and typography, including author type overrides
* templates as a stress-test bed

The strongest parts of Juice today are still layout, spacing, color tokens, typography, and icons.

The next strongest areas are now:

* modular shipped themes (KiwiPress is the richest reference; Tide is the dark product/SaaS one)
* motion wave 1 (P0 + P1)
* surface utilities A–C
* accordion and tabs chrome plus DOM-first auto-enhance
* documented theme / icon / typography contracts
* templates as design proofs

The weakest areas are still:

* remaining surface depth (`shadowTone`, `overlay`, `variant` / structural card variants)
* component maturity beyond the three auto-enhance runtimes
* blush remaining an unpublished YAML-only draft
* templates as a continuing stress-test surface
* Juice CLI and config / generator workflow
* optional later type size-step (`xs` / `1rem`) if it is ever needed

Theme-contract slice C is vacant: there is no remaining SCSS/YAML hole on the shipped set. Author type attrs already beat theme semantic defaults. Those are not open holes.

Tide is a shipped dark product/SaaS theme under `src/themes/tide/`. Accordion and tabs roles are bound there, and package exports include `@citrusworx/juiceui/styles/themes/tide`. Blush stays under `src/themes/_draft/`.

For the honest Beta promise, see [Juice Beta](./juice-beta.md) and the [maturity matrix](./juice-maturity-matrix.md).

---

## What Improved Through 0.4.0 and After

### Through 0.4.0

0.4.0 was a real Beta cut, not a packaging bump.

* **Modular themes, core CSS is core-only.** `@citrusworx/juiceui/styles` carries utilities and components, not theme identity. `aquaflux`, `kiwipress`, and `citrusmint` shipped as separate CSS entrypoints. Activate with `theme="<id>"` after importing core + theme CSS. Each theme follows the `<id>.scss` + `<id>.yaml` authoring contract.
* **Accordion and tabs joined navigation as real runtimes.** Layout chrome, shared `--juice-*` role contracts, DOM-first auto-enhance, and the Sig `Accordion` factory plus create/init/start/stop helpers. All three stay Emerging. Markup plus auto-enhance is the contract, not a large JS component library.
* **Motion wave 1 is documented and gated.** Canonical `motion` covers the P0/P1 catalog. `prefers-reduced-motion` is respected. That is a supported Beta subset, not the full [animations roadmap](./juice-animations-roadmap.md).
* **Teal tokens exist.** `teal-100`–`teal-900` and the `lagoon` swatch landed so a dark product theme had something to consume. Tide itself shipped after 0.4.0.
* **Packaging matches the runtime story.** `sideEffects` includes `dist/index.js`. `@citrusworx/sigjs` is a published `^0.3.0` caret range, not `workspace:^`.
* **Docs maturity caught up to the JS entry.** The [maturity matrix](./juice-maturity-matrix.md) marks the JS entrypoint and public component exports as **Emerging**.

### Since 0.4.0 (on master, unpublished)

This is the stack sitting in the pending Juice changesets above.

* **Tide shipped as the fourth library theme** (PR #95, `juice-ship-tide-theme`). Import `@citrusworx/juiceui/styles/themes/tide` and activate with `theme="tide"`. Dark product/SaaS identity, teal/lagoon tokens, accordion and tabs chrome, named `tide-card` / `tide-panel` surfaces. Blush remains a YAML-only draft.
* **Surface language A→B→C.** Themeable `surfaceTone` `soft|strong|muted` (#97), `borderStrength` `soft|bold` (#99), standalone `blur` `sm|md` (#102). A–C utilities are done. `overlay`, `variant`, and `shadowTone` are not.
* **Theme contract.** Canonical required-versus-optional checklist (#104) plus automated `--juice-*` bind tests (#105). `yarn workspace @citrusworx/juiceui verify` fails if aquaflux, kiwipress, citrusmint, tide, or the theme generator drops a required accordion, tabs, surface-tone, or border-strength bind. Slice C is vacant — no remaining holes on the shipped set.
* **Typography and icon polish.** Icon authoring contract (#108): default `[icon]` size is `1rem`, `iconSize` (`xxs`…`xxl`) is first-class, `width` / `height` stay the custom-size escape hatch. Typography authoring contract (#110). Author `font` / `fontColor` / `fontWeight` / `lineHeight` beat theme `h1`–`h6` / `p` defaults via `[theme] [attr]` companions (#112), same pattern as `surfaceTone`.

See [Surfaces](./juice-surfaces.md), [Theme Contract](./juice-theme-contract.md), [Icons](./juice-icons.md), and [Typography Contract](./juice-typography-contract.md).

---

## Foundations That Still Stand

These were true before 0.4.0 and remain true:

* Layout and spacing are the identity of Juice. Plain `<section>` is a neutral semantic block; auto-responsive section layout is opt-in via `section[auto]`.
* Typography is a usable system layer (semantic text sizes, `lineHeight`, `fontWeight`, font loading), not a thin add-on. Author attrs now win over theme heading/paragraph defaults when set.
* Numeric sizing includes practical fractional rem values.
* Token/style split for gradients is the pattern to keep repeating.
* Templates (SaaS, retail, delivery, social feed, spa/marketing, hosting dashboard, FAQ) are still the best stress tests of aesthetic range and layout semantics.

---

## What Is Still Holding Juice Back

### 1. Remaining Surface Depth

Surface language A–C ships. That is not a full surface system.

Still missing or only specified:

* `shadowTone` (cool / warm depth language)
* `overlay` (frost / tint / glass overlays that stay composable)
* `variant` and structural card variants (`monochromatic`, `glass`, `tinted`, plus `card` recipes in the [Surface Spec](./juice-surface-spec.md))

Authors still hand-assemble too much of the visual character for cards, panels, and heroes. See [Surfaces](./juice-surfaces.md).

### 2. Components Are Uneven Beyond the Runtimes

Accordion and tabs have chrome plus auto-enhance. Navigation still exists and is still Emerging. The Sig Accordion factory is real.

That is not the same as a polished component library. Cards, buttons, forms, and nav variants are useful and still settling. Prop contracts for styling internal parts are still being figured out. Juice should not pretend the exported component surface is broader or more mature than it is.

### 3. Blush Is Still Draft

Tide is a fourth shipped library theme. Blush is further back (YAML-only, no emitted CSS). Package `exports` and the published tarball still do not expose `_draft`.

### 4. Templates Still Expose Proportional Weaknesses

Juice can express many aesthetics, but dense layouts still reveal weaknesses in column math, containment, and app-style shell composition. That is useful signal, not failure. Templates should keep doing that job after each system improvement.

### 5. CLI and Generator Remain a Separate Track

The Juice CLI (`tooling/cli/juice`) and config-driven generation from `juice.config.yaml` are draft. They must not block remaining surface depth. The theme contract on the four shipped references is already documented and tested; the generator workflow is a different problem.

### 6. Optional Later Type Size-Step

The authoring contract is in. Author type attrs already beat theme semantic defaults. Remaining typography work, if any, is a later `xs` / `1rem` `fontSize` step or type-token gap — not the theme-versus-author cascade, and not a hole that should reorder this list.

---

## Revised Priorities

Lock this build order. Do not reorder it because a later item is more exciting.

### Closed / done on master (old P1–P3)

These were the lock order after 0.4.0. They are done on master. They are not in the 0.4.0 tarball.

* **Old P1 — Expand surfaces A–C.** `surfaceTone`, `borderStrength`, and standalone `blur` ship. Theme roles and bind tests cover the first two; blur is a core utility.
* **Old P2 — Formalize the theme contract.** [Theme Contract](./juice-theme-contract.md) is the canonical checklist. `libraries/juice/src/juice.theme-contract.test.ts` fails verify if a shipped library theme drops a required `--juice-*` bind. Slice C is vacant.
* **Old P3 — Typography / icon polish.** Icon contract, typography contract, and author type attrs beating theme defaults are in. See [Icons](./juice-icons.md) and [Typography Contract](./juice-typography-contract.md).

### Priority 1. Remaining Surface Depth

A–C utilities are **done**. The next Juice library build is the rest of the surface model.

Recommended next additions (see [Surface Spec](./juice-surface-spec.md)):

* `shadowTone` for depth / shadow language
* `overlay` / tint where they stay composable
* `variant` and more structural variants on `card` / `panel` / `hero`

This is what makes templates feel finished with less manual assembly.

### Priority 2. Next Runtime / Component, Carefully

The browser behavior layer should keep growing, but slowly.

A plausible next runtime is something like a modal / dialog, following the same rule as accordion and tabs: valid Juice markup should auto-enhance. Do not oversell a component roadmap. Do not add a runtime until the chrome contract and markup conventions are real.

Short-term focus remains:

* keep navigation, accordion, and tabs documented as Emerging until they settle
* improve component authoring patterns
* ensure anything newly exported is actually ready

### Priority 3. Templates as Stress Tests; Juice CLI as a Separate Track

Keep using templates to test:

* dense app shells
* marketing sites
* retail / product merchandising
* themed experiences
* FAQ / product pages under shipped Tide

The Juice CLI (`tooling/cli/juice`) is a parallel track. It must not block remaining surface depth.

### Priority 4. 0.5.0 Publish Lane

When the library work above is ready to ship — or earlier if a clean Juice-only cut is wanted — consume the pending Juice changesets and publish **0.5.0**. Prefer a Juice-only version-packages pass so other packages do not ride along.

This docs refresh does not cut 0.5.0. Do not run `yarn version-packages` or publish from a roadmap update.

---

## Recommended Build Order

1. Remaining surface depth: `shadowTone`, `overlay`, `variant` / structural card variants. A–C utilities are done.
2. Add the next runtime or component only when the chrome and markup are ready (for example modal). Keep nav / accordion / tabs Emerging. Do not oversell this.
3. Keep template-driven stress testing after each improvement. Treat the Juice CLI as a parallel track.
4. Cut **0.5.0** when ready: consume the pending Juice changesets; Juice-only if possible. Do not cut it from a docs refresh.

Closed on master, not in this order: expand surfaces A–C, formalize the theme contract, typography / icon polish (including author type attrs beating theme defaults).

---

## Summary

0.4.0 was a real Beta cut. It shipped modular themes, motion wave 1, accordion and tabs runtimes, teal tokens, and packaging that matches the auto-enhance story.

Master is ahead of that cut. Tide is a fourth shipped library theme. Surface A–C utilities, the theme contract plus bind tests, and icon/typography authoring contracts (including author type overrides) are on master and unpublished. Blush remains draft.

The next stage is refinement, then a publish:

* remaining surface depth (`shadowTone`, `overlay`, `variant`)
* grow runtime/components only when the markup contract is honest
* keep templates as stress tests; CLI in parallel
* **0.5.0** as the publish lane for the pending Juice stack, when ready

That is a strong place to be.
