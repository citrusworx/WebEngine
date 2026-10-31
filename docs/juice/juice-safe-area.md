# Juice Safe Area

This document explains the current safe-area chrome in `libraries/juice/src/components/safe-area/safe-area.scss` (monorepo path; outside this vault). `components.scss` forwards that file after `nav.scss` and `drawer.scss`, and before `toast.scss` and `wizard.scss`.

Safe area is CSS-only. Importing the core stylesheet is enough. There is no JS entry, no `createSafeArea`, no auto-enhance, and no `SafeArea()` Sig factory. Markup is the contract.

This surface is Emerging, not Stable. It shipped in 0.9.3. It is not one of the thirty-two Emerging auto-enhance runtimes. That count stays thirty-two. There is no `juice:change`, no `getState()`, and `@citrusworx/sigjs/juice` `bind()` does not accept it. There is no runtime to infer and no `JuiceRuntimeName` for it.

Safe area pads a host clear of the notch, the home indicator, and rounded corners. It does not paint. There is nothing for a theme to bind.

`dist/index.css` on master matches `safe-area.scss`. The compiler drops quotes on attribute values (`[safe-area=top]`). The declarations are the same. Shipped theme CSS does not mention `--juice-safe-area-` or `[safe-area]`.

## Markup

There is no HTML global `safe-area` attribute, and there is no `<safe-area>` element. `[safe-area]` is an attribute selector. One attribute, and the value is the edge, the same shape as `[drawer="left"]` and `[badge="square"]`.

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

<body safe-area>
  <header safe-area="top">Top bar</header>
  <main safe-area="x">Page</main>
  <footer safe-area="bottom">Bottom bar</footer>
