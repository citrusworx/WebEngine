# Juice Sheet

This document explains the current sheet chrome in `libraries/juice/src/components/sheet/sheet.scss` and points at the sheet runtime in `libraries/juice/src/js/src/sheet/sheet-runtime.ts` (monorepo paths; outside this vault). `components.scss` forwards the stylesheet after `keyboard-avoider.scss` and before `search-panel.scss`.

Sheet is Mobile-Critical. It is a bottom-anchored dialog: a grab handle, stacked detents, and an overlay. The stylesheet paints the states. It does not pick a detent in JavaScript. The runtime writes `[detent]`, `[dragging]`, and `data-motion-state`.

The key idea is the same as navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, progress, pagination, disclosure, spinner, select, input, textarea, field, icon button, avatar, table, pressable, touchable row, and keyboard avoider:

> If a user writes a valid Juice sheet and it exists in the browser, the overlay should open, rest at a detent, and follow a drag on the handle.

That is the standard. The stylesheet owns the heights, the scrim, and the motion. The runtime owns open, close, focus, and the drag.

## The Goal

The sheet runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize sheet in their app code.

There is no `Sheet()` Sig factory. Markup plus the runtime is the contract. `@citrusworx/sigjs/juice` `bind()` does not name sheet, keyboard-avoider, pressable, or touchable-row. There is no `JuiceRuntimeName` for any of those four. `JuiceRuntimeName` stops at twenty-eight names, through `table`.

This surface is Emerging, not Stable. Valid markup should lay out from core CSS, and importing the JS entry should open and drag it, but the API is still likely to evolve.

Sheet is a dialog. It is not a restyle of `[drawer]`, and it is not the surface `overlay="frost|tint"` utility.

