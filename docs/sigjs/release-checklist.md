# Sig.js Release Checklist

Use this before publishing `@citrusworx/sigjs`.

npm **`0.7.2`** is the current registry cut (published 2026-10-27, `gitHead` `c794c06f`, PR #295). `libraries/sig/package.json` is **0.7.2**. `libraries/sig/CHANGELOG.md` records **0.7.2**, **0.7.1**, and **0.7.0**. Do **not** republish `0.7.2`, `0.7.1`, `0.7.0`, `0.6.0`, `0.4.0`, `0.3.0`, or `0.2.0`.

**0.7.0** was published 2026-10-21 (`gitHead` `747f2f71`, PR #270). **0.7.1** (2026-10-27, `gitHead` `b2f2b287`) is a stale build: the tarball matches **0.7.0** except the `version` field, and its published `dist/juice.d.ts` does not name icon-button, avatar, or table. **0.7.2** does. Use **0.7.2**.

`.changeset/sig-juice-icon-avatar-table.md` (minor, the PR #295 `bind` work) and `.changeset/sigjs-npm-072-docs.md` (patch, the published-version notes from PR #298) are **consumed**. Do not re-add them. Do **not** run `yarn version-packages` to catch Sig up with npm. Other packages still have pending changesets, and that command would version them.

`yarn changeset status` (what Juice Package CI runs, with no `--since`) does not list `@citrusworx/sigjs` once those two files are gone. `yarn changeset status --since=origin/master` still exits 1 on a diff that touches `libraries/sig` and adds no changeset. `@changesets/cli` 2.29.6 does not treat a hand-set `package.json` version as covering that diff. Do not add a changeset to silence it. A new Sig changeset would wait for `yarn version-packages` and move the manifest off **0.7.2**.

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

The workspace version is **0.7.2**. npm latest is **0.7.2**. Do not bump `libraries/sig/package.json` in a docs-only change. Do not run `yarn version-packages` while other packages have pending changesets.

Confirm with `npm view @citrusworx/sigjs version` before writing install lines. Add a Changeset only for work that is **not** already in npm **0.7.2**.

Workspace packages that publish (`@citrusworx/juiceui`, `@citrusworx/sugar`) declare `@citrusworx/sigjs` `^0.7.0` so Yarn links `libraries/sig`. `^0.6.0` and `^0.4.0` do not. Private apps may keep `workspace:*` (MiaMakes front does).

## Publish Flow

Drew publishes. This checklist does not publish.

1. Land a Changeset only for work that is not already in npm **0.7.2**.
2. Merge with Juice Package CI green.
3. On a clean `master` (or a `release/sigjs-*` branch), do not run `yarn version-packages` until non-Sig changeset files are parked, if this publish should not version them. That command versions every package with a pending changeset (grapevine, kiwipress, nectarine, webengine, and the rest).
4. A later publish, after those files are parked, may run:

   ```bash
   yarn version-packages
   ```

5. Review `libraries/sig/package.json` and `CHANGELOG.md` against `npm view @citrusworx/sigjs version`. Both record **0.7.2**. A later publish has to be newer than **0.7.2**.
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
- Keep published packages on a caret range that matches the workspace version being published (`^0.7.0`). The workspace is **0.7.2**. `^0.7.0` (`>=0.7.0 <0.8.0`) still matches it. Do not use `workspace:^` on packages that `changeset publish` will pack; npm does not rewrite Yarn workspace protocol.
- Private apps may keep `workspace:*` / `workspace:^`.
- Outside consumers (and `libraries/sig/examples/counter`) install `@citrusworx/sigjs@^0.7.0` from the registry. That range resolves. npm latest is **0.7.2**. The committed counter `package-lock.json` records `@citrusworx/sigjs@0.7.2`, and `npm ci` in that folder installs it.
