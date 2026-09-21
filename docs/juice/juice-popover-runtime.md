# Juice Popover Runtime

This document explains the current popover runtime in `libraries/juice/src/js/src/popover/popover-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation, accordion, tabs, modal, drawer, and toast:

> If a user writes valid Juice popover markup and it exists in the browser, the popover behavior should just work.

That is the standard.

## The Goal

The popover runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize popover behavior in their app code.

There is no `Popover()` Sig factory. Markup plus the runtime is the contract.

This surface is Emerging, not Stable-ish. Valid markup should work after importing the JS entry, but the API is still likely to evolve.

Popover is a non-modal dialog. It is not a modal, not a drawer, and not a toast stack.

## Markup Contract

The runtime is aligned with Juice’s popover chrome:

```html
<button type="button" aria-controls="demo-pop">Open help</button>
<div popover-root id="demo-pop" hidden>
  <div popover-panel role="dialog">
    <button type="button" popover-close aria-label="Close">×</button>
    <div popover-header><h2>Help</h2></div>
    <div popover-body>Account details live on this page.</div>
  </div>
</div>
```

It requires a `[popover-root]` root. Closed vs open is the native `hidden` attribute on that root. The runtime does **not** write `content="active"` or `content="hidden"`. Those values clash with Juice layout `[content]`.

**Never use a bare `popover` attribute.** `popover=""` / `popover="manual"` activates the native HTML Popover API. The floating surface is `[popover-panel]`.

**Placement:** `[popover-root]` / `[popover-root="bottom"]` / `"top"` / `"left"` / `"right"`. Bare or unspecified is bottom.

**Opener pairing:** any element whose `aria-controls` token list includes the root `id`. There is no extra Juice opener attribute.

**Close:** `[popover-close]` inside the root, Escape, or a click outside the open root (and outside its opener). Clicks inside the root stay open.

Prefer shipping `role="dialog"` and a labelled heading in markup. The runtime fills those if they are missing, plus opener `aria-expanded` / `aria-haspopup="dialog"` and an empty close name (`aria-label="Close"`). It does **not** set `aria-modal`. Authors may set it; the runtime does not, because the background stays interactive.

Theme paint uses `--juice-popover-*` roles. Core CSS paints `[popover-root]` at **z-index 1050** (above modal/drawer `1000`, below toast `1100`). That is a structural band, not a theme contract — see [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands). See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md). `[popover-root]` is an anchored positioning wrapper, not a dialog overlay, not a drawer, not a toast stack, and not the surface `overlay="frost|tint"` utility. Modal is a centered dialog; drawer is an edge-docked panel; toast is a corner snackbar; popover is a floating panel next to its opener.

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the popover runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startPopoverRuntime();
    });
  } else {
    startPopoverRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

`stopPopoverRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createPopover(options?)
initPopover(options?)
startPopoverRuntime()
stopPopoverRuntime()
```

These are useful for internal control, tests, or advanced cases.

`createPopover()` can run alongside the automatic document runtime. Each click or key event is claimed once, so a custom-root controller does not double-fire with the singleton.

## PopoverOptions

The configurable shape is:

```ts
type PopoverOptions = {
  root?: ParentNode;
  rootSelector?: string;
  panelSelector?: string;
  closeSelector?: string;
  gap?: number;
};
```

By default, Juice uses:

```ts
{
  root: document,
  rootSelector: '[popover-root]',
  panelSelector: '[popover-panel]',
  closeSelector: '[popover-close]',
  gap: 8,
}
```

## PopoverController

```ts
type PopoverController = {
  destroy: () => void;
  sync: () => void;
  open: (target?: HTMLElement | null) => void;
  close: (target?: HTMLElement | null) => void;
  toggle: (target?: HTMLElement | null) => void;
};
```

## What the Runtime Actually Does

The runtime performs eight main jobs:

1. Find `[popover-root]` roots and pair openers whose `aria-controls` token list includes that root `id`
2. Resolve the panel (`[popover-panel]`, then `[role="dialog"]`, then the root’s first element child)
3. Fill missing root / panel / title ids, `role="dialog"`, and `aria-labelledby` from the header heading. It does not set `aria-modal`
4. Fill opener `aria-expanded` / `aria-haspopup="dialog"` and an empty `[popover-close]` name
5. Toggle native `hidden` on the root; opening one managed popover closes any other open popover
6. Move focus into the panel on open (`[autofocus]` if present, else the first focusable, else `tabindex="-1"` on the panel), trap Tab inside the panel, and restore focus to the opener on close
7. Place the root with `position: fixed` from the opener’s `getBoundingClientRect` plus an 8px gap; flip once to the opposite side if the preferred side overflows; reposition on open, window resize, and capture scroll (rAF-throttled)
8. Handle click (opener toggle, close, outside) and keyboard (Escape, Tab trap, Enter/Space on non-button openers and closes)

Orphan `aria-controls` that do not target a `[popover-root]` are ignored.

When `[popover-root]` has a `name` or `id`, that value becomes the slug used for generated ids (`help-panel`, `help-title`). A missing root id is filled as `${slug}-root`.

Exclusive open is among popovers. This runtime does not close a modal, drawer, or toast, and those runtimes do not close a popover.

## Placement

Placement is dependency-free. There is no Floating UI.

The runtime reads `[popover-root="top|bottom|left|right"]` (default `bottom`), then positions the root `fixed` from the opener rect in viewport coordinates. `fixed` needs no scroll offset. The gap is `8` unless `createPopover({ gap })` overrides it.

If the preferred side overflows the viewport on that one axis, the runtime flips once to the opposite side (`bottom` ↔ `top`, `left` ↔ `right`). There is no shift or size middleware.

Open popovers reposition on window resize and capture-phase scroll, scheduled with `requestAnimationFrame`.

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If a popover appears later, the observer schedules a `sync()` call so Juice can wire ids and ARIA, start handling clicks, and place any already-open root.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

- Escape closes the open popover and returns focus to the opener, but only when no open `[modal-overlay]` or `[drawer-overlay]` exists (those dialogs own Escape). Menu sits in the same Escape band as popover. Combobox, toast, and tooltip yield to an open popover or an open menu. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- Tab / Shift+Tab wrap inside the open panel (focus trap). The background is not inert
- Enter and Space activate non-button openers and `[popover-close]` controls (native buttons already synthesize a click)

Arrow-key roving is intentionally out of scope. This is not `role="menu"`.

## Limitations

- No `Popover()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- Orphan `aria-controls` that do not target `[popover-root]` are ignored.
- Opening is exclusive among popovers. Only one managed popover is open at a time.
- Roots use native `hidden`, never layout `content=`.
- Never use a bare `popover` attribute. The surface is `[popover-panel]`.
- The panel is a non-modal dialog: `role="dialog"` without `aria-modal`. The background stays interactive.
- Placement has no Floating UI. One opposite-side flip only; no shift or size middleware.
- Centered modal / dialog, edge-docked drawer, and toast-stack behavior are not part of this runtime. See [Modal Runtime](./juice-modal-runtime.md), [Drawer Runtime](./juice-drawer-runtime.md), and [Toast Runtime](./juice-toast-runtime.md).
- Escape dismisses the open popover only when no open modal/drawer overlay exists. Menu sits in the same Escape band. Combobox, toast, and tooltip yield to an open popover or an open menu. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).

## Why This Matches Navigation

The popover runtime copies the navigation, accordion, tabs, modal, drawer, and toast lifecycle by convention:

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
