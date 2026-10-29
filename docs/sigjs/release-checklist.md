# Sig.js Release Checklist

Use this before publishing `@citrusworx/sigjs`.

Workspace `libraries/sig/package.json` is **1.0.0**. `libraries/sig/CHANGELOG.md` records **1.0.0**, **0.7.2**, **0.7.1**, and **0.7.0**. npm `latest` is **1.0.0** (published 2026-10-29, `gitHead` `4ef7b2e7`). **1.0.0** is the **0.7.2** API (published 2026-10-27, `gitHead` `c794c06f`, PR #295). Do **not** republish `1.0.0`, `0.7.2`, `0.7.1`, `0.7.0`, `0.6.0`, `0.4.0`, `0.3.0`, or `0.2.0`.

**0.7.0** was published 2026-10-21 (`gitHead` `747f2f71`, PR #270). **0.7.1** (2026-10-27, `gitHead` `b2f2b287`) is a stale build: the tarball matches **0.7.0** except the `version` field, and its published `dist/juice.d.ts` does not name icon-button, avatar, or table. **0.7.2** does. **1.0.0** keeps that **0.7.2** surface.

`.changeset/sig-juice-icon-avatar-table.md` (minor, the PR #295 `bind` work) and `.changeset/sigjs-npm-072-docs.md` (patch, the published-version notes from PR #298) are **consumed**. Do not re-add them. Do **not** add a new Sig changeset for **1.0.0**. Do **not** run `yarn version-packages`. Other packages still have pending changesets, and that command would version them. A Sig changeset would also move the manifest off **1.0.0**.

`yarn changeset status` (what Juice Package CI runs, with no `--since`) does not require a changeset for a hand-set version. `yarn changeset status --since=origin/master` exits 1 on a diff that touches `libraries/sig` and adds no changeset. `@changesets/cli` 2.29.6 does not treat a hand-set `package.json` version as covering that diff. Do not add a changeset to silence `--since`. Juice Package CI does not pass `--since`.

The Changeset that produced `0.4.0` (`sigjs-juice-adapter`) is **consumed**. Do not re-add it. The three Changesets that produced `0.3.0` (`sigjs-reactive-props-routes`, `sigjs-runtime-polish`, `sigjs-standalone-docs`) are **consumed**. Do not re-add them. The three that describe the `0.7.0` tree (`sigjs-bind-list`, `sigjs-v1-api-cleanup`, `sigjs-api-surface`) are **consumed** in the changelog. Do not re-add them.

**0.6.0** was published 2026-10-21 from an unversioned local build (`gitHead` `3055fe2e`). `libraries/sig/package.json` never recorded `0.6.0`.

There is **no** Changesets GitHub Action and **no** `NPM_TOKEN` in this repo. Publish is manual, same as Juice / Nectarine. Do not invent CI credentials.

## Semver

**1.0.0** starts the stable line. Before 1.0, a breaking change shipped as a **minor**, not as `1.0.0`. `0.7.0` removed `captureCleanupScope` from the package root and stopped re-exporting `jsxDEV` from `.` (`jsxDEV` stayed on `./jsx-dev-runtime`). That was a minor under the 0.x rule. A `^0.6.0` install does not receive it. A `^0.7.0` install does not receive **1.0.0**. That 0.x rule is finished.

From **1.0.0**:

- **major** — a breaking change to the public API. `^1.0.0` does not install it.
- **minor** — a new public API that existing callers can ignore (a new documented export, or a new optional argument that does not change existing calls).
- **patch** — a fix, packaging change, or docs change that does not change the public API.

The public API is every documented export of these entries, including the behavior those docs promise:

- `.`
- `./jsx-runtime`
- `./jsx-dev-runtime`
- `./sig-router`
- `./juice` (`bind` and the types it documents)

`bindList` and `ListItem` are exported and tagged experimental. A breaking change to an experimental export can ship as a minor. A breaking change to a stable export is a major. `captureCleanupScope` is not a public export. `Signal.set` always notifies, including when the value is unchanged. That behavior is part of the 1.x contract.

`^1.0.0` is `>=1.0.0 <2.0.0`. It installs minors and patches. It does not install `2.0.0`. `^0.7.0` is `>=0.7.0 <0.8.0`. It installs npm **0.7.2** and never installs **1.0.0**. Older 0.x carets stay inside one minor: `^0.4.0` is `>=0.4.0 <0.5.0`, and `^0.6.0` does not install `0.7.0` or later.

The optional peer `@citrusworx/juiceui` stays `>=0.9.1 <1`. Widening that range (accepting more peer versions, `bind` unchanged) is a minor. Narrowing it is a major, because an install that worked can start failing. The peer stays optional. The main entry does not import Juice.

SSR, a virtual DOM, `<For>`, and `<Show>` are non-goals for 1.0. Shipping one of them later is a new API (a minor) unless it changes a stable export.

## Required Checks

```bash
yarn changeset status
yarn verify:juice
yarn workspace @citrusworx/sigjs test
```

Juice Package CI is the path-filter gate (`libraries/sig/**` → `yarn verify:juice` + `yarn changeset status`).

## This version

The workspace version is **1.0.0**. npm `latest` is **1.0.0**. Do not bump `libraries/sig/package.json` in a docs-only change. Do not run `yarn version-packages` while other packages have pending changesets. Do not add a Sig changeset for work already in **1.0.0**. A Sig changeset would move the manifest off **1.0.0** the next time that command runs.

Confirm with `npm view @citrusworx/sigjs version` before writing install lines. `npm install @citrusworx/sigjs` installs **1.0.0**. Add a Changeset only for work that is **not** already in **1.0.0**.

Workspace packages that publish (`@citrusworx/juiceui`, `@citrusworx/sugar`) declare `@citrusworx/sigjs` `^1.0.0` so Yarn links `libraries/sig`. `^0.7.0` does not. **1.0.0** is on npm, so a published manifest that requires `^1.0.0` can resolve. Private apps may keep `workspace:*` (MiaMakes front and KiwiPress front do) or `workspace:^` (Drew Winkles does). Blackwater front is private and declares `^1.0.0`.

## Publish Flow

Drew publishes. This checklist does not publish.

1. Do not add a Sig changeset. **1.0.0** is already in `package.json` and `CHANGELOG.md`.
2. Merge with Juice Package CI green (`yarn install --immutable`, `yarn verify:juice`, `yarn changeset status`).
3. On a clean `master`, do not run `yarn version-packages`. That command versions every package with a pending changeset (grapevine, kiwipress, nectarine, webengine, juice, sugar, and the rest) and would move `@citrusworx/sigjs` off **1.0.0** if a Sig changeset existed.
4. Review `libraries/sig/package.json` and `CHANGELOG.md` against `npm view @citrusworx/sigjs version`. The manifest, the changelog, and the registry `latest` tag are **1.0.0**. Do not republish **1.0.0**.
5. Do not publish from a dirty worktree.
6. Build is `prepack` (`tsc`). Publish **Sig only**:

   ```bash
   yarn npm login
   yarn workspace @citrusworx/sigjs npm publish --access public
   ```

   `yarn release-packages` publishes **every** versioned public package in that commit. Use it only when that is intended.

7. `libraries/sig/examples/counter` and `examples/todo-app` pin `@citrusworx/sigjs@^1.0.0`. Each `package-lock.json` records **1.0.0**. The ToDo course uses that same range. Neither folder is a Yarn workspace member.
8. If you used `changeset publish`, push any tags it created. The **1.0.0** publish did not use it.

## Notes

- Do **not** run `npm publish` from CI in this repository until a documented workflow exists with a real org token.
- Keep published packages on a caret range that matches the workspace version being published (`^1.0.0`). Do not use `workspace:^` on packages that `changeset publish` will pack; npm does not rewrite Yarn workspace protocol.
- Private apps may keep `workspace:*` / `workspace:^`.
- `libraries/sig/examples/counter` installs `@citrusworx/sigjs@^1.0.0` from the registry. The committed `package-lock.json` records `@citrusworx/sigjs@1.0.0`, and `npm ci` in that folder installs it.
