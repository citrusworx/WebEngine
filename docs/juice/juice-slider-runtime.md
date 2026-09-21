# Juice Slider Runtime

This document explains the current slider runtime in `libraries/juice/src/js/src/slider/slider-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, and switch:

> If a user writes valid Juice slider markup and it exists in the browser, the value should just work.

That is the standard.

## The Goal

The slider runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize slider behavior in their app code.

There is no `Slider()` Sig factory. Markup plus the runtime is the contract.

This surface is Emerging, not Stable-ish. Valid markup should work after importing the JS entry, but the API is still likely to evolve.

Slider is an APG **Slider** (a horizontal single-thumb control). It is not a native `<input type="range">` restyle, not a progress meter, and not a scrollbar. No vertical orientation, no multi-thumb, no focus trap, and no Escape handling in v1.

## Markup Contract

The runtime is aligned with Juice’s slider chrome:

```html
<label>
  Volume
  <div slider>
    <div slider-fill></div>
    <div slider-thumb aria-label="Volume"></div>
  </div>
</label>

<div slider="horizontal" aria-valuemin="10" aria-valuemax="30" aria-valuenow="20">
  <button slider-thumb aria-valuetext="20 degrees" aria-label="Temperature"></button>
</div>
```

It requires a `[slider]` host (boolean, or `slider="horizontal"`) that owns a `[slider-thumb]`. `[slider-fill]` is optional. The host **is** the track. There is no `[slider-track]` child, no `slider-value` attribute, and no `slider-size`. `scale` does not change track or thumb geometry.

**A boolean `[slider]` attribute is fine.** There is no HTML global `slider` attribute.

**What this runtime enhances:**

- A `[slider]` or `[slider="horizontal"]` host that contains a `[slider-thumb]` whose nearest `[slider]` ancestor is that host.
- The first such thumb is the control. Extra thumbs are not a multi-thumb slider in v1. A nested `[slider]` owns its own first thumb.
- The thumb is the APG slider. Sync writes `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `aria-orientation="horizontal"` on the thumb. An author `role="slider"` on the host is removed so assistive tech sees one slider.
- A thumb that is not natively focusable gets `tabindex="0"` when it has no `tabindex`. Buttons, inputs, selects, textareas, and anchors with `href` are already focusable and are left alone. A `<button slider-thumb>` with no `type` becomes `type="button"`.

`[slider="vertical"]` is not painted and is not enhanced. Orphan `[slider-thumb]` elements, hosts with no thumb, and a native `<input type="range">` are ignored. Do not restyle bare `[role="slider"]`.

**Accessible name:** authors must supply one. Visible text, a wrapping `<label>`, `aria-label`, or `aria-labelledby` all count. The runtime does **not** invent a name, and it does **not** invent or rewrite `aria-valuetext`.

**Value:** thumb `aria-valuemin` / `aria-valuemax` / `aria-valuenow` win over the same attributes on the host. Missing min defaults to `0`. Missing max defaults to `100`. A missing `aria-valuenow` defaults to min. Values clamp to min/max. If max is below min, max is treated as min.

**Paint hook:** sync writes the host inline custom property `--juice-slider-ratio` (unitless `0`–`1`) for every range. That hook is not a theme role and not an author attribute. Integer `aria-valuenow` `0`–`100` on the thumb also matches the chrome attribute selectors when min/max are omitted or are `0` / `100`.

Theme paint uses `--juice-slider-*` roles (`track`, `track-border`, `fill`, `thumb`, `thumb-border`, `thumb-shadow`, `focus-ring`). Core CSS does not give `[slider]` an overlay z-index. The thumb uses z-index `1` so it stays above the fill. That is in-control stacking, not an overlay band — see [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands). See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md). `[slider]` is an APG slider, not a range input, not a progress meter, and not the surface `overlay="frost|tint"` utility.

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the slider runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startSliderRuntime();
    });
  } else {
    startSliderRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

`stopSliderRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createSlider(options?)
initSlider(options?)
startSliderRuntime()
stopSliderRuntime()
```

These are useful for internal control, tests, or advanced cases.

`createSlider()` can run alongside the automatic document runtime. Each pointer or key event is claimed once, so a custom-root controller does not double-fire with the singleton.

`initSlider()` is the same function as `createSlider()`.

## SliderOptions

The configurable shape is:

```ts
type SliderOptions = {
  root?: ParentNode;
  sliderSelector?: string;
};
```

By default, Juice uses:

```ts
{
  root: document,
  sliderSelector: '[slider]:not([slider="vertical"])',
}
```

## SliderController

```ts
type SliderController = {
  destroy: () => void;
  sync: () => void;
  setValue: (value: number, target?: HTMLElement | null) => void;
  getValue: (target?: HTMLElement | null) => number;
  increment: (target?: HTMLElement | null) => void;
  decrement: (target?: HTMLElement | null) => void;
};
```

`setValue()` writes a finite number, clamped to min/max, including fractions. Non-finite values are ignored. `getValue()` reads the clamped value. With no resolved slider it returns `0`. `increment()` and `decrement()` add or subtract the step (`1`). Disabled hosts are left alone. With no target, the controller uses the first enhanceable `[slider]` in its root.

## What the Runtime Actually Does

The runtime performs six main jobs:

1. Find enhanceable `[slider]` hosts that own a `[slider-thumb]`. `[slider="vertical"]`, orphan thumbs, hosts with no thumb, and `<input type="range">` are ignored. Only the first thumb whose nearest `[slider]` is that host is the control
2. Put `role="slider"` on the thumb and remove `role="slider"` from the host. Set `tabindex="0"` when the thumb is not natively focusable and has no tabindex. Set `type="button"` when a button thumb omitted `type`. It does not invent an accessible name or `aria-valuetext`
3. Write `aria-valuemin` (default `0`), `aria-valuemax` (default `100`), `aria-valuenow` (default min, clamped), and `aria-orientation="horizontal"` on the thumb. Thumb attributes win over the host. Keep the host `--juice-slider-ratio` (unitless `0`–`1`) in sync for every range
4. On the thumb, ArrowLeft and ArrowDown decrease by `1`, ArrowRight and ArrowUp increase by `1`, PageDown decreases by `10`, PageUp increases by `10`, and Home / End jump to min / max. Values clamp. Keyboard deltas do not re-snap an existing fractional value
5. Primary `pointerdown` on the track, fill, or thumb jumps to that position, focuses the thumb, and drags until `pointerup` or `pointercancel`. Pointer values snap to a step of `1` from min. The thumb captures the pointer when the platform allows it
6. Leave Escape, Enter, and Space alone. Slider does not participate in the overlay / popover / menu / combobox / toast / tooltip yield order. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).

