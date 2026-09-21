# Juice Modal Runtime

This document explains the current modal dialog runtime in `libraries/juice/src/js/src/modal/modal-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation, accordion, and tabs:

> If a user writes valid Juice modal markup and it exists in the browser, the dialog behavior should just work.

That is the standard.

## The Goal

The modal runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize modal behavior in their app code.

There is no `Modal()` Sig factory. Markup plus the runtime is the contract.

## Markup Contract

The runtime is aligned with Juice’s modal chrome:

```html
<div modal-overlay id="demo-modal" hidden>
  <div modal role="dialog" aria-modal="true" aria-labelledby="demo-title">
    <button type="button" modal-close aria-label="Close">×</button>
    <div modal-header><h2 id="demo-title">Account</h2></div>
    <div modal-body>…</div>
  </div>
</div>
<button type="button" aria-controls="demo-modal">Open</button>
```

It requires a `[modal-overlay]` root. Closed vs open is the native `hidden` attribute on that overlay. The runtime does **not** write `content="active"` or `content="hidden"`. Those values clash with Juice layout `[content]`.

**Opener pairing:** any element whose `aria-controls` token list includes the overlay `id`. There is no extra Juice opener attribute.

**Close:** `[modal-close]` inside the overlay, Escape, or a click on the overlay backdrop.

**Backdrop opt-out:** `modal-overlay="static"` (or `createModal({ closeOnBackdrop: false })`). Clicks on the dialog panel itself never close.

Prefer shipping `role="dialog"`, `aria-modal="true"`, and a labelled heading in markup. The runtime fills those if they are missing, plus opener `aria-expanded` / `aria-haspopup="dialog"` and an empty close name (`aria-label="Close"`).

Theme paint uses `--juice-modal-*` roles. See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md). `[modal-overlay]` is a dialog scrim, not the surface `overlay="frost|tint"` utility.

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the modal runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startModalRuntime();
    });
  } else {
    startModalRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

`stopModalRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createModal(options?)
initModal(options?)
startModalRuntime()
stopModalRuntime()
```

These are useful for internal control, tests, or advanced cases.

`createModal()` can run alongside the automatic document runtime. Each click or key event is claimed once, so a custom-root controller does not double-fire with the singleton.

## ModalOptions

The configurable shape is:

```ts
type ModalOptions = {
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
  overlaySelector: '[modal-overlay]',
  dialogSelector: '[modal]',
  closeSelector: '[modal-close]',
  closeOnBackdrop: true,
}
```

## ModalController

```ts
type ModalController = {
  destroy: () => void;
  sync: () => void;
  open: (target?: HTMLElement | null) => void;
  close: (target?: HTMLElement | null) => void;
  toggle: (target?: HTMLElement | null) => void;
};
```

## What the Runtime Actually Does

The runtime performs seven main jobs:

1. Find `[modal-overlay]` roots and pair openers whose `aria-controls` token list includes that overlay `id`
2. Resolve the dialog (`[modal]`, then `[role="dialog"]`, then the overlay’s first element child)
3. Fill missing overlay / dialog / title ids, `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` from the header heading
4. Fill opener `aria-expanded` / `aria-haspopup="dialog"` and an empty `[modal-close]` name
5. Toggle native `hidden` on the overlay; opening one overlay closes any other open overlay
6. Trap focus while open and restore it to the opener on close
7. Handle click (opener, close, backdrop) and keyboard (Escape, Tab trap, Enter/Space on non-button openers and closes)

Orphan `aria-controls` that do not target a `[modal-overlay]` are ignored.

When `[modal-overlay]` has a `name` or `id`, that value becomes the slug used for generated ids (`seats-modal-dialog`, `seats-modal-title`). A missing overlay id is filled as `${slug}-overlay`.

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If a modal appears later, the observer schedules a `sync()` call so Juice can wire ids and ARIA and start handling clicks.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

- Escape closes the open overlay and returns focus to the opener. Modal shares the highest Escape band with drawer; if a drawer overlay is also open, that same Escape closes both. Popover, combobox, toast, and tooltip yield. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- Tab / Shift+Tab wrap inside the open dialog (focus trap)
- Enter and Space activate non-button openers and `[modal-close]` controls (native buttons already synthesize a click)

Arrow-key roving is intentionally out of scope.

## Limitations

- No `Modal()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- Orphan `aria-controls` that do not target `[modal-overlay]` are ignored.
- Opening is exclusive among modals. Only one modal overlay is open at a time. Modal and drawer stay independently exclusive: both may be open at once, and one Escape then closes both. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- Overlays use native `hidden`, never layout `content=`.
- Drawer / sheet behavior is not part of this runtime. See [Drawer Runtime](./juice-drawer-runtime.md).
- `modal-overlay="static"` (or `closeOnBackdrop: false`) opts out of backdrop click only. Escape and `[modal-close]` still dismiss.
- Overlay chrome is `z-index: 1000`. That is a structural band, not a theme contract. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).

## Why This Matches Navigation

The modal runtime copies the navigation, accordion, and tabs lifecycle by convention:

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
