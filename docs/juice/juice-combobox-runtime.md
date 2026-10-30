# Combobox

Combobox is an editable input plus a listbox popup on `[combobox]`, with `[combobox-input]`, an optional `[combobox-trigger]`, and `[combobox-list]`.

It is Emerging and shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup ([Automatic behavior](./juice-runtime-behavior.md#automatic-behavior)).

## Markup

```html
<label for="fruit-input">Fruit</label>
<div combobox name="fruit">
  <input id="fruit-input" combobox-input type="text" />
  <button type="button" combobox-trigger aria-label="Show fruits"></button>
  <ul combobox-list hidden>
    <li combobox-option>Apple</li>
    <li combobox-option>Banana</li>
    <li combobox-option data-value="apricot">Apricot</li>
  </ul>
</div>
```

Closed and open is the native `hidden` attribute on `[combobox-list]`. Authors name the input with a `<label>`, `aria-label`, or `aria-labelledby`. A root `name` or `id` is only the slug for generated ids.

## Attributes

| Hook | What it does |
| --- | --- |
| `[combobox]` | Composite root. `name` or `id` becomes the slug for generated list and option ids. |
| `[combobox-input]` | Text field. Sync sets `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, and `aria-controls`. |
| `[combobox-trigger]` | Optional toggle. Sync sets `aria-expanded`, `aria-controls`, and `aria-haspopup="listbox"`. |
| `[combobox-list]` | Popup. `hidden` closes it. Sync sets `role="listbox"` and an id. |
| `[combobox-option]` | Option row. Sync sets `role="option"` and an id. `"active"` is the highlighted row. |
| `data-value` | When present, filter can match it and select writes it into the input. Otherwise select writes the option text. |

## JavaScript

| Export | What it does |
| --- | --- |
| `createCombobox` | Builds a controller for the comboboxes under `root`. |
| `initCombobox` | Same call as `createCombobox`. |
| `startComboboxRuntime` | Starts the document controller. A second call syncs. Returns null without a document. |
| `stopComboboxRuntime` | Destroys that controller and cancels a deferred boot. |

A custom-root `createCombobox()` can run beside the document runtime, and each click, focus, input, or key event is claimed once.

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Parent node to search. |
| `rootSelector` | `[combobox]` | Composite root. |
| `inputSelector` | `[combobox-input]` | Text field inside that root. |
| `triggerSelector` | `[combobox-trigger]` | Optional toggle inside that root. |
| `listSelector` | `[combobox-list]` | Popup. Open means `hidden` is absent. |
| `optionSelector` | `[combobox-option]` | Option rows inside the list. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Removes the document listeners and disconnects the observer. |
| `sync()` | Fills roles, ids, and ARIA. An open list is filtered again. Records the current state. |
| `open(target?)` | Opens the resolved combobox. A missing or disabled input is ignored. An open list is refiltered. |
| `close(target?)` | Closes an open list, clears the active option, and shows every option again. |
| `toggle(target?)` | Closes when the list is open. Otherwise opens. |
| `select(target?)` | Commits the option at `target`, or the option that contains it. Otherwise commits the active option, then closes. |
| `isOpen(target?)` | Whether the resolved list is open. False when none resolves. |
| `getState(target?)` | `{ open: boolean, value: string }` from the list and the input, or `null`. |

With no target, `open`, `close`, `toggle`, `select`, `isOpen`, and `getState` use the open combobox, or the first one in the root.

## Events

A real open or value change dispatches a bubbling `juice:change` from `[combobox]`. The detail is `{ runtime: "combobox", state: { open: boolean, value: string } }`. One action publishes the final state once, and a write that leaves both fields unchanged does not dispatch ([juice:change](./juice-runtime-behavior.md#juicechange)).

## Accessibility

- The input is `role="combobox"` with `aria-autocomplete="list"`, `aria-expanded`, and `aria-controls`. The list is `role="listbox"`. Each option is `role="option"` with an id. The committed option is `aria-selected="true"`.
- Focus stays on the input. The highlighted row is `aria-activedescendant` plus `combobox-option="active"`. There is no focus trap, and Tab is not wrapped.
- Authors name the input. The runtime does not invent an accessible name.
- ArrowDown and ArrowUp open the list if needed, then move among visible options without wrapping. Home and End move to the first or last visible option while the list is open. While closed, Home and End keep the native cursor.
- Enter selects the active option. Tab closes without committing it. Enter or Space on a non-button trigger toggles the list. IME composition is ignored.
- Escape closes without changing the input value, unless an open dialog overlay, popover, or menu already owns Escape. [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- `[combobox-list]` paints at z-index 1050. Theme paint uses `--juice-combobox-*` roles. [Z-index bands](./juice-runtime-behavior.md#z-index-bands).

## Behavior

1. Find `[combobox]` roots and the input, optional trigger, list, and options inside each root. Orphan nodes outside a `[combobox]` are ignored.
2. Fill missing `combobox`, `listbox`, and `option` roles, list and option ids, `aria-autocomplete="list"`, `aria-controls`, and trigger `aria-haspopup="listbox"`.
3. Open on input focus, typing, or trigger click. Close on Escape (yielding to an open `[modal-overlay]`, `[drawer-overlay]`, `[popover-root]`, or `[menu-root] [menu]:not([hidden])`), outside click, blur unless focus stays inside the combobox, Tab, or after select.
4. Filter visible options with a case-insensitive substring of option text and, when present, `data-value`. Non-matches get `hidden`. An empty match set stays open.
5. Write `aria-expanded` on the input and, when present, the trigger. Keyboard focus on a row is `aria-activedescendant` plus `combobox-option="active"`.
6. Selection is single-select. The input becomes the option text, or `data-value` when that attribute is present. The chosen option gets `aria-selected="true"`. Siblings are cleared.
7. Opening one combobox closes the other open ones.
8. Closing, including after select, Tab, or Escape, clears `combobox-option="active"` and `aria-activedescendant`, so a later Enter cannot commit a stale option.

Focus stays on the input. Disabled inputs are ignored. Option `mousedown` is cancelled so the input keeps focus through click-to-select.

### Filter

The query is the current input value, trimmed and lowercased. An option matches when its text includes that query, or when `data-value` includes it. An empty query shows every option. Non-matches get native `hidden`. An empty match set leaves the list open with no visible rows. Closing clears those `hidden` flags so the next open starts from the full list, then filters again.

### Placement

Placement is CSS only. `[combobox-list]` is absolutely positioned under the field at z-index 1050. The runtime does not measure, flip, or shift the list.

<details>
<summary>Edge cases</summary>

- Generated ids prefer an existing element id. Otherwise they use the root `name` or `id` slug (`fruit-list`, `fruit-option-1`).
- A trigger that is not a button, and not a link with `href`, gets `role="button"` and `tabindex="0"` when `tabindex` is missing.
- A click inside the combobox that is not an option or the trigger does not close the list. An outside click closes every open list in the root.
- Opening also closes other open comboboxes in the document that match the same root selector.
- The runtime does not write layout `content="active"` or `content="hidden"`.
- Escape is also ignored when the event is already `defaultPrevented`.

</details>

- Single-select only. No multi-select, no async or remote fetch, and no creatable options.
- No `Combobox()` factory. Author the markup and let the runtime enhance it.
- Orphan `[combobox-input]`, `[combobox-list]`, and `[combobox-option]` nodes outside `[combobox]` are ignored.
- Only one list is open at a time.
- Optional `surfaceTone` on `[combobox-list]` is allowed. The runtime does not set it.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| Input + listbox | A native select |
| Input + listbox | A popover |
| Input + listbox | A tooltip |

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
