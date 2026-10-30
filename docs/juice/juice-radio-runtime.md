# Radio

Radio is an APG radio inside `[radiogroup]`. Each `[radio]` host is the disc, and the dot is `::after`.

It is Emerging and shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup ([Automatic behavior](./juice-runtime-behavior.md#automatic-behavior)).

## Markup

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

A boolean `[radio]` is valid. There is no HTML global `radio` attribute. `[radiogroup]` is layout only. Authors use `stack`, `row`, and `gap`. There is no `[radio-dot]` and no `radio-size`. `scale` does not change disc geometry. There are no `--juice-radiogroup-*` roles.

## Attributes

| Hook | What it does |
| --- | --- |
| `[radiogroup]` | Group root. Layout only. Sync sets `role="radiogroup"`. Radios outside a group are ignored. |
| `[radio]` | One option whose nearest `[radiogroup]` is that group. The host is the disc. Sync sets `role="radio"`. |

## JavaScript

| Export | What it does |
| --- | --- |
| `createRadio` | Builds a controller for the groups under `root`. |
| `initRadio` | Same call as `createRadio`. |
| `startRadioRuntime` | Starts the document controller. A second call syncs. Returns null without a document. |
| `stopRadioRuntime` | Destroys that controller and cancels a deferred boot. |

A custom-root `createRadio()` can run beside the document runtime, and each click, change, or key event is claimed once.

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Parent node to search. |
| `radiogroupSelector` | `[radiogroup]` | Group roots. |
| `radioSelector` | `[radio]` | Options. Orphans outside a group are ignored. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Removes the root listeners and disconnects the observer. |
| `sync()` | Fills group and radio roles, binary `aria-checked`, button `type`, and the roving tabindex. |
| `select(radio?)` | Checks that radio and clears the others in its nearest group. Disabled radios are ignored. |
| `getChecked(group?)` | The checked radio in the group, or `null` when none is checked. |
| `getState(target?)` | `{ value: string \| null, index: number }`, or `null`. |

`select` needs a radio. It does not fall back to the first option. With no group, `getChecked` and `getState` use the first `[radiogroup]` in the root. A group passed directly, or an element inside a group, both resolve.

## Events

A selection change dispatches a bubbling `juice:change` from `[radiogroup]`. The detail is `{ runtime: "radio", state: { value: string | null, index: number } }`. `value` is the checked option's `value` attribute or the native input value, `index` is its position or `-1` when none are checked, and an unchanged pair does not dispatch ([juice:change](./juice-runtime-behavior.md#juicechange)).

## Accessibility

- The group gets `role="radiogroup"`. Each option gets `role="radio"` and `aria-checked` of `"true"` or `"false"`. A button with no `type` becomes `type="button"`.
- Authors name the group and each option. The runtime does not invent a name.
- One tab stop per group. The checked enabled radio is `tabindex="0"`. When that radio is disabled, or nothing is checked, the first enabled radio is `"0"`. Every other radio, including disabled ones, is `"-1"`.
- ArrowRight and ArrowDown select the next enabled radio and move focus there. ArrowLeft and ArrowUp select the previous one. Movement wraps and skips `disabled` and `aria-disabled="true"`.
- Enter and Space select the targeted radio. They do not move to another option.
- Escape and Tab are not handled. Alt, Ctrl, and Meta are ignored. There is no focus trap. [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- `[radio]` has no z-index. Theme roles are `control`, `control-checked`, `border`, `border-checked`, `mark`, and `focus-ring`. [Z-index bands](./juice-runtime-behavior.md#z-index-bands).

## Behavior

1. Find `[radiogroup]` roots and the enhanceable `[radio]` descendants whose nearest group is that root. Buttons and `input type="radio"` qualify. Orphans outside a group, `div`, `span`, text inputs, and checkboxes are ignored.
2. Fill `role="radiogroup"` on the group and `role="radio"` on each option. On a button with no `type`, set `type="button"`. The runtime does not invent an accessible name.
3. Write binary `aria-checked` (`"true"` or `"false"`). `mixed` and any other value coerce to `"false"`. When more than one option is checked, keep the first in document order. Zero checked stays zero until something is selected. On a native radio, keep `.checked` in lockstep, including a static `aria-checked="true"` on an unchecked radio.
4. Write a roving `tabindex`. The checked enabled radio is `"0"`. When that radio is disabled, or nothing is checked, the first enabled radio is `"0"`. Every other radio in the group is `"-1"`.
5. Select on click for button hosts. `preventDefault` stops a missing `type` from submitting the form. Native radios follow `change` when the browser checks them, then the group is made exclusive. Enter and Space select the targeted radio. Arrow keys move among enabled radios, wrap, skip disabled radios, then focus and select that radio.
6. Leave Escape to the overlay, popover, menu, and combobox yield order. Radio does not handle it.

There is no focus trap. Nested `[radiogroup]` elements stay independent.

### Native radio hosts

Native radio hosts are a secondary path. `[radio]` on `<input type="radio">` inside a `[radiogroup]` opts that option into radio chrome (`appearance: none`). Radios outside a `[radiogroup]` stay untouched.

Paint uses `:checked`. Behavior uses `aria-checked`. Sync keeps them together:

- Native `checked` wins when it is already true.
- Otherwise `aria-checked="true"` is copied onto `.checked`.
- A later `change` that checks the input selects that radio and clears the rest of the group.
- Enter and Space use the same select path as a button, and `preventDefault` so Space does not activate twice.

Exclusivity is the nearest `[radiogroup]`. The runtime does not treat the native `name` as the group.

<details>
<summary>Edge cases</summary>

- A radio whose nearest group is a nested `[radiogroup]` belongs to that inner group. The outer group does not select it.
- A checked disabled radio stays checked until another option is selected. The tab stop moves to the first enabled radio.
- When every radio in the group is disabled, every `tabindex` is `"-1"`.
- For a native input, `value` is `HTMLInputElement.value` (the default is `"on"` when the attribute is absent). For a button, `value` is the `value` attribute, or `null` when it is absent.
- The group can start with nothing checked. The first arrow from an enabled radio selects the next or previous enabled option.

</details>

- No `Radio()` factory. Author the markup and let the runtime enhance it.
- v1 is exclusive and binary. `aria-checked="mixed"` becomes `"false"`. There is no tri-state.
- Orphan `[radio]` elements outside a `[radiogroup]` are ignored. There is no solo exclusive group.
- When more than one radio is checked, sync keeps the first in document order. Zero checked is allowed until something is selected.
- The runtime does not invent an accessible name for the group or for an option.
- Only button hosts and `input type="radio"` hosts inside a `[radiogroup]` are enhanced.
- Native `disabled` and `aria-disabled="true"` are not selected.
- `select()` needs a radio target. It does not fall back to the first option.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| APG radio inside `[radiogroup]` | A checkbox |
| APG radio inside `[radiogroup]` | Orphans outside the group (they are ignored) |

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
- [Checkbox runtime](./juice-checkbox-runtime.md)
