# Icon button

Icon button is a square icon-only control on the existing button chrome. `createIconButton` keeps a `[toggle]` pressed state in sync with `aria-pressed`.

Emerging. The twenty-sixth runtime. On master. Not in the published `@citrusworx/juiceui@0.9.2` release. `createIconButton`, `initIconButton`, `startIconButtonRuntime`, and `stopIconButtonRuntime` are not in that npm cut.

Importing `@citrusworx/juiceui` enhances valid markup. See [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior). The published `@citrusworx/juiceui@0.9.2` package does not include this runtime.

Color, border, and hover fill stay with `button` and `[btn]`. There is no focus trap, no Escape handler, and no `IconButton()` factory.

## Markup

Default square.

```html
<button type="button" icon-button btn="flat" aria-label="Add">
  <i icon="plus" lib="solid"></i>
</button>
```

Small outline.

```html
<button type="button" icon-button btn="outline" scale="sm" aria-label="Close">
  <i icon="xmark" lib="solid"></i>
</button>
```

Large 3d.

```html
<button type="button" icon-button btn="3d" scale="lg" aria-label="Settings">
  <i icon="gear" lib="solid"></i>
</button>
```

Circle from the attribute value.

```html
<button type="button" icon-button="round" btn="text" aria-label="More">
  <i icon="ellipsis" lib="solid"></i>
</button>
```

Circle from `[round]`.

```html
<button type="button" icon-button round btn="metallic" aria-label="Favorite">
  <i icon="star" lib="solid"></i>
</button>
```

Toggle, unpressed.

```html
<button type="button" icon-button toggle aria-label="Bold">
  <i icon="bold" lib="solid"></i>
</button>
```

Toggle, pressed.

```html
<button type="button" icon-button="round" toggle pressed aria-label="Italic">
  <i icon="italic" lib="solid"></i>
</button>
```

`[icon-button]` is the host. There is no HTML global `icon-button` attribute. A boolean attribute is fine. Any value, including `icon-button="round"`, stays as authored. `[icon-button][round]` is the same circle as `[icon-button="round"]`. `[scale="sm"|"lg"]` stays CSS. The runtime does not write `scale`.

A `div`, a `span`, or an `<a href>` with `[icon-button]` is still a host. A node without `[icon-button]` is ignored.

## Attributes

| Hook | What it does |
| --- | --- |
| `[icon-button]` | Host. Any value stays. The usual host is `<button type="button" icon-button>`. |
| `[round]` or `="round"` | Circle. Same option either way. Radius comes from `--juice-icon-button-radius-round`. |
| `[scale="sm"\|"lg"]` | CSS size step. The runtime does not write `scale`. Unmarked scale matches a default button. |
| `[toggle]` | Click flips pressed state. Enter and Space flip it only when the host is not a `<button>` and not an `<a href>`. |
| `[pressed]` | On a toggle, kept in sync with `aria-pressed`. Without `[toggle]`, it stays visual only. |
| `aria-pressed` | `"true"` or `"false"` on a toggle. An initial `[pressed]` or `aria-pressed="true"` starts pressed. Otherwise sync writes `"false"`. |
| Disagreeing start | When both are present and they disagree, either signal starts pressed, then sync writes both to match. `[pressed]` wins that case. |
| Non-button toggle | Gets `role="button"` and `tabindex="0"` when those are missing. An author `role` or `tabindex` is kept. Native buttons and links are left alone, including `type` and `href`. |
| Disabled | `[disabled]`, `aria-disabled="true"`, a native disabled `<button>`, or a disabled `<input>`. Sync still writes the initial `aria-pressed`. Click, keys, and `toggle()` do not flip it. |
| Accessible name | A non-empty `aria-label`, an `aria-labelledby` that resolves to visible text, or visible text on the host. This runtime does not invent one. |

A blank or whitespace-only `aria-label` is not a name. A blank `aria-labelledby` is not a name. An id that is missing, hidden, `aria-hidden`, or empty is not a name. Several ids are joined when more than one resolves to visible text.

Visible text is the host's own text, with whitespace collapsed. Hidden and `aria-hidden` subtrees are skipped. SVG subtrees are skipped, including an SVG `<title>`. An icon-only `[icon]` contributes no text. `title` is left untouched and is not a name.

`getState().pressed` is `aria-pressed="true"` or `[pressed]`. A `[pressed]` without `[toggle]` can report `pressed: true`. The runtime does not add `aria-pressed` to that host. Removing `[toggle]` does not strip an `aria-pressed` already written.

## JavaScript

