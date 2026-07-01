# @citrusworx/juiceui

## 0.3.0

### Minor Changes

- Updated Grid built-in responsiveness.

## Unreleased

### Minor Changes

- **Breaking:** `@citrusworx/juiceui/styles` now ships **core CSS only** (`dist/index.css`). Import theme styles separately via `@citrusworx/juiceui/styles/themes/<id>`.
- Added modular theme builds: `dist/themes/aquaflux.css`, `kiwipress.css`, `citrusmint.css`.
- Added motion wave 1: `fade.in.down/up`, `fade.out.down/up`, `slideOut.left/right/up/down` (P1).
- Documented responsive defaults, `surfaceTone="soft"`, and expanded motion catalog.

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