Native `disabled` and `aria-disabled="true"` on the host or the thumb still sync role and value attributes, and they do not move. There is no focus trap. There is no exclusive-open rule. This runtime does not close a modal, drawer, toast, popover, wizard, tooltip, combobox, banner, or menu, and it does not toggle a switch.

## Pointer mapping

Pointer position uses the thumb’s travel, not the raw track width.

The thumb center moves from half the thumb width to the far end, so the ends stay inside the host. A primary pointer on the track, the fill, or the thumb maps `clientX` across that inset, snaps to a step of `1` from min, and clamps. A zero-width host, or a range where max equals min, stays at min. A later `pointermove` follows only while that pointer is captured in the drag. `pointerup` and `pointercancel` end it.

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If a slider appears later, the observer schedules a `sync()` call so Juice can wire the thumb’s `role` and value attributes, write `--juice-slider-ratio`, and start handling keys and pointers.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

- ArrowLeft and ArrowDown decrease the focused thumb by `1`
- ArrowRight and ArrowUp increase the focused thumb by `1`
- PageDown decreases by `10`. PageUp increases by `10`
- Home jumps to min. End jumps to max
- Values clamp to min/max. A value already at an end stays there
- Escape, Enter, and Space are not handled. Slider never steals Escape. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- Alt, Ctrl, Meta, and composing key events are ignored
- Keys apply when the event target is the thumb or inside the thumb. There is no focus trap. Tab is not wrapped

The step is `1`. The page step is `10`. Those are v1 constants, not author attributes.

## Limitations

- No `Slider()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- This surface is Emerging, not Stable-ish.
- v1 is horizontal and single-thumb. `[slider="vertical"]` is not painted and is not enhanced. Extra thumbs are ignored. There is no multi-thumb slider.
- There is no native `<input type="range">` restyle. A range input cannot host a `[slider-thumb]`.
- Authors must supply an accessible name. The runtime does not invent `aria-label` text, and it does not invent or rewrite `aria-valuetext`.
- Default bounds are min `0` and max `100`. A missing `aria-valuenow` starts at min. Thumb ARIA values win over the host.
- `setValue()` accepts a finite number, including fractions, and clamps. Keyboard steps add `1` or `10` without re-snapping that fraction. Pointer jumps snap to a step of `1` from min.
- Native `disabled` and `aria-disabled="true"` on the host or thumb do not move the value.
- There is no focus trap and no Escape, Enter, or Space handling. Slider is not a layered overlay. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- There is no overlay z-index. The thumb’s z-index `1` only stacks it above the fill. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- Centered modal / dialog, edge-docked drawer, toast-stack, popover, wizard, tooltip, combobox, banner, menu, and switch behavior are not part of this runtime. See [Modal Runtime](./juice-modal-runtime.md), [Drawer Runtime](./juice-drawer-runtime.md), [Toast Runtime](./juice-toast-runtime.md), [Popover Runtime](./juice-popover-runtime.md), [Wizard Runtime](./juice-wizard-runtime.md), [Tooltip Runtime](./juice-tooltip-runtime.md), [Combobox Runtime](./juice-combobox-runtime.md), [Banner Runtime](./juice-banner-runtime.md), [Menu Runtime](./juice-menu-runtime.md), and [Switch Runtime](./juice-switch-runtime.md).

## Why This Matches Navigation

The slider runtime copies the navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, and switch lifecycle by convention:

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
