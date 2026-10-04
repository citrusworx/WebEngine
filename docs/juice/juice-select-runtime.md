# Juice Select Runtime

This document explains the current select runtime in `libraries/juice/src/js/src/select/select-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, and spinner:

> If a user writes valid Juice select markup and it exists in the browser, the accessible name should just work.

That is the standard.

## The Goal

The select runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize select behavior in their app code.

There is no `Select()` Sig factory. Markup plus the runtime is the contract.

This surface is Emerging, not Stable-ish. Valid markup should work after importing the JS entry, but the API is still likely to evolve.

Select is a styled native **`<select>`**. The open list stays the platform popup. It is not a combobox. Combobox stays `[combobox]` / `[combobox-input]` / `[combobox-list]` and is left untouched. There is no listbox, no Escape handler, no focus trap, and no Sig Select factory. Change events and the keyboard stay on the native control. `[multiple]` and `size` listboxes stay native selects.

Select is the twenty-second Emerging auto-enhance runtime. `@citrusworx/juiceui@0.9.0` shipped eighteen (navigation through progress). `@citrusworx/juiceui@0.9.1` is the live npm cut and adds pagination, the nineteenth. Disclosure is the twentieth. Spinner is the twenty-first. Input is the twenty-third. Disclosure, spinner, select, and input are unpublished versus 0.9.1. All twenty-three stay Emerging.

## Markup Contract

The runtime is aligned with Juice’s select chrome:

```html
<label for="city">City</label>
<select select id="city">
  <option>Portland</option>
  <option>Salem</option>
</select>

<label>
  City
  <select select>
    <option>Portland</option>
  </select>
</label>

<span select-label>Flavor</span>
<select select>
  <option>Lime</option>