Sheet is the thirty-second Emerging auto-enhance runtime. It is on master and not yet in npm. `@citrusworx/juiceui@0.9.5` is the latest published cut (published 2026-10-30 15:11 UTC). Do not invent a version number for sheet. `@citrusworx/juiceui@0.9.0` shipped eighteen (navigation through progress). `@citrusworx/juiceui@0.9.1` added pagination, the nineteenth. Disclosure is the twentieth. Spinner is the twenty-first. Select is the twenty-second. Input is the twenty-third. Textarea is the twenty-fourth. Field is the twenty-fifth. Disclosure, spinner, select, input, textarea, field, and motion core shipped in 0.9.2. Icon button is the twenty-sixth, avatar is the twenty-seventh, and table is the twenty-eighth; those three shipped in 0.9.3. Pressable (chrome in #299 and #301, runtime in #303) is the twenty-ninth and shipped in 0.9.4. Touchable row (chrome in #306, runtime in #308) is the thirtieth and shipped in 0.9.4. Keyboard avoider (chrome in #310, runtime in #311) shipped in 0.9.5. Sheet chrome landed in #316 and the runtime in #317. All thirty-two stay Emerging.

## When to use it

Use `[sheet-overlay]` when the panel should dock to the bottom of the viewport and rest at peek, half, or full height. A filter sheet, a share sheet, or a composer that the user drags between heights is this component.

Use [Drawer](./juice-drawer-runtime.md) for a panel docked to the left or right edge. Use [Modal](./juice-modal-runtime.md) for a centered dialog. Use [Keyboard avoider](./juice-keyboard-avoider.md) when the page itself has to clear the software keyboard and there is no sheet.

## Markup

There is no HTML global `sheet` attribute, and there is no `<sheet>` element. `[sheet-overlay]` and `[sheet]` are attribute selectors.

```html
<button type="button" aria-controls="filters-sheet">Filters</button>

<div sheet-overlay id="filters-sheet" hidden>
  <div sheet role="dialog" aria-modal="true" sheet-detents="peek half full">
    <button type="button" sheet-handle aria-label="Drag"></button>
    <button type="button" sheet-close aria-label="Close">×</button>
    <div sheet-header>
      <h2>Filters</h2>
    </div>
    <div sheet-body>
      <p>Refine the list.</p>
    </div>
    <div sheet-footer>
      <button type="button">Apply</button>
    </div>
  </div>
</div>
```

| Part | What it is |
|---|---|
| `[sheet-overlay]` | Full-viewport host. Closed vs open is native `hidden` on this element. |
| `[sheet]` | The panel. `role="dialog"`. Anchored to the bottom edge of the overlay. |
| `[sheet-handle]` | The grab bar. The visible bar is `--juice-sheet-handle-width` by `--juice-sheet-handle-height`. |
| `[sheet-header]` | Title block. The runtime also starts a drag here. |
| `[sheet-body]` | Scrolling content. `overflow: auto` and `overscroll-behavior: contain`. |
| `[sheet-footer]` | Action row. Owns the safe-area and keyboard padding when it is present. |
| `[sheet-close]` | Dismiss control. `2.5rem` circle, absolute, top and right `0.75rem`. |

Closed vs open matches drawer. Native `hidden` on the overlay is `display: none`. Markup without `[hidden]` stays visible so a static demo keeps working. The runtime removes `[hidden]` before the enter motion and sets it only after the exit motion.

`[sheet-overlay]` matches every value. The three overlay modes are below. Optional `surfaceTone` on `[sheet]` is allowed. The stylesheet does not force it.

## Overlay modes

| Value | Paint | Pointers |
|---|---|---|
| `[sheet-overlay]` (boolean, omitted value, or any value other than `none`) | Modal backdrop | `pointer-events: auto` on the overlay |
| `[sheet-overlay="static"]` | The same backdrop | The same paint. Click-to-close is the runtime. This file keeps the backdrop. |
| `[sheet-overlay="none"]` | No backdrop (`transparent`) | `pointer-events: none` on the overlay, `auto` on `[sheet]`, so the page behind stays clickable |

`[sheet-overlay="static"]` is restated after the backdrop rule so the value is not dropped by `:not([sheet-overlay="none"])`. The runtime treats boolean, omitted, and `"static"` as modal. `"none"` is non-modal. See [Sheet runtime](./juice-sheet-runtime.md).

## Detents

`sheet-detents` on `[sheet]` is the allowed set. Words compose with `~=`, the same shape as `[keyboard-avoider~="footer"]`. The default set, when the attribute is absent or contains no known word, is `half full`. The current detent is `[detent]` on the sheet: `peek`, `half`, or `full`.

Rank is peek < half < full. This stylesheet only styles the states. It does not pick a detent.

| Markup | Height |
|---|---|
| No `[detent]`, and half is allowed (including the default, and an absent `sheet-detents`) | `--juice-sheet-half` |
| `[sheet-detents~="peek"]` alone, no `[detent]` | `--juice-sheet-peek` |
| `[sheet-detents~="full"]` without half, no `[detent]` | `--juice-sheet-full` |
| `[detent="peek"]`, `[detent="half"]`, or `[detent="full"]` | That height. `[detent]` wins over the resting rule. |

`[dragging]` on the sheet, or on the overlay, sets `transition: none` so a drag can write inline height without fighting the detent transition. The enter and exit motion is animation, not that transition.

`data-motion-state` on `[sheet-overlay]` is `entering`, `entered`, `exiting`, or `exited`.

| State | Overlay | Panel |
|---|---|---|
| `entering` | Fade in, `--juice-motion-duration-base`, `--juice-motion-ease-enter` | Slide up from `translateY(100%)` |
| `exiting` | Fade out, `--juice-motion-duration-fast`, `--juice-motion-ease-exit` | Slide down to `translateY(100%)` |
| `exited` | `opacity: 0` | `translateY(100%)` |

## Layout roles

Layout roles, on `:root` only. They are not color, so they are not restated on `[theme]`. A custom property set on `[theme]` would re-resolve on the themed element. These lengths do not depend on the theme. Shipped library themes and generated `--jx-*` themes are not required to bind them. Do not put these roles on `[theme]`.

| Role | Default |
|---|---|
| `--juice-sheet-offset` | `max(env(safe-area-inset-top, 0px), 1.5rem)`. Top gap for the full detent. |
| `--juice-sheet-peek` | `25vh`, then `25dvh` |
| `--juice-sheet-half` | `50vh`, then `50dvh` |
| `--juice-sheet-full` | `calc(100vh - var(--juice-sheet-offset))`, then the same with `100dvh` |
| `--juice-sheet-max-height` | The same cap as full |
| `--juice-sheet-radius` | `1rem`. Top corners only. The bottom edge is square. |
| `--juice-sheet-handle-width` | `2.5rem` |
| `--juice-sheet-handle-height` | `0.25rem` |

Each `dvh` declaration follows the `vh` declaration. A browser that does not understand `dvh` drops that line and keeps the `vh` line above it.

The sheet is `position: absolute`, `bottom: 0`, `left: 0`, `right: 0`, `height: var(--juice-sheet-half)` until a detent rule replaces it, and `max-height: var(--juice-sheet-max-height)`. `box-sizing` is `border-box`. `[sheet]` sets `overflow: hidden` so the radius clips the panel. The sheet itself does not set `z-index`.

## Color fallback

Color comes from an optional sheet role that falls through to the drawer role of the same name, then to an unthemed fallback:

```css
var(--juice-sheet-<name>, var(--juice-drawer-<name>, <fallback>))
```

| Sheet role | Falls through to | What it paints |
|---|---|---|
| `--juice-sheet-overlay` | `--juice-drawer-overlay` | Scrim |
| `--juice-sheet-panel` | `--juice-drawer-panel` | Panel fill |
| `--juice-sheet-panel-border` | `--juice-drawer-panel-border` | Panel hairline |
| `--juice-sheet-panel-shadow` | `--juice-drawer-panel-shadow` | Panel elevation |
| `--juice-sheet-close` | `--juice-drawer-close` | Close fill |
| `--juice-sheet-close-color` | `--juice-drawer-close-color` | Close ink |
| `--juice-sheet-close-hover` | `--juice-drawer-close-hover` | Close hover fill |
| `--juice-sheet-focus-ring` | `--juice-drawer-focus-ring` | Close focus outline |

Shipped themes already bind the drawer names. A sheet override is optional. This file does not declare `--juice-sheet-*` color roles on `:root` or `[theme]`. Declaring them would block the drawer fallback. There is no `REQUIRED_SHEET_ROLES` entry and no theme edit in the chrome slice. The aqua / kw / cm / tide / jx alias chain stays inside drawer chrome. Drawer roles are the contract those aliases already satisfy.

The drawer shadow points down (a positive Y offset). On a bottom sheet that shadow falls under the panel. Set `--juice-sheet-panel-shadow` to a shadow with a negative Y offset to aim it up, onto the page above the sheet. That override does not require a theme file edit.

`[sheet-close]` uses the shared `overlay-close-transition` mixin: background and color over `--juice-motion-duration-fast` with `--juice-motion-ease-standard`. Focus-visible is a `2px` outline, offset `2px`, in `--juice-sheet-focus-ring` (falling through to the drawer ring, then `currentColor`).

See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md).

