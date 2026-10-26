# Juice Release Checklist

Use this before publishing `@citrusworx/juiceui`.

## Semver

- `patch`: bug fixes, packaging fixes, test-only hardening, accessibility/runtime fixes that do not change the public API shape
- `minor`: new stable exports, new attribute contracts, new design-system capabilities, new shipped assets, new documented browser-support guarantees
- `major`: breaking API changes, removed exports, renamed runtime attributes, breaking asset-path changes, browser-support drops

## Required Checks

Run this first:

```bash
yarn workspace @citrusworx/juiceui verify
```

That must pass before publishing.

## Release Review

- confirm `libraries/juice/package.json` versioning is being driven by Changesets
- confirm `libraries/juice/CHANGELOG.md` describes user-facing changes clearly
- confirm `dist/index.css`, `dist/index.js`, and `dist/icons/` are present after build
- confirm artifact budgets still pass in `src/juice.artifacts.test.ts`
- confirm interactive runtime tests still pass for navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, field, icon button, avatar, and table behavior
- confirm any new assets are intentionally part of the published contract
- confirm README examples and package entrypoints still match the build output

## Publish Flow

1. Create a Changeset for Juice when the change is release-worthy.
2. Merge with CI passing.
3. Run `yarn version-packages` when preparing the release branch or release commit.
4. Review the generated Juice changelog entry.
5. Publish with `yarn release-packages`.

## Notes

- Do not publish Juice from a dirty worktree.
- Do not bypass `verify` for “docs-only” changes if the package version is changing.
- If browser targets or shipped asset directories change, update the README and artifact tests in the same change.
- `sideEffects` must include `./dist/index.js` as well as the CSS entries. The JS entry auto-starts navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, field, icon button, avatar, and table; bundlers that trust `sideEffects` can drop that auto-enhance if the JS file is treated as pure. Disclosure, spinner, select, input, textarea, field, and motion core shipped in 0.9.2. Icon button, avatar, and table auto-start with that entry and are on master, not in the published npm 0.9.2 release. See [Avatar](./juice-avatar.md) and [Table](./juice-table.md). Skeleton (`[skeleton]`) is CSS-only loading chrome. It does not auto-start, it is not one of those runtimes, and it is on master, not in the published npm 0.9.2 release. See [Skeleton](./juice-skeleton.md). List (`[list]`) is CSS-only stacked rows. It does not auto-start, it is not one of those runtimes, and it is on master, not in the published npm 0.9.2 release. See [List](./juice-list.md). Badge (`[badge]`) is CSS-only label chrome. It does not auto-start, it is not one of those runtimes, and the layout plus KiwiPress paint shipped in npm 0.9.2. See [Badge](./juice-badge.md).
- Keep `@citrusworx/sigjs` on a caret range that matches the workspace version being published (currently `^0.7.0`), not `workspace:^`. This repo publishes with `changeset publish`, which uses `npm publish` and does not rewrite Yarn workspace protocol. Yarn still resolves `^0.7.0` to the local `libraries/sig` workspace during development. `^0.7.0` does not match npm `0.6.0`.
