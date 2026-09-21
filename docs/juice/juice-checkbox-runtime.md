# Juice Checkbox Runtime

This document explains the current checkbox runtime in `libraries/juice/src/js/src/checkbox/checkbox-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, and slider:

> If a user writes valid Juice checkbox markup and it exists in the browser, the toggle should just work.

That is the standard.

## The Goal

The checkbox runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize checkbox behavior in their app code.

There is no `Checkbox()` Sig factory. Markup plus the runtime is the contract.

This surface is Emerging, not Stable-ish. Valid markup should work after importing the JS entry, but the API is still likely to evolve. It is on master and is not in the `@citrusworx/juiceui@0.8.0` npm cut. Switch and slider are unpublished on that same cut.

Checkbox is an APG **Checkbox** (a binary check). It is not `[switch]`, not a menu `menuitemcheckbox`, and not a layered overlay. No tri-state, no focus trap, and no Escape handling in v1.

## Markup Contract

The runtime is aligned with Juice’s checkbox chrome:

```html
<label>
  <button type="button" checkbox aria-label="Accept terms"></button>
  Accept terms
</label>

<button type="button" checkbox aria-checked="true">Remember me</button>

<input type="checkbox" checkbox aria-label="Backup" />
```

It requires a boolean `[checkbox]` attribute on the control host. The host **is** the box. The checkmark is a CSS pseudo-element (`::after`). There is no `[checkbox-box]` child, no `checkbox-size`, and `scale` does not change box geometry.

**A boolean `[checkbox]` attribute is fine.** There is no HTML global `checkbox` attribute.

**Hosts this runtime enhances:**

- `button` (primary). Sync fills `role="checkbox"`, binary `aria-checked` (`"true"` | `"false"`), and `type="button"` when `type` is missing (so a form does not submit).
- `input type="checkbox"` (secondary). Chrome already paints `:checked`. Sync fills `role="checkbox"` and keeps `aria-checked` in lockstep with the native `checked` property. A static `aria-checked="true"` on an unchecked box is promoted onto `.checked` so `:checked` paint matches.

Other `[checkbox]` hosts (`div`, `span`, text inputs, radios) are ignored. Do not restyle bare `[role="checkbox"]`.

**Accessible name:** authors must supply one. Visible text, a wrapping `<label>`, `aria-label`, or `aria-labelledby` all count. The runtime does **not** invent a name.

**Checked state:** `aria-checked="true"` is on. Anything else, including `aria-checked="mixed"`, coerces to `"false"`. v1 is binary. There is no tri-state.

Theme paint uses `--juice-checkbox-*` roles (`control`, `control-checked`, `border`, `border-checked`, `mark`, `focus-ring`). Core CSS does not give `[checkbox]` a z-index. It is an inline control — see [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands). See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md). `[checkbox]` is an APG checkbox, not `[switch]`, not a menu `menuitemcheckbox`, and not the surface `overlay="frost|tint"` utility.

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the checkbox runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startCheckboxRuntime();
    });
  } else {
    startCheckboxRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

`stopCheckboxRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createCheckbox(options?)
initCheckbox(options?)
startCheckboxRuntime()
stopCheckboxRuntime()
```

These are useful for internal control, tests, or advanced cases.

`createCheckbox()` can run alongside the automatic document runtime. Each click, change, or key event is claimed once, so a custom-root controller does not double-fire with the singleton.

`initCheckbox()` is the same function as `createCheckbox()`.

## CheckboxOptions

The configurable shape is:

```ts
type CheckboxOptions = {
  root?: ParentNode;
  checkboxSelector?: string;
};
```

By default, Juice uses:

```ts
{
  root: document,
  checkboxSelector: '[checkbox]',
}
```

## CheckboxController

```ts
type CheckboxController = {
  destroy: () => void;
  sync: () => void;
  toggle: (target?: HTMLElement | null) => void;
  check: (target?: HTMLElement | null) => void;
  uncheck: (target?: HTMLElement | null) => void;
  setChecked: (checked: boolean, target?: HTMLElement | null) => void;
  isChecked: (target?: HTMLElement | null) => boolean;
};
```

`toggle()` flips the resolved checkbox. `check()` / `uncheck()` / `setChecked()` write a binary checked state. `isChecked()` reads it. Disabled hosts are left alone. With no target, the controller uses the first enhanceable `[checkbox]` in its root.

## What the Runtime Actually Does

The runtime performs six main jobs:

1. Find enhanceable `[checkbox]` hosts. Buttons and `input type="checkbox"` qualify. `div`, `span`, text inputs, and radios are ignored
2. Fill `role="checkbox"`. On a button with no `type`, set `type="button"`. It does not invent an accessible name
3. Write binary `aria-checked` (`"true"` or `"false"`). `mixed` and any other value coerce to `"false"`. On a checkbox host, keep `.checked` in lockstep, including promoting a static `aria-checked="true"` onto an unchecked box
4. Toggle on click for button hosts (`preventDefault`, so a missing `type` does not submit the form). Checkbox hosts follow the native `change` event so `:checked` paint and `aria-checked` stay aligned
5. Toggle on Enter and Space for both hosts. Native `disabled` and `aria-disabled="true"` are ignored
6. Leave Escape to the overlay / popover / menu / combobox / toast / tooltip yield order. Checkbox does not participate. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).

There is no focus trap. There is no exclusive-open rule. This runtime does not close a modal, drawer, toast, popover, wizard, tooltip, combobox, banner, or menu, and it does not toggle a switch, move a slider, or select a radio.

## Native checkbox hosts

Native checkbox hosts are a secondary story, not a restyle of every form checkbox.

Juice `[checkbox]` on `<input type="checkbox">` opts that one control into checkbox chrome (`appearance: none`) and checkbox behavior. Other checkboxes are untouched. The runtime is not `[switch]` and not `menuitemcheckbox`.

Paint uses `:checked`. Behavior uses `aria-checked`. Sync keeps them together:

- native `checked` wins when it is already true
- otherwise `aria-checked="true"` is copied onto `.checked`
- a later `change` (the browser’s own toggle) writes `aria-checked` from `.checked`
- Enter / Space call the same toggle path as a button, and `preventDefault` so Space does not toggle twice

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If a checkbox appears later, the observer schedules a `sync()` call so Juice can wire `role` and binary `aria-checked` and start handling clicks and keys.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

- Enter and Space toggle the focused checkbox (button or native checkbox host)
- Escape is not handled. Checkbox never steals it. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- There is no focus trap. Tab is not wrapped. The runtime does not move focus

Arrow-key roving is intentionally out of scope. This is one control, not a group. Exclusive selection belongs to [Radio Runtime](./juice-radio-runtime.md).

## Limitations

- No `Checkbox()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- This surface is Emerging, not Stable-ish. It is on master and unpublished versus `@citrusworx/juiceui@0.8.0`, along with switch and slider.
- v1 is binary. `aria-checked="mixed"` coerces to `"false"`. There is no tri-state.
- Authors must supply an accessible name. The runtime does not invent `aria-label` text.
- Only button hosts and `input type="checkbox"` hosts are enhanced. Other `[checkbox]` elements are ignored.
- Native checkbox hosts are a secondary story. This is not `[switch]`, and it is not `menuitemcheckbox`.
- Native `disabled` and `aria-disabled="true"` do not toggle.
- There is no focus trap and no Escape handling. Checkbox is not a layered overlay. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- There is no z-index elevation. Checkbox is inline chrome. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- Centered modal / dialog, edge-docked drawer, toast-stack, popover, wizard, tooltip, combobox, banner, menu, switch, slider, and radio behavior are not part of this runtime. See [Modal Runtime](./juice-modal-runtime.md), [Drawer Runtime](./juice-drawer-runtime.md), [Toast Runtime](./juice-toast-runtime.md), [Popover Runtime](./juice-popover-runtime.md), [Wizard Runtime](./juice-wizard-runtime.md), [Tooltip Runtime](./juice-tooltip-runtime.md), [Combobox Runtime](./juice-combobox-runtime.md), [Banner Runtime](./juice-banner-runtime.md), [Menu Runtime](./juice-menu-runtime.md), [Switch Runtime](./juice-switch-runtime.md), [Slider Runtime](./juice-slider-runtime.md), and [Radio Runtime](./juice-radio-runtime.md).

## Why This Matches Navigation

The checkbox runtime copies the navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, and slider lifecycle by convention:

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
