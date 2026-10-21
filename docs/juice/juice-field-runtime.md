# Juice Field Runtime

This document explains the current field runtime in `libraries/juice/src/js/src/field/field-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, and textarea:

> If a user writes valid Juice field markup and it exists in the browser, the control should be described by the visible help and error text.

That is the standard.

## The Goal

The field runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize field behavior in their app code.

There is no `Field()` Sig factory. Markup plus the runtime is the contract.

This surface is Emerging, not Stable-ish. Valid markup should work after importing the JS entry, but the API is still likely to evolve.

Field is a wrapper around a control. The control is the first `input`, `textarea`, or `select` inside `[field]` that is not inside a nested field. Typing, change, and the keyboard stay on that control. Field is not a validation engine, not a floating label, and not a restyle of input, textarea, select, or combobox. Input stays `<input input>` and is left to name itself. Textarea stays `<textarea textarea>` and is left to name itself. Select stays `<select select>` and is left to name itself. Combobox stays `[combobox]` / `[combobox-input]` / `[combobox-list]` and is left untouched. There is no Escape handler, no focus trap, and no Sig Field factory.

**Naming gap.** `[field-label]` is chrome only. This runtime does not name the control. It does not set `aria-label` or `aria-labelledby`, and it does not turn `[field-label]` into a name. Name the control with an associated `<label for>`, a wrapping `<label>`, or the control's own label part: `[input-label]`, `[textarea-label]`, or `[select-label]`. Those names are the input, textarea, and select runtimes. A `[field-label]` with no `for`, and a `[field-label]` that is not also one of those label parts, paints and does not name the control.

Field is the twenty-fifth Emerging auto-enhance runtime. `@citrusworx/juiceui@0.9.0` shipped eighteen (navigation through progress). `@citrusworx/juiceui@0.9.2` is the live npm cut. `@citrusworx/juiceui@0.9.1` added pagination, the nineteenth. Disclosure is the twentieth. Spinner is the twenty-first. Select is the twenty-second. Input is the twenty-third. Textarea is the twenty-fourth. Disclosure, spinner, select, input, textarea, field, and motion core shipped in 0.9.2. Icon button is the twenty-sixth Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release. All twenty-six stay Emerging.

## Markup Contract

The runtime is aligned with Juice’s field chrome:

```html
<label for="email">Email</label>
<div field>
  <input input id="email" type="email">
  <p field-help>Use a work address.</p>
  <p field-error hidden>Enter an email.</p>
</div>

<div field invalid>
  <label>
    City
    <select select id="city">
      <option>Portland</option>
    </select>
  </label>
  <p field-error id="city-error">Pick a city.</p>
</div>

<div field>
  <span textarea-label>Note</span>
  <textarea textarea id="note"></textarea>
  <p field-help>Plain language.</p>
