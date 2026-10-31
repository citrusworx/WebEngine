# Migrating from 0.x

1.0.0 is the 0.7.2 API under semver. Most breaks happened earlier, while 0.x still shipped breaks as minors. This page lists them from the published tarballs.

If you are on **0.7.2**, change the range to `^1.0.0`. No call site has to move. If you are on **0.7.0** or **0.7.1**, read the Juice section before you bind icon button, avatar, or table.

| From | To 1.0.0 |
|---|---|
| 0.7.2 | Version range only |
| 0.7.1 | Treat it as 0.7.0. It does not contain the 0.7.2 Juice names |
| 0.7.0 | Add the three Juice names only if you bind them. Root exports already match |
| 0.6.0 | Drop root imports of `captureCleanupScope` and `jsxDEV` |
| 0.4.0 or 0.3.0 | Also adopt `bindList` / `untrack` only if you want them. They are new, not required |
| 0.2.0 | Param factories take `params`. Reactive props exist. Tests are no longer in the tarball |

`^0.7.0` does not install 1.0.0. `^0.6.0` does not install 0.7.0. `^1.0.0` is `>=1.0.0 <2.0.0`.

## 0.7.2 to 1.0.0

No public change. `Signal.set` still always notifies. `bindList` stays experimental. The peer stays `@citrusworx/juiceui` `>=0.9.1 <1`.

## 0.7.1

Published the same day as 0.7.2. The tarball matches 0.7.0 except the `version` field. `dist/juice.d.ts` does not name icon button, avatar, or table. Use 0.7.2 or 1.0.0.

## 0.7.0

This is the cleanup that 1.0 keeps.

| Remove | Replacement |
|---|---|
| `import { captureCleanupScope } from "@citrusworx/sigjs"` | Do not import it. Component and `bindList` cleanup is automatic. The function remains internal |
| `import { jsxDEV } from "@citrusworx/sigjs"` | `import { jsxDEV } from "@citrusworx/sigjs/jsx-dev-runtime"` |
| JSX typed as `any` | `Child` and `JSX.IntrinsicElements` are real types. A function child must return text |

`JSX` is exported from `./jsx-runtime` and `./jsx-dev-runtime`. `jsxImportSource` no longer depends on a root import.

`bindList` and `untrack` were already in the unpublished-in-`package.json` 0.6.0 tarball. 0.7.0 kept them and marked `bindList` and `ListItem` experimental.

## 0.6.0

`package.json` in this repo never recorded 0.6.0. The npm tarball (`gitHead` `3055fe2e`, 2026-10-21) still exports `captureCleanupScope` and `jsxDEV` from the package root, still types parts of JSX as `any`, and already has `bindList`. Move to 0.7.0 or later for the cleanup, then to 1.0.0 for the stable line.

## 0.4.0 and the Juice adapter

0.4.0 added `@citrusworx/sigjs/juice` and `bind`. The main entry still does not import Juice. The peer on that tarball was `^0.9.1`. 0.7.0 widened the written range to `>=0.9.1 <1`, which is the 1.0 range.

Icon button, avatar, and table were not in 0.4.0, 0.6.0, 0.7.0, or 0.7.1. They arrived in 0.7.2.

### Binding those three

| Your Juice | On Sig 1.0.0 |
|---|---|
| 0.9.1 | `import "@citrusworx/sigjs/juice"` throws `startDisclosureRuntime` is not exported. Upgrade Juice before using the adapter |
| 0.9.2 | Adapter loads. Binding icon button, avatar, or table throws `needs a newer @citrusworx/juiceui` |
| 0.9.3+ | All 28 names bind |

The peer range says 0.9.1 is allowed. The 1.0.0 adapter does not load against that tarball. That mismatch is a package bug, not a migration step you can code around inside Sig. Install Juice 0.9.2 or newer to import the adapter, and 0.9.3 or newer to bind the three new names.

Write-back on 1.0.0 is switch, checkbox, disclosure, modal, and icon button. Avatar and table are read-only. Older adapters did not write icon button.

## 0.3.0

| Change | What to do |
|---|---|
| Route factories receive `params` | `function User(params: { id: string })`. A zero-arg factory from 0.2 still runs, but the type is `(params) => Node` |
| `RouteParams`, `RouteFactory`, `RouteView`, and `RouteMap` are exported | They were unexported in 0.2.0 |
| Function-valued host props | `className={() => ...}` updates. A bare `className={flag.get()}` stays a snapshot |
| `batch` is nested-safe | Inner `batch` no longer flushes early. A throw still flushes successful sets |
| `navigate` normalizes a missing leading slash | `navigate("about")` is `/about` |
| `"*"` | Optional. Without it, `navigate` to an unknown path is a no-op and `popstate` empties the target |

## 0.2.0

The first published runtime: `Signal`, `effect`, `batch`, `memo`, `mount`, `disposeTree`, JSX, and exact-path `SigRouter`. That tarball also shipped test files under `dist/` and re-exported `jsxDEV` from the root. 0.3.0 stopped publishing tests. 0.7.0 stopped re-exporting `jsxDEV`.

There was no `untrack`, no `bindList`, no `bind`, and no `:param` matching. `captureCleanupScope` was a public export on the root.

## Checklist

| Step | |
|---|---|
| Set the dependency to `^1.0.0` | `^0.7.0` will not move |
| Search for `captureCleanupScope` and root `jsxDEV` | Delete or retarget |
| Search for `new Signal` | Call `Signal(value)` |
| Search for `{() => <Tag />}` | That stringifies. Use `hidden` or `replaceChildren` |
| If you bind Juice widgets | Use Juice ≥ 0.9.2 to load the adapter, ≥ 0.9.3 for icon button, avatar, and table |
| If you relied on `set` skipping equal values | It does not. Compare yourself, or read a `memo` |

The symbol-by-symbol contract is the [API reference](./sig-api.md).
