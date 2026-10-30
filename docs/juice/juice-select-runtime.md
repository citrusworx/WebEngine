# Select

Select is a styled native `<select select>`. The open list stays the platform popup.

It is Emerging, the twenty-second Emerging runtime, and shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup ([Automatic behavior](./juice-runtime-behavior.md#automatic-behavior)).

## Markup

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

`<select select>` is the host. `[select-label]` is an optional visible label. A boolean `[select]` is valid. There is no HTML global `select` attribute. The element stays `<select>`. There is no `[select-list]` and no `[select-option]`.

## Attributes

| Hook | What it does |
| --- | --- |
| `[select]` | On the native `<select>`. Any value, including `select="list"`, stays as authored. Sync does not rewrite it. |
| `[select-label]` | Optional visible label. Pair it with `for` / `id`, a wrapping element, or the nearest preceding sibling. |

## JavaScript

| Export | What it does |
| --- | --- |
| `createSelect` | Builds a controller for the selects under `root`. |
| `initSelect` | Same call as `createSelect`. |
| `startSelectRuntime` | Starts the document controller. A second call syncs. Returns null without a document. |
| `stopSelectRuntime` | Destroys that controller and cancels a deferred boot. |

A custom-root `createSelect()` can run beside the document runtime, and this runtime claims no clicks or keys.

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Parent node to search. When the root itself is `<select select>`, that host is managed too. |
| `selectSelector` | `select[select]` | Native selects with `[select]`. Label lookup also searches the document. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Disconnects the observer and cancels a scheduled sync. |
| `sync()` | Walks each managed host and applies the accessible name. |
| `getState(target?)` | `{ value: string }` from `HTMLSelectElement.value`, or `null` when no host resolves. |

These methods do not open the platform popup, do not listen for `change`, and do not build a listbox. With no target, `getState` uses the first managed select. A target that is the select, or an ancestor of one, both resolve.

## Events

Select publishes value changes through native `input` and `change` and does not dispatch `juice:change`. `getState()` still returns `{ value: string }` from `HTMLSelectElement.value` (the first selected option), or `null` when no host resolves ([juice:change](./juice-runtime-behavior.md#juicechange)).

## Accessibility

- Sync does not set `role`, `aria-expanded`, `aria-multiselectable`, or `tabindex`. It does not build a listbox.
- An author `aria-label` or `aria-labelledby` is kept. A blank value is not a name. `title` is left untouched and does not block a visible label.
- When the author has not set a name, a separate label is referenced with `aria-labelledby`. A wrapping label is copied into `aria-label` as its visible text, excluding the select, so the selected option is not part of the name.
- The runtime does not listen for keys. Escape, Enter, Space, arrows, and Tab stay with the platform control and its popup. There is no focus trap. [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- `select[select]` has no z-index. The chevron is a `background-image` on the host. Theme roles are `surface`, `border`, `ink`, `chevron`, and `focus-ring`. `focus-ring` paints on `:focus-visible`. [Z-index bands](./juice-runtime-behavior.md#z-index-bands).

## Behavior

1. Find `<select select>` hosts inside the root. A node that is not a `<select>` is ignored, including `[combobox]` and a bare `[select]` on another element. A `<select>` without `[select]` is ignored. A `<select select>` inside `[combobox]` is ignored. Any attribute value, including `select="list"`, stays as authored.
2. When the author has not set `aria-label` or `aria-labelledby`, name the control from the first visible label. Order: an associated `<label for>`, a wrapping `<label>`, then `[select-label]`.
3. A label that does not contain the control is referenced with `aria-labelledby`. An id is added only when that label has none (`juice-select-label-N`). A wrapping label is copied into `aria-label` as its visible text excluding the select.
4. Hidden or empty labels are skipped. When nothing visible remains, no name is invented, and a name this runtime wrote is removed. An author name is kept. A blank value is not a name. `title` does not count and does not block a visible label. If the author later sets a name, a name this runtime wrote on the other attribute is removed.
5. Leave change and keys on the platform control. Select claims no events and does not take part in the overlay yield order. There is no listbox, no Escape handler, and no focus trap. `[multiple]` and `size` listboxes stay native selects. Sync does not set `role`, `aria-expanded`, `aria-multiselectable`, or `tabindex`. The open list stays the platform popup.

There is no focus trap and no keyboard map.

<details>
<summary>Edge cases</summary>

- `[select-label]` matches a `for` / `id` pair, a wrapping element that contains only that select, or the nearest preceding sibling. A label nested in a preceding sibling counts when that sibling does not itself contain a select.
- `hidden` or `aria-hidden="true"` on the label or an ancestor skips it. Empty text is skipped. The next visible source is used.
- A name this runtime wrote is removed when that label goes away, becomes hidden, or becomes empty.
- Label lookup also searches the document, so an associated label outside a custom root can still name a select inside it. Selects outside the root are left alone.
- `[multiple]` and `size` other than `1` drop the chevron and keep the native list. The runtime does not turn them into a listbox.
- The observer watches child list, character data, and `select`, `select-label`, `for`, `id`, `hidden`, `aria-hidden`, `aria-label`, `aria-labelledby`, `multiple`, and `size`. A label text edit schedules sync. An author name is still kept.

</details>

- No `Select()` factory. Author the markup and let the runtime enhance it.
- A node that is not a `<select>` is ignored. A `<select>` without `[select]` is ignored. A `<select select>` inside `[combobox]` is ignored.
- The accessible name comes from a visible label only when the author has not set `aria-label` or `aria-labelledby`. No name is invented when nothing visible is there.
- `[multiple]` and `size` listboxes stay native selects. Change events and the keyboard stay native.
- There is no focus trap and no Escape, Enter, Space, or arrow handling.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| Native select | A combobox |
| Native select | A custom list (the open list stays the platform popup) |

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
- [Radio runtime](./juice-radio-runtime.md)
- [Breadcrumb runtime](./juice-breadcrumb-runtime.md)
- [Progress runtime](./juice-progress-runtime.md)
- [Pagination runtime](./juice-pagination-runtime.md)
- [Disclosure runtime](./juice-disclosure-runtime.md)
- [Spinner runtime](./juice-spinner-runtime.md)
- [Icon button runtime](./juice-icon-button-runtime.md)
- [Accordion runtime](./juice-accordion-runtime.md)