</body>
```

| Attribute | What it pads |
|---|---|
| `[safe-area]` | All four edges. Boolean `[safe-area]` is all four. |
| `[safe-area=""]` | All four edges. An empty value is the same host. |
| `[safe-area="top"]` | Top only. |
| `[safe-area="bottom"]` | Bottom only. |
| `[safe-area="x"]` | Left and right. |
| `[safe-area="y"]` | Top and bottom. |
| Any other value | All four edges. `left`, `right`, `start`, `end`, `all`, and `margin` are not their own edges. |

The all-four rule is not a bare `[safe-area]`. It is `[safe-area]` plus four `:not()` selectors, so `[safe-area="top"]`, `[safe-area="bottom"]`, `[safe-area="x"]`, and `[safe-area="y"]` do not also take the other edges. A bare `[safe-area]` would pad every edge, and the value would only replace one of them. Attribute values are case-sensitive here. `safe-area="Top"` is an unknown value and pads all four edges.

Each rule sets padding longhands and `box-sizing: border-box`. Longhands, so a variant replaces only its edges. A lower-specificity padding shorthand on the same element keeps the edges this variant does not set. `border-box` keeps the pad inside a `width: 100%` host.

The rules do not set `position`, `inset`, `z-index`, `width`, `height`, `display`, or `margin`. `nav[fixed]`, `nav[sticky]`, `[drawer]`, and `[wizard-header]` keep the boxes they already set.

Core CSS does not give `[safe-area]` a z-index. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).

## The inset

Every edge this variant sets uses the same formula. Top is the pattern. Right, bottom, and left use their own inset.

```css
padding-top: max(var(--juice-safe-area-pad), env(safe-area-inset-top, 0px));
```

`x` sets the left longhand and the right longhand. `y` sets the top longhand and the bottom longhand. There is no per-edge floor. Every edge reads `--juice-safe-area-pad`.

The `0px` fallback is in the compiled declaration. A browser that does not understand `env(safe-area-inset-*)` uses `0px`, and `max()` then keeps the floor.

A device with no inset still keeps the floor. A device whose inset is larger uses the inset.

## The floor

`--juice-safe-area-pad` is a layout role. The default is `1rem`, the cozy spacing step (`$spacing-scale` in `libraries/juice/src/core/mixins.scss`) and the block padding on `nav`. It is declared on `:root` only. It is not restated on `[theme]`.

| Role | Where | Default |
|---|---|---|
| `--juice-safe-area-pad` | `:root` only | `1rem` |

Color roles are restated on `[theme]` because `var()` and `currentColor` resolve on the element that sets the property. This length is a literal. It does not read a theme token, so a second declaration on `[theme]` would not change the computed value. Shipped library themes and generated `--jx-*` themes are not required to bind it. Bundled theme CSS does not contain the name.

`[theme] [safe-area]` is still in each rule, in the same declaration block as the bare selector. That half raises specificity. It does not set `--juice-safe-area-pad`.

The floor does not follow the responsive spacing mixin. `[padding="cozy"]` shrinks at breakpoints. `--juice-safe-area-pad` stays `1rem`.

An author can set `--juice-safe-area-pad` on a host. The longhand reads the variable there. Core does not set a different floor per edge.

See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md).

## `viewport-fit=cover`

`env(safe-area-inset-*)` is `0px` unless the viewport meta tag opts into the unsafe area.

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

Without `viewport-fit=cover`, the insets resolve to `0px` and the host keeps only the `1rem` floor. The stylesheet does not add the meta tag. The page does.

## Physical `x` and `y`

Spacing utilities spell an axis as its own attribute: `[paddingX]`, `[paddingY]`, `[padding-top]`. Safe area is one host, so the axis stays a value.

`x` is left and right. `y` is top and bottom. They are physical edges. They are not `inline-start` / `inline-end`, and they are not `block-start` / `block-end`.

`env(safe-area-inset-*)` is a physical viewport inset. A notch does not follow writing mode. The left inset and the right inset can differ, which is what a landscape phone does when the notch sits on one side. There is no `env(safe-area-inset-inline-start)`. A logical value would point at the wrong physical edge under `direction: rtl`.

## No margin mode

There is no `[safe-area-margin]`. Juice modifiers (`[dense]`, `[static]`, `[divided]`) change a value of the same property. They do not switch padding for margin.

Padding is the inset that lets a fixed or sticky bar keep painting into the unsafe area. The bar’s background still reaches the glass.

The content stops at the pad. Margin on that inner host opens a gap, or collapses through the bar.

Margin on the fixed element itself fights `nav[fixed]` and `nav[sticky]`: those rules set `top: 0` and `left: 0`, and `nav` is `width: 100%`. Horizontal margins plus `width: 100%` overflow.

That belongs on those components. This file does not set `margin`, and it does not edit `nav.scss`.

## Cascade

Specificity below counts each attribute in the selector, including each `:not()`. The all-four rule is `(0, 5, 0)` on its own, not `(0, 1, 0)`. The header comment in `safe-area.scss` matches this table. The all-four rule is the `:not()` chain at `(0, 5, 0)`, and `(0, 6, 0)` under `[theme]`. `dist/index.css` has the same chain, with the quotes dropped.

| Selector | Specificity | Edges |
|---|---|---|
| `[safe-area]:not([safe-area="top"]):not([safe-area="bottom"]):not([safe-area="x"]):not([safe-area="y"])` | 0,5,0 | All four |
| `[theme]` plus that chain | 0,6,0 | All four |
| `nav[fixed] > [container]` plus that chain, and the `nav[sticky]` twin | 0,7,1 | All four |
| `[wizard-header] > [container]` plus that chain | 0,7,0 | All four |
| `[safe-area="top"]` | 0,1,0 | Top |
| `[theme] [safe-area="top"]` | 0,2,0 | Top |
| `nav[fixed] > [container][safe-area="top"]`, and the sticky twin | 0,3,1 | Top |
| `[wizard-header] > [container][safe-area="top"]` | 0,3,0 | Top |

`bottom` follows `top`, with the bottom longhand. `x` is `(0, 1, 0)` / `(0, 2, 0)` / `(0, 3, 1)` / `(0, 3, 0)` and sets left and right. `y` uses that same ladder and sets top and bottom.

`[safe-area="top"]` does not include the `:not()` chain. A valued host is the low-specificity row. An empty or unknown host is the high-specificity row.

Padding utilities such as `[padding-top]` and `[paddingX]` are `(0, 1, 0)` and load before this file (`mixins.scss` is used before `components.scss`). A safe-area longhand replaces that edge. A later shorthand at the same or higher specificity can still replace every edge. That is the wizard container, the toast region, and `[toast]`, below.

`[container]` sets `padding: 1rem` at `(0, 1, 0)`, then `2rem` from the `md` breakpoint and `3rem` from `lg`. Those shorthands load in the layout layer, before safe area.

A valued longhand replaces only its edges, so the other edges keep that responsive padding. A boolean host is `(0, 5, 0)` and replaces all four, including the `2rem` and `3rem` steps.

`nav > [container]` and `[wizard-header] > [container]` beat the plain container shorthand. Those two are the bars below.

## Composition

These rules were already in core. Safe area restates the two that would swallow a container host. `nav.scss`, `wizard.scss`, `drawer.scss`, and `toast.scss` were not edited.

### Nav

`nav` keeps its own padding: `1rem 1.5rem`, and `0.75rem 1rem` under `960px`. Both are `(0, 0, 1)`. They come from `nav.scss`, which is forwarded before safe area.

An inner host adds a second inset. The nav’s padding is the outer box. The host’s padding is another box inside it.

```html
<nav>
  <div safe-area="x">This pad sits inside the nav’s own padding.</div>