## Z-index

`z-index` is `1000` on `[sheet-overlay]`, the same band as `[modal-overlay]` and `[drawer-overlay]`. There is no layer system and no `--juice-z-*` token. The sheet panel does not set `z-index`. The handle sets `z-index: 1` so the hit target sits above the header. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).

## Safe area and the keyboard

Footer bottom padding is the keyboard-avoider safe-area composition, the same `max()` that file emits. It is not a sum. The home indicator must not stack on the keyboard.

```css
padding-bottom: max(
  var(--juice-safe-area-pad),
  env(safe-area-inset-bottom, 0px),
  var(--juice-keyboard-inset)
);
```

`[sheet] > [sheet-body]:last-child` uses that formula too, so a sheet with no footer still clears the inset. A body that is followed by a footer keeps its own padding. The footer owns the inset.

`html[keyboard-open]` shrinks the sheet max-height by `--juice-keyboard-inset`:

```css
max-height: calc(var(--juice-sheet-max-height) - var(--juice-keyboard-inset));
```

The keyboard-avoider runtime sets `[keyboard-open]` on `<html>` while the keyboard is open and writes the inset there. Under that attribute the footer and a trailing body drop the keyboard term and keep the safe-area terms:

```css
padding-bottom: max(var(--juice-safe-area-pad), env(safe-area-inset-bottom, 0px));
```

The inset is applied once, as the max-height shrink. While the attribute is absent, the footer `max()` still includes the inset for the `env()` fallback. See [Keyboard avoider](./juice-keyboard-avoider.md) and [Safe Area](./juice-safe-area.md).

## Handle hit target

The visible bar stays `--juice-sheet-handle-width` (`2.5rem`) by `--juice-sheet-handle-height` (`0.25rem`). `margin-top` is `0.75rem` and `margin-bottom` is `0.25rem`. The bar is a pill (`border-radius: 999px`) in the close ink. It sets `touch-action: none`.

