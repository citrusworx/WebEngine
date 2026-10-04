# Juice Spinner Runtime

This document explains the current spinner runtime in `libraries/juice/src/js/src/spinner/spinner-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, and disclosure:

> If a user writes valid Juice spinner markup and it exists in the browser, the busy status and hide should just work.

That is the standard.

## The Goal

The spinner runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize spinner behavior in their app code.

There is no `Spinner()` Sig factory. Markup plus the runtime is the contract.

This surface is Emerging, not Stable-ish. Valid markup should work after importing the JS entry, but the API is still likely to evolve.

Spinner is a standalone indeterminate **busy indicator**. It is not a progress bar. Progress stays a valued `[progress]` / `[progress-fill]` bar (determinate or `progress="indeterminate"`). It is not a disclosure. CSS owns the spin. There is no value, no keyboard, no Escape, no focus trap, and no Sig Spinner factory.

Spinner is the twenty-first Emerging auto-enhance runtime. `@citrusworx/juiceui@0.9.0` shipped eighteen (navigation through progress). `@citrusworx/juiceui@0.9.1` is the live npm cut and adds pagination, the nineteenth. Disclosure is the twentieth. Select is the twenty-second. Input is the twenty-third. Disclosure, spinner, select, and input are unpublished versus 0.9.1. All twenty-three stay Emerging.

## Markup Contract

The runtime is aligned with Juice’s spinner chrome:

```html
<div spinner>
  <span spinner-label>Saving</span>
</div>

<div spinner aria-label="Working"></div>

