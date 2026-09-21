# Juice Banner Runtime

This document explains the current banner runtime in `libraries/juice/src/js/src/banner/banner-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, and combobox:

> If a user writes valid Juice banner markup and it exists in the browser, the dismissible callout should just work.

That is the standard.

## The Goal

The banner runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize banner behavior in their app code.

There is no `Banner()` Sig factory. Markup plus the runtime is the contract. Authors place `[banner]` nodes — this is not a portal.

This surface is Emerging, not Stable-ish. Valid markup should work after importing the JS entry, but the API is still likely to evolve.

Banner is an inline alert / callout. It is not a toast stack, not a dialog overlay, not a drawer, and not the surface `overlay="frost|tint"` utility. There is no `[banner-region]`, no focus trap, no Escape steal, and no auto-dismiss timer. The banner stays until dismiss.

## Markup Contract

The runtime is aligned with Juice’s banner chrome:

```html
<div banner role="status">
  <div banner-body>Scheduled maintenance tonight.</div>
  <button type="button" banner-close aria-label="Dismiss">×</button>
</div>

<div banner="full" banner-tone="warning" name="maintenance" banner-persist="session">
  <div banner-body>Scheduled maintenance tonight.</div>
  <button type="button" banner-close aria-label="Dismiss">×</button>
</div>
```

It requires a `[banner]` root. Closed vs open is the native `hidden` attribute on that root. The node stays in the DOM. The runtime does **not** write `content="active"` or `content="hidden"`. Those values clash with Juice layout `[content]`.

**Layout:** `[banner]` / `[banner="full"]`. Bare is inset. `full` is edge-to-edge (width 100%, no radius). Do not put status on the `banner` attribute — that slot is layout.

**Status:** optional `[banner-tone="info|success|warning|error"]`. Bare `[banner]` without `banner-tone` is neutral.

**Slots:** optional `[banner-body]` and `[banner-close]` inside the banner.

**Persist:** optional `banner-persist="session|local"` plus a `name` or `id` key. Without persist, or without a key, dismiss is in-memory only.

**Close:** `[banner-close]` inside the banner. Enter / Space also dismiss when the close control is not a native button. Escape is never stolen — see [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).

Prefer shipping `role="status"` (info / success / neutral) or `role="alert"` (error / warning) in markup. The runtime fills that if it is missing, plus an empty close name (`aria-label="Dismiss"`).

Theme paint uses `--juice-banner-*` roles. There is no panel-shadow role; banner is inline, not an elevated snackbar. See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md). `[banner]` is an inline alert / callout, not a toast stack, not a dialog overlay, not a drawer, and not the surface `overlay="frost|tint"` utility. There is no scrim and no `[banner-region]`. Optional `surfaceTone` on `[banner]` is allowed; do not force it. Toast is a corner snackbar stack; banner is an in-flow callout.

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the banner runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startBannerRuntime();
    });
  } else {
    startBannerRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

`stopBannerRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createBanner(options?)
initBanner(options?)
startBannerRuntime()
stopBannerRuntime()
```

These are useful for internal control, tests, or advanced cases.

`createBanner()` can run alongside the automatic document runtime. Each click or key event is claimed once, so a custom-root controller does not double-fire with the singleton.

## BannerOptions

The configurable shape is:

```ts
type BannerOptions = {
  root?: ParentNode;
  bannerSelector?: string;
  closeSelector?: string;
};
```

By default, Juice uses:

```ts
{
  root: document,
  bannerSelector: '[banner]',
  closeSelector: '[banner-close]',
}
```

## BannerController

```ts
type BannerController = {
  destroy: () => void;
  sync: () => void;
  show: (target?: HTMLElement | null) => void;
  dismiss: (target?: HTMLElement | null) => void;
};
```

`show()` and `dismiss()` toggle native `hidden` on a `[banner]`. `show()` never hides siblings and never moves focus into the banner.

## What the Runtime Actually Does

The runtime performs seven main jobs:

1. Find `[banner]` / `[banner="full"]` roots. There is no region wrapper and no portal
2. Set banner `role="status"` for info / success / neutral, or `role="alert"` for `banner-tone="error|warning"`
3. Fill an empty `[banner-close]` name (`aria-label="Dismiss"`) and button role/tabindex on non-native closes
4. Show / dismiss via native `hidden` on the banner (the node stays); `show()` never hides siblings and does not move focus into the banner
5. Remember dismiss when `banner-persist="session|local"` plus a `name` or `id` is set (`juice-banner:<key>`). `show()` clears that key
6. Handle click (`[banner-close]`) and keyboard (Enter / Space on non-button closes)
7. Leave Escape to the overlay / popover / combobox / toast / tooltip yield order. Banner does not steal it. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).

Banner is not exclusive. This runtime does not close a modal, drawer, toast, popover, wizard, tooltip, or combobox, and those runtimes do not close a banner.

There is no focus trap. There is no auto-dismiss timer. The banner stays until dismiss.

## Persist

Persist is optional and lean.

`banner-persist="session"` writes to `sessionStorage`. `banner-persist="local"` writes to `localStorage`. The key is `name` when present, otherwise `id`. The stored name is `juice-banner:<key>` with value `"1"`.

Without `banner-persist`, or without a `name` / `id`, dismiss is in-memory only. A later `sync()` (or a new controller) re-hides a persisted banner that is visible again. `show()` removes the stored key so the callout can return.

Storage errors (private mode / quota) still apply dismiss in the current document.

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If a banner appears later, the observer schedules a `sync()` call so Juice can wire roles and close names, apply a persisted dismiss, and start handling close.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

- Enter and Space activate non-button `[banner-close]` controls (native buttons already synthesize a click)
- Escape is not handled. Banner never steals it. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- There is no focus trap. Tab is not wrapped. The runtime does not move focus into the banner on show

Arrow-key roving is intentionally out of scope. There is no auto-dismiss timer.

## Limitations

- No `Banner()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- Banner is not a toast stack: no `[banner-region]`, no corner portal, no stacking runtime, and no auto-dismiss timer.
- Banner is not a dialog: no focus trap, no `aria-modal`, no overlay, and no Escape steal. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- Roots use native `hidden`, never layout `content=`. The node stays in the DOM.
- Persist needs `banner-persist="session|local"` plus a `name` or `id`. Without both, dismiss is in-memory only.
- `show()` never hides siblings. Multiple banners can stay visible.
- There is no z-index elevation. Banner is inline chrome. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- Centered modal / dialog, edge-docked drawer, toast-stack, popover, wizard, tooltip, and combobox behavior are not part of this runtime. See [Modal Runtime](./juice-modal-runtime.md), [Drawer Runtime](./juice-drawer-runtime.md), [Toast Runtime](./juice-toast-runtime.md), [Popover Runtime](./juice-popover-runtime.md), [Wizard Runtime](./juice-wizard-runtime.md), [Tooltip Runtime](./juice-tooltip-runtime.md), and [Combobox Runtime](./juice-combobox-runtime.md).

## Why This Matches Navigation

The banner runtime copies the navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, and combobox lifecycle by convention:

- DOM-first
- automatic boot
- event delegation
- MutationObserver plus rAF `sync()`
- idempotent singleton `start*Runtime` / `stop*Runtime`
- framework-agnostic

Shared internals under `libraries/juice/src/js/src/shared/` are not a public multi-feature runtime API.

## Design Rule Going Forward

Interactive Juice browser features should follow this standard:

> If valid Juice markup exists in the browser, the feature should activate automatically and work without app glue.
