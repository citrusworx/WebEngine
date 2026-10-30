# Progress

A progress bar is a meter rooted at `[progress]`.

Emerging. Shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup. [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior).

## Markup

```html
<div progress aria-label="Upload">
  <span progress-fill></span>
  <span progress-label>Uploading</span>
</div>

<div progress="indeterminate" aria-label="Working">
  <span progress-fill></span>
</div>
```

Authors write `<div progress>`, not a bare `<progress>`. `[progress]` is an attribute selector, not the type selector `progress`.

## Attributes

| Hook | What it does |
| --- | --- |
| `[progress]` | Track host. Boolean is determinate. Any value other than `indeterminate` stays determinate. |
| `[progress="indeterminate"]` | Busy state. The only indeterminate value. Wins over a stale `aria-valuenow`. |
| `[progress-fill]` | Filled portion. Optional for the runtime. How the chrome paints the value. |
| `[progress-label]` | Optional author text. Not copied into a name or `aria-valuetext`. |
| `aria-valuemin` | Lower bound. Missing defaults to `0`. |
| `aria-valuemax` | Upper bound. Missing defaults to `100`. A max below min collapses to min. |
| `aria-valuenow` | Current value. Missing or non-numeric defaults to min (empty bar, not indeterminate). |
| `aria-valuetext` | Author-owned. Sync never invents or rewrites it. |
| `--juice-progress-ratio` | Inline unitless `0`–`1` written by sync. Not a theme role and not an author attribute. |
| `--juice-progress-*` | Theme roles: `track`, `track-border`, `fill`, `ink`, `focus-ring`. |

There is no `[progress-bar]`, `[progress-track]`, or `progress-value` attribute. `scale` does not change bar geometry. `focus-ring` paints only on `:focus-visible`.

## JavaScript

| Export | What it does |
| --- | --- |
| `createProgress(options?)` | Controller for `options.root`, or the document. |
| `initProgress(options?)` | Same call as `createProgress`. |
| `startProgressRuntime()` | Document controller. A second call syncs and returns it. Returns `null` when there is no document. |
| `stopProgressRuntime()` | Destroys that controller and cancels a deferred boot. |

A custom-root controller can run beside the document runtime. This runtime claims no clicks or keys.

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Node to search. |
| `progressSelector` | `[progress]` | Host query. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Disconnects this controller. |
| `sync()` | Applies role, range, ratio, and the indeterminate flag. |
| `setValue(value, target?)` | Writes a finite number, clamped to min/max. Non-finite values are ignored. |
| `getValue(target?)` | Clamped or remembered value. `0` when no host resolves. |
| `setIndeterminate(flag, target?)` | `true` sets `progress="indeterminate"`. `false` writes the boolean attribute and restores `aria-valuenow`. |
| `isIndeterminate(target?)` | True only when the attribute is exactly `indeterminate`. |
| `getState(target?)` | Returns `{ value: number, indeterminate: boolean }`, or `null`. |

With no target, the controller uses the first `[progress]` in its root. A target inside a host resolves to that host.

While indeterminate, `setValue()` updates the remembered value and `--juice-progress-ratio` and still omits `aria-valuenow`.

### Events

A real value or indeterminate change dispatches a bubbling [juice:change](./juice-runtime-behavior.md#juicechange) from `[progress]`.

`detail` is `{ runtime: "progress", state: { value: number, indeterminate: boolean } }`. A write that leaves both fields unchanged does not dispatch. This surface stays Emerging.

## Accessibility

- Authors supply the accessible name. The runtime does not invent one and does not copy `[progress-label]`.
- Sync writes `role="progressbar"`. An author role that is not `progressbar` is replaced. No `tabindex` is added.
- While indeterminate, `aria-valuenow` is omitted. Min and max stay. The last determinate value is restored when the flag clears.
- Progress does not listen for keys, including Escape. [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- There is no z-index. [Z-index bands](./juice-runtime-behavior.md#z-index-bands).

## Behavior

1. Find `[progress]` hosts. A native `<progress>` without the attribute is ignored. A bare `[role="progressbar"]` is ignored.
2. Put `role="progressbar"` on the host. Do not invent a name or `aria-valuetext`.
3. On a determinate host, write min (default `0`), max (default `100`), and now (default min, clamped).
4. Keep `--juice-progress-ratio` in sync for every range, including ranges the 0–100 selectors do not cover.
5. Treat only `progress="indeterminate"` as indeterminate. CSS slides `[progress-fill]`. The host clips that motion.
6. Leave clicks and the keyboard alone.

`<progress progress>` is enhanced, but native `value` and `max` are not the value hook. The UA does not show a `[progress-fill]` child.

`prefers-reduced-motion` stops the indeterminate animation and leaves a static partial fill. The runtime still writes the ratio from the remembered value.

Integer `aria-valuenow` `0`–`100` also matches the chrome attribute selectors when min and max are omitted or are `0` / `100`.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| APG-inspired progressbar | Slider (no thumb, no keyboard stepping, no pointer drag) |
| `<div progress>` | A restyle of native `<progress>` as the only story |
| Indeterminate meter | Spinner (`[spinner]` has no value) |
| Inline status | A layered overlay, or `overlay="frost"` / `overlay="tint"` |

## Related

- [Attributes](./juice-attributes.md)
- [Theme contract](./juice-theme-contract.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Slider](./juice-slider-runtime.md)
- [Spinner](./juice-spinner-runtime.md)