<div spinner hidden aria-label="Held"></div>
```

`[spinner]` is the host. The ring is `::before`. `[spinner-label]` is optional visible text, usually inside the host. A boolean `[spinner]` attribute is fine. There is no HTML global `spinner` attribute, and there is no `<spinner>` element.

**What this runtime enhances:**

- A `[spinner]` host. Any attribute value, including `spinner="busy"`, is still a spinner. Sync does not rewrite that value.
- A node without `[spinner]` is ignored. A bare `[role="status"]` or `[aria-busy]` is not a spinner.
- `[spinner-label]` is author text. Sync does not copy it into `aria-label` or `aria-labelledby`.

**Shown and hidden:** shown means the host does not have the native `hidden` attribute.

- While shown, sync writes `role="status"` and `aria-busy="true"`. An author role that is not `status` is replaced. The host is not made focusable. There is no `tabindex`. There is no keyboard and no pointer handler.
- Hidden means native `hidden`. `hide()` sets that attribute and clears `role="status"` and `aria-busy` so a hidden spinner does not announce as busy. An author role that is not `status` on an already-hidden host is left. `show()` removes `hidden` and restores the shown state. Siblings are left alone.

**Accessible name:** authors own it.

- A visible `[spinner-label]` is author text. The runtime does not invent a name from it.
- When there is no visible label, authors supply the accessible name (`aria-label` or `aria-labelledby`). This runtime does not invent `aria-label` text.
- A name the author already set is kept. Sync does not rewrite `aria-label` or `aria-labelledby`.

There is no value. Sync does not write `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`, or `--juice-progress-ratio`.

Theme paint uses `--juice-spinner-*` roles (`track`, `indicator`, `ink`, `focus-ring`). The track is the inactive ring stroke. The indicator is the leading arc (`border-top-color`) and is what spins. CSS owns that spin (`juice-spinner-spin` on `::before`). `prefers-reduced-motion` stops the animation and leaves the indicator. Core CSS does not give `[spinner]` a z-index. It is inline status chrome — see [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands). `focus-ring` paints only on `:focus-visible`. The host is usually not focusable. See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md). `[spinner]` is not a progress bar, not a disclosure, and not the surface `overlay="frost|tint"` utility.

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the spinner runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startSpinnerRuntime();
    });
  } else {
    startSpinnerRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

`stopSpinnerRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createSpinner(options?)
initSpinner(options?)
startSpinnerRuntime()
stopSpinnerRuntime()
```

These are useful for internal control, tests, or advanced cases.

`createSpinner()` can run alongside the automatic document runtime. This runtime claims no clicks or keys, so there is nothing to double-fire.

`initSpinner()` is the same function as `createSpinner()`.

## SpinnerOptions

The configurable shape is:

```ts
type SpinnerOptions = {
  root?: ParentNode;
  spinnerSelector?: string;
};
```

By default, Juice uses:

```ts
{
  root: document,
  spinnerSelector: '[spinner]',
}
```

A custom `root` limits sync to spinners inside that root. When the root itself is a `[spinner]`, that host is managed too.

## SpinnerController

```ts
type SpinnerController = {
  destroy: () => void;
  sync: () => void;
  show: (target?: HTMLElement | null) => void;
  hide: (target?: HTMLElement | null) => void;
  isShown: (target?: HTMLElement | null) => boolean;
};
```

`sync()` walks each managed host and applies shown or hidden state. `show()` removes native `hidden` and writes `role="status"` and `aria-busy="true"`. `hide()` clears `role="status"` and `aria-busy`, then sets native `hidden`. `isShown()` is true when the resolved host does not have `hidden`.

An element argument resolves to that host when it matches `[spinner]` inside the root, or to the closest spinner that does. When the argument is omitted, the first spinner in tree order is used. A node that is not inside a managed `[spinner]` is ignored. These methods do not touch siblings. They never write a value.

## What the Runtime Actually Does

The runtime performs five main jobs:

1. Find `[spinner]` hosts inside the root. A node without `[spinner]` is ignored. A bare `[role="status"]` is ignored. Any attribute value, including `spinner="busy"`, stays as authored
2. While the host is shown, write `role="status"` and `aria-busy="true"`. Replace an author role that is not `status`. Do not add `tabindex`. Do not invent an accessible name. Do not copy `[spinner-label]` into `aria-label` or `aria-labelledby`. Do not rewrite a name the author already set
3. While the host is hidden, remove `role="status"` and `aria-busy` so the spinner does not announce as busy. An author role that is not `status` on an already-hidden host is left. `show()` removes native `hidden`. `hide()` sets it. Siblings stay as they are
4. Leave Escape, clicks, and the keyboard alone. Spinner claims no events and does not participate in the overlay / popover / menu / combobox / toast / tooltip yield order. It does not collapse a disclosure. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering)
5. Leave the spin to CSS. The ring is `::before`. The animation is `juice-spinner-spin`. `prefers-reduced-motion` stops that animation and leaves the indicator. The runtime does not write a value, `aria-valuenow`, or `--juice-progress-ratio`

There is no focus trap. There is no keyboard map. This runtime does not close a modal, drawer, toast, popover, wizard, tooltip, combobox, banner, or menu, and it does not toggle a switch, move a slider, toggle a checkbox, select a radio, move a breadcrumb or pagination current page, change a progress value, or collapse an accordion item or a disclosure.

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If a spinner appears later, the observer schedules a `sync()` call so Juice can wire shown or hidden state.

The observer watches child list changes and these attributes: `spinner`, `hidden`, `role`, `aria-busy`, `aria-label`, and `aria-labelledby`. A change to `aria-label` or `aria-labelledby` schedules sync. Sync still does not rewrite that name.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

Spinner does not listen for keys.

- Escape is not handled. Spinner never steals it. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- Enter, Space, and arrows are not handled. They do not show or hide the spinner
- There is no focus trap. Tab is not wrapped. The runtime does not move focus and does not set `tabindex`

Authors own whether the host is focusable. The runtime does not make it a control.

## Limitations

- No `Spinner()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- This surface is Emerging, not Stable-ish. Spinner is the twenty-first Emerging auto-enhance runtime, unpublished versus `@citrusworx/juiceui@0.9.1`. Pagination shipped in that cut and remains the nineteenth. Disclosure remains the twentieth and is also unpublished versus that cut. Select is the twenty-second and is also unpublished versus that cut. Input is the twenty-third and is also unpublished versus that cut. All twenty-three stay Emerging.
- This is not a progress bar. There is no value, no `aria-valuenow`, and no `--juice-progress-ratio`. `progress="indeterminate"` is a different runtime.
- This is not a disclosure. `[disclosure]` / `[disclosure-trigger]` / `[disclosure-panel]` is a different runtime. The two do not toggle each other.
- A node without `[spinner]` is ignored. Any `[spinner]` value, including `spinner="busy"`, stays as authored.
- A visible `[spinner-label]` is author text. The runtime does not invent `aria-label` when there is no visible label, and it does not copy a label into `aria-label` or `aria-labelledby`. An author name is kept.
- Shown hosts are `role="status"` and `aria-busy="true"`. An author role that is not `status` is replaced while shown. `hide()` sets native `hidden` and clears `role="status"` and `aria-busy` so a hidden spinner does not announce as busy. Siblings are left alone.
- CSS owns the spin (`juice-spinner-spin` on the ring). `prefers-reduced-motion` stops that animation and leaves the indicator. The runtime does not animate.
- There is no focus trap and no Escape, Enter, Space, or arrow handling. The host is not given `tabindex`. Spinner is not a layered overlay. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- There is no z-index elevation. Spinner is inline status chrome. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- Centered modal / dialog, edge-docked drawer, toast-stack, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, and accordion behavior are not part of this runtime. See [Modal Runtime](./juice-modal-runtime.md), [Drawer Runtime](./juice-drawer-runtime.md), [Toast Runtime](./juice-toast-runtime.md), [Popover Runtime](./juice-popover-runtime.md), [Wizard Runtime](./juice-wizard-runtime.md), [Tooltip Runtime](./juice-tooltip-runtime.md), [Combobox Runtime](./juice-combobox-runtime.md), [Banner Runtime](./juice-banner-runtime.md), [Menu Runtime](./juice-menu-runtime.md), [Switch Runtime](./juice-switch-runtime.md), [Slider Runtime](./juice-slider-runtime.md), [Checkbox Runtime](./juice-checkbox-runtime.md), [Radio Runtime](./juice-radio-runtime.md), [Breadcrumb Runtime](./juice-breadcrumb-runtime.md), [Progress Runtime](./juice-progress-runtime.md), [Pagination Runtime](./juice-pagination-runtime.md), [Disclosure Runtime](./juice-disclosure-runtime.md), and [Accordion Runtime](./juice-accordion-runtime.md).

## Why This Matches Navigation

The spinner runtime copies the navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, and disclosure lifecycle by convention:

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
