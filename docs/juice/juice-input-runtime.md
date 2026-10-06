# Juice Input Runtime

This document explains the current input runtime in `libraries/juice/src/js/src/input/input-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, and select:

> If a user writes valid Juice input markup and it exists in the browser, the accessible name should just work.

That is the standard.

## The Goal

The input runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize input behavior in their app code.

There is no `Input()` Sig factory. Markup plus the runtime is the contract.

This surface is Emerging, not Stable-ish. Valid markup should work after importing the JS entry, but the API is still likely to evolve.

Input is a styled native **`<input>`**. Typing, change, and the keyboard stay on the native control. It is not a combobox and not a select. Combobox stays `[combobox]` / `[combobox-input]` / `[combobox-list]` and is left untouched. Select stays `<select select>` and is left untouched. Textarea is a different runtime — see [Textarea Runtime](./juice-textarea-runtime.md). The `[field]` wrapper is not this runtime. There is no mask, no validation engine, no floating label, no Escape handler, no focus trap, and no Sig Input factory.

Input is the twenty-third Emerging auto-enhance runtime. `@citrusworx/juiceui@0.9.0` shipped eighteen (navigation through progress). `@citrusworx/juiceui@0.9.1` is the live npm cut and adds pagination, the nineteenth. Disclosure is the twentieth. Spinner is the twenty-first. Select is the twenty-second. Textarea is the twenty-fourth. Disclosure, spinner, select, input, and textarea are unpublished versus 0.9.1. All twenty-four stay Emerging.

## Markup Contract

The runtime is aligned with Juice’s input chrome:

```html
<label for="city">City</label>
<input input id="city" type="text" />

<label>
  City
  <input input type="text" value="Portland" />
</label>

