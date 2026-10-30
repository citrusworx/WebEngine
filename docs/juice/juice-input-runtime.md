# Input

Input is a styled native `<input>`. `createInput` names a text-like `[input]` from a visible label when the author has not set one.

Emerging. The twenty-third runtime. Shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup. See [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior).

Typing, change, and the keyboard stay on the control. There is no mask, no validation engine, no floating label, and no `Input()` factory.

## Markup

Associated label.

```html
<label for="city">City</label>
<input input id="city" type="text" />
```

Wrapping label.

```html
<label>
  City
  <input input type="text" value="Portland" />
</label>
```

Preceding label part.

```html
<span input-label>Flavor</span>
<input input type="text" />
```

`<input input>` is the host. There is no HTML global `input` attribute. The element is still `<input>`. A boolean `[input]` is fine. Any value, including `input="text"`, stays as authored.

## Attributes

| Hook | What it does |
| --- | --- |
| `[input]` | Host on `<input>`. Sync does not rewrite the attribute. |
| Text-like `type` | Missing, empty, or `text`, `email`, `password`, `search`, `tel`, `url`, `number`. Match is case-insensitive. |
| Other `type` | Ignored: checkbox, radio, range, file, date, time, datetime-local, month, week, color, hidden, button, submit, reset, image. |
| Ignored host | Not an `<input>`, no `[input]`, inside `[combobox]`, or `[combobox-input]`. A `<textarea>` or `[field]` is not this host. |
| `[input-label]` | Optional visible label. `for` / `id`, a wrapper that contains only that input, or the nearest preceding sibling. |
| `aria-label` | Written for a wrapping label, from visible text excluding the input, so the value is not part of the name. |
| `aria-labelledby` | Written when the label does not contain the control. Id `juice-input-label-N` is added only when that label has none. |
| Author name | A non-blank `aria-label` or `aria-labelledby` is kept. A blank value is not a name. `title` is not a name and does not block a label. |

## JavaScript

| Export | What it does |
| --- | --- |
| `createInput(options?)` | Builds a controller. Same function as `initInput`. Without `document`, methods do nothing and `getState()` returns `null`. |
| `initInput(options?)` | Same call as `createInput`. |
| `startInputRuntime()` | Starts the document singleton. A second call syncs and returns it. Returns `null` without `document`. |
| `stopInputRuntime()` | Destroys the singleton and cancels a deferred boot. |

`createInput()` can run beside the document runtime. This runtime claims no clicks or keys.

### Options

| Option | Default |
| --- | --- |
| `root` | `document` |
| `inputSelector` | `input[input]` |

A custom `root` limits sync to hosts inside that root. When the root itself is an `<input input>`, that host is managed too. Label lookup also searches the document, so a label outside the root can still name an input inside it. Inputs outside the root are left alone.

### Controller

- `destroy()` disconnects the observer and cancels a scheduled sync.
- `sync()` walks each managed host and applies the accessible name.
- `getState(target?)` returns `{ value: string }` from the control, or `null` when no managed host matches.

With no target, `getState()` uses the first managed host. A target that is not a host uses the first managed host inside it. These methods do not listen for typing or `change`, and they do not mask or validate the value.

### Events

Value changes stay on the native `input` and `change` events. This runtime does not dispatch [juice:change](./juice-runtime-behavior.md#juicechange). `getState()` returns `{ value: string }`, or `null` when the host is missing.

## Accessibility

- Name the control with a visible label, or set `aria-label` or `aria-labelledby`. Hidden labels (`hidden` or `aria-hidden="true"` on the label or an ancestor) and empty text are skipped.
- A separate label is referenced with `aria-labelledby`. A wrapping label is copied into `aria-label`.
- Escape is not handled. Input is not a layered overlay. See [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- Core CSS does not give `input[input]` a z-index. It is inline field chrome. See [Z-index bands](./juice-runtime-behavior.md#z-index-bands).
- The runtime does not move focus, set `tabindex`, or trap focus. `:focus-visible` paints a `2px` outline in `--juice-input-focus-ring`, offset `2px`.

## Behavior

1. Find text-like `<input input>` hosts in the root and ignore every other node, including a host inside `[combobox]`.
2. When the author has not set a name, use the first visible label: associated `<label for>`, then a wrapping `<label>`, then `[input-label]`.
3. Reference a separate label with `aria-labelledby`, and copy a wrapping label into `aria-label` without the input's own value.
4. Skip hidden or empty labels, invent no name when nothing visible remains, and remove a name this runtime wrote when its source goes away or the host stops qualifying.
5. Leave typing, change, and keys on the platform control. Sync does not set `role`.

A preceding `[input-label]` may be the sibling itself, or nested in a preceding sibling that does not contain an input. The search stops at an `<input>` sibling. A wrapping `[input-label]` counts only when it contains that one text-like host.

If the author later sets a name, a name this runtime wrote on the other attribute is removed. `title` is left untouched.

### Keyboard

Input does not listen for keys, `input`, or `change`.

- Escape is not handled. See [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- Typing, Enter, Tab, and `change` stay with the platform control.
- There is no focus trap. The runtime does not move focus or set `tabindex`.

### Theme roles

| Role | What it paints |
| --- | --- |
| `--juice-input-surface` | Field fill |
| `--juice-input-border` | Border color |
| `--juice-input-ink` | Text |
| `--juice-input-placeholder` | Placeholder |
| `--juice-input-focus-ring` | `:focus-visible` outline |

`<input input>` is not the surface `overlay="frost|tint"` utility. See the [Theme contract](./juice-theme-contract.md).

The observer watches child list, character data, and `input`, `input-label`, `type`, `for`, `id`, `hidden`, `aria-hidden`, `aria-label`, `aria-labelledby`, `combobox`, and `combobox-input`.

A label text edit schedules sync. An author name is still kept. A type change that leaves the text-like set, or a move into `[combobox]`, drops the host and removes a name this runtime wrote.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| Native text field | A combobox (`[combobox]`, `[combobox-input]`, `[combobox-list]`) |
| Native text field | A select (`<select select>`) |
| Native text field | A textarea or a `[field]` wrapper |

## Related

- [Attributes](./juice-attributes.md)
- [Theme contract](./juice-theme-contract.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Textarea](./juice-textarea-runtime.md)
- [Field](./juice-field-runtime.md)
