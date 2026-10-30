# Textarea

Textarea is a styled native `<textarea>`. `createTextarea` names a `[textarea]` from a visible label when the author has not set one.

Emerging. The twenty-fourth runtime. Shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup. See [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior).

Typing, change, and the keyboard stay on the control. There is no auto-grow, no character count, no validation engine, no floating label, and no `Textarea()` factory.

## Markup

Associated label.

```html
<label for="note">Note</label>
<textarea textarea id="note"></textarea>
```

Wrapping label.

```html
<label>
  Note
  <textarea textarea>Portland</textarea>
</label>
```

Preceding label part.

```html
<span textarea-label>Flavor</span>
<textarea textarea></textarea>
```

`<textarea textarea>` is the host. There is no HTML global `textarea` attribute. The element is still `<textarea>`. A boolean `[textarea]` is fine. Any value, including `textarea="note"`, stays as authored.

## Attributes

| Hook | What it does |
| --- | --- |
| `[textarea]` | Host on `<textarea>`. Sync does not rewrite the attribute. |
| Ignored host | Not a `<textarea>`, no `[textarea]`, inside `[combobox]`, or `[combobox-input]`. An `<input>` or `[field]` is not this host. |
| `[textarea-label]` | Optional visible label. `for` / `id`, a wrapper that contains only that textarea, or the nearest preceding sibling. |
| `aria-label` | Written for a wrapping label, from visible text excluding the textarea, so the value is not part of the name. |
| `aria-labelledby` | Written when the label does not contain the control. Id `juice-textarea-label-N` is added only when that label has none. |
| Author name | A non-blank `aria-label` or `aria-labelledby` is kept. A blank value is not a name. `title` is not a name and does not block a label. |

## JavaScript

| Export | What it does |
| --- | --- |
| `createTextarea(options?)` | Builds a controller. Same function as `initTextarea`. Without `document`, methods do nothing and `getState()` returns `null`. |
| `initTextarea(options?)` | Same call as `createTextarea`. |
| `startTextareaRuntime()` | Starts the document singleton. A second call syncs and returns it. Returns `null` without `document`. |
| `stopTextareaRuntime()` | Destroys the singleton and cancels a deferred boot. |

`createTextarea()` can run beside the document runtime. This runtime claims no clicks or keys.

### Options

| Option | Default |
| --- | --- |
| `root` | `document` |
| `textareaSelector` | `textarea[textarea]` |

A custom `root` limits sync to hosts inside that root. When the root itself is a `<textarea textarea>`, that host is managed too. Label lookup also searches the document, so a label outside the root can still name a textarea inside it. Textareas outside the root are left alone.

### Controller

- `destroy()` disconnects the observer and cancels a scheduled sync.
- `sync()` walks each managed host and applies the accessible name.
- `getState(target?)` returns `{ value: string }` from the control, or `null` when no managed host matches.

With no target, `getState()` uses the first managed host. A target that is not a host uses the first managed host inside it. These methods do not listen for typing or `change`, and they do not auto-grow, count characters, or validate.

### Events

Value changes stay on the native `input` and `change` events. This runtime does not dispatch [juice:change](./juice-runtime-behavior.md#juicechange). `getState()` returns `{ value: string }`, or `null` when the host is missing.

## Accessibility

- Name the control with a visible label, or set `aria-label` or `aria-labelledby`. Hidden labels (`hidden` or `aria-hidden="true"` on the label or an ancestor) and empty text are skipped.
- A separate label is referenced with `aria-labelledby`. A wrapping label is copied into `aria-label`.
- Escape is not handled. Textarea is not a layered overlay. See [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- Core CSS does not give `textarea[textarea]` a z-index. It is inline field chrome. See [Z-index bands](./juice-runtime-behavior.md#z-index-bands).
- The runtime does not move focus, set `tabindex`, or trap focus. `:focus-visible` paints a `2px` outline in `--juice-textarea-focus-ring`, offset `2px`.

## Behavior

1. Find `<textarea textarea>` hosts in the root and ignore every other node, including a host inside `[combobox]`.
2. When the author has not set a name, use the first visible label: associated `<label for>`, then a wrapping `<label>`, then `[textarea-label]`.
3. Reference a separate label with `aria-labelledby`, and copy a wrapping label into `aria-label` without the textarea's own value.
4. Skip hidden or empty labels, invent no name when nothing visible remains, and remove a name this runtime wrote when its source goes away or the host stops qualifying.
5. Leave typing, change, and keys on the platform control. Sync does not set `role`.

A preceding `[textarea-label]` may be the sibling itself, or nested in a preceding sibling that does not contain a textarea. The search stops at a `<textarea>` sibling. A wrapping `[textarea-label]` counts only when it contains that one textarea.

If the author later sets a name, a name this runtime wrote on the other attribute is removed. `title` is left untouched.

### Keyboard

Textarea does not listen for keys, `input`, or `change`.

- Escape is not handled. See [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- Typing, Enter, Tab, and `change` stay with the platform control.
- There is no focus trap. The runtime does not move focus or set `tabindex`.

### Theme roles

| Role | What it paints |
| --- | --- |
| `--juice-textarea-surface` | Field fill |
| `--juice-textarea-border` | Border color |
| `--juice-textarea-ink` | Text |
| `--juice-textarea-placeholder` | Placeholder |
| `--juice-textarea-focus-ring` | `:focus-visible` outline |

`resize: vertical` keeps the native grip. There is no auto-grow. `<textarea textarea>` is not the surface `overlay="frost|tint"` utility. See the [Theme contract](./juice-theme-contract.md).

The observer watches child list, character data, and `textarea`, `textarea-label`, `for`, `id`, `hidden`, `aria-hidden`, `aria-label`, `aria-labelledby`, `combobox`, and `combobox-input`.

A label text edit schedules sync. An author name is still kept. Removing `[textarea]`, or moving the host into `[combobox]`, drops the host and removes a name this runtime wrote.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| Native multiline field | An input (`<input input>`) |
| Native multiline field | A select (`<select select>`) |
| Native multiline field | A combobox (`[combobox]`, `[combobox-input]`, `[combobox-list]`) |
| Native multiline field | A `[field]` wrapper |

## Related

- [Attributes](./juice-attributes.md)
- [Theme contract](./juice-theme-contract.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Input](./juice-input-runtime.md)
- [Field](./juice-field-runtime.md)
