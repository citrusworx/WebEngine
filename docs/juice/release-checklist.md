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
- confirm interactive runtime tests still pass for navigation and accordion behavior
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