| Export | What it does |
| --- | --- |
| `createIconButton(options?)` | Builds a controller. Same function as `initIconButton`. Without `document`, methods do nothing and `getState()` returns `null`. |
| `initIconButton(options?)` | Same call as `createIconButton`. |
| `startIconButtonRuntime()` | Starts the document singleton. A second call syncs and returns it. Returns `null` without `document`. |
| `stopIconButtonRuntime()` | Destroys the singleton and cancels a deferred boot. |

`createIconButton()` can run beside the document runtime. Each click or key is claimed once, so the two do not double-fire.

### Options

| Option | Default |
| --- | --- |
| `root` | `document` |
| `iconButtonSelector` | `[icon-button]` |

A custom `root` limits sync to hosts inside that root. When the root itself is an `[icon-button]`, that host is managed too. Hosts outside the root are left alone.

### Controller

- `destroy()` removes the click and keydown listeners, disconnects the observer, and cancels a scheduled sync. It does not strip `aria-pressed`, `[pressed]`, `role`, or `tabindex`.
- `sync()` writes toggle state and runs the name check on each managed host.
- `toggle(target?)` flips the resolved toggle when it is not disabled. A host without `[toggle]`, or a disabled host, is left unchanged.
- `getState(target?)` returns `{ pressed: boolean, disabled: boolean, named: boolean }`, or `null` when no managed host matches.

With no target, `toggle()` and `getState()` use the first managed host. A target inside a host resolves to that host. `named: false` does not block a toggle.

### Events