</nav>
```

Putting `[safe-area]` on the `nav` replaces that edge. The longhand wins over `nav`’s padding, including inside the `960px` query, because a media query does not add specificity.

```html
<nav safe-area="top">
  <div container>The top edge is the inset. The side padding stays the nav’s.</div>
</nav>

<nav safe-area>
  <div container>All four nav edges are the inset. The 960px step does not come back.</div>
</nav>
```

`nav > [container] { padding: 0 }` is `(0, 1, 1)`. It beats a bare valued host (`top`, `bottom`, `x`, `y`) at `(0, 1, 0)`. It does not beat the all-four chain at `(0, 5, 0)`. On a themed page, `[theme] [safe-area="top"]` is `(0, 2, 0)` and beats that container reset for the edges the value sets.

`nav[fixed] > [container][safe-area]` and `nav[sticky] > [container][safe-area]` are restated for every value, including the all-four chain. A container that is the host keeps the inset when the nav is fixed or sticky. The nav’s own padding is a separate box outside that container. This file does not zero it.

```html
<nav fixed>
  <div container safe-area="top">Pinned top bar. The container keeps the top inset.</div>
</nav>

<nav sticky>
  <div container safe-area="x">Sticky bar. Left and right stay inset.</div>
</nav>
```

`nav[fixed]` and `nav[sticky]` set `position` with `top: 0` and `left: 0`. They do not set `width`. `width: 100%` is on `nav`. They are top-pinned. There is no bottom-bar component. A bar along the home indicator would be a new component. This chrome does not invent one.

### Wizard header

`[wizard-header] > [container]` sets `padding: 1rem 1.5rem` at `(0, 2, 0)`. `wizard.scss` is forwarded after safe area, so that shorthand loads later.

It ties `[theme] [safe-area="top"]` at `(0, 2, 0)` and wins for a valued host, which is why the shorthand would wipe the longhand. It does not tie the all-four chain. That chain is `(0, 5, 0)`, or `(0, 6, 0)` under `[theme]`, and it already beats the shorthand.

`[wizard-header] > [container][safe-area]` is restated at `(0, 3, 0)` for a valued host and `(0, 7, 0)` for the all-four chain. The container keeps the edges that value sets.

The other edges stay on the wizard shorthand. A boolean host replaces all four, so the `1.5rem` horizontal padding becomes `max(1rem, env(safe-area-inset-left, 0px))` and the matching right inset.

When the inset is under `1rem`, that is a shorter side pad than the wizard rule.

```html
<div wizard-header>
  <div container safe-area="top">The top inset replaces only the top padding.</div>
</div>
```

`[wizard-header]` itself stays `position: sticky`, `top: 0`, `z-index: 50`. Safe area does not add a band.

### Drawer

`[drawer]` is `overflow: auto`. Padding on the drawer, or on a host inside it, is inside the scrollport. Scroll the panel and the pad moves with the content. The notch clearance does not stay pinned.

```html
<div drawer>
  <div drawer-header>
    <div safe-area="top">This pad scrolls away with the panel.</div>
  </div>
  <div drawer-body>…</div>
