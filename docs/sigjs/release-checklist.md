# Sig.js Release Checklist

Use this before publishing `@citrusworx/sigjs`.

npm **`0.7.2`** is the current registry cut (published 2026-10-27, `gitHead` `c794c06f`, PR #295). Do **not** republish `0.7.2`, `0.7.1`, `0.7.0`, `0.6.0`, `0.4.0`, `0.3.0`, or `0.2.0`.

**0.7.0** was published 2026-10-21 (`gitHead` `747f2f71`). **0.7.1** (2026-10-27, `gitHead` `b2f2b287`) is a stale build: its published `dist/juice.d.ts` does not name icon-button, avatar, or table. **0.7.2** does. `libraries/sig/package.json` is still `0.7.0`. `libraries/sig/CHANGELOG.md` still opens on `0.7.0` and still says that version is not published and that npm latest is `0.6.0`. Those two sentences are stale. Do **not** hand-edit a `0.7.1` or `0.7.2` section into the changelog to catch npm up. Do **not** run `yarn version-packages` to do it. Other packages still have pending changesets, and that command would version them and can move Sig off `0.7.0` even though npm is already at `0.7.2`.

`.changeset/sig-juice-icon-avatar-table.md` is still unconsumed (`"@citrusworx/sigjs": minor`). It describes the `bind` work npm **0.7.2** already includes. Do not add a second changeset for that work.

The Changeset that produced `0.4.0` (`sigjs-juice-adapter`) is **consumed**. Do not re-add it. The three Changesets that produced `0.3.0` (`sigjs-reactive-props-routes`, `sigjs-runtime-polish`, `sigjs-standalone-docs`) are **consumed**. Do not re-add them. The three that describe the `0.7.0` tree (`sigjs-bind-list`, `sigjs-v1-api-cleanup`, `sigjs-api-surface`) are **consumed** in the changelog. Do not re-add them.

**0.6.0** was published 2026-10-21 from an unversioned local build (`gitHead` `3055fe2e`). `libraries/sig/package.json` never recorded `0.6.0`.

There is **no** Changesets GitHub Action and **no** `NPM_TOKEN` in this repo. Publish is manual, same as Juice / Nectarine. Do not invent CI credentials.

## Semver

- `patch`: packaging fixes, docs, bug fixes that do not change the public API shape
- `minor`: new runtime capabilities (reactive function-valued props, `:param` / `*` routing, new exports)
- `major`: breaking API changes for a 1.x line

Before 1.0, a breaking change ships as a **minor**, not as `1.0.0`. `0.7.0` removed `captureCleanupScope` from the package root and stopped re-exporting `jsxDEV` from `.` (`jsxDEV` stayed on `./jsx-dev-runtime`). That was a minor. A `^0.6.0` install does not receive it. `major` waits for the 1.x line.

`0.x` caret ranges do **not** include the next minor: `^0.4.0` is `>=0.4.0 <0.5.0`. `^0.7.0` is `>=0.7.0 <0.8.0` and installs npm **0.7.2** today. `^0.6.0` does not install `0.7.0` or later. `^0.4.0` installs neither `0.6.0` nor `0.7.0`.

## Required Checks

```bash
yarn changeset status
yarn verify:juice
yarn workspace @citrusworx/sigjs test
```

Juice Package CI is the path-filter gate (`libraries/sig/**` → `yarn verify:juice` + `yarn changeset status`).

## Next version

The workspace version is still **0.7.0**. npm latest is **0.7.2**. Do not bump `libraries/sig/package.json` in a docs change. Do not run `yarn version-packages` while other packages have pending changesets.

Confirm with `npm view @citrusworx/sigjs version` before writing install lines. Add a Changeset only for work that is **not** already in npm **0.7.2** and **not** already described by `.changeset/sig-juice-icon-avatar-table.md`.

Workspace packages that publish (`@citrusworx/juiceui`, `@citrusworx/sugar`) declare `@citrusworx/sigjs` `^0.7.0` so Yarn links `libraries/sig`. `^0.6.0` and `^0.4.0` do not. Private apps may keep `workspace:*` (MiaMakes front does).

## Publish Flow

Drew publishes. This checklist does not publish.

1. Land a Changeset only for work that is not already in npm **0.7.2** and not already described by `.changeset/sig-juice-icon-avatar-table.md`.
2. Merge with Juice Package CI green.
3. On a clean `master` (or a `release/sigjs-*` branch), do not run `yarn version-packages` until non-Sig changeset files are parked, if this publish should not version them. That command versions every package with a pending changeset (grapevine, kiwipress, nectarine, webengine, and the rest) and can move `@citrusworx/sigjs` off `0.7.0` even though npm is already at `0.7.2`.
4. A later publish, after those files are parked, may run:

   ```bash
   yarn version-packages
   ```

5. Review `libraries/sig/package.json` and `CHANGELOG.md` against `npm view @citrusworx/sigjs version`. A publish has to be newer than **0.7.2**. The workspace manifest is still **0.7.0**, and the changelog does not record **0.7.1** or **0.7.2**.
6. Do not publish from a dirty worktree.
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
- Outside consumers (and `libraries/sig/examples/counter`) install `@citrusworx/sigjs@^0.7.0` from the registry. That range resolves. npm latest is **0.7.2**. The committed counter `package-lock.json` does not record that tarball, so `npm ci` in the example folder fails until the lock is refreshed. `npm install` does resolve it.