</select>
```

`<select select>` is the host. `[select-label]` is an optional visible label. A boolean `[select]` attribute is fine. There is no HTML global `select` attribute. The element is still `<select>`. There is no `[select-list]` and no `[select-option]`.

**What this runtime enhances:**

- A `<select select>` host. Any attribute value, including `select="list"`, is still a select. Sync does not rewrite that value.
- A node that is not a `<select>` is ignored. That includes `[combobox]` and a bare `[select]` on another element. A `<select>` without `[select]` is ignored. A `<select select>` inside `[combobox]` is ignored. Combobox stays a different component.

**Accessible name:** synced from a visible label only when the author has not set `aria-label` or `aria-labelledby`.

- Order: an associated `<label for>`, then a wrapping `<label>`, then `[select-label]`. `[select-label]` is a `for` / `id` pair, a wrapping element that contains only that select, or the nearest preceding sibling (including one nested in a preceding sibling that does not itself contain a select).
- A label that does not contain the control is referenced with `aria-labelledby`. An id is added only when that label has none (`juice-select-label-N`).
- A wrapping label is copied into `aria-label` as its visible text, excluding the select, so the selected option is not part of the name. The same copy is used when `[select-label]` wraps the control.
- Hidden labels are skipped. `hidden` or `aria-hidden="true"` on the label or an ancestor skips it. Empty text is skipped. The next visible source is used.
- When nothing visible is there, sync does not invent a name. A name this runtime wrote is removed if that label goes away, becomes hidden, or becomes empty.
- An author `aria-label` or `aria-labelledby` is kept. A blank value is not a name. `title` is left untouched and does not block a visible label. If the author later sets a name, a name this runtime wrote on the other attribute is removed.

`[multiple]` and `size` listboxes stay native `<select>` elements. Sync does not set `role`, `aria-expanded`, `aria-multiselectable`, or `tabindex`, and it does not build a listbox. Change events and the keyboard stay native.

Theme paint uses `--juice-select-*` roles (`surface`, `border`, `ink`, `chevron`, `focus-ring`). The chevron is a `background-image` on the host, not `::after`. `[multiple]` and `size` other than `1` drop that chevron and keep the native list. Core CSS does not give `select[select]` a z-index. It is inline field chrome — see [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands). `focus-ring` paints on `:focus-visible`. See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md). `<select select>` is not a combobox and not the surface `overlay="frost|tint"` utility.

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the select runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startSelectRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startSelectRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

`stopSelectRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createSelect(options?)
initSelect(options?)
startSelectRuntime()
stopSelectRuntime()
```

These are useful for internal control, tests, or advanced cases.

`createSelect()` can run alongside the automatic document runtime. This runtime claims no clicks or keys, so there is nothing to double-fire.

`initSelect()` is the same function as `createSelect()`.

## SelectOptions

The configurable shape is:

```ts
type SelectOptions = {
  root?: ParentNode;
  selectSelector?: string;
};
```

By default, Juice uses:

```ts
{
  root: document,
  selectSelector: 'select[select]',
}
```

A custom `root` limits sync to selects inside that root. When the root itself is a `<select select>`, that host is managed too. Label lookup also searches the document, so an associated label outside the root can still name a select inside it. Selects outside the root are left alone.

## SelectController

```ts
type SelectController = {
  destroy: () => void;
  sync: () => void;
};
```

`destroy()` disconnects the observer and cancels a scheduled sync. `sync()` walks each managed host and applies the accessible name. These methods do not open the platform popup, do not listen for `change`, and do not build a listbox.

## What the Runtime Actually Does

The runtime performs five main jobs:

1. Find `<select select>` hosts inside the root. A node that is not a `<select>` is ignored, including `[combobox]` and a bare `[select]` on another element. A `<select>` without `[select]` is ignored. A `<select select>` inside `[combobox]` is ignored. Any attribute value, including `select="list"`, stays as authored
2. When the author has not set `aria-label` or `aria-labelledby`, name the control from the first visible label. Order: associated `<label for>`, wrapping `<label>`, then `[select-label]` (`for` / `id`, a wrapping element that contains only that select, or the nearest preceding sibling). A blank value is not an author name. `title` is left untouched and does not block a visible label
3. A separate label is referenced with `aria-labelledby`. An id is added only when that label has none. A wrapping label is copied into `aria-label` as its visible text excluding the select, so the selected option is not part of the name. Hidden or empty labels are skipped. When nothing visible is there, no name is invented, and a name this runtime wrote is removed. If the author later sets a name, a name this runtime wrote on the other attribute is removed
4. Leave change events and the keyboard on the platform control. Select claims no events and does not participate in the overlay / popover / menu / combobox / toast / tooltip yield order. There is no listbox, no Escape handler, and no focus trap. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering)
5. Leave the open list to the platform popup. `[multiple]` and `size` listboxes stay native selects. Sync does not set `role`, `aria-expanded`, `aria-multiselectable`, or `tabindex`. Combobox is a different component and stays untouched

There is no focus trap. There is no keyboard map. This runtime does not close a modal, drawer, toast, popover, wizard, tooltip, combobox, banner, or menu, and it does not toggle a switch, move a slider, toggle a checkbox, select a radio, move a breadcrumb or pagination current page, change a progress value, collapse an accordion item or a disclosure, or show or hide a spinner.

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If a select or its label appears later, the observer schedules a `sync()` call so Juice can wire the accessible name.

The observer watches child-list changes, character data, and these attributes: `select`, `select-label`, `for`, `id`, `hidden`, `aria-hidden`, `aria-label`, `aria-labelledby`, `multiple`, and `size`. A label text edit schedules sync. An author name is still kept.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

Select does not listen for keys, and it does not listen for `change`.

- Escape is not handled. Select never steals it. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- Enter, Space, arrows, and Tab are not handled. They stay with the platform control and its popup
- `change` is not handled. The browser keeps the selected option
- There is no focus trap. Tab is not wrapped. The runtime does not move focus and does not set `tabindex`

`[multiple]` and `size` listboxes stay native selects. The runtime does not turn them into a listbox.

## Limitations

- No `Select()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- This surface is Emerging, not Stable-ish. Select is the twenty-second Emerging auto-enhance runtime, unpublished versus `@citrusworx/juiceui@0.9.1`. Pagination shipped in that cut and remains the nineteenth. Disclosure remains the twentieth and spinner remains the twenty-first. Input is the twenty-third and is also unpublished versus that cut. Disclosure, spinner, select, and input are unpublished versus that cut. All twenty-three stay Emerging.
- This is not a combobox. `[combobox]` / `[combobox-input]` / `[combobox-list]` / `[combobox-option]` is a different runtime. A `<select select>` inside `[combobox]` is ignored. Combobox stays untouched.
- The open list stays the platform popup. There is no `[select-list]`, no `[select-option]`, and no listbox. Sync does not set `role`, `aria-expanded`, `aria-multiselectable`, or `tabindex`.
- A node that is not a `<select>` is ignored. A `<select>` without `[select]` is ignored. Any `[select]` value, including `select="list"`, stays as authored.
- The accessible name comes from a visible label only when the author has not set `aria-label` or `aria-labelledby`. Order: associated `<label for>`, wrapping `<label>`, then `[select-label]`. A separate label is referenced with `aria-labelledby`. A wrapping label is copied into `aria-label` as its visible text excluding the select, so the selected option is not part of the name. Hidden or empty labels are skipped. No name is invented when nothing visible is there. `title` does not count. A name this runtime wrote is removed if that label goes away.
- `[multiple]` and `size` listboxes stay native selects. Change events and the keyboard stay native.
- There is no focus trap and no Escape, Enter, Space, or arrow handling. Select is not a layered overlay. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- There is no z-index elevation. Select is inline field chrome. The chevron is a `background-image`. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- Centered modal / dialog, edge-docked drawer, toast-stack, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, and accordion behavior are not part of this runtime. See [Modal Runtime](./juice-modal-runtime.md), [Drawer Runtime](./juice-drawer-runtime.md), [Toast Runtime](./juice-toast-runtime.md), [Popover Runtime](./juice-popover-runtime.md), [Wizard Runtime](./juice-wizard-runtime.md), [Tooltip Runtime](./juice-tooltip-runtime.md), [Combobox Runtime](./juice-combobox-runtime.md), [Banner Runtime](./juice-banner-runtime.md), [Menu Runtime](./juice-menu-runtime.md), [Switch Runtime](./juice-switch-runtime.md), [Slider Runtime](./juice-slider-runtime.md), [Checkbox Runtime](./juice-checkbox-runtime.md), [Radio Runtime](./juice-radio-runtime.md), [Breadcrumb Runtime](./juice-breadcrumb-runtime.md), [Progress Runtime](./juice-progress-runtime.md), [Pagination Runtime](./juice-pagination-runtime.md), [Disclosure Runtime](./juice-disclosure-runtime.md), [Spinner Runtime](./juice-spinner-runtime.md), and [Accordion Runtime](./juice-accordion-runtime.md).

## Why This Matches Navigation

The select runtime copies the navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, and spinner lifecycle by convention:

- DOM-first
- automatic boot
- MutationObserver plus rAF `sync()`
- idempotent singleton `start*Runtime` / `stop*Runtime`
- framework-agnostic

It does not copy their event delegation. v1 claims no events. The open list stays the platform popup.

Shared internals under `libraries/juice/src/js/src/shared/` are not a public multi-feature runtime API.

## Design Rule Going Forward

Interactive Juice browser features should follow this standard:

> If valid Juice markup exists in the browser, the feature should activate automatically and work without app glue.
