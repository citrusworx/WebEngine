# Field

Field is a wrapper. `createField` points `aria-describedby` at visible help and error text, and mirrors `[invalid]` onto the first control.

Emerging. The twenty-fifth runtime. Shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup. See [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior).

Typing, change, and the keyboard stay on that control. Field is not a validation engine, not a floating label, and not a restyle of input, textarea, select, or combobox. There is no `Field()` factory.

`[field-label]` is chrome only. This runtime does not set `aria-label` or `aria-labelledby`. Name the control with `<label for>`, a wrapping `<label>`, or `[input-label]`, `[textarea-label]`, or `[select-label]`. Those names belong to the input, textarea, and select runtimes.

## Markup

Help text, with the error hidden until needed.

```html
<label for="email">Email</label>
<div field>
  <input input id="email" type="email">
  <p field-help>Use a work address.</p>
  <p field-error hidden>Enter an email.</p>
</div>
```

Invalid select. The error keeps its author id.

```html
<div field invalid>
  <label>
    City
    <select select id="city">
      <option>Portland</option>
    </select>
  </label>
  <p field-error id="city-error">Pick a city.</p>
</div>
```

Textarea inside the wrapper.

```html
<div field>
  <span textarea-label>Note</span>
  <textarea textarea id="note"></textarea>
  <p field-help>Plain language.</p>
</div>
```

`[field]` is the host wrapper. A boolean `[field]` is fine. There is no HTML global `field` attribute. Any value, including `field="group"`, stays as authored.

## Attributes

| Hook | What it does |
| --- | --- |
| `[field]` | Host wrapper. Sync does not rewrite the attribute. |
| Control | The first `input`, `textarea`, or `select` whose nearest `[field]` ancestor is this field. A button is not a control. |
| Nested `[field]` | A control or part inside a nested field belongs to the nested field. A second control here is skipped until the first one goes away. |
| `[field-label]` | Optional chrome. It does not name the control. This runtime does not watch it. |
| `[field-help]` | Optional help text. Visible parts are described in document order. |
| `[field-error]` | Optional error text. It can be referenced together with help. |
| `aria-describedby` | Set to the visible parts' ids, joined with a space, when the author has not set it. Id `juice-field-desc-N` is added only when a part has none. |
| Author description | A non-blank `aria-describedby` is kept, including when `[invalid]` is set. Whitespace-only does not block the visible parts. |
| `[invalid]` | Presence counts. `invalid="false"` is still invalid. The runtime writes `aria-invalid="true"` on the control, not the attribute's value. |
| Author `aria-invalid` | Kept, including `false`, `grammar`, and an author `true`. A blank value is not set, so whitespace-only does not block `[invalid]`. |
| Clearing `[invalid]` | Removes only an `aria-invalid` this runtime wrote. An author value stays. The wrapper does not receive `aria-invalid`. |

`title`, `aria-label`, and `aria-labelledby` are left untouched. They do not block a description, and this runtime does not write them.

## JavaScript

| Export | What it does |
| --- | --- |
| `createField(options?)` | Builds a controller. Same function as `initField`. Without `document`, methods do nothing and `getState()` returns `null`. |
| `initField(options?)` | Same call as `createField`. |
| `startFieldRuntime()` | Starts the document singleton. A second call syncs and returns it. Returns `null` without `document`. |
| `stopFieldRuntime()` | Destroys the singleton and cancels a deferred boot. |

`createField()` can run beside the document runtime. This runtime claims no clicks or keys.

### Options

| Option | Default |
| --- | --- |
| `root` | `document` |
| `fieldSelector` | `[field]` |

A custom `root` limits sync to fields inside that root. When the root itself is a `[field]`, that host is managed too. Fields outside the root are left alone, including their help and error ids.

### Controller

