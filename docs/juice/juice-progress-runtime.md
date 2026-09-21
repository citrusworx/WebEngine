# Juice Progress Runtime

This document explains the current progress runtime in `libraries/juice/src/js/src/progress/progress-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, and breadcrumb:

> If a user writes valid Juice progress markup and it exists in the browser, the value and the indeterminate flag should just work.

That is the standard.

## The Goal

The progress runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize progress behavior in their app code.

There is no `Progress()` Sig factory. Markup plus the runtime is the contract.

This surface is Emerging, not Stable-ish. Valid markup should work after importing the JS entry, but the API is still likely to evolve. It is on master and is not in the `@citrusworx/juiceui@0.8.0` npm cut. Switch, slider, checkbox, radio, and breadcrumb are unpublished on that same cut.

Progress is an APG-inspired **Progressbar**. It is not a slider, not a spinner-only loader, and not a native `<progress>` restyle. It is not interactive. No keyboard, no pointer handling, no focus trap, and no Escape handling in v1.

## Markup Contract

The runtime is aligned with Juice’s progress chrome:

```html
<div progress aria-label="Upload">
  <span progress-fill></span>
  <span progress-label>Uploading</span>
</div>

<div progress aria-valuemin="10" aria-valuemax="30" aria-valuenow="20" aria-valuetext="20 degrees" aria-label="Temperature">
  <span progress-fill></span>
</div>

<div progress="indeterminate" aria-label="Working">
  <span progress-fill></span>
