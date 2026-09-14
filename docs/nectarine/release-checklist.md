# Nectarine Release Checklist

Use this before publishing `@citrusworx/nectarine`.

`0.1.0` is already on npm (May 2026). Pending Changesets on this branch bump the next release to **0.2.0**.

There is **no** Changesets GitHub Action and **no** `NPM_TOKEN` in this repo. Publish is manual, same as Juice (`yarn version-packages` then `yarn release-packages`). Do not invent CI credentials.

## Semver

- `patch`: packaging fixes, docs, bug fixes that do not change the public API shape
- `minor`: new stable exports (for example `./config`, `./api`), compiler/adapter capabilities, optional-peer packaging
- `major`: breaking API changes for a 1.x line

`0.x` minors may include breaking import-path changes. **0.2.0** stops re-exporting adapters from `@citrusworx/nectarine`. Consumers must import them from `@citrusworx/nectarine/adapters/pg` (or `/ms`, `/mg`).

## Required Checks

Run this first:

```bash
yarn verify:nectarine
```

That must pass before publishing. It typechecks, rebuilds `dist/` (`prepack` runs the same `yarn build`), runs Vitest, and dry-runs `npm pack`.

## Release Review

- confirm `libraries/nectarine/package.json` versioning is driven by Changesets (do not hand-edit `version`)
- confirm `LICENSE` is MIT and `license` / `publishConfig.access` are set
- confirm `files` is `["dist"]` and every `exports` target exists after build
- confirm `js-yaml` is a runtime `dependency` (not only a devDependency)
- confirm `pg` / `mysql2` / `mongodb` are **optional** peerDependencies
- confirm the root entry does **not** `require` adapter modules
- confirm README install examples work for npm / yarn / pnpm consumers (not only `yarn workspace`)

## Publish Flow

1. Land nectarine Changesets on the release branch (this branch currently has several pending nectarine notes plus this packaging changeset).
2. Merge with CI passing (`Nectarine Package` workflow).
3. From the repo root, apply versions:

   ```bash
   yarn version-packages
   ```

   That is `changeset version`. It will:

   - bump `@citrusworx/nectarine` **0.1.0 → 0.2.0** (highest pending bump is minor)
   - write `libraries/nectarine/CHANGELOG.md`
   - also version **every other package with a pending changeset** (today that includes `@citrusworx/seltzer`)
   - patch internal dependents such as `@citrusworx/kiwipress` (`updateInternalDependencies`)

4. Review the generated Nectarine changelog and `package.json` version. Do not publish from a dirty worktree.
5. Commit the version files Changesets wrote (`package.json`, `CHANGELOG.md`, deleted `.changeset/*.md`).
6. Publish:

   **Nectarine only** (recommended until Seltzer is intentionally released from this branch):

   ```bash
   yarn npm login
   yarn workspace @citrusworx/nectarine npm publish --access public
   ```

   `prepack` rebuilds `dist/` immediately before the tarball is packed. npm also includes `LICENSE` and `README.md` even though `files` is `["dist"]`.

   **Every versioned public package** (Nectarine + anything else `version-packages` bumped):

   ```bash
   yarn release-packages
   ```

   That is `changeset publish`. It needs an npm user who can publish `@citrusworx/*` (the 0.1.0 publisher was `drewnitro`). This repo does not store that token.

7. Push the version commit and any git tags `changeset publish` created.

## Notes

- Do **not** run `npm publish` / `yarn npm publish` from CI in this repository until a documented workflow exists with a real org token.
- `prepack` is the source of truth for `dist/`. Committed `dist/` is for workspace consumers; the packed tarball is always rebuilt.
- Database drivers stay optional. Postgres consumers: `npm install @citrusworx/nectarine pg`. The MongoDB 7 peer wants Node 20.9+; the package `engines` floor is Node 18 for Postgres/MySQL.
- Changesets `baseBranch` is `master`. On `cursor/blackwater-phase0-backend`, pass the PR base to `yarn changeset status --since=…` (the Nectarine Package workflow already does this).
