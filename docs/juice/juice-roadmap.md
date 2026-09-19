# Juice Roadmap

## Current Position

`@citrusworx/juiceui@0.4.0` is on npm. That is the current Juice Beta cut.

Juice is a CSS-first, attribute-driven styling and composition system. It is no longer a layout-utility kit, and it is not a finished component framework.

The visible layers today:

* layout and spacing primitives
* token-driven color, font, gradient, and motion systems
* four shipped modular themes (`aquaflux`, `kiwipress`, `citrusmint`, `tide`), with core CSS separate from theme identity
* a small surface language (`surfaceTone="soft|strong|muted"`, `borderStrength="soft|bold"`, `blur="sm|md"`)
* Emerging browser runtimes: navigation, accordion, and tabs auto-enhance when the JS entry is imported
* a Sig Accordion factory plus create/init/start/stop helpers
* templates as a stress-test bed

The strongest parts of Juice today are still layout, spacing, color tokens, typography, and icons.

The next strongest areas are now:

* modular shipped themes (KiwiPress is the richest reference)
* motion wave 1 (P0 + P1)
* accordion and tabs chrome plus DOM-first auto-enhance
* templates as design proofs

The weakest areas are still:

* surface language breadth (A–C utilities ship; `overlay` / `variant` / `shadowTone` do not)
* theme-contract tests across the shipped set (checklist is written; automation is not)
* component maturity beyond the three auto-enhance runtimes
* icon and typography polish
* blush remaining an unpublished YAML-only draft
* config / generator workflow

Tide is a shipped dark product/SaaS theme under `src/themes/tide/`. Accordion and tabs roles are bound there, and package exports include `@citrusworx/juiceui/styles/themes/tide`. Blush stays under `src/themes/_draft/`.

For the honest Beta promise, see [Juice Beta](./juice-beta.md) and the [maturity matrix](./juice-maturity-matrix.md).

---

## What Improved Through 0.4.0

### 1. Themes Are Modular, and Core CSS Is Core-Only

Juice no longer ships a single CSS bundle that also carries theme identity.

* `@citrusworx/juiceui/styles` is **core only** (utilities and components, no theme rules). This is a breaking change versus the older single-bundle mental model.
* `aquaflux`, `kiwipress`, `citrusmint`, and `tide` ship as separate CSS entrypoints: `@citrusworx/juiceui/styles/themes/<id>`.
* Activate with `theme="<id>"` on the root after importing core + theme CSS.
* Each shipped theme follows the `<id>.scss` + `<id>.yaml` authoring contract.

Themes are no longer conceptual, and they are no longer one Aquaflux example. Four library themes are in the package surface. 0.4.0 published the first three; Tide joined afterward.

### 2. Accordion and Tabs Joined Navigation as Real Runtimes

Juice is not CSS-only, and the browser layer is no longer “navigation only.”

0.4.0 ships:

* accordion layout chrome (`[accordion]`, `[accordion-item]`) plus a shared `--juice-accordion-*` role contract
* a DOM-first accordion runtime that auto-enhances valid markup (click toggle, Escape, late DOM sync)
* tabs layout chrome (`[tabs]`, `[tabs-list]`, `[tab]`, `[tab-panel]`) plus a shared `--juice-tabs-*` role contract
* a DOM-first tabs runtime that auto-enhances valid markup (exclusive panels, APG keyboard, dual-write `[active]` / `aria-selected`)
* the Sig `Accordion` factory and create/init/start/stop helpers for navigation, accordion, and tabs

Navigation was already present. It remains Emerging, same as accordion and tabs. Importing `@citrusworx/juiceui` auto-starts all three. Markup plus auto-enhance is the contract, not a large JS component library.

See [Runtime Behavior](./juice-runtime-behavior.md), [Accordion Runtime](./juice-accordion-runtime.md), and [Tabs Runtime](./juice-tabs-runtime.md).

### 3. Motion Wave 1 Is Documented and Gated

The canonical `motion` attribute now covers the P0/P1 catalog (including `fade.in.down/up`, `fade.out.down/up`, and `slideOut.left/right/up/down`). `prefers-reduced-motion` is respected.

That is a supported Beta subset, not the full [animations roadmap](./juice-animations-roadmap.md).

### 4. Teal Tokens Exist; Tide Now Ships

0.4.0 added a teal/cyan family (`teal-100`–`teal-900`) and the `lagoon` swatch.

**Tide** consumes those tokens as a dark product/SaaS theme and now lives at `src/themes/tide/`, compiled to `dist/themes/tide.css`. Import `@citrusworx/juiceui/styles/themes/tide`. Draft **blush** remains YAML-only under `src/themes/_draft/`. Package `exports` and the published tarball still do not expose `_draft`.

### 5. Packaging Matches the Runtime Story

* `sideEffects` includes `dist/index.js`, so bundlers that trust the field do not drop auto-start navigation, accordion, and tabs.
* `@citrusworx/sigjs` is a published `^0.3.0` caret range, not `workspace:^`.

That is packaging honesty, not a new product surface.

### 6. Docs Maturity Caught Up to the JS Entry

The [maturity matrix](./juice-maturity-matrix.md) now marks the JS entrypoint and public component exports as **Emerging**. Beta docs no longer describe the JS entry as a stub, and they do not pretend Juice is a broad component library.

---

## Foundations That Still Stand

These were true before 0.4.0 and remain true:

* Layout and spacing are the identity of Juice. Plain `<section>` is a neutral semantic block; auto-responsive section layout is opt-in via `section[auto]`.
* Typography is a usable system layer (semantic text sizes, `lineHeight`, `fontWeight`, font loading), not a thin add-on.
* Numeric sizing includes practical fractional rem values.
* Token/style split for gradients is the pattern to keep repeating.
* Templates (SaaS, retail, delivery, social feed, spa/marketing, hosting dashboard, FAQ) are still the best stress tests of aesthetic range and layout semantics.