- `destroy()` disconnects the observer, cancels a scheduled sync, and removes `aria-describedby`, `aria-invalid`, and description ids this runtime wrote. An author value stays.
- `sync()` walks each managed field and applies the description and invalid state.
- `isInvalid(target?)` reads `[invalid]` on the resolved field, or `false` when none is managed.
- `getState(target?)` returns `{ invalid: boolean }`, or `null` when no managed field matches.

With no target, both readers use the first managed field. A target inside a field resolves to that field. These methods do not listen for typing or `change`, do not validate, do not float a label, and do not name the control.

### Events

A change of `invalid` dispatches a bubbling, composed [juice:change](./juice-runtime-behavior.md#juicechange) from `[field]`, with `detail` `{ runtime: "field", state: { invalid: boolean } }`. `invalid` is the `[invalid]` attribute on the wrapper.

`isInvalid()` returns that flag, and `getState()` returns `{ invalid: boolean }` or `null` when the host is missing. The first observation does not dispatch, and a write that leaves `invalid` unchanged does not dispatch.

## Accessibility

- Help and error describe the control. They do not name it. Use a real label, or the control's own label part, for the accessible name.
- Hidden parts (`hidden` or `aria-hidden="true"` on the part or an ancestor) and empty text are skipped. Hidden text inside an otherwise visible part is not part of that text.
- Escape is not handled. Field is not a layered overlay. See [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- Core CSS does not give `[field]` a z-index. It is inline wrapper chrome. See [Z-index bands](./juice-runtime-behavior.md#z-index-bands).
- The runtime does not move focus, set `tabindex`, or trap focus. `[invalid]` paints the wrapper border and does not restyle the nested control.

## Behavior

1. Find `[field]` hosts in the root. A node without `[field]` is ignored. Any attribute value stays as authored.
2. Use the first `input`, `textarea`, or `select` that is not inside a nested field. Skip a button, a nested control, a second control, and a field with no control.
3. When the author has not set `aria-describedby`, point it at the visible `[field-help]` and `[field-error]` in that field, in document order.
4. When `[invalid]` is present and the author has not set `aria-invalid`, set `aria-invalid="true"` on the control. Clearing `[invalid]` removes only a value this runtime wrote.
5. Leave typing, change, keys, and the accessible name on the platform control and the input, textarea, and select runtimes.

A part inside a nested field stays with that field. A part outside `[field]` is ignored. A part that contains the control, or that the control contains, is skipped. An author id on a part is kept. An id this runtime wrote is removed on `destroy()`, or when nothing still references it.

### Keyboard

Field does not listen for keys, `input`, or `change`.

- Escape is not handled. See [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- Typing, Enter, Tab, and `change` stay with the platform control.
- There is no focus trap. The runtime does not move focus or set `tabindex`.

### Theme roles

| Role | What it paints |
| --- | --- |
| `--juice-field-surface` | Wrapper fill |
| `--juice-field-gap` | Stack gap |
| `--juice-field-label-ink` | Label ink |
| `--juice-field-help-ink` | Help ink |
| `--juice-field-error-ink` | Error ink |
| `--juice-field-invalid-border` | `[invalid]` border on the wrapper |

`[field]` is not the surface `overlay="frost|tint"` utility. The legacy form layout in `libraries/juice/src/components/form/form.scss` stays as it is. See the [Theme contract](./juice-theme-contract.md).

The observer watches child list, character data, and `field`, `field-help`, `field-error`, `invalid`, `hidden`, `aria-hidden`, `aria-describedby`, `aria-invalid`, and `id`. `[field-label]` is not watched.

A help or error text edit schedules sync. An author description or author `aria-invalid` is still kept. Removing `[field]` drops the host and removes state this runtime wrote.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| Wrapper | A validation engine |
| Help and error on the first input, textarea, or select | A name for the control |

## Related

- [Attributes](./juice-attributes.md)
- [Theme contract](./juice-theme-contract.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Input](./juice-input-runtime.md)
- [Textarea](./juice-textarea-runtime.md)
- [Select](./juice-select-runtime.md)