</div>
```

`[drawer-header]` and `[drawer-body]` are `(0, 1, 0)` and do not select descendants. A host inside them keeps its pad.

Those two rules load before safe area. On the header or the body itself, a valued longhand ties `(0, 1, 0)` and wins because it comes later.

The other edges keep the header or body padding. A boolean host is `(0, 5, 0)` and replaces all four.

The `768px` padding step on those parts is the same specificity and still loses the edges safe area sets.

`[drawer-close]` is `position: absolute`, `top: 1rem`, `right: 1rem`. That offset is not `max(1rem, env(safe-area-inset-*))`. The control can sit in the unsafe area. Moving it is a drawer change. This file does not edit `drawer.scss`.

### Toast region

`[toast-region]` and `[theme] [toast-region]` set `padding: 1rem` at `(0, 1, 0)` and `(0, 2, 0)`. `toast.scss` loads after safe area. There is no toast restatement.

A valued host on the region itself ties that later shorthand and loses. `[toast-region safe-area="top"]` does not keep the top inset. The same is true for `bottom`, `x`, and `y`.

An empty or unknown value on the region is the `:not()` chain, `(0, 5, 0)` or `(0, 6, 0)` under `[theme]`. That beats the region’s padding. Boolean `[safe-area]` on `[toast-region]` does pad all four edges.

`[toast]` sets `padding: 0.875rem 2.75rem 0.875rem 1rem` at `(0, 1, 0)`, also after safe area. A valued host on the toast element loses the same way. Boolean `[safe-area]` on `[toast]` wins and replaces that padding, including the `2.75rem` end padding that clears `[toast-close]`.

A child that is not the region and not the toast is unaffected by those shorthands. The child can be the host. The region’s own `1rem` stays on the outer box. The runtime finds `[toast]` anywhere inside the region.

```html
<div toast-region="bottom-right">
  <div toast>
    <div safe-area="bottom">Saved</div>
  </div>
</div>
```

Corner values (`top-right`, `top-left`, `bottom-right`, `bottom-left`) set position only. The padding fight is the base region rule, and the toast’s own padding.

### No bottom bar

`nav[fixed]` and `nav[sticky]` are top-pinned. Nothing in core CSS is a bottom-pinned app bar. Safe area can pad a footer the author pins. It does not ship the bar.

## Usage

The meta tag and a page shell. Each edge is on the element that should move, so the insets do not stack.

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

<header safe-area="top">Harbor</header>
<main safe-area="x">
  <h1>Departures</h1>
</main>
<footer safe-area="bottom">The 4:10 is on time.</footer>
```

A fixed nav, with the inset on the bar rather than on a second inner host:

```html
<nav fixed safe-area="top">
  <div container>
    <span nav-brand>Harbor</span>
    <span nav-actions><button btn>Tickets</button></span>
  </div>
</nav>
```

A fixed nav whose inner container is the host. The nav’s padding is still there, outside the container. The container’s top padding is the inset:

```html
<nav fixed>
  <div container safe-area="top">
    <span nav-brand>Harbor</span>
  </div>
</nav>
```

A wizard header container:

```html
<div wizard-header>
  <div container safe-area="x">
    <div brand>Harbor</div>
  </div>
</div>
```

A toast stack. The host is inside the toast, so the toast’s own padding stays:

```html
<div toast-region="bottom-right">
  <div toast>
    <div safe-area="bottom">Saved</div>
  </div>
</div>
```

An unknown value is all four edges. Prefer a named value when only one edge should move:

```html
<div safe-area="left">This pads all four. There is no left-only value.</div>
<div safe-area="x">Left and right only.</div>
```

## Keyboard avoider

`keyboard-avoider.scss` loads after this file. Padding mode on a bare `[safe-area]`, `[safe-area="bottom"]`, or `[safe-area="y"]` host replaces bottom padding with `max(var(--juice-safe-area-pad), env(safe-area-inset-bottom, 0px), var(--juice-keyboard-inset))`. Translate-only and footer-only hosts keep this file's padding. See [Keyboard avoider](./juice-keyboard-avoider-runtime.md). A sheet footer, and a `[sheet-body]` that is the last child, use that same `max()`. Under `html[keyboard-open]` those pads drop the keyboard term and the sheet max-height shrinks by the inset, so the keyboard is counted once. See [Sheet chrome](./juice-sheet.md#safe-area-and-the-keyboard).

## Accessibility

Safe area does not set `role`, a name, or a live region. It adds padding. The words in the host stay in the accessibility tree.

Padding is not a substitute for a control’s hit target. `[drawer-close]` can sit under the notch or the rounded corner. It remains focusable. It can be hard to see and hard to tap. The author places that control. This chrome does not move it.