A `::before` on `[sheet-handle]` is the hit target. It does not paint. It is `44px` tall and as wide as the bar. `top: -0.75rem` cancels the handle's `margin-top`, so the top of the target meets the sheet's top edge and the full `44px` stays inside the panel. `[sheet] { overflow: hidden }` clips anything that crosses that edge. Centering the `44px` on the `0.25rem` bar would put part of the target above the sheet, and that part would not receive hits. The bar's box does not change.

## Reduced motion

`prefers-reduced-motion: reduce` sets `transition: none` on `[sheet]` and `[sheet-close]`, including under `[theme]`. Durations also collapse through `--juice-motion-*`. The enter and exit animations follow those tokens. The runtime clamps the drag rubber-band when reduced motion is set. See [Sheet runtime](./juice-sheet-runtime.md) and [Animations](./juice-animations.md).

## Examples

A modal half-and-full sheet. Half is the resting height until the runtime writes `[detent]`.

```html
<button type="button" aria-controls="share-sheet">Share</button>

<div sheet-overlay id="share-sheet" hidden>
  <div sheet role="dialog" aria-labelledby="share-title">
    <button type="button" sheet-handle></button>
    <button type="button" sheet-close>×</button>
    <div sheet-header><h2 id="share-title">Share</h2></div>
    <div sheet-body><p>Send this page.</p></div>
  </div>
</div>
```

A static scrim. The backdrop stays. The runtime does not close on a backdrop click.

```html
<div sheet-overlay="static" id="confirm-sheet" hidden>
  <div sheet role="dialog" detent="full">
    <div sheet-header><h2>Confirm</h2></div>
    <div sheet-body><p>This step stays until you choose.</p></div>
    <div sheet-footer>
      <button type="button" sheet-close>Done</button>
    </div>
  </div>
</div>
```

A non-modal sheet. No scrim. The page behind the overlay stays clickable. The panel still receives hits.

```html
<div sheet-overlay="none" id="player-sheet">
  <div sheet role="dialog" sheet-detents="peek half" detent="peek">
    <button type="button" sheet-handle></button>
    <div sheet-body><p>Now playing</p></div>
  </div>
</div>
```

Aim the shadow up without editing a theme:

```css
[sheet] {
  --juice-sheet-panel-shadow: 0 -24px 56px -24px rgb(0 0 0 / 0.42);
}
```

## Limitations

- No `Sheet()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- This surface is Emerging, not Stable. Sheet is the thirty-second Emerging auto-enhance runtime. It is on master and not yet in npm. The latest published cut is `@citrusworx/juiceui@0.9.5`. Keyboard avoider remains the thirty-first and shipped in 0.9.5. All thirty-two stay Emerging.
- `@citrusworx/sigjs/juice` `bind()` does not name sheet. Do not pass `"sheet"` as a `JuiceRuntimeName`. See [Sheet runtime](./juice-sheet-runtime.md#sig-bind).
- Color roles are optional. They fall through to `--juice-drawer-*`. There is no required sheet role. Layout roles stay on `:root`.
- The drawer fallback for `--juice-sheet-panel-shadow` points down. Set `--juice-sheet-panel-shadow` when the shadow should aim up.
- `[sheet] { overflow: hidden }` clips to the panel. The `44px` handle target is kept inside the top edge so that clip does not shorten the hit area.
- `html[keyboard-open]` shrinks max-height by the keyboard inset and drops that term from footer and trailing-body padding, so the keyboard is counted once.
- Overlay `z-index` is `1000`, shared with modal and drawer. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- Centered modal, edge-docked drawer, toast, popover, wizard, tooltip, combobox, banner, menu, and the other runtimes are not this chrome.

## Why this matches drawer

Sheet copies the drawer closed/open contract: native `hidden` on the overlay, `data-motion-state` for enter and exit, and `aria-controls` openers. The panel is bottom-anchored instead of edge-docked, and the height is a detent instead of `drawer-size`. Shared internals under `libraries/juice/src/js/src/shared/` are not a public multi-feature runtime API. Sheet does not import Sig.

## Design rule going forward

Interactive Juice browser features should follow this standard:

> Valid Juice markup should work automatically when it reaches the browser.

## Related

- [Sheet runtime](./juice-sheet-runtime.md)
- [Drawer runtime](./juice-drawer-runtime.md)
- [Keyboard avoider](./juice-keyboard-avoider.md)
- [Safe area](./juice-safe-area.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Attributes](./juice-attributes.md)
- [Theme contract](./juice-theme-contract.md)
