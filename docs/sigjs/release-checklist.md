# Sig.js Release Checklist

Use this before publishing `@citrusworx/sigjs`.

npm `0.2.0` (2026-07-01) is **not** current `libraries/sig`. Pending Changesets bump the next publish to **0.3.0** (minor: reactive props, `:param` routes, plus patch polish/docs). Do not republish `0.2.0`.

There is **no** Changesets GitHub Action and **no** `NPM_TOKEN` in this repo. Publish is manual, same as Juice / Nectarine. Do not invent CI credentials.

## Semver

- `patch`: packaging fixes, docs, bug fixes that do not change the public API shape
- `minor`: new runtime capabilities (reactive function-valued props, `:param` / `*` routing, new exports)
- `major`: breaking API changes for a 1.x line

`0.x` caret ranges do **not** include the next minor: `^0.2.0` is `>=0.2.0 <0.3.0`.

## Required Checks

```bash
yarn changeset status
yarn verify:juice
yarn workspace @citrusworx/sigjs test
```

Juice Package CI is the path-filter gate (`libraries/sig/**` → `yarn verify:juice` + `yarn changeset status`).

## Forced companion bumps

`.changeset/config.json` sets `updateInternalDependencies` to `patch`. Parking other changeset files does **not** keep Juice/Sugar out of a Sig `0.3.0` version commit.

`yarn version-packages` will:

- bump `@citrusworx/sigjs` **0.2.0 → 0.3.0**
- **also patch-bump** `@citrusworx/juiceui` and `@citrusworx/sugar` (and version private dependents) because `0.3.0` is outside their `^0.2.0` ranges
- rewrite those `@citrusworx/sigjs` ranges to `^0.3.0`

Merge the Juice `0.4.0` version PR first when it is still open, so the forced Juice bump is `0.4.0 → 0.4.1` rather than `0.3.0 → 0.3.1`.

## Publish Flow

1. Land the Sig Changesets (`sigjs-reactive-props-routes.md` minor, `sigjs-runtime-polish.md` / `sigjs-standalone-docs.md` patch).
2. Merge with Juice Package CI green.
3. On a clean `master` (or `release/sigjs-0.3.0`), park **non-Sig** changeset files so grapevine / kiwipress / nectarine / webengine are not versioned from *their* notes. Keep the three `sigjs-*.md` files.
4. Apply versions:

   ```bash
   yarn version-packages
   ```

5. Review `libraries/sig/package.json` (**0.3.0**) and `CHANGELOG.md`. Expect Juice + Sugar patch version files and `^0.3.0` dep ranges in the same commit. Restore parked non-Sig changesets.
6. Commit what Changesets wrote. Do not publish from a dirty worktree.
7. Publish **Sig only** unless the companion Juice/Sugar patches are intentionally going to npm in this release:

   ```bash
   yarn npm login
   yarn workspace @citrusworx/sigjs npm publish --access public
   ```

   `prepack` rebuilds `dist/` immediately before the tarball is packed.

   `yarn release-packages` publishes **every** versioned public package in that commit (Sig + the forced Juice/Sugar patches). Use it only when that is intended.

8. Push the version commit. If you used `changeset publish`, push any tags it created.

## Notes

- Do **not** run `npm publish` from CI in this repository until a documented workflow exists with a real org token.
- Keep published packages on a caret range that matches the **current** `libraries/sig` version (`^0.2.0` until the version commit, then `^0.3.0`). Do not use `workspace:^` on packages that `changeset publish` will pack; npm does not rewrite Yarn workspace protocol.
- Private apps may keep `workspace:*` / `workspace:^`.
