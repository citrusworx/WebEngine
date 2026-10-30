# Checkbox

Checkbox is an APG checkbox on `[checkbox]`. The host is the box, and the checkmark is `::after`.

It is Emerging and shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup ([Automatic behavior](./juice-runtime-behavior.md#automatic-behavior)).

## Markup

```html
<label>
  <button type="button" checkbox aria-label="Accept terms"></button>
  Accept terms
</label>

<button type="button" checkbox aria-checked="true">Remember me</button>

<input type="checkbox" checkbox aria-label="Backup" />
```

A boolean `[checkbox]` is valid. There is no HTML global `checkbox` attribute. There is no `[checkbox-box]` and no `checkbox-size`. `scale` does not change box geometry.

## Attributes

| Hook | What it does |
| --- | --- |
| `[checkbox]` | Boolean hook on the control. The host is the box. Sync sets `role="checkbox"` and binary `aria-checked`. |

## JavaScript

| Export | What it does |
| --- | --- |
| `createCheckbox` | Builds a controller for the checkboxes under `root`. |
| `initCheckbox` | Same call as `createCheckbox`. |
| `startCheckboxRuntime` | Starts the document controller. A second call syncs. Returns null without a document. |
| `stopCheckboxRuntime` | Destroys that controller and cancels a deferred boot. |

A custom-root `createCheckbox()` can run beside the document runtime, and each click, change, or key event is claimed once.

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Parent node to search. |
| `checkboxSelector` | `[checkbox]` | Hosts. Only buttons and `input type="checkbox"` are enhanced. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Removes the root listeners and disconnects the observer. |
| `sync()` | Fills `role="checkbox"`, missing button `type`, and binary `aria-checked`. |
| `toggle(target?)` | Flips the resolved checkbox. Disabled hosts are left alone. |
| `check(target?)` | Sets the resolved checkbox checked. |
| `uncheck(target?)` | Clears the resolved checkbox. |
| `setChecked(checked, target?)` | Writes the boolean. `checked` is the first argument. Disabled hosts are left alone. |
| `isChecked(target?)` | Reads checked. False when none resolves. |
| `getState(target?)` | `{ checked: boolean }`, or `null`. |

With no target, these methods use the first enhanceable `[checkbox]` in the root.

## Events

A checked change dispatches a bubbling `juice:change` from `[checkbox]`. The detail is `{ runtime: "checkbox", state: { checked: boolean } }`. A write that leaves `checked` unchanged does not dispatch ([juice:change](./juice-runtime-behavior.md#juicechange)).

## Accessibility

- Sync sets `role="checkbox"` and `aria-checked` to `"true"` or `"false"`. A button with no `type` becomes `type="button"`.
- Authors supply the name with visible text, a wrapping `<label>`, `aria-label`, or `aria-labelledby`. The runtime does not invent one.
- Enter and Space toggle the focused checkbox. Arrow-key roving for a group is [Radio](./juice-radio-runtime.md).
- Escape is not handled. [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- There is no focus trap. Tab is not wrapped. The runtime does not move focus.
- `[checkbox]` has no z-index. Theme roles are `control`, `control-checked`, `border`, `border-checked`, `mark`, and `focus-ring`. [Z-index bands](./juice-runtime-behavior.md#z-index-bands).

## Behavior

1. Find enhanceable `[checkbox]` hosts. Buttons and `input type="checkbox"` qualify. `div`, `span`, text inputs, and radios are ignored.
2. Fill `role="checkbox"`. On a button with no `type`, set `type="button"`. The runtime does not invent an accessible name.
3. Write binary `aria-checked` (`"true"` or `"false"`). `mixed` and any other value coerce to `"false"`. On a native checkbox host, keep `.checked` in lockstep, including a static `aria-checked="true"` on an unchecked box.
4. Toggle on click for button hosts. `preventDefault` stops a missing `type` from submitting the form. Native checkbox hosts follow the native `change` event so `:checked` paint and `aria-checked` stay aligned.
5. Toggle on Enter and Space for both hosts. Native `disabled` and `aria-disabled="true"` are ignored.
6. Leave Escape to the overlay, popover, menu, and combobox yield order. Checkbox does not handle it.

There is no focus trap and no exclusive-open rule.

### Native checkbox hosts

Native checkbox hosts are a secondary path. `[checkbox]` on `<input type="checkbox">` opts that one control into checkbox chrome (`appearance: none`). Other checkboxes stay untouched. This is not `[switch]` and not `menuitemcheckbox`.

Paint uses `:checked`. Behavior uses `aria-checked`. Sync keeps them together:

- Native `checked` wins when it is already true.
- Otherwise `aria-checked="true"` is copied onto `.checked`.
- A later `change` writes `aria-checked` from `.checked`.
- Enter and Space use the same toggle as a button, and `preventDefault` so Space does not toggle twice.

<details>
<summary>Edge cases</summary>

- `aria-checked="mixed"` is stored as `"false"`. There is no tri-state.
- A button click always calls `preventDefault`, including when `type` is already `button`.
- Native hosts do not use the click handler. The browser toggles `.checked`, and the `change` listener copies that into `aria-checked`.

</details>

- No `Checkbox()` factory. Author the markup and let the runtime enhance it.
- v1 is binary. There is no tri-state.
- The runtime does not invent an accessible name.
- Hosts other than `button` and `input type="checkbox"` are ignored.
- Native `disabled` and `aria-disabled="true"` do not toggle.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| APG checkbox, binary `aria-checked` | A switch |
| APG checkbox, binary `aria-checked` | A layered overlay |

## Related

- [Attributes](./juice-attributes.md)
- [Theme contract](./juice-theme-contract.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Modal runtime](./juice-modal-runtime.md)
- [Drawer runtime](./juice-drawer-runtime.md)
- [Toast runtime](./juice-toast-runtime.md)
- [Popover runtime](./juice-popover-runtime.md)
- [Wizard runtime](./juice-wizard-runtime.md)
- [Tooltip runtime](./juice-tooltip-runtime.md)
- [Combobox runtime](./juice-combobox-runtime.md)
- [Banner runtime](./juice-banner-runtime.md)
- [Menu runtime](./juice-menu-runtime.md)
- [Switch runtime](./juice-switch-runtime.md)
- [Slider runtime](./juice-slider-runtime.md)
- [Radio runtime](./juice-radio-runtime.md)