`viewport-fit=cover` lets the page paint under the system chrome. The inset is what keeps the text and controls out of that strip. Without the meta tag, the floor is still `1rem`, and the device inset is not applied.

## Limitations

- CSS-only. No `SafeArea()` factory, no `createSafeArea`, and no auto-enhance. The JS entry does not boot a safe-area runtime. There is no `juice:change` and no `getState()`. `@citrusworx/sigjs/juice` `bind()` does not accept `[safe-area]`.
- Emerging, not Stable. On master, and shipped in 0.9.3. The thirty-two Emerging runtimes stay thirty-two.
- Shipped themes are not required to bind `--juice-safe-area-pad`. The role is on `:root` only. Bundled theme CSS does not contain it.
- Values other than `top`, `bottom`, `x`, and `y` pad all four edges. There is no `left`, `right`, `start`, or `end` value.
- `x` and `y` are physical. They do not follow writing mode.
- There is no `[safe-area-margin]`. The inset is padding.
- There is no per-edge floor. Every edge reads `--juice-safe-area-pad`.
- The floor is a literal `1rem`. It does not use the responsive spacing mixin. Boolean `[safe-area]` on `[container]` replaces that container’s `2rem` / `3rem` breakpoint padding.
- The stylesheet does not add `viewport-fit=cover`. Without that meta tag, `env(safe-area-inset-*)` is `0px`.
- There is no z-index. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).

## Known gaps

These are the conflicts the chrome left in place. This page records them. It does not change the CSS.

- `nav` still has `padding: 1rem 1.5rem` (`0.75rem 1rem` under `960px`). A host inside the nav adds a second inset. Exact clearance on the bar means putting `[safe-area]` on the `nav`. `nav.scss` was not edited.
- `nav > [container] { padding: 0 }` at `(0, 1, 1)` still beats a bare valued host that is not under `[theme]` and is not inside `nav[fixed]` or `nav[sticky]`. `safe-area="top"` on that plain container does not pad. Boolean, empty, and unknown values do, because the `:not()` chain is `(0, 5, 0)`.
- The header comment in `safe-area.scss` still describes bare `[safe-area]` as `(0, 1, 0)` and says `nav > [container]` beats it. The compiled all-four selector is the `:not()` chain. The comment was not edited.
- `nav[fixed]` and `nav[sticky]` are top-pinned (`top: 0`, `left: 0`). There is no bottom-bar component. A home-indicator bar is not this chrome.
- `[drawer]` scrolls (`overflow: auto`). An inner pad scrolls with the panel. `[drawer-header]` and `[drawer-body]` do not use the inset. `[drawer-close]` stays `top: 1rem` and `right: 1rem` and can sit in the unsafe area. `drawer.scss` was not edited.
- A valued `[safe-area]` on `[toast-region]` loses to the later `padding: 1rem` shorthand. There is no toast restatement. Boolean `[safe-area]` on the region itself wins, because that selector is `(0, 5, 0)`.
- `[toast]` sets `padding: 0.875rem 2.75rem 0.875rem 1rem` at `(0, 1, 0)` after safe area. A valued host on the toast loses. Boolean `[safe-area]` on the toast replaces that padding, including the `2.75rem` that clears `[toast-close]`. A child inside the toast keeps its own pad.
- Boolean `[safe-area]` on `[container]` replaces the container’s responsive padding (`1rem`, then `2rem` from `md`, `3rem` from `lg`). A valued host replaces only its edges. `nav > [container]` still zeros that padding at `(0, 1, 1)` before safe area is considered.
- `[wizard-header] > [container]` is `padding: 1rem 1.5rem`. A boolean host replaces the horizontal `1.5rem` with the `1rem` floor when the inset is smaller than that. The restatement keeps the inset. It does not add the inset on top of `1.5rem`.
- The page has to set `viewport-fit=cover`. Core CSS cannot.

## Where this sits

Cards, badges, stats, skeleton, and list are the other CSS-only structural hooks: markup plus core CSS, no runtime. Safe area is the inset.

It does not paint a surface, a row, or a label. Skeleton holds a loading shape.

List holds rows. Badge is the label.

See [Badge](./juice-badge.md) [Skeleton](./juice-skeleton.md)

[List](./juice-list.md) [Cards](./juice-cards.md)

[Styles](./juice-styles.md) [Attributes](./juice-attributes.md)

and the [maturity matrix](./juice-maturity-matrix.md).
