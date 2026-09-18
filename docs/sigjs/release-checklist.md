# Sig.js Release Checklist

Use this before publishing `@citrusworx/sigjs`.

npm **`0.3.0`** is current (published 2026-09-18). Do **not** republish `0.3.0`. Do **not** republish `0.2.0`.

There is **no** Changesets GitHub Action and **no** `NPM_TOKEN` in this repo. Publish is manual, same as Juice / Nectarine. Do not invent CI credentials.

## Semver

- `patch`: packaging fixes, docs, bug fixes that do not change the public API shape
- `minor`: new runtime capabilities (reactive function-valued props, `:param` / `*` routing, new exports)
- `major`: breaking API changes for a 1.x line

`0.x` caret ranges do **not** include the next minor: `^0.3.0` is `>=0.3.0 <0.4.0`. `^0.2.0` does **not** include `0.3.0`.

Workspace `libraries/sig/package.json` may still read `0.2.0` until a version commit lands. Treat **npm `0.3.0`** as the published truth. Consume remaining `sigjs-*.md` Changesets on the next version run so they do not try to re-cut `0.3.0`.

## Required Checks

```bash
yarn changeset status
yarn verify:juice
yarn workspace @citrusworx/sigjs test
```

Juice Package CI is the path-filter gate (`libraries/sig/**` → `yarn verify:juice` + `yarn changeset status`).

## Next version

After `0.3.0`, the next publish is:

- **0.3.1** (patch) for packaging / docs / bug fixes, or
- **0.4.0** (minor) only if new public runtime capabilities land

Do not invent a fake version. Confirm with `npm view @citrusworx/sigjs version` before writing install lines.

Workspace dependents (`@citrusworx/juiceui`, `@citrusworx/sugar`, Blackwater front) still declare `^0.2.0` on master. That range does **not** include `0.3.0`. The next `yarn version-packages` should rewrite those ranges to `^0.3.0` (and may patch-bump Juice/Sugar because `updateInternalDependencies` is `patch`).

## Publish Flow

1. Land runtime/docs Changesets for the work that is *not* already in `0.3.0`.
2. Merge with Juice Package CI green.
3. On a clean `master` (or a `release/sigjs-*` branch), park **non-Sig** changeset files so grapevine / kiwipress / nectarine / webengine are not versioned from *their* notes.
4. Apply versions:

   ```bash
   yarn version-packages
   ```

5. Review `libraries/sig/package.json` (must be **newer than 0.3.0**) and `CHANGELOG.md`. Expect Juice + Sugar patch version files and `^0.3.0` dep ranges in the same commit if their ranges still say `^0.2.0`. Restore parked non-Sig changesets.
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
- Keep published packages on a caret range that matches the **current** published `libraries/sig` version (`^0.3.0`). Do not use `workspace:^` on packages that `changeset publish` will pack; npm does not rewrite Yarn workspace protocol.
- Private apps may keep `workspace:*` / `workspace:^`.
- Outside consumers (and `libraries/sig/examples/counter`) install `@citrusworx/sigjs@^0.3.0` from the registry.