<span input-label>Flavor</span>
<input input type="text" />
```

`<input input>` is the host. `[input-label]` is an optional visible label. A boolean `[input]` attribute is fine. There is no HTML global `input` attribute. The element is still `<input>`.

**What this runtime enhances:**

- An `<input input>` host whose type is missing, empty, or one of `text`, `email`, `password`, `search`, `tel`, `url`, and `number`. Any attribute value, including `input="text"`, is still an input. Sync does not rewrite that value.
- A node that is not an `<input>` is ignored. That includes a `<textarea>`, a `[field]` wrapper, `[combobox]`, and a bare `[input]` on another element. An `<input>` without `[input]` is ignored. An `<input input>` inside `[combobox]`, including `[combobox-input]`, is ignored. Combobox stays a different component. Select stays a different component.
- Checkbox, radio, range, file, date, time, datetime-local, month, week, color, hidden, button, submit, reset, and image are ignored, even with `[input]`.

**Accessible name:** synced from a visible label only when the author has not set `aria-label` or `aria-labelledby`.

- Order: an associated `<label for>`, then a wrapping `<label>`, then `[input-label]`. `[input-label]` is a `for` / `id` pair, a wrapping element that contains only that input, or the nearest preceding sibling (including one nested in a preceding sibling that does not itself contain an input).
- A label that does not contain the control is referenced with `aria-labelledby`. An id is added only when that label has none (`juice-input-label-N`).
- A wrapping label is copied into `aria-label` as its visible text, excluding the input, so the input's own value is not part of the name. The same copy is used when `[input-label]` wraps the control.
- Hidden labels are skipped. `hidden` or `aria-hidden="true"` on the label or an ancestor skips it. Empty text is skipped. The next visible source is used.
- When nothing visible is there, sync does not invent a name. A name this runtime wrote is removed if that label goes away, becomes hidden, becomes empty, or the host stops being a text-like `[input]`.
- An author `aria-label` or `aria-labelledby` is kept. A blank value is not a name. `title` is left untouched and does not block a visible label. If the author later sets a name, a name this runtime wrote on the other attribute is removed.

Typing, change, and the keyboard stay native. Sync does not set `role`, does not listen for `input` or `change`, and does not mask, validate, or float a label.

Theme paint uses `--juice-input-*` roles (`surface`, `border`, `ink`, `placeholder`, `focus-ring`). Core CSS does not give `input[input]` a z-index. It is inline field chrome — see [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands). `focus-ring` paints on `:focus-visible`. See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md). `<input input>` is not a combobox, not a select, and not the surface `overlay="frost|tint"` utility.

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the input runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startInputRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startInputRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

`stopInputRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createInput(options?)
initInput(options?)
startInputRuntime()
stopInputRuntime()
```

These are useful for internal control, tests, or advanced cases.

`createInput()` can run alongside the automatic document runtime. This runtime claims no clicks or keys, so there is nothing to double-fire.

`initInput()` is the same function as `createInput()`.

## InputOptions

The configurable shape is:

```ts
type InputOptions = {
  root?: ParentNode;
  inputSelector?: string;
};
```

By default, Juice uses:

```ts
{
  root: document,
  inputSelector: 'input[input]',
}
```

A custom `root` limits sync to inputs inside that root. When the root itself is an `<input input>`, that host is managed too. Label lookup also searches the document, so an associated label outside the root can still name an input inside it. Inputs outside the root are left alone.

## InputController

```ts
type InputController = {
  destroy: () => void;
  sync: () => void;
};
```

`destroy()` disconnects the observer and cancels a scheduled sync. `sync()` walks each managed host and applies the accessible name. These methods do not listen for typing or `change`, do not mask the value, and do not validate it.

## What the Runtime Actually Does

The runtime performs five main jobs:

1. Find text-like `<input input>` hosts inside the root. A node that is not an `<input>` is ignored, including a `<textarea>`, a `[field]` wrapper, `[combobox]`, and a bare `[input]` on another element. An `<input>` without `[input]` is ignored. An `<input input>` inside `[combobox]`, including `[combobox-input]`, is ignored. Checkbox, radio, range, file, date, time, datetime-local, month, week, color, hidden, button, submit, reset, and image are ignored. Any attribute value, including `input="text"`, stays as authored
2. When the author has not set `aria-label` or `aria-labelledby`, name the control from the first visible label. Order: associated `<label for>`, wrapping `<label>`, then `[input-label]` (`for` / `id`, a wrapping element that contains only that input, or the nearest preceding sibling). A blank value is not an author name. `title` is left untouched and does not block a visible label
3. A separate label is referenced with `aria-labelledby`. An id is added only when that label has none. A wrapping label is copied into `aria-label` as its visible text excluding the input, so the input's own value is not part of the name. Hidden or empty labels are skipped. When nothing visible is there, no name is invented, and a name this runtime wrote is removed. If the author later sets a name, a name this runtime wrote on the other attribute is removed
4. Leave typing, change, and the keyboard on the platform control. Input claims no events and does not participate in the overlay / popover / menu / combobox / toast / tooltip yield order. There is no mask, no validation engine, no floating label, no Escape handler, and no focus trap. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering)
5. Leave the value to the platform control. Combobox and select are different components and stay untouched. Textarea and the `[field]` wrapper are not this runtime

There is no focus trap. There is no keyboard map. This runtime does not close a modal, drawer, toast, popover, wizard, tooltip, combobox, banner, or menu, and it does not toggle a switch, move a slider, toggle a checkbox, select a radio, move a breadcrumb or pagination current page, change a progress value, collapse an accordion item or a disclosure, show or hide a spinner, or open a select.

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If an input or its label appears later, the observer schedules a `sync()` call so Juice can wire the accessible name.

The observer watches child-list changes, character data, and these attributes: `input`, `input-label`, `type`, `for`, `id`, `hidden`, `aria-hidden`, `aria-label`, `aria-labelledby`, `combobox`, and `combobox-input`. A label text edit schedules sync. An author name is still kept. A type change that leaves the text-like set drops the host, and a name this runtime wrote is removed.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

Input does not listen for keys, and it does not listen for `input` or `change`.

- Escape is not handled. Input never steals it. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- Typing, Enter, and Tab are not handled. They stay with the platform control
- `change` is not handled. The browser keeps the value
- There is no focus trap. Tab is not wrapped. The runtime does not move focus and does not set `tabindex`
- There is no mask, no validation engine, and no floating label

## Limitations

- No `Input()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- This surface is Emerging, not Stable-ish. Input is the twenty-third Emerging auto-enhance runtime, unpublished versus `@citrusworx/juiceui@0.9.1`. Pagination shipped in that cut and remains the nineteenth. Disclosure remains the twentieth, spinner remains the twenty-first, and select remains the twenty-second. Textarea is the twenty-fourth and is also unpublished versus that cut. Disclosure, spinner, select, input, and textarea are unpublished versus that cut. All twenty-four stay Emerging.
- This is not a combobox. `[combobox]` / `[combobox-input]` / `[combobox-list]` / `[combobox-option]` is a different runtime. An `<input input>` inside `[combobox]`, including `[combobox-input]`, is ignored. Combobox stays untouched.
- This is not a select. `<select select>` is a different runtime. The open list of a select stays the platform popup. Select stays untouched.
- Textarea and the `[field]` wrapper are not this runtime. A node that is not an `<input>` is ignored. An `<input>` without `[input]` is ignored. Any `[input]` value, including `input="text"`, stays as authored.
- Text-like controls only: a missing `type`, an empty `type`, and `text`, `email`, `password`, `search`, `tel`, `url`, and `number`. Checkbox, radio, range, file, date, time, datetime-local, month, week, color, hidden, button, submit, reset, and image are ignored.
- The accessible name comes from a visible label only when the author has not set `aria-label` or `aria-labelledby`. Order: associated `<label for>`, wrapping `<label>`, then `[input-label]`. A separate label is referenced with `aria-labelledby`. A wrapping label is copied into `aria-label` as its visible text excluding the input, so the input's own value is not part of the name. Hidden or empty labels are skipped. No name is invented when nothing visible is there. `title` does not count. A name this runtime wrote is removed if that label goes away.
- Typing, change, and the keyboard stay native. There is no mask, no validation engine, and no floating label.
- There is no focus trap and no Escape handling. Input is not a layered overlay. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- There is no z-index elevation. Input is inline field chrome. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- Centered modal / dialog, edge-docked drawer, toast-stack, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, and accordion behavior are not part of this runtime. See [Modal Runtime](./juice-modal-runtime.md), [Drawer Runtime](./juice-drawer-runtime.md), [Toast Runtime](./juice-toast-runtime.md), [Popover Runtime](./juice-popover-runtime.md), [Wizard Runtime](./juice-wizard-runtime.md), [Tooltip Runtime](./juice-tooltip-runtime.md), [Combobox Runtime](./juice-combobox-runtime.md), [Banner Runtime](./juice-banner-runtime.md), [Menu Runtime](./juice-menu-runtime.md), [Switch Runtime](./juice-switch-runtime.md), [Slider Runtime](./juice-slider-runtime.md), [Checkbox Runtime](./juice-checkbox-runtime.md), [Radio Runtime](./juice-radio-runtime.md), [Breadcrumb Runtime](./juice-breadcrumb-runtime.md), [Progress Runtime](./juice-progress-runtime.md), [Pagination Runtime](./juice-pagination-runtime.md), [Disclosure Runtime](./juice-disclosure-runtime.md), [Spinner Runtime](./juice-spinner-runtime.md), [Select Runtime](./juice-select-runtime.md), and [Accordion Runtime](./juice-accordion-runtime.md).

## Why This Matches Navigation

The input runtime copies the navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, and select lifecycle by convention:

- DOM-first
- automatic boot
- MutationObserver plus rAF `sync()`
- idempotent singleton `start*Runtime` / `stop*Runtime`
- framework-agnostic

It does not copy their event delegation. v1 claims no events. Typing, change, and the keyboard stay on the platform control.

Shared internals under `libraries/juice/src/js/src/shared/` are not a public multi-feature runtime API.

## Design Rule Going Forward

Interactive Juice browser features should follow this standard:

> If valid Juice markup exists in the browser, the feature should activate automatically and work without app glue.
