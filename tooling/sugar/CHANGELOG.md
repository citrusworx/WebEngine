# @citrusworx/sugar

## 0.3.0

### Minor Changes

- changeset overdue
- 8af5be5: Add a `kind` field on Sugar nodes and the first event kinds (`onClick`, `onDragStart`, `onDragMove`, `onDragEnd`, `customEvent`) with `trigger`/`payload` outputs.
- 6724650: Harden the Sugar graph model so ports have unique per-node ids, edges reference specific ports instead of node categories, and rendering/hit-testing can place multiple input and output ports.

### Patch Changes

- f8ce0bb: Pan the Sugar node canvas in both X and Y so off-screen nodes stay reachable, with hit-testing and node drag in world space.
- Updated dependencies [801b616]
- Updated dependencies [240d133]
- Updated dependencies [f4eff14]
- Updated dependencies [c60eaef]
- Updated dependencies [0a9e6d6]
  - @citrusworx/juiceui@0.9.7

## 0.2.1

### Patch Changes

- Replace monorepo-only internal dependency ranges with published semver ranges so consumers outside the workspace can install these packages correctly.
- Updated dependencies
  - @citrusworx/juiceui@0.1.1

## 0.2.0

### Minor Changes

- Added READMEs to each

### Patch Changes

- Updated dependencies
  - @citrusworx/juiceui@0.1.0
  - @citrusworx/sigjs@0.1.0

## 0.1.1

### Patch Changes

- e7a1584: Release preparation
- e7a1584: Standardize library package manifests for independent publishing, align build outputs with published entrypoints, and add Changesets-based release automation for the monorepo.
- Updated dependencies [e7a1584]
- Updated dependencies [e7a1584]
  - @citrusworx/juiceui@0.0.2
  - @citrusworx/sigjs@0.0.2
