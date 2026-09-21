# Juice Toast Runtime

This document explains the current toast / snackbar runtime in `libraries/juice/src/js/src/toast/toast-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation, accordion, tabs, modal, and drawer:

> If a user writes valid Juice toast markup and it exists in the browser, the snackbar behavior should just work.

That is the standard.

## The Goal

The toast runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize toast behavior in their app code.

There is no `Toast()` Sig factory. Markup plus the runtime is the contract. There is no programmatic message factory either — authors place `[toast-region]` and `[toast]` nodes.

This surface is Emerging, not Stable-ish. Valid markup should work after importing the JS entry, but the API is still likely to evolve.

Toast is not a dialog. It is a non-modal stack. It is not an inline banner / callout.

## Markup Contract

The runtime is aligned with Juice’s toast chrome:

```html
<div toast-region>
  <div toast id="demo-toast">
    <div toast-title>Saved</div>
    <div toast-body>Your changes were written.</div>
    <button type="button" toast-close aria-label="Dismiss">×</button>
  </div>
</div>
```

It requires a `[toast-region]` root. Authors place that region in markup. The runtime does **not** invent a portal. The region stays in the DOM. Closed vs open for an individual `[toast]` is the native `hidden` attribute. The runtime does **not** write `content="active"` or `content="hidden"`. Those values clash with Juice layout `[content]`.

**Position:** `[toast-region]` / `[toast-region="top-right"]` / `"top-left"` / `"bottom-right"` / `"bottom-left"`. Bare or unspecified is top-right.

**Status:** bare `[toast]` is neutral. Optional values are `[toast="success|error|info|warning"]`.

**Slots:** optional `[toast-title]`, `[toast-body]`, and `[toast-close]` inside the toast.

**Duration:** optional `toast-duration` on a toast, in milliseconds (`"3000"`). `"0"`, `"Infinity"`, or a negative number is sticky. The create option `defaultDuration` is `5000`. A `defaultDuration` of `0` / `Infinity` / negative also means no auto-dismiss.

**Live polarity:** optional `toast-live="assertive"` on the region or a toast, or set `aria-live="assertive"` in markup.

**Close:** `[toast-close]` inside the toast, or Escape for the most recently shown visible toast when no open modal/drawer overlay, popover, combobox list, or tooltip exists. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).

Prefer shipping `aria-live="polite"` on the region. The runtime fills missing live-region ARIA and toast roles if they are missing, plus an empty close name (`aria-label="Dismiss"`).

Theme paint uses `--juice-toast-*` roles. Core CSS paints `[toast-region]` at **z-index 1100**. That is a structural band, not a theme contract — see [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands). See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md). `[toast-region]` is a non-modal stack, not the surface `overlay="frost|tint"` utility, not `[modal-overlay]`, and not `[drawer-overlay]`. Modal is a centered dialog; drawer is an edge-docked panel; toast is a corner snackbar.

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the toast runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startToastRuntime();
    });
  } else {
    startToastRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

`stopToastRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createToast(options?)
initToast(options?)
startToastRuntime()
stopToastRuntime()
```

These are useful for internal control, tests, or advanced cases.

`createToast()` can run alongside the automatic document runtime. Each click or key event is claimed once, so a custom-root controller does not double-fire with the singleton.

## ToastOptions

The configurable shape is:

```ts
type ToastOptions = {
  root?: ParentNode;
  regionSelector?: string;
  toastSelector?: string;
  closeSelector?: string;
  defaultDuration?: number;
};
```

By default, Juice uses:

```ts
{
  root: document,
  regionSelector: '[toast-region]',
  toastSelector: '[toast]',
  closeSelector: '[toast-close]',
  defaultDuration: 5000,
}
```

## ToastController

```ts
type ToastController = {
  destroy: () => void;
  sync: () => void;
  show: (target?: HTMLElement | null) => void;
  dismiss: (target?: HTMLElement | null) => void;
};
```

`show()` and `dismiss()` toggle native `hidden` on a `[toast]`. `show()` never hides siblings. Stacking is the point.

## What the Runtime Actually Does

The runtime performs seven main jobs:

1. Find `[toast-region]` roots and `[toast]` descendants (orphans outside a region are ignored)
2. Fill missing `aria-live` (`polite`, or `assertive` when `toast-live="assertive"`) and `aria-relevant="additions"` on the region
3. Set toast `role="status"`, or `role="alert"` for `toast="error"` or assertive live
4. Fill an empty `[toast-close]` name (`aria-label="Dismiss"`) and button role/tabindex on non-native closes
5. Show / dismiss via native `hidden` on the toast (the region stays); `show()` never hides siblings and does not move focus into the toast
6. Auto-dismiss after `defaultDuration` (5000) or `toast-duration`; pause while pointer or focus is inside the toast; sticky when `0` / `Infinity` / negative
7. Handle click (`[toast-close]`) and keyboard (Escape for the most recently shown visible toast when no open modal/drawer overlay, popover, combobox list, or tooltip exists; Enter/Space on non-button closes)

Orphan `[toast]` nodes that are not inside `[toast-region]` are ignored.

Toast is not exclusive. This runtime does not close a modal or a drawer, and those dialog runtimes do not close a toast.

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If a toast appears later, the observer schedules a `sync()` call so Juice can wire live-region ARIA and start handling dismiss.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

- Escape dismisses the most recently shown visible toast, but only when no open `[modal-overlay]`, `[drawer-overlay]`, `[popover-root]`, `[combobox-list]`, or `[tooltip-root]` exists (those surfaces own Escape first). An open tip hides while toasts remain. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- Enter and Space activate non-button `[toast-close]` controls (native buttons already synthesize a click)
- There is no focus trap. Tab is not wrapped. The runtime does not move focus into the toast on show.

Arrow-key roving is intentionally out of scope.

## Limitations

- No `Toast()` factory and no programmatic message factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- Orphan `[toast]` nodes that are not inside `[toast-region]` are ignored.
- Toast is not a dialog: no focus trap, no `aria-modal`, and stacking is allowed.
- Individual toasts use native `hidden`, never layout `content=`. The region stays in the DOM.
- Centered modal / dialog, edge-docked drawer, and inline banner / callout behavior are not part of this runtime. See [Modal Runtime](./juice-modal-runtime.md), [Drawer Runtime](./juice-drawer-runtime.md), and [Banner Runtime](./juice-banner-runtime.md).
- Escape dismisses the most recent visible toast only, and only when no open modal/drawer overlay, popover, combobox list, or tooltip exists. Toast does not block tooltip Escape. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- Region chrome is `z-index: 1100`. That is a structural band, not a theme contract. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).

## Why This Matches Navigation

The toast runtime copies the navigation, accordion, tabs, modal, and drawer lifecycle by convention:

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
