# Slider

Slider is an APG slider. `[slider]` is the track, and `[slider-thumb]` is the control (`role="slider"`).

It is Emerging and shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup ([Automatic behavior](./juice-runtime-behavior.md#automatic-behavior)).

## Markup

```html
<label>
  Volume
  <div slider>
    <div slider-fill></div>
    <div slider-thumb aria-label="Volume"></div>
  </div>
</label>

<div slider="horizontal" aria-valuemin="10" aria-valuemax="30" aria-valuenow="20">
  <button slider-thumb aria-valuetext="20 degrees" aria-label="Temperature"></button>
</div>
```

A boolean `[slider]` is valid. There is no HTML global `slider` attribute. `[slider="horizontal"]` is the same host. `[slider-fill]` is optional. There is no `[slider-track]`, `slider-value`, or `slider-size`. `scale` does not change track or thumb geometry.

## Attributes

| Hook | What it does |
| --- | --- |
| `[slider]` | Track host. Boolean or `horizontal`. `slider="vertical"` is not enhanced. |
| `[slider-fill]` | Optional completed portion of the range. |
| `[slider-thumb]` | Required thumb. The first thumb whose nearest `[slider]` is the host is the control. |

## JavaScript

| Export | What it does |
| --- | --- |
| `createSlider` | Builds a controller for the sliders under `root`. |
| `initSlider` | Same call as `createSlider`. |
| `startSliderRuntime` | Starts the document controller. A second call syncs. Returns null without a document. |
| `stopSliderRuntime` | Destroys that controller and cancels a deferred boot. |

A custom-root `createSlider()` can run beside the document runtime, and each pointer or key event is claimed once.

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Parent node to search. |
| `sliderSelector` | `[slider]:not([slider="vertical"])` | Track hosts. Vertical markup is excluded. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Ends a drag, removes the root listeners, and disconnects the observer. |
| `sync()` | Writes the thumb role, bounds, orientation, and the host `--juice-slider-ratio`. |
| `setValue(value, target?)` | Writes a finite number and clamps it, including fractions. Non-finite values are ignored. |
| `getValue(target?)` | Clamped value. Returns `0` when none resolves. |
| `increment(target?)` | Adds 1. Does not re-snap a fractional value. Disabled hosts are left alone. |
| `decrement(target?)` | Subtracts 1. Does not re-snap a fractional value. Disabled hosts are left alone. |
| `getState(target?)` | `{ value: number }`, or `null`. |

With no target, these methods use the first enhanceable `[slider]` in the root.

## Events

A value change dispatches a bubbling `juice:change` from `[slider]`. The detail is `{ runtime: "slider", state: { value: number } }`. A write that leaves `value` unchanged does not dispatch ([juice:change](./juice-runtime-behavior.md#juicechange)).

## Accessibility

- The thumb gets `role="slider"`, `aria-orientation="horizontal"`, `aria-valuemin`, `aria-valuemax`, and `aria-valuenow`. An author `role="slider"` on the host is removed.
- A thumb that is not natively focusable gets `tabindex="0"` when it has none. A button thumb with no `type` becomes `type="button"`.
- Authors supply the accessible name. The runtime does not invent `aria-label` text, and it does not invent or rewrite `aria-valuetext`.
- ArrowLeft and ArrowDown decrease by 1. ArrowRight and ArrowUp increase by 1. PageDown decreases by 10. PageUp increases by 10. Home jumps to min. End jumps to max. Values clamp.
- Alt, Ctrl, Meta, and composing keys are ignored. Keys apply when the event target is the thumb or inside the thumb.
- Escape, Enter, and Space are not handled. [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- There is no focus trap. `[slider]` has no overlay z-index. The thumb uses z-index 1 above the fill. Theme roles are `track`, `track-border`, `fill`, `thumb`, `thumb-border`, `thumb-shadow`, and `focus-ring`. [Z-index bands](./juice-runtime-behavior.md#z-index-bands).

## Behavior

1. Find `[slider]` hosts that own a `[slider-thumb]`. `[slider="vertical"]`, orphan thumbs, hosts with no thumb, and `<input type="range">` are ignored. Only the first thumb whose nearest `[slider]` is that host is the control. A nested `[slider]` owns its own first thumb.
2. Put `role="slider"` on the thumb and remove `role="slider"` from the host. Set `tabindex="0"` when the thumb is not natively focusable and has no tabindex. Set `type="button"` when a button thumb omitted `type`. The runtime does not invent an accessible name or `aria-valuetext`.
3. Write `aria-valuemin` (default `0`), `aria-valuemax` (default `100`), `aria-valuenow` (default min, then clamped), and `aria-orientation="horizontal"` on the thumb. Thumb attributes win over the host. If max is below min, max is treated as min. Keep `--juice-slider-ratio` (unitless `0`–`1`) on the host for every range.
4. On the thumb, ArrowLeft and ArrowDown decrease by 1, ArrowRight and ArrowUp increase by 1, PageDown decreases by 10, PageUp increases by 10, and Home and End jump to min and max. Keyboard deltas do not re-snap an existing fraction.
5. Primary `pointerdown` on the track, fill, or thumb jumps to that position, focuses the thumb, and drags until `pointerup` or `pointercancel`. Pointer values snap to a step of 1 from min. The thumb captures the pointer when the platform allows it.
6. Leave Escape, Enter, and Space alone. Slider does not take part in the overlay yield order.

Native `disabled` and `aria-disabled="true"` on the host or the thumb still sync role and value attributes, and they do not move the value. There is no focus trap and no exclusive-open rule.

### Pointer mapping

Pointer position uses the thumb's travel, not the raw track width. The thumb center moves from half the thumb width to the far end. A primary pointer maps `clientX` across that inset, snaps to a step of 1 from min, and clamps. A zero-width host, or a range where max equals min, stays at min. `pointermove` follows only while that pointer is the active drag. `pointerup` and `pointercancel` end it.

<details>
<summary>Edge cases</summary>

- Extra thumbs are not a second value. v1 reads the first owned thumb only.
- Integer `aria-valuenow` from 0 through 100 also matches the chrome attribute selectors when min and max are omitted or are `0` and `100`. `--juice-slider-ratio` is the paint hook for every other range. It is not a theme role and not an author attribute.
- `setValue` clamps a finite number and keeps a fraction. `increment` and `decrement` add or subtract 1 from that fraction.
- Buttons, inputs, selects, textareas, and anchors with `href` are already focusable, so sync does not add `tabindex`.

</details>

- No `Slider()` factory. Author the markup and let the runtime enhance it.
- v1 is horizontal and single-thumb. `[slider="vertical"]` is not painted and is not enhanced.
- There is no native `<input type="range">` restyle. A range input cannot host a `[slider-thumb]`.
- Default bounds are min `0` and max `100`. A missing `aria-valuenow` starts at min.
- The step is `1` and the page step is `10`. Those are fixed. They are not author attributes.
- Native `disabled` and `aria-disabled="true"` on the host or thumb do not move the value.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| APG slider, `[slider]` track, `[slider-thumb]` with `role="slider"` | A native `input type="range"` restyle |
| APG slider, `[slider]` track, `[slider-thumb]` with `role="slider"` | A progress meter |

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
