# Juice Drawer Runtime

This document explains the current drawer dialog runtime in `libraries/juice/src/js/src/drawer/drawer-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation, accordion, tabs, and modal:

> If a user writes valid Juice drawer markup and it exists in the browser, the dialog behavior should just work.

That is the standard.

## The Goal

The drawer runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize drawer behavior in their app code.

There is no `Drawer()` Sig factory. Markup plus the runtime is the contract.

This surface is Emerging, not Stable-ish. Valid markup should work after importing the JS entry, but the API is still likely to evolve.

## Markup Contract

The runtime is aligned with Juice’s drawer chrome:

```html
<div drawer-overlay id="demo-drawer" hidden>
  <div drawer role="dialog" aria-modal="true" aria-labelledby="demo-title">
    <button type="button" drawer-close aria-label="Close">×</button>
    <div drawer-header><h2 id="demo-title">Filters</h2></div>
    <div drawer-body>…</div>
  </div>
</div>
<button type="button" aria-controls="demo-drawer">Open</button>
```

It requires a `[drawer-overlay]` root. Closed vs open is the native `hidden` attribute on that overlay. The runtime does **not** write `content="active"` or `content="hidden"`. Those values clash with Juice layout `[content]`.

**Edge:** `[drawer]` / `[drawer="right"]` / `[drawer="left"]`. Bare or unspecified docks right.

**Size:** optional `[drawer-size="sm|lg"]` (default `22rem`, `sm` `16rem`, `lg` `32rem`). Do not put size on the `drawer` attribute — that slot is the edge.

**Opener pairing:** any element whose `aria-controls` token list includes the overlay `id`. There is no extra Juice opener attribute.

**Close:** `[drawer-close]` inside the overlay, Escape, or a click on the overlay backdrop.

**Backdrop opt-out:** `drawer-overlay="static"` (or `createDrawer({ closeOnBackdrop: false })`). Clicks on the drawer panel itself never close.

Prefer shipping `role="dialog"`, `aria-modal="true"`, and a labelled heading in markup. The runtime fills those if they are missing, plus opener `aria-expanded` / `aria-haspopup="dialog"` and an empty close name (`aria-label="Close"`).

Theme paint uses `--juice-drawer-*` roles. See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md). `[drawer-overlay]` is a drawer scrim, not the surface `overlay="frost|tint"` utility, and not `[modal-overlay]`. Modal is a centered dialog; drawer is an edge-docked panel.

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the drawer runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startDrawerRuntime();
    });
  } else {
    startDrawerRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

`stopDrawerRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createDrawer(options?)
initDrawer(options?)
startDrawerRuntime()
stopDrawerRuntime()
```

These are useful for internal control, tests, or advanced cases.

`createDrawer()` can run alongside the automatic document runtime. Each click or key event is claimed once, so a custom-root controller does not double-fire with the singleton.

## DrawerOptions

The configurable shape is:

```ts
type DrawerOptions = {
  root?: ParentNode;
  overlaySelector?: string;
  dialogSelector?: string;
  closeSelector?: string;
  closeOnBackdrop?: boolean;
};
```

By default, Juice uses:

```ts
{
  root: document,
  overlaySelector: '[drawer-overlay]',
  dialogSelector: '[drawer]',
  closeSelector: '[drawer-close]',
  closeOnBackdrop: true,
}
```

## DrawerController

```ts
type DrawerController = {
  destroy: () => void;
  sync: () => void;
  open: (target?: HTMLElement | null) => void;
  close: (target?: HTMLElement | null) => void;
  toggle: (target?: HTMLElement | null) => void;
};
```

## What the Runtime Actually Does

The runtime performs seven main jobs:

1. Find `[drawer-overlay]` roots and pair openers whose `aria-controls` token list includes that overlay `id`
2. Resolve the dialog (`[drawer]`, then `[role="dialog"]`, then the overlay’s first element child)
3. Fill missing overlay / dialog / title ids, `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` from the header heading
4. Fill opener `aria-expanded` / `aria-haspopup="dialog"` and an empty `[drawer-close]` name
5. Toggle native `hidden` on the overlay; opening one overlay closes any other open drawer overlay
6. Trap focus while open and restore it to the opener on close
7. Handle click (opener, close, backdrop) and keyboard (Escape, Tab trap, Enter/Space on non-button openers and closes)

Orphan `aria-controls` that do not target a `[drawer-overlay]` are ignored.

When `[drawer-overlay]` has a `name` or `id`, that value becomes the slug used for generated ids (`filters-drawer-dialog`, `filters-drawer-title`). A missing overlay id is filled as `${slug}-overlay`.

Exclusive open is among drawers. This runtime does not close a modal, and the modal runtime does not close a drawer.

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If a drawer appears later, the observer schedules a `sync()` call so Juice can wire ids and ARIA and start handling clicks.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

- Escape closes the open overlay and returns focus to the opener
- Tab / Shift+Tab wrap inside the open dialog (focus trap)
- Enter and Space activate non-button openers and `[drawer-close]` controls (native buttons already synthesize a click)

Arrow-key roving is intentionally out of scope.

## Limitations

- No `Drawer()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- Orphan `aria-controls` that do not target `[drawer-overlay]` are ignored.
- Opening is exclusive among drawers. Only one drawer overlay is open at a time.
- Overlays use native `hidden`, never layout `content=`.
- Centered modal / dialog behavior is not part of this runtime. See [Modal Runtime](./juice-modal-runtime.md).
- `drawer-overlay="static"` (or `closeOnBackdrop: false`) opts out of backdrop click only. Escape and `[drawer-close]` still dismiss.

## Why This Matches Navigation

The drawer runtime copies the navigation, accordion, tabs, and modal lifecycle by convention:

- DOM-first
- automatic boot
- event delegation
- MutationObserver plus rAF `sync()`
- idempotent singleton `start*Runtime` / `stop*Runtime`
- framework-agnostic

It does not introduce a shared multi-feature runtime module.

## Design Rule Going Forward

Interactive Juice browser features should follow this standard:

> If valid Juice markup exists in the browser, the feature should activate automatically and work without app glue.
