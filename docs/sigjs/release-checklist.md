# Sig.js Release Checklist

Use this before publishing `@citrusworx/sigjs`.

npm **`0.6.0`** is the current registry cut (published 2026-10-21 from an unversioned local build, `gitHead` `3055fe2e`). Do **not** republish `0.6.0`, `0.4.0`, `0.3.0`, or `0.2.0`.

**0.7.0** is the release candidate. `libraries/sig/package.json` is already `0.7.0`, and `libraries/sig/CHANGELOG.md` records it. It is **not** on npm. Do **not** bump `0.7.0` again before that publish. Do **not** run `yarn version-packages` for this publish. Other packages still have pending changesets, and that command would version them and can move Sig off `0.7.0`.

The Changeset that produced `0.4.0` (`sigjs-juice-adapter`) is **consumed**. Do not re-add it. The three Changesets that produced `0.3.0` (`sigjs-reactive-props-routes`, `sigjs-runtime-polish`, `sigjs-standalone-docs`) are **consumed**. Do not re-add them. The three that describe this `0.7.0` tree (`sigjs-bind-list`, `sigjs-v1-api-cleanup`, `sigjs-api-surface`) are **consumed** in the changelog. Do not re-add them.

There is **no** Changesets GitHub Action and **no** `NPM_TOKEN` in this repo. Publish is manual, same as Juice / Nectarine. Do not invent CI credentials.

## Semver

- `patch`: packaging fixes, docs, bug fixes that do not change the public API shape
- `minor`: new runtime capabilities (reactive function-valued props, `:param` / `*` routing, new exports)
- `major`: breaking API changes for a 1.x line

`0.x` caret ranges do **not** include the next minor: `^0.4.0` is `>=0.4.0 <0.5.0`. `^0.6.0` does not install `0.7.0`. `^0.4.0` installs neither `0.6.0` nor `0.7.0`.

## Required Checks

```bash
yarn changeset status
yarn verify:juice
yarn workspace @citrusworx/sigjs test
```

Juice Package CI is the path-filter gate (`libraries/sig/**` → `yarn verify:juice` + `yarn changeset status`).

## Next version

The next publish is **0.7.0**, the release candidate. The workspace version and changelog are already set. Do not run `yarn version-packages` first.

Confirm with `npm view @citrusworx/sigjs version` before writing install lines. npm latest should still be `0.6.0` until this publish. Add Changesets only for work that is **not** already in this `0.7.0` tree.

Workspace packages that publish (`@citrusworx/juiceui`, `@citrusworx/sugar`) declare `@citrusworx/sigjs` `^0.7.0` so Yarn links `libraries/sig`. `^0.6.0` and `^0.4.0` do not. Private apps may keep `workspace:*` (MiaMakes front does).

## Publish Flow

1. Land **new** runtime/docs Changesets for work that is not already in this `0.7.0` tree. Do not add one that bumps Sig before `0.7.0` is published.
2. Merge with Juice Package CI green.
3. On a clean `master` (or a `release/sigjs-*` branch), publish the release candidate as already versioned. Do not run `yarn version-packages`. That command versions every package with a pending changeset (grapevine, kiwipress, nectarine, webengine, and the rest) and can move `@citrusworx/sigjs` off `0.7.0`.
4. After `0.7.0` is on npm, a later publish may run:

   ```bash
   yarn version-packages
   ```

   Park non-Sig changeset files first if that command should not version them.
5. Review `libraries/sig/package.json` (this publish is **0.7.0**; a later publish must be newer than that) and `CHANGELOG.md`.
6. The version commit is already on `master` before publish. Do not publish from a dirty worktree.
7. Publish **Sig only** unless companion packages are intentionally going to npm in this release:

   ```bash
   yarn npm login
   yarn workspace @citrusworx/sigjs npm publish --access public
   ```

   `prepack` rebuilds `dist/` immediately before the tarball is packed.

   `yarn release-packages` publishes **every** versioned public package in that commit. Use it only when that is intended.

8. Push the version commit. If you used `changeset publish`, push any tags it created.

## Notes

- Do **not** run `npm publish` from CI in this repository until a documented workflow exists with a real org token.
- Keep published packages on a caret range that matches the workspace version being published (`^0.7.0`). Do not use `workspace:^` on packages that `changeset publish` will pack; npm does not rewrite Yarn workspace protocol.
- Private apps may keep `workspace:*` / `workspace:^`.
- Outside consumers (and `libraries/sig/examples/counter`) install `@citrusworx/sigjs@^0.7.0` from the registry once `0.7.0` is published. Until then, `^0.7.0` does not resolve on npm.
