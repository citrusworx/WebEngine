# Juice Radio Runtime

This document explains the current radio runtime in `libraries/juice/src/js/src/radio/radio-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, and checkbox:

> If a user writes valid Juice radio markup and it exists in the browser, exclusive selection should just work.

That is the standard.

## The Goal

The radio runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize radio behavior in their app code.

There is no `Radio()` Sig factory. Markup plus the runtime is the contract.

This surface is Emerging, not Stable-ish. Valid markup should work after importing the JS entry, but the API is still likely to evolve.

Radio is an APG **Radio Group** (one selected option). It is not `[switch]`, not `[checkbox]`, and not a layered overlay. No tri-state, no focus trap, and no Escape handling in v1. Radios outside a `[radiogroup]` are ignored.

## Markup Contract

The runtime is aligned with Juice’s radio chrome:

```html
<div radiogroup aria-label="Shipping">
  <label>
    <button type="button" radio></button>
    Ground
  </label>
  <button type="button" radio aria-checked="true">Air</button>
</div>

<fieldset radiogroup aria-label="Payment">
  <input type="radio" radio aria-label="Card" />
  <input type="radio" radio aria-checked="true" aria-label="Cash" />
</fieldset>
```

`[radiogroup]` is the group root. `[radio]` is one option. The host **is** the disc. The dot is a CSS pseudo-element (`::after`). There is no `[radio-dot]` child, no `radio-size`, and `scale` does not change disc geometry. `[radiogroup]` is layout only: authors use `stack` / `row` / `gap`. There are no `--juice-radiogroup-*` roles.

**A boolean `[radio]` attribute is fine.** There is no HTML global `radio` attribute.

**What this runtime enhances:**

- A `[radiogroup]` root. Sync fills `role="radiogroup"`. Authors supply the group’s accessible name.
- `button` `[radio]` descendants (primary) whose nearest `[radiogroup]` is that group. Sync fills `role="radio"`, binary `aria-checked` (`"true"` | `"false"`), `type="button"` when `type` is missing, and a roving `tabindex` (one tab stop per group).
- `input type="radio"` descendants (secondary). Chrome already paints `:checked`. Sync keeps `aria-checked` in lockstep with the native `checked` property. A static `aria-checked="true"` on an unchecked radio is promoted onto `.checked` so `:checked` paint matches. Exclusivity is the `[radiogroup]`, not only the input `name`.

Orphan `[radio]` elements outside a `[radiogroup]` are ignored. Other `[radio]` hosts (`div`, `span`, text inputs, checkboxes) are ignored. A radio belongs to its nearest `[radiogroup]`. Nested groups stay independent. Do not restyle bare `[role="radio"]` or `[role="radiogroup"]`.

**Accessible name:** authors must supply one for the group and for each option. Visible text, a wrapping `<label>`, `aria-label`, or `aria-labelledby` all count. The runtime does **not** invent a name.

**Checked state:** `aria-checked="true"` is selected. Anything else, including `aria-checked="mixed"`, coerces to `"false"`. v1 is exclusive and binary. When more than one radio in a group is checked, sync keeps the first in document order and clears the rest. Zero checked is allowed until something is selected.

Theme paint uses `--juice-radio-*` roles (`control`, `control-checked`, `border`, `border-checked`, `mark`, `focus-ring`). Core CSS does not give `[radio]` a z-index. It is an inline control — see [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands). See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md). `[radio]` is an APG radio, not `[switch]`, not `[checkbox]`, and not the surface `overlay="frost|tint"` utility.

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the radio runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startRadioRuntime();
    });
  } else {
    startRadioRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

`stopRadioRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createRadio(options?)
initRadio(options?)
startRadioRuntime()
stopRadioRuntime()
```

These are useful for internal control, tests, or advanced cases.

`createRadio()` can run alongside the automatic document runtime. Each click, change, or key event is claimed once, so a custom-root controller does not double-fire with the singleton.

`initRadio()` is the same function as `createRadio()`.

## RadioOptions

The configurable shape is:

```ts
type RadioOptions = {
  root?: ParentNode;
  radiogroupSelector?: string;
  radioSelector?: string;
};
```

By default, Juice uses:

```ts
{
  root: document,
  radiogroupSelector: '[radiogroup]',
  radioSelector: '[radio]',
}
```

## RadioController

```ts
type RadioController = {
  destroy: () => void;
  sync: () => void;
  select: (radio?: HTMLElement | null) => void;
  getChecked: (group?: HTMLElement | null) => HTMLElement | null;
};
```

`select()` checks that radio and clears the other radios in its nearest `[radiogroup]`. It needs a radio target. Disabled radios are left alone. `getChecked()` returns the checked radio in a group, or `null` when none is checked. With no group, it uses the first `[radiogroup]` in the root. A group passed directly, or an element inside a group, both resolve.

## What the Runtime Actually Does

The runtime performs six main jobs:

1. Find `[radiogroup]` roots and the enhanceable `[radio]` descendants whose nearest `[radiogroup]` is that group. Buttons and `input type="radio"` qualify. Orphans outside a group, `div`, `span`, text inputs, and checkboxes are ignored
2. Fill `role="radiogroup"` on the group and `role="radio"` on each option. On a button with no `type`, set `type="button"`. It does not invent an accessible name
3. Write binary `aria-checked` (`"true"` or `"false"`). `mixed` and any other value coerce to `"false"`. When more than one option is checked, keep the first in document order. Zero checked stays zero until something is selected. On a native radio, keep `.checked` in lockstep, including promoting a static `aria-checked="true"` onto an unchecked radio
4. Write a roving `tabindex`. The checked enabled radio gets `"0"`. When the checked radio is disabled, or nothing is checked, the first enabled radio gets `"0"`. Every other radio in the group, including disabled ones, gets `"-1"`
5. Select on click for button hosts (`preventDefault`, so a missing `type` does not submit the form). Native radios follow the `change` event when the browser checks them, then the group is made exclusive. Enter and Space select the targeted radio. ArrowRight and ArrowDown move to the next enabled radio. ArrowLeft and ArrowUp move to the previous one. Movement wraps and skips `disabled` / `aria-disabled="true"`, then focuses and selects that radio
6. Leave Escape to the overlay / popover / menu / combobox / toast / tooltip yield order. Radio does not participate. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).

There is no focus trap. There is no exclusive-open rule across groups. Nested `[radiogroup]` elements stay independent. This runtime does not close a modal, drawer, toast, popover, wizard, tooltip, combobox, banner, or menu, and it does not toggle a switch, move a slider, or toggle a checkbox.

## Native radio hosts

Native radio hosts are a secondary story, not a restyle of every form radio.

Juice `[radio]` on `<input type="radio">` inside a `[radiogroup]` opts that option into radio chrome (`appearance: none`) and radio behavior. Radios outside a `[radiogroup]` are untouched. The runtime is not `[switch]` and not `[checkbox]`.

Paint uses `:checked`. Behavior uses `aria-checked`. Sync keeps them together:

- native `checked` wins when it is already true
- otherwise `aria-checked="true"` is copied onto `.checked`
- a later `change` that checks the input selects that radio and clears the rest of the group
- Enter / Space call the same select path as a button, and `preventDefault` so Space does not activate twice

Exclusivity is the nearest `[radiogroup]`. The runtime does not treat the native `name` as the group.

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If a radiogroup appears later, the observer schedules a `sync()` call so Juice can wire `role`, binary `aria-checked`, and the roving tabindex, and start handling clicks and keys.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

- ArrowRight and ArrowDown select the next enabled radio in the group and move focus there
- ArrowLeft and ArrowUp select the previous enabled radio and move focus there
- Movement wraps. Disabled radios and `aria-disabled="true"` radios are skipped
- Enter and Space select the targeted radio. They do not move to a different option
- Escape and Tab are not handled. Radio never steals Escape. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- Alt, Ctrl, and Meta key events are ignored
- There is no focus trap. Tab enters the group once, on the roving tab stop, and leaves

The group can start with nothing checked. The first arrow from an enabled radio selects the next or previous enabled option.

## Limitations

- No `Radio()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- This surface is Emerging, not Stable-ish.
- v1 is exclusive and binary. `aria-checked="mixed"` coerces to `"false"`. There is no tri-state.
- Orphan `[radio]` elements outside a `[radiogroup]` are ignored. There is no solo exclusive group.
- A radio belongs to its nearest `[radiogroup]`. Nested groups stay independent. Exclusivity is that group, not the native input `name`.
- When more than one radio is checked, sync keeps the first in document order. Zero checked is allowed until something is selected.
- Authors must supply an accessible name for the group and for each option. The runtime does not invent `aria-label` text.
- Only button hosts and `input type="radio"` hosts inside a `[radiogroup]` are enhanced. Other `[radio]` elements are ignored.
- Native radio hosts are a secondary story. This is not `[switch]` and not `[checkbox]`.
- Native `disabled` and `aria-disabled="true"` are not selected. A checked disabled radio stays checked until another option is selected, and the tab stop moves to the first enabled radio.
- `select()` needs a radio target. It does not fall back to the first option.
- There is no focus trap and no Escape handling. Radio is not a layered overlay. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- There is no z-index elevation. Radio is inline chrome. `[radiogroup]` is layout only. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- Centered modal / dialog, edge-docked drawer, toast-stack, popover, wizard, tooltip, combobox, banner, menu, switch, slider, and checkbox behavior are not part of this runtime. See [Modal Runtime](./juice-modal-runtime.md), [Drawer Runtime](./juice-drawer-runtime.md), [Toast Runtime](./juice-toast-runtime.md), [Popover Runtime](./juice-popover-runtime.md), [Wizard Runtime](./juice-wizard-runtime.md), [Tooltip Runtime](./juice-tooltip-runtime.md), [Combobox Runtime](./juice-combobox-runtime.md), [Banner Runtime](./juice-banner-runtime.md), [Menu Runtime](./juice-menu-runtime.md), [Switch Runtime](./juice-switch-runtime.md), [Slider Runtime](./juice-slider-runtime.md), and [Checkbox Runtime](./juice-checkbox-runtime.md).

## Why This Matches Navigation

The radio runtime copies the navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, and checkbox lifecycle by convention:

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