A change of `pressed`, `disabled`, or `named` dispatches a bubbling, composed [juice:change](./juice-runtime-behavior.md#juicechange) from `[icon-button]`, with `detail` `{ runtime: "icon-button", state: { pressed: boolean, disabled: boolean, named: boolean } }`. `getState()` returns that shape, or `null` when the host is missing.

The first observation does not dispatch, so the initial `aria-pressed` write is not a change. A later unchanged `sync()`, or a disabled toggle that does not flip, does not dispatch.

## Accessibility

- Give every icon button an accessible name. `aria-label` is the usual one for an icon-only control. `aria-labelledby` works when it points at visible text. `title` does not.
- `[toggle]` exposes `aria-pressed="true"` or `"false"`. A toolbar of bold, italic, and underline buttons is a set of pressed toggles.
- Prefer `<button type="button">` so the platform supplies the role, the type, and Enter / Space. A non-button toggle receives `role="button"` and `tabindex="0"` only when those are missing.
- Disabled is `disabled` on a native button, `[disabled]`, or `aria-disabled="true"`. The control does not toggle while disabled.
- Focus is the `:focus-visible` ring. The runtime does not move focus and does not trap it. See [Escape and layering](./juice-runtime-behavior.md#escape--layering) and [Z-index bands](./juice-runtime-behavior.md#z-index-bands).

## Behavior

1. Find `[icon-button]` hosts in the root. Any attribute value stays as authored.
2. Check the accessible name. Do not invent one. In development, an unnamed host warns once.
3. On `[toggle]`, write `aria-pressed` `"true"` or `"false"` and mirror `[pressed]`.
4. Flip a toggle on click. Enter and Space flip a non-button, non-link toggle and call `preventDefault`. Disabled hosts do not flip.
5. Leave Escape to the overlay, popover, menu, combobox, toast, and tooltip yield order. Icon button does not participate.

### Name

When `NODE_ENV === "development"`, an unnamed host warns once per element. The element is the second argument to `console.warn`. Production and test stay silent. A name added later does not warn again, and dropping that name later does not warn a second time.

```text
[juice] [icon-button] has no accessible name. Add a non-empty aria-label, an aria-labelledby that resolves to text, or visible text. Icon-only content and title do not count.
```

### Keyboard

- Click flips `[icon-button][toggle]`. A plain `[icon-button]` click does not write `aria-pressed`.
- Enter and Space flip a toggle that is not a `<button>` and not an `<a href>`. Both keys call `preventDefault`. Repeat keydowns are not ignored.
- A `<button>` turns Enter and Space into a click, and that click flips the toggle. An `<a href>` keeps Enter and Space. A click still flips the toggle.
- An `<a>` without `href` is not treated as that native control, so Enter and Space are handled here.
- Escape is not handled. See [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- There is no focus trap. The runtime does not move focus.

### Disabled

Chrome paints `:disabled`, `[disabled]`, and `[aria-disabled="true"]` at `opacity: 0.5`, with `cursor: default` and `pointer-events: none`, so a pointer click never reaches the host. The runtime no-op is what stops `toggle()` and a key that still arrives. Sync still records the initial pressed value.

### Theme roles

Core CSS owns the defaults on `:root`. Shipped library themes and generated `--jx-*` themes are not required to bind them. There is no icon-button fill role. Hover fill stays with `btn="flat|outline|text|3d|metallic"` and the default button.

| Role | Default |
| --- | --- |
| `--juice-icon-button-padding` | `0.625rem` |
| `--juice-icon-button-padding-sm` | `0.4rem` |
| `--juice-icon-button-padding-lg` | `0.875rem` |
| `--juice-icon-button-icon-size` | `1.25rem` |
| `--juice-icon-button-icon-size-sm` | `1rem` |
| `--juice-icon-button-icon-size-lg` | `1.5rem` |
| `--juice-icon-button-size` | `calc(var(--juice-icon-button-icon-size) + (var(--juice-icon-button-padding) * 2))` |
| `--juice-icon-button-size-sm` | `calc(var(--juice-icon-button-icon-size-sm) + (var(--juice-icon-button-padding-sm) * 2))` |
| `--juice-icon-button-size-lg` | `calc(var(--juice-icon-button-icon-size-lg) + (var(--juice-icon-button-padding-lg) * 2))` |
| `--juice-icon-button-radius` | `0.5rem` |
| `--juice-icon-button-radius-sm` | `0.375rem` |
| `--juice-icon-button-radius-lg` | `0.625rem` |
| `--juice-icon-button-radius-round` | `999px` |
| `--juice-icon-button-focus-ring` | `currentColor` |

`[scale="sm"|"lg"]` steps size, padding, radius, and the glyph together. The circle uses `--juice-icon-button-radius-round` and keeps the scale's size. Do not shrink the glyph to the content box. A theme or UA border stays inside the border-box, and `max-width: 100%` would undersize the icon. The glyph is centered.

### Press and focus

`:focus-visible` paints a `2px` solid outline in `--juice-icon-button-focus-ring`, with `outline-offset: 2px`. `[pressed]` and `[aria-pressed="true"]` paint `box-shadow: inset 0 0 0 2px currentColor`. `:active` presses `translateY(2px)`, the same press as `[btn="3d"]`.

Transitions read `--juice-motion-duration-instant` and `--juice-motion-ease-standard` for background, color, border, shadow, and transform. Core CSS does not give `[icon-button]` a z-index. See [Z-index bands](./juice-runtime-behavior.md#z-index-bands) and the [Theme contract](./juice-theme-contract.md).

### Reduced motion

`prefers-reduced-motion: reduce` sets `transition: none` and drops the `:active` translate. That does not clear the `[btn="3d"]` or `[btn="metallic"]` hover transform. That press belongs to the button variant.

The observer watches child list, character data, and `icon-button`, `toggle`, `pressed`, `disabled`, `role`, `tabindex`, `hidden`, `aria-hidden`, `aria-pressed`, `aria-disabled`, `aria-label`, `aria-labelledby`, `title`, `href`, and `id`. `title` is watched and is still not a name.

Removing `[icon-button]` drops the host. `destroy()` stops that observation.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Sig

`@citrusworx/sigjs/juice` binds 28 runtimes through `table` on master and in `@citrusworx/sigjs@0.7.2`. Icon button is one of those 28. `JuiceRuntimeName` includes `"icon-button"`.

`bind(host)` and `bind(host, "icon-button")` seed a signal from `getState()`. The host matcher looks for `[icon-button]` after earlier matchers, so a host that already matches (for example `[switch]`) stays on that runtime.

Write-back calls `toggle` only when the host has `[toggle]` and `pressed` changes, then republishes `getState()`. A disabled host, or a host without `[toggle]`, refuses the write, and the signal snaps back to the host.

Binding `icon-button` against `@citrusworx/juiceui@0.9.2` throws because `startIconButtonRuntime` is not exported:

```text
Sig juice bind: "icon-button" needs a newer @citrusworx/juiceui that exports startIconButtonRuntime.
```

The module still loads, and the other runtimes still bind. Juice does not import Sig, and this runtime does not call `bind`. `juice:change` and `getState()` still work without Sig. State stays `{ pressed: boolean, disabled: boolean, named: boolean }`.

## Not to be confused with

| This | Not this |
| --- | --- |
| Square icon-only control | A switch (`[switch]`) |
| Square icon-only control | A checkbox (`[checkbox]`) |

## Related

- [Attributes](./juice-attributes.md)
- [Theme contract](./juice-theme-contract.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Switch](./juice-switch-runtime.md)
- [Checkbox](./juice-checkbox-runtime.md)
