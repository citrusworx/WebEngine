# Spinner

A spinner is an indeterminate busy indicator rooted at `[spinner]`.

Emerging. The twenty-first runtime. Shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup. [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior).

## Markup

```html
<div spinner>
  <span spinner-label>Saving</span>
</div>

<div spinner aria-label="Working"></div>
```

The ring is `::before`. A boolean `[spinner]` attribute is valid. There is no `<spinner>` element.

## Attributes

| Hook | What it does |
| --- | --- |
| `[spinner]` | Host. Any value, including `spinner="busy"`, stays as authored. |
| `[spinner-label]` | Optional author text. Not copied into `aria-label` or `aria-labelledby`. |
| `hidden` | Native hidden state. `hide()` sets it and clears `role="status"` and `aria-busy`. |
| `--juice-spinner-*` | Theme roles: `track`, `indicator`, `ink`, `focus-ring`. |

`track` is the inactive ring stroke. `indicator` is the leading arc (`border-top-color`) and is what spins. CSS owns `juice-spinner-spin` on `::before`. `focus-ring` paints only on `:focus-visible`. The host is usually not focusable.

## JavaScript

| Export | What it does |
| --- | --- |
| `createSpinner(options?)` | Controller for `options.root`, or the document. |
| `initSpinner(options?)` | Same call as `createSpinner`. |
| `startSpinnerRuntime()` | Document controller. A second call syncs and returns it. Returns `null` when there is no document. |
| `stopSpinnerRuntime()` | Destroys that controller and cancels a deferred boot. |

A custom-root controller can run beside the document runtime. This runtime claims no clicks or keys.

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Node to search. A root that is itself a `[spinner]` is managed too. |
| `spinnerSelector` | `[spinner]` | Host query. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Disconnects this controller. |
| `sync()` | Applies shown or hidden state. |
| `show(target?)` | Removes `hidden`. Writes `role="status"` and `aria-busy="true"`. |
| `hide(target?)` | Clears `role="status"` and `aria-busy`, then sets `hidden`. |
| `isShown(target?)` | True when the resolved host lacks `hidden`. |
| `getState(target?)` | Returns `{ shown: boolean }`, or `null`. |

An element argument resolves to a `[spinner]` in the root, or to the closest spinner. Omitted, the first spinner in tree order is used. These methods do not touch siblings and never write a value.

### Events

A real show or hide dispatches a bubbling [juice:change](./juice-runtime-behavior.md#juicechange) from `[spinner]`.

`detail` is `{ runtime: "spinner", state: { shown: boolean } }`. An unchanged `shown` does not dispatch. This surface stays Emerging.

## Accessibility

- While shown, sync writes `role="status"` and `aria-busy="true"`. An author role that is not `status` is replaced.
- `hide()` clears both so a hidden spinner does not announce as busy. An author role that is not `status` on an already-hidden host is left.
- Authors supply the name when there is no visible `[spinner-label]`. An author name is kept.
- The runtime does not add `tabindex` and does not listen for keys. [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- There is no z-index. [Z-index bands](./juice-runtime-behavior.md#z-index-bands).

## Behavior

1. Find `[spinner]` hosts. A bare `[role="status"]` or `[aria-busy]` is not a spinner.
2. While shown, write `role="status"` and `aria-busy="true"`. Do not invent a name.
3. While hidden, remove `role="status"` and `aria-busy`. `show()` removes `hidden`. `hide()` sets it.
4. Leave clicks and the keyboard alone. Spinner does not collapse a disclosure.
5. Leave the spin to CSS. `prefers-reduced-motion` stops the animation and leaves the indicator.

There is no value. Sync does not write `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`, or `--juice-progress-ratio`.

There is no `Spinner()` factory.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| Indeterminate busy indicator | Progress bar (`[progress]`, including `progress="indeterminate"`) |
| Shown or hidden status | Disclosure |
| Inline chrome | A layered overlay, or `overlay="frost"` / `overlay="tint"` |

## Related

- [Attributes](./juice-attributes.md)
- [Theme contract](./juice-theme-contract.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Progress](./juice-progress-runtime.md)
- [Disclosure](./juice-disclosure-runtime.md)