---

## What Is Still Holding Juice Back

### 1. Surface Language Is Still Early

Juice has a real surface hook, but not a full surface system.

Shipped today:

* `surfaceTone="soft|strong|muted"` with a `--juice-surface-*` theme role contract
* `borderStrength="soft|bold"` with `--juice-border-strength-*` roles (composes with tones)
* `blur="sm|md"` standalone backdrop-filter (`6px` / `16px`; explicit blur overrides a tone's length)

Still missing or only specified:

* better depth / shadow language
* clearer glass / overlay / tint patterns
* more ready-made structural variants on `card` / `panel` / `hero`

Authors still hand-assemble too much of the visual character for cards, panels, and heroes. See [Surfaces](./juice-surfaces.md) and [Surface Spec](./juice-surface-spec.md).

### 2. The Theme Contract Is Still Formalizing

The required-versus-optional checklist now lives in [Theme Contract](./juice-theme-contract.md). All four shipped themes are equal references there: identity YAML, required `--juice-*` binds, optional Tide hooks, prefix aliases, and the theme × role-family matrix.

That is docs formalization, not a finished system. Automated tests that assert every shipped theme binds the required accordion, tabs, surface-tone, and border-strength families are **not** written yet. Config-driven generation from `juice.config.yaml` remains draft. Neither should block the next contract step.

### 3. Components Are Uneven Beyond the Runtimes

Accordion and tabs now have chrome plus auto-enhance. Navigation still exists and is still Emerging. The Sig Accordion factory is real.

That is not the same as a polished component library. Cards, buttons, forms, and nav variants are useful and still settling. Prop contracts for styling internal parts are still being figured out. Juice should not pretend the exported component surface is broader or more mature than it is.

### 4. Icon and Typography Still Need Polish

Icons and type are Stable-ish in the maturity matrix, and they already carry real value. The remaining work is contract polish, not invention:

* canonical icon sizing, coloring, and icon + text alignment
* which icon attributes are first-class versus leftover
* a clearer font-size / display-body hierarchy and naming consistency

### 5. Blush Is Still Draft

Tide is a fourth shipped library theme: dark product/SaaS, teal/lagoon identity, accordion and tabs roles bound, published CSS export. Blush is further back (YAML-only, no emitted CSS).

### 6. Templates Still Expose Proportional Weaknesses

Juice can express many aesthetics, but dense layouts still reveal weaknesses in column math, containment, and app-style shell composition. That is useful signal, not failure. Templates should keep doing that job after each system improvement.

---

## Revised Priorities

Lock this build order. Do not reorder it because a later item is more exciting.

### Priority 1. Expand the Surface Language

Tide promotion is done. Surface language is the next Juice library build.

Build out the surface model that already started. Do not treat that work as finished: A–C utilities (`surfaceTone`, `borderStrength`, standalone `blur`) ship, but overlay / variant / shadowTone do not.

Recommended next additions:

* more surface utilities beyond the shipped A–C set
* depth / shadow language
* overlay / tint where they stay composable
* more structural variants on `card` (see [Surface Spec](./juice-surface-spec.md))

This is what makes templates feel finished with less manual assembly.

### Priority 2. Formalize the Theme Contract

Docs formalization is in progress. [Theme Contract](./juice-theme-contract.md) is the canonical checklist against `aquaflux`, `kiwipress`, `citrusmint`, and `tide`.

Next step is automated tests that fail if a shipped library theme omits a required `--juice-*` bind. Do not claim those tests are done. Do not wait for a generator rewrite. Filling remaining SCSS/YAML gaps is later work.

### Priority 3. Typography / Icon Contract Polish

Settle the remaining authoring rules:

* attribute-first icons with clear size, color, alignment, and library selection
* tighter type hierarchy and naming
* docs that match the real attributes

This is polish on strong layers, not a new layer.

### Priority 4. Next Runtime / Component, Carefully

The browser behavior layer should keep growing, but slowly.

A plausible next runtime is something like a modal / dialog, following the same rule as accordion and tabs: valid Juice markup should auto-enhance. Do not oversell a component roadmap. Do not add a runtime until the chrome contract and markup conventions are real.

Short-term focus remains:

* keep navigation, accordion, and tabs documented as Emerging until they settle
* improve component authoring patterns
* ensure anything newly exported is actually ready

### Priority 5. Templates as Stress Tests; Juice CLI as a Separate Track

Keep using templates to test:

* dense app shells
* marketing sites
* retail / product merchandising
* themed experiences
* FAQ / product pages under shipped Tide

The Juice CLI (`tooling/cli/juice`) is a separate track. It must not block surface work or theme-contract formalization.

---

## Recommended Build Order

1. Expand `surfaceTone` and related surface utilities.
2. Formalize the theme contract: checklist is written; next is automated bind tests.
3. Tighten typography and icon authoring contracts.
4. Add the next runtime or component only when the chrome and markup are ready (for example modal). Do not oversell this.
5. Keep template-driven stress testing after each improvement. Treat the Juice CLI as a parallel track.

---

## Summary

0.4.0 was a real Beta cut, not a packaging bump.

It shipped modular themes, motion wave 1, accordion and tabs runtimes, teal tokens, and packaging that matches the auto-enhance story. Layout, tokens, typography, and icons were already the strongest layers; they still are. Tide is now a fourth shipped library theme. Blush remains draft.

The next stage is refinement:

* make surface language richer
* automate the theme contract against the four shipped references
* polish icons and type
* grow runtime/components only when the markup contract is honest

That is a strong place to be.