</div>
```

`[field]` is the host wrapper. `[field-label]` is optional chrome. `[field-help]` is optional help text. `[field-error]` is optional error text. `[invalid]` on the wrapper paints the invalid border and, when the author has not set `aria-invalid`, mirrors `aria-invalid="true"` onto the control. A boolean `[field]` attribute is fine. There is no HTML global `field` attribute. Any value, including `field="group"`, is still a field. Sync does not rewrite that value.

**What this runtime enhances:**

- A `[field]` host. The control is the first `input`, `textarea`, or `select` inside that field whose nearest `[field]` ancestor is this field. A button is not a control. A control inside a nested `[field]` belongs to the nested field. A second control in the same field is skipped until the first one goes away. A field with no control is skipped.
- Help and error parts in that same field, in document order. A part inside a nested field stays with the nested field. A part outside `[field]` is ignored.

**Description:** `aria-describedby` points at visible `[field-help]` and `[field-error]` only when the author has not set `aria-describedby`.

- Order is document order inside the field. Both a help part and an error part can be referenced. The value is their ids joined with a space.
- An id is added only when that part has none (`juice-field-desc-N`). An author id is kept.
- Hidden parts are skipped. `hidden` or `aria-hidden="true"` on the part or an ancestor skips it. Empty text is skipped. Hidden text inside an otherwise visible part is not part of the visible text.
- When nothing visible is there, sync does not invent a description. A description this runtime wrote is removed if those parts go away, become hidden, become empty, or the host stops being a `[field]`. An id this runtime wrote is removed when nothing still references it. An author id is left in place.
- An author `aria-describedby` is kept, including when `[invalid]` is also set. A blank value is not a description, so a whitespace-only `aria-describedby` does not block the visible parts. `title`, `aria-label`, and `aria-labelledby` are left untouched. They do not block a description, and this runtime does not write them.

**Invalid:** `[field][invalid]` sets `aria-invalid="true"` on the control only when the author has not set `aria-invalid`.

- Presence of `[invalid]` is what counts. `invalid="false"` is still `[invalid]`. The runtime writes `aria-invalid="true"`, not the attribute's value.
- An author `aria-invalid` is kept. A blank value is not set, so a whitespace-only `aria-invalid` does not block `[invalid]`. `false`, `grammar`, and an author `true` are author values. They stay. Clearing `[invalid]` does not remove them.
- Clearing `[invalid]` removes only an `aria-invalid` this runtime wrote. `destroy()` does the same. The wrapper itself does not receive `aria-invalid`.

Typing, change, and the keyboard stay native. Sync does not set `role`, does not listen for `input` or `change`, and does not validate, float a label, or name the control.

Theme paint uses the six `--juice-field-*` roles (`surface`, `gap`, `label-ink`, `help-ink`, `error-ink`, `invalid-border`). Core CSS does not give `[field]` a z-index. It is inline wrapper chrome — see [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands). `[invalid]` paints the wrapper border. It does not restyle the nested control. See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md). `[field]` is not an input, not a textarea, not a select, not a combobox, and not the surface `overlay="frost|tint"` utility. The legacy form layout in `libraries/juice/src/components/form/form.scss` stays as it is.

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the field runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    bootOnReady = () => {
      bootOnReady = null;
      if (!autoStartSuspended) {
        startFieldRuntime();
      }
    };
    document.addEventListener('DOMContentLoaded', bootOnReady);
  } else {
    startFieldRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

`stopFieldRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createField(options?)
initField(options?)
startFieldRuntime()
stopFieldRuntime()
```

These are useful for internal control, tests, or advanced cases.

A real invalid change dispatches a bubbling `juice:change` from `[field]`. `detail` is `{ runtime: "field", state: { invalid: boolean } }`. `invalid` is the `[invalid]` attribute on the wrapper. `isInvalid()` and `getState()` read it. A write that leaves `invalid` unchanged does not dispatch. This surface stays Emerging. See [juice:change](./juice-runtime-behavior.md#juicechange).

`createField()` can run alongside the automatic document runtime. This runtime claims no clicks or keys, so there is nothing to double-fire.

`initField()` is the same function as `createField()`.

## FieldOptions

The configurable shape is:

```ts
type FieldOptions = {
  root?: ParentNode;
  fieldSelector?: string;
};
```

By default, Juice uses:

```ts
{
  root: document,
  fieldSelector: '[field]',
}
```

A custom `root` limits sync to fields inside that root. When the root itself is a `[field]`, that host is managed too. Fields outside the root are left alone, including their help and error ids.

## FieldController

```ts
type FieldController = {
  destroy: () => void;
  sync: () => void;
  isInvalid: (target?: HTMLElement | null) => boolean;
  getState: (target?: HTMLElement | null) => FieldState | null;
};
```

`destroy()` disconnects the observer, cancels a scheduled sync, and removes `aria-describedby`, `aria-invalid`, and description ids this runtime wrote. An author value is left in place. `sync()` walks each managed field and applies the description and invalid state. These methods do not listen for typing or `change`, do not validate the value, do not float a label, and do not name the control.

## What the Runtime Actually Does

The runtime performs five main jobs:

1. Find `[field]` hosts inside the root. Any attribute value, including `field="group"`, stays as authored. A node without `[field]` is ignored
2. Find the control: the first `input`, `textarea`, or `select` inside the field that is not inside a nested field. A button, a nested field's control, and a field with no control are skipped. The second control in the same field is skipped until the first one goes away
3. When the author has not set `aria-describedby`, point it at the visible `[field-help]` and `[field-error]` in that field, in document order. Nested fields keep their own parts. An id is added only when that part has none. Hidden parts and empty text are skipped. An author `aria-describedby` is kept. A blank value is not a description. A description this runtime wrote is removed when its source goes away
4. When `[invalid]` is present and the author has not set `aria-invalid`, set `aria-invalid="true"` on the control. A blank value is not set. An author value is kept. Clearing `[invalid]` removes only an `aria-invalid` this runtime wrote
5. Leave typing, change, and the keyboard on the platform control. Leave the accessible name to the input, textarea, and select runtimes. `[field-label]` is chrome only. Field claims no events and does not participate in the overlay / popover / menu / combobox / toast / tooltip yield order. There is no validation engine, no floating label, no Escape handler, and no focus trap. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering)

There is no focus trap. There is no keyboard map. This runtime does not close a modal, drawer, toast, popover, wizard, tooltip, combobox, banner, or menu, and it does not toggle a switch, move a slider, toggle a checkbox, select a radio, move a breadcrumb or pagination current page, change a progress value, collapse an accordion item or a disclosure, show or hide a spinner, open a select, name an input, name a textarea, or name a select.

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If a field, its control, or its help or error text appears later, the observer schedules a `sync()` call so Juice can wire the description and invalid state.

The observer watches child-list changes, character data, and these attributes: `field`, `field-help`, `field-error`, `invalid`, `hidden`, `aria-hidden`, `aria-describedby`, `aria-invalid`, and `id`. A help or error text edit schedules sync. An author description or author `aria-invalid` is still kept. Removing `[field]` drops the host, and state this runtime wrote is removed. `[field-label]` is not watched. It does not name the control.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

Field does not listen for keys, and it does not listen for `input` or `change`.

- Escape is not handled. Field never steals it. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- Typing, Enter, and Tab are not handled. They stay with the platform control
- `change` is not handled. The browser keeps the value
- There is no focus trap. Tab is not wrapped. The runtime does not move focus and does not set `tabindex`
- There is no validation engine and no floating label

## Limitations

- No `Field()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- This surface is Emerging, not Stable-ish. Field is the twenty-fifth Emerging auto-enhance runtime, shipped in `@citrusworx/juiceui@0.9.2`. Pagination shipped in 0.9.1 and remains the nineteenth. Disclosure remains the twentieth, spinner remains the twenty-first, select remains the twenty-second, input remains the twenty-third, and textarea remains the twenty-fourth. Disclosure, spinner, select, input, textarea, field, and motion core shipped in 0.9.2. Icon button is the twenty-sixth Emerging auto-enhance runtime and is on master, not in the published npm 0.9.2 release. All twenty-six stay Emerging.
- `[field-label]` is chrome only. This runtime does not name the control. Name it with an associated `<label for>`, a wrapping `<label>`, or the control's own label part (`[input-label]`, `[textarea-label]`, `[select-label]`). Those names belong to the input, textarea, and select runtimes.
- The description comes from visible `[field-help]` and `[field-error]` only when the author has not set `aria-describedby`. Hidden or empty parts are skipped. No description is invented when nothing visible is there. An author `aria-describedby` is kept. A blank value is not a description.
- `[invalid]` sets `aria-invalid="true"` only when the author has not set `aria-invalid`. An author value is kept. A blank value is not set. Clearing `[invalid]` removes only an `aria-invalid` this runtime wrote.
- The control is the first `input`, `textarea`, or `select` in the field that is not inside a nested field. A button is skipped. A nested field keeps its own parts. A field with no control is skipped. Any `[field]` value, including `field="group"`, stays as authored.
- Typing, change, and the keyboard stay native. There is no validation engine and no floating label.
- There is no focus trap and no Escape handling. Field is not a layered overlay. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- There is no z-index elevation. Field is inline wrapper chrome. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- Centered modal / dialog, edge-docked drawer, toast-stack, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, and accordion behavior are not part of this runtime. See [Modal Runtime](./juice-modal-runtime.md), [Drawer Runtime](./juice-drawer-runtime.md), [Toast Runtime](./juice-toast-runtime.md), [Popover Runtime](./juice-popover-runtime.md), [Wizard Runtime](./juice-wizard-runtime.md), [Tooltip Runtime](./juice-tooltip-runtime.md), [Combobox Runtime](./juice-combobox-runtime.md), [Banner Runtime](./juice-banner-runtime.md), [Menu Runtime](./juice-menu-runtime.md), [Switch Runtime](./juice-switch-runtime.md), [Slider Runtime](./juice-slider-runtime.md), [Checkbox Runtime](./juice-checkbox-runtime.md), [Radio Runtime](./juice-radio-runtime.md), [Breadcrumb Runtime](./juice-breadcrumb-runtime.md), [Progress Runtime](./juice-progress-runtime.md), [Pagination Runtime](./juice-pagination-runtime.md), [Disclosure Runtime](./juice-disclosure-runtime.md), [Spinner Runtime](./juice-spinner-runtime.md), [Select Runtime](./juice-select-runtime.md), [Input Runtime](./juice-input-runtime.md), [Textarea Runtime](./juice-textarea-runtime.md), [Icon Button Runtime](./juice-icon-button-runtime.md), and [Accordion Runtime](./juice-accordion-runtime.md).

## Why This Matches Navigation

The field runtime copies the navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, and textarea lifecycle by convention:

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
