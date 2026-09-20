# Juice Tooltip Runtime

This document explains the current tooltip runtime in `libraries/juice/src/js/src/tooltip/tooltip-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation, accordion, tabs, modal, drawer, toast, popover, and wizard:

> If a user writes valid Juice tooltip markup and it exists in the browser, the hover/focus tip should just work.

That is the standard.

## The Goal

The tooltip runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize tooltip behavior in their app code.

There is no `Tooltip()` Sig factory. Markup plus the runtime is the contract.

This surface is Emerging, not Stable-ish. Valid markup should work after importing the JS entry, but the API is still likely to evolve.

Tooltip is a hover/focus tip. It is not a popover (interactive), not a native `title` attribute, not a modal, not a drawer, and not a toast stack.

## Markup Contract

The runtime is aligned with Juice’s tooltip chrome:

```html
<button type="button" aria-describedby="demo-tip">Save</button>
<div tooltip-root id="demo-tip" hidden>
  <div tooltip-panel role="tooltip">Saves the current draft.</div>
</div>
```

It requires a `[tooltip-root]` root. Closed vs open is the native `hidden` attribute on that root. The runtime does **not** write `content="active"` or `content="hidden"`. Those values clash with Juice layout `[content]`.

**Never use a bare `tooltip` attribute.** The floating surface is `[tooltip-panel]`. This is Juice chrome, not the native HTML `title` attribute — do not restyle or replace `title`.

**Placement:** `[tooltip-root]` / `[tooltip-root="top"]` / `"bottom"` / `"left"` / `"right"`. Bare or unspecified is top.

**Trigger pairing:** prefer `aria-describedby` pointing at the root `id` (APG). `aria-controls` is also accepted for consistency with other Juice runtimes. There is no extra Juice trigger attribute.

Prefer shipping `role="tooltip"` on the panel. The runtime fills that if it is missing, plus a missing root id, and it ensures the trigger `aria-describedby` token list includes that id.

Theme paint uses `--juice-tooltip-*` roles. Core CSS paints `[tooltip-root]` at **z-index 1060** (slightly above popover `1050`, below toast `1100`). See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md). `[tooltip-root]` is an anchored positioning wrapper, not a dialog overlay, not a drawer, not a toast stack, not a popover, and not the surface `overlay="frost|tint"` utility. Popover is an interactive floating panel; tooltip is a hover/focus tip. Focus never moves into the tip.

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the tooltip runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startTooltipRuntime();
    });
  } else {
    startTooltipRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

`stopTooltipRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createTooltip(options?)
initTooltip(options?)
startTooltipRuntime()
stopTooltipRuntime()
```

These are useful for internal control, tests, or advanced cases.

`createTooltip()` can run alongside the automatic document runtime. Each pointer or key event is claimed once, so a custom-root controller does not double-fire with the singleton.

## TooltipOptions

The configurable shape is:

```ts
type TooltipOptions = {
  root?: ParentNode;
  rootSelector?: string;
  panelSelector?: string;
  gap?: number;
  hideDelay?: number;
};
```

By default, Juice uses:

```ts
{
  root: document,
  rootSelector: '[tooltip-root]',
  panelSelector: '[tooltip-panel]',
  gap: 8,
  hideDelay: 150,
}
```

## TooltipController

```ts
type TooltipController = {
  destroy: () => void;
  sync: () => void;
  show: (target?: HTMLElement | null) => void;
  hide: (target?: HTMLElement | null) => void;
};
```

`show()` and `hide()` toggle native `hidden` on `[tooltip-root]`. `show()` never moves focus into the tip.

## What the Runtime Actually Does

The runtime performs eight main jobs:

1. Find `[tooltip-root]` roots and pair triggers whose `aria-describedby` token list (preferred) or `aria-controls` token list includes that root `id`
2. Resolve the panel (`[tooltip-panel]`, then `[role="tooltip"]`, then the root’s first element child)
3. Fill a missing root id and `role="tooltip"` on the panel. Ensure the trigger `aria-describedby` token list includes that id
4. Show on `mouseover` / `focusin` of the trigger; hide on `mouseout` / `focusout` after a grace delay (default 150ms) so a brief leave does not flicker
5. Opening one managed tooltip hides any other open tooltip
6. Do not move focus into the tip. There is no focus trap. The tip has `pointer-events: none` in chrome, so the delay is not a hover bridge onto the tip
7. Place the root with `position: fixed` from the trigger’s `getBoundingClientRect` plus an 8px gap; flip once to the opposite side if the preferred side overflows; reposition on show, window resize, and capture scroll (rAF-throttled)
8. Handle Escape (hide the open tip, but yield to an open `[modal-overlay]`, `[drawer-overlay]`, or `[popover-root]`)

Orphan `aria-describedby` / `aria-controls` that do not target a `[tooltip-root]` are ignored.

When `[tooltip-root]` has a `name` or `id`, that value becomes the slug used for generated ids (`help-root`). A missing root id is filled as `${slug}-root`.

Exclusive open is among tooltips. This runtime does not close a modal, drawer, toast, popover, or wizard, and those runtimes do not close a tooltip.

Touch / first-tap is later. v1 is hover and keyboard focus only.

## Placement

Placement is dependency-free. There is no Floating UI.

The runtime reads `[tooltip-root="top|bottom|left|right"]` (default `top`), then positions the root `fixed` from the trigger rect in viewport coordinates. `fixed` needs no scroll offset. The gap is `8` unless `createTooltip({ gap })` overrides it.

If a transformed or filtered ancestor is the fixed containing block, the runtime subtracts that origin.

If the preferred side overflows the viewport on that one axis, the runtime flips once to the opposite side (`top` ↔ `bottom`, `left` ↔ `right`). There is no shift or size middleware.

Open tooltips reposition on window resize and capture-phase scroll, scheduled with `requestAnimationFrame`.

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If a tooltip appears later, the observer schedules a `sync()` call so Juice can wire ids and ARIA, start handling hover/focus, and place any already-open root.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

- Escape hides the open tip, but only when no open `[modal-overlay]`, `[drawer-overlay]`, or `[popover-root]` exists (those surfaces own Escape)
- There is no focus trap. Tab is not wrapped. The runtime does not move focus into the tip
- Hover (`mouseover` / `mouseout`) and keyboard focus (`focusin` / `focusout`) are the v1 show/hide path

Arrow-key roving is intentionally out of scope. Touch / first-tap is later.

## Limitations

- No `Tooltip()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- Orphan `aria-describedby` / `aria-controls` that do not target `[tooltip-root]` are ignored.
- Opening is exclusive among tooltips. Only one managed tip is open at a time.
- Roots use native `hidden`, never layout `content=`.
- Never use a bare `tooltip` attribute. The surface is `[tooltip-panel]`. Do not restyle or replace native `title`.
- Tooltip is not a popover: no interactive content, no close button, no focus trap, and focus never moves into the tip.
- Placement has no Floating UI. One opposite-side flip only; no shift or size middleware.
- Touch / first-tap is later. v1 is hover and keyboard focus only.
- Centered modal / dialog, edge-docked drawer, toast-stack, popover, and wizard behavior are not part of this runtime. See [Modal Runtime](./juice-modal-runtime.md), [Drawer Runtime](./juice-drawer-runtime.md), [Toast Runtime](./juice-toast-runtime.md), [Popover Runtime](./juice-popover-runtime.md), and [Wizard Runtime](./juice-wizard-runtime.md).
- Escape hides the open tip only when no open modal/drawer overlay or popover-root exists.

## Why This Matches Navigation

The tooltip runtime copies the navigation, accordion, tabs, modal, drawer, toast, popover, and wizard lifecycle by convention:

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
