# Nectarine Release Checklist

Use this before publishing `@citrusworx/nectarine`.

**npm `0.4.0` is already published** (2026-09-15). Do not publish 0.4.0 again. **0.5.0 is not on npm.**

Workspace `libraries/nectarine/package.json` is **0.5.0**. `yarn version-packages` already consumed the Nectarine changesets (ON CONFLICT minor, dist rebuild patch, plus the other pending Nectarine notes). That changelog mentions `ON CONFLICT`. Do not run `yarn version-packages` again to publish this cut. Master still has unrelated pending changesets, and a full run versions every package that has one. WebEngine, KiwiPress, and the private apps were not version-bumped. `@citrusworx/webengine` and `@citrusworx/kiwipress` depend on `^0.5.0` so Yarn links the workspace package.

**Never publish a version that git does not record.** The 0.5.0 `package.json` and `CHANGELOG.md` bump is committed before `npm publish`. Publishing 0.4.0 without that commit is why the changelog has no 0.4.0 section.

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

- confirm `libraries/nectarine/package.json` versioning is driven by Changesets. Do not hand-edit `version` to invent the next release. **0.5.0** came from `yarn version-packages`. Do not publish it until that commit is the tree you pack. Do not claim it is already on npm
- confirm `LICENSE` is MIT and `license` / `publishConfig.access` are set
- confirm `files` is `["dist"]` and every `exports` target exists after build
- confirm `js-yaml` is a runtime `dependency` (not only a devDependency)
- confirm `pg` / `mysql2` / `mongodb` are **optional** peerDependencies
- confirm the root entry does **not** `require` adapter modules
- confirm README install examples work for npm / yarn / pnpm consumers (not only `yarn workspace`)

## Publish Flow

1. Land nectarine Changesets on the release branch.
2. Merge with CI passing (`Nectarine Package` workflow).
3. From the repo root, apply versions:

   ```bash
   yarn version-packages
   ```

   That is `changeset version`. For this cut it already ran against only the Nectarine changesets and bumped `@citrusworx/nectarine` **0.4.0 → 0.5.0**. Do not run it again on a tree that still has unrelated changesets. A later release starts from new changesets, not from replaying 0.5.0.

4. Review the generated Nectarine changelog and `package.json` version (**0.5.0**, mentioning `ON CONFLICT`). Do not publish from a dirty worktree. npm stays **0.4.0** until this publish.
5. Commit the version files Changesets wrote (`package.json`, `CHANGELOG.md`, deleted `.changeset/*.md`) **before** publishing. Never publish without that commit.
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

- Never publish without committing the version bump. A published number that git still shows as the previous version makes the next `yarn version-packages` reuse that number.
- Do **not** run `npm publish` / `yarn npm publish` from CI in this repository until a documented workflow exists with a real org token.
- `prepack` is the source of truth for `dist/`. Committed `dist/` is for workspace consumers; the packed tarball is always rebuilt.
- Database drivers stay optional. Postgres consumers: `npm install @citrusworx/nectarine pg`. The MongoDB 7 peer wants Node 20.19+; the package `engines` floor is Node 18 for Postgres/MySQL.
- Changesets `baseBranch` is `master`. On `cursor/blackwater-phase0-backend`, pass the PR base to `yarn changeset status --since=…` (the Nectarine Package workflow already does this).