</div>
```

`[progress]` is the track host. `[progress-fill]` is the filled portion. `[progress-label]` is optional visible text. The host **is** the track. There is no `[progress-bar]`, no `[progress-track]`, and no `progress-value` attribute. `scale` does not change bar geometry.

**A boolean `[progress]` attribute is fine.** There is no HTML global `progress` attribute. `[progress]` is an attribute selector, not the type selector `progress`. Authors write `<div progress>`, not `<progress>`.

**What this runtime enhances:**

- A `[progress]` host. Boolean is determinate. `progress="indeterminate"` is the busy state. Any other value, such as `progress="busy"`, stays determinate. Sync does not rewrite that value.
- `[progress-fill]` and `[progress-label]` are optional for the runtime. The fill is how the chrome paints the value. The label is author text. Sync does not copy it into a name or `aria-valuetext`.
- Sync writes `role="progressbar"` on the host. An author role that is not `progressbar` is replaced. The host is not made focusable. There is no `tabindex`.

A native `<progress>` without the attribute is ignored. `<progress progress>` matches the attribute and is enhanced, but native `value` / `max` are not the value hook, and the UA does not show a `[progress-fill]` child. Do not restyle bare `[role="progressbar"]`.

**Accessible name:** authors must supply one. Visible text, `[progress-label]`, a wrapping label, `aria-label`, or `aria-labelledby` all count only when the author wrote them. The runtime does **not** invent a name, and it does **not** copy `[progress-label]` into `aria-label`, `aria-labelledby`, or `aria-valuetext`.

**Value text:** `aria-valuetext` is author-owned. Sync never invents it and never rewrites it, including when `setValue` changes the number.

**Value:** `aria-valuemin` / `aria-valuemax` / `aria-valuenow` live on the host. Missing min defaults to `0`. Missing max defaults to `100`. A missing or non-numeric `aria-valuenow` defaults to min, which is an empty determinate bar (ratio `0`), not indeterminate. Values clamp to min/max. If max is below min, max collapses to min and the ratio is `0`.

**Paint hook:** sync writes the host inline custom property `--juice-progress-ratio` (unitless `0`–`1`) for every range. That hook is not a theme role and not an author attribute. Integer `aria-valuenow` `0`–`100` also matches the chrome attribute selectors when min/max are omitted or are `0` / `100`. The inline property covers the other ranges.

**Indeterminate:** only `progress="indeterminate"`. That flag wins over a stale `aria-valuenow` for both paint and ARIA. APG omits `aria-valuenow` while the flag is set. Min and max stay. The last determinate value is remembered and restored as `aria-valuenow` when the flag clears. CSS slides `[progress-fill]`. The host clips that motion. `prefers-reduced-motion` stops the animation and leaves a static partial fill. The runtime still writes `--juice-progress-ratio` from the remembered value so the determinate fill is ready when the flag clears.

Theme paint uses `--juice-progress-*` roles (`track`, `track-border`, `fill`, `ink`, `focus-ring`). Core CSS does not give `[progress]` a z-index. It is inline status chrome — see [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands). `focus-ring` paints only on `:focus-visible`. See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md). `[progress]` is an APG-inspired progressbar, not a slider, not a spinner, and not the surface `overlay="frost|tint"` utility.

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the progress runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startProgressRuntime();
    });
  } else {
    startProgressRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

`stopProgressRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createProgress(options?)
initProgress(options?)
startProgressRuntime()
stopProgressRuntime()
```

These are useful for internal control, tests, or advanced cases.

`createProgress()` can run alongside the automatic document runtime. This runtime claims no clicks or keys, so there is nothing to double-fire.

`initProgress()` is the same function as `createProgress()`.

## ProgressOptions

The configurable shape is:

```ts
type ProgressOptions = {
  root?: ParentNode;
  progressSelector?: string;
};
```

By default, Juice uses:

```ts
{
  root: document,
  progressSelector: '[progress]',
}
```

## ProgressController

```ts
type ProgressController = {
  destroy: () => void;
  sync: () => void;
  setValue: (value: number, target?: HTMLElement | null) => void;
  getValue: (target?: HTMLElement | null) => number;
  setIndeterminate: (
    indeterminate: boolean,
    target?: HTMLElement | null
  ) => void;
  isIndeterminate: (target?: HTMLElement | null) => boolean;
};
```

`sync()` walks each managed host and applies the role, range, ratio, and indeterminate rules. `setValue()` writes a finite number, including fractions, clamped to min/max. Non-finite values are ignored. While the host is indeterminate, `setValue()` updates the remembered value and `--juice-progress-ratio` and still omits `aria-valuenow`. `getValue()` reads that clamped or remembered value. With no resolved host it returns `0`. `setIndeterminate(true)` sets `progress="indeterminate"`. `setIndeterminate(false)` writes the boolean `progress` attribute (empty value) and restores the remembered `aria-valuenow`. `isIndeterminate()` is true only when the attribute is exactly `indeterminate`. With no target, the controller uses the first `[progress]` in its root. A target inside a host resolves to that host.

## What the Runtime Actually Does

The runtime performs six main jobs:

1. Find `[progress]` hosts. A native `<progress>` without the attribute is ignored. A bare `[role="progressbar"]` is ignored. `<progress progress>` is enhanced, but native `value` / `max` are not the value hook
2. Put `role="progressbar"` on the host. Replace an author role that is not `progressbar`. Do not add `tabindex`. Do not invent an accessible name. Do not invent or rewrite `aria-valuetext`. Do not copy `[progress-label]` into either
3. On a determinate host, write `aria-valuemin` (default `0`), `aria-valuemax` (default `100`), and `aria-valuenow` (default min, clamped). A missing or non-numeric now is an empty bar, not indeterminate. A max below min collapses to min. Any `progress` value other than `indeterminate` stays as authored
4. Keep the host `--juice-progress-ratio` (unitless `0`–`1`) in sync for every range, including ranges the 0–100 chrome selectors do not cover
5. Treat only `progress="indeterminate"` as indeterminate. Remove `aria-valuenow` while that flag is set. Keep min and max. Remember the last determinate value, including a stale now on first sync and a later author now that sync then removes. Restore that value when the flag clears. CSS owns the sliding fill
6. Leave Escape, clicks, and the keyboard alone. Progress claims no events and does not participate in the overlay / popover / menu / combobox / toast / tooltip yield order. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).

There is no focus trap. There is no keyboard map. This runtime does not close a modal, drawer, toast, popover, wizard, tooltip, combobox, banner, or menu, and it does not toggle a switch, move a slider, toggle a checkbox, select a radio, or move a breadcrumb current page.

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If a progress bar appears later, the observer schedules a `sync()` call so Juice can wire `role="progressbar"`, the value attributes, `--juice-progress-ratio`, and the indeterminate flag.

The observer watches child list changes and these attributes: `progress`, `role`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `aria-valuetext`. A change to `aria-valuetext` schedules sync. Sync still does not rewrite that text.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

Progress does not listen for keys.

- Escape is not handled. Progress never steals it. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- Enter, Space, and arrows are not handled. Arrows do not change the value
- There is no focus trap. Tab is not wrapped. The runtime does not move focus and does not set `tabindex`

Authors own whether the host is focusable. The runtime does not make it a control.

## Limitations

- No `Progress()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- This surface is Emerging, not Stable-ish. It is on master and unpublished versus `@citrusworx/juiceui@0.8.0`, along with switch, slider, checkbox, radio, and breadcrumb.
- This is not a slider. There is no thumb, no keyboard stepping, and no pointer drag.
- There is no native `<progress>` restyle as the only story. Native `value` / `max` are not the value hook. Authors write `<div progress>`.
- Authors must supply an accessible name. The runtime does not invent `aria-label` text, does not copy `[progress-label]`, and does not invent or rewrite `aria-valuetext`.
- Default bounds are min `0` and max `100`. A missing or non-numeric `aria-valuenow` starts at min. Values clamp. A max below min collapses to min.
- Only `progress="indeterminate"` is indeterminate. Any other value stays determinate and is not rewritten by sync. `setIndeterminate(false)` writes the boolean attribute.
- While indeterminate, `aria-valuenow` is omitted. The last determinate value is remembered, including a stale now, and restored when the flag clears. `setValue()` during the busy state updates that memory and the ratio without writing `aria-valuenow`.
- CSS slides the indeterminate fill. `prefers-reduced-motion` stops that animation and leaves a static partial fill. The runtime does not animate.
- There is no focus trap and no Escape, Enter, Space, or arrow handling. Progress is not a layered overlay. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- There is no z-index elevation. Progress is inline status chrome. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- Centered modal / dialog, edge-docked drawer, toast-stack, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, and breadcrumb behavior are not part of this runtime. See [Modal Runtime](./juice-modal-runtime.md), [Drawer Runtime](./juice-drawer-runtime.md), [Toast Runtime](./juice-toast-runtime.md), [Popover Runtime](./juice-popover-runtime.md), [Wizard Runtime](./juice-wizard-runtime.md), [Tooltip Runtime](./juice-tooltip-runtime.md), [Combobox Runtime](./juice-combobox-runtime.md), [Banner Runtime](./juice-banner-runtime.md), [Menu Runtime](./juice-menu-runtime.md), [Switch Runtime](./juice-switch-runtime.md), [Slider Runtime](./juice-slider-runtime.md), [Checkbox Runtime](./juice-checkbox-runtime.md), [Radio Runtime](./juice-radio-runtime.md), and [Breadcrumb Runtime](./juice-breadcrumb-runtime.md).

## Why This Matches Navigation

The progress runtime copies the navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, and breadcrumb lifecycle by convention:

- DOM-first
- automatic boot
- MutationObserver plus rAF `sync()`
- idempotent singleton `start*Runtime` / `stop*Runtime`
- framework-agnostic

It does not copy their event delegation. v1 claims no events.

Shared internals under `libraries/juice/src/js/src/shared/` are not a public multi-feature runtime API.

## Design Rule Going Forward

Interactive Juice browser features should follow this standard:

> If valid Juice markup exists in the browser, the feature should activate automatically and work without app glue.
