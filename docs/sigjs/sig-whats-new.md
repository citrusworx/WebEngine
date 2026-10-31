# What's new in 1.0

`@citrusworx/sigjs@1.0.0` was published on 2026-10-29 (`gitHead` `4ef7b2e7`). It freezes the **0.7.2** API. The published `dist/` is the same as 0.7.2 except `package.json` and the README. No export was added, removed, or renamed.

The default branch matches that tarball. There is no master-only public API.

## What 1.0 changes

| Topic | 1.0.0 |
|---|---|
| Semver | A breaking change to a documented stable export is a major. A new public API is a minor. A fix is a patch |
| Install range | `^1.0.0` is `>=1.0.0 <2.0.0`. `^0.7.0` does not install 1.0.0 |
| `Signal.set` | Still always notifies, including when the value is unchanged. That behavior is part of the contract |
| `bindList`, `ListItem` | Still experimental |
| SSR, virtual DOM, `<For>`, `<Show>` | Still non-goals |
| Juice peer | Still optional `@citrusworx/juiceui` `>=0.9.1 <1` |

The written policy is [Semver](./release-checklist.md#semver). How to move off 0.x is [Migrating from 0.x](./sig-migrating.md).

## What you already have if you are on 0.7.2

Nothing to recode. Bump the dependency to `^1.0.0` when you want the stable line. Stay on `^0.7.0` only if you intend to stay off 1.x.

## What landed in the 0.7 line, and is therefore in 1.0

These are not new in the 1.0.0 diff. They are the API 1.0 freezes. Versions before 0.7.2 do not have all of them.

| Version | In the 1.0 freeze |
|---|---|
| 0.7.0 (2026-10-21) | `bindList` and `untrack` on the root. `captureCleanupScope` and `jsxDEV` removed from the root. Public `any` removed from JSX. `JSX` namespace exported from the JSX runtime entries. `Signal.set` documented as always-notify |
| 0.7.1 (2026-10-27) | Same bits as 0.7.0. The version field changed. Do not use this tarball for the Juice names below |
| 0.7.2 (2026-10-27) | `bind` learns `icon-button`, `avatar`, and `table`. Avatar and table are read-only. Icon button writes `pressed` through `toggle` when the host has `[toggle]` |

## Entry points

| Entry | Role |
|---|---|
| `@citrusworx/sigjs` | Signals, JSX, `bindList`, `SigRouter` |
| `@citrusworx/sigjs/jsx-runtime` | Automatic JSX |
| `@citrusworx/sigjs/jsx-dev-runtime` | `jsxDEV` |
| `@citrusworx/sigjs/sig-router` | Router without pulling JSX |
| `@citrusworx/sigjs/juice` | Optional `bind` |

## Juice, as verified for this release

| Juice | With Sig 1.0.0 |
|---|---|
| 0.9.1 | The `./juice` module fails to load |
| 0.9.2 | Loads. Binding icon button, avatar, or table throws |
| 0.9.3, 0.9.4, 0.9.5 | All 28 names bind |

The full table is [Runtime binding](./sig-juice-integration.md#runtime-binding). Juice 0.9.4 and 0.9.5 also publish runtimes Sig does not bind: pressable, touchable row, and keyboard avoider.

## Explicitly unchanged

| Still true | |
|---|---|
| Function children are text | `String(child())` |
| Components run once | They are not render functions |
| `memo` is `{ get }` | No public dispose |
| No `<For>` or `<Show>` | `replaceChildren` or `bindList` |
| `style={{}}` does not apply CSS | A style string does. The object form is only in the types |
