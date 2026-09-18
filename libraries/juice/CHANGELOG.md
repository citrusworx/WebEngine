# @citrusworx/juiceui

## 0.4.0

### Breaking Changes

- **`@citrusworx/juiceui/styles` is core-only.** It now ships `dist/index.css` (utilities and components, no theme identity). Import a published theme separately via `@citrusworx/juiceui/styles/themes/<id>` (`aquaflux`, `kiwipress`, or `citrusmint`).

### Minor Changes

- Added modular theme builds: `dist/themes/aquaflux.css`, `kiwipress.css`, `citrusmint.css`.
- Added motion wave 1: `fade.in.down/up`, `fade.out.down/up`, `slideOut.left/right/up/down` (P1).
- Documented responsive defaults, `surfaceTone="soft"`, and an expanded motion catalog.
- Added accordion layout chrome (`[accordion]`, `[accordion-item]`) and Aquaflux surface styling so FAQ triggers read as stacked controls, not primary CTA buttons.
- Added a shared accordion chrome role contract (`--juice-accordion-*`, with `--aqua-*` / `--kw-*` / `--cm-*` / `--jx-*` aliases) so library and generated themes bind trigger/chevron/panel/focus paint from existing tokens.
- Added a DOM-first accordion runtime that auto-enhances valid `[accordion]` markup (click toggle, Escape, late DOM sync) without app init.
- Added tabs layout chrome (`[tabs]`, `[tabs-list]`, `[tab]`, `[tab-panel]`) and a shared `--juice-tabs-*` role contract so library and generated themes bind strip/trigger/indicator/focus paint from existing tokens, with CTA overrides so tab buttons are not primary gradient buttons.
- Added a DOM-first tabs runtime that auto-enhances valid `[tabs]` markup (exclusive panels, APG keyboard, dual-write `[active]`/`aria-selected`, late DOM sync) without app init.
- Added a teal/cyan color family (`teal-100`–`teal-900`, `lagoon` swatch). Draft dark Tide (and blush) remain **unpublished**: they live under `src/themes/_draft/`, are blocked from package `exports`, and are omitted from the published tarball.

### Patch Changes

- Bind accordion chrome roles in generated Juice themes so app-owned `--jx-*` stylesheets paint `[accordion-item]` from existing surface and accent tokens.
- Mark `dist/index.js` as a `sideEffects` entry so auto-start navigation, accordion, and tabs runtimes survive bundler tree-shaking. Depend on a published `@citrusworx/sigjs` `^0.2.0` caret range so npm consumers do not receive `workspace:^`. Document those runtimes as Emerging in Beta.
- Close Tide FAQ accordion chrome toward the dark navy mock (local draft only — Tide is not a published theme).

## 0.3.0

### Minor Changes

- Updated Grid built-in responsiveness.

## 0.1.1

### Patch Changes

- Replace monorepo-only internal dependency ranges with published semver ranges so consumers outside the workspace can install these packages correctly.

## 0.1.0

### Minor Changes

- Added READMEs to each

### Patch Changes

- Updated dependencies
  - @citrusworx/sigjs@0.1.0

## 0.0.2

### Patch Changes

- e7a1584: Release preparation
- e7a1584: Standardize library package manifests for independent publishing, align build outputs with published entrypoints, and add Changesets-based release automation for the monorepo.
- Updated dependencies [e7a1584]
- Updated dependencies [e7a1584]
  - @citrusworx/sigjs@0.0.2
