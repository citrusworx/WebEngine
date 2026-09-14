# Changesets

Use `yarn changeset` to create a release note for any package changes.

Use `yarn version-packages` to apply the pending version bumps locally.

Use `yarn release-packages` to publish **all** versioned public packages to npm (`changeset publish`). That requires an npm login with `@citrusworx` access; this repo does not store an `NPM_TOKEN`.

Package-specific checklists:

- Juice: [`docs/juice/release-checklist.md`](../docs/juice/release-checklist.md)
- Nectarine: [`docs/nectarine/release-checklist.md`](../docs/nectarine/release-checklist.md)

To publish only Nectarine after `yarn version-packages`:

```bash
yarn workspace @citrusworx/nectarine npm publish --access public
```
