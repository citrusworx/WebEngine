# Juice Badge

This document explains the current badge chrome in `libraries/juice/src/components/badge/badge.scss` (monorepo path; outside this vault). Related layout lives in `developers/developers.scss` and `wizard/wizard.scss`. The only shipped theme that paints `[badge]` itself is `libraries/juice/src/themes/kiwipress/kiwipress.scss`.

Badge is CSS-only. Importing the core stylesheet is enough for the shape and the core color. There is no JS entry, no `createBadge`, no auto-enhance, and no `Badge()` Sig factory. Markup is the contract.

This surface is Emerging, not Stable. It is not one of the thirty-two Emerging auto-enhance runtimes. That count stays thirty-two. There is no `juice:change`, no `getState()`, and `@citrusworx/sigjs/juice` `bind()` does not accept it. There is no runtime to infer and no `JuiceRuntimeName` for it.

Two cuts are in play, and they are not the same CSS:

- The base `[badge]` layout shipped in the published `@citrusworx/juiceui@0.9.2` npm cut. `npm view @citrusworx/juiceui@0.9.2` reports `gitHead` `03cf749c8e8ddc740e7613f398840864bc5ba827` (published 2026-10-14).
- That commit’s `badge.scss` is the literal pill, `[badge="square"]`, and `[badge="ribbon"]`. Its compiled `dist/index.css` has those rules and does not have `--juice-badge-*`.
- The published tarball contains those core rules and the four KiwiPress `[badge]` rules in `dist/themes/kiwipress.css`.
- The core roles, the `[theme] [badge]` ink and `line-height`, the `[theme] [cta] [badge]` companion, and the `a` / `button` focus outline shipped in `@citrusworx/juiceui@0.9.3`. `npm view @citrusworx/juiceui@0.9.3` reports `gitHead` `c794c06f421f3682e1efd1e96465cffc0a6404d1` (published 2026-10-27).

`dist/index.css` on master matches `badge.scss`. The compiler drops quotes on attribute values (`[badge=square]`, `[badge=ribbon]`). The declarations are the same. Shipped theme CSS does not mention `--juice-badge-*`.

Badge is a short label. It is not an avatar (`[avatar]` is an initials-or-photo mark; `[badge="square"]` is only the square-radius precedent). It is not a status dot. It is not the Font Awesome `id-badge` icon. It is not `[philosophy-badge]`, which is a separate KiwiPress diagram chip documented at the end of this page.

## Markup

There is no HTML global `badge` attribute, and there is no `<badge>` element. `[badge]` is an attribute selector. Juice does not style a bare `[ribbon]`. The ribbon shape is the value `badge="ribbon"`.

```html
<span badge>New</span>

<span badge="square">v0.9.2</span>

<div card="pricing" featured>
  <span badge="ribbon">Most Popular</span>
  <div plan>
    <div header>
      <div name>Pro</div>
    </div>
  </div>
</div>

<span badge warm>Warm</span>
```

`[warm]` is a separate boolean. Core CSS does not paint it. KiwiPress does, and the theme generator still emits a warm rule for app-owned themes. That generator rule loses to core, covered under cascade. See [Attributes](./juice-attributes.md).

| Attribute | What it does |
|---|---|
| `[badge]` | Pill. `inline-flex`, centered, `font-weight: 600`, `line-height: 1`, `box-sizing: border-box`. Gap, padding, radius, and font size come from the layout roles (`0.375rem`, `0.375rem 0.75rem`, `999px`, `0.8125rem`). Ink, fill, and the 1px border come from the color roles. `background-image` and `box-shadow` are cleared. |
| `[badge="square"]` | Same pill, with radius `--juice-badge-radius-square` (`0.375rem`). |
| `[badge="ribbon"]` | `position: absolute`, `top: -0.75rem`, `left: 50%`, `transform: translateX(-50%)`. Radius stays the pill unless `square` is also set. |
| `[warm]` | No core geometry. Color only, and only where a theme rule beats the core roles. |

Any other value, including `badge="dot"` or `badge="lg"`, is the pill. Only `square` and `ribbon` change geometry. There is no `[scale]`, no size token, and no count, tone, or dot variant.

`square` and `ribbon` compose. Square sets the radius. Ribbon sets the position. Outside `[cta]`, KiwiPress ribbon colors still apply to `[badge="ribbon"]`. `[warm]` on a ribbon is a specificity question, covered under KiwiPress.

Core CSS does not give `[badge]` a z-index. A ribbon is taken out of flow and paints in document order. It is not `z-index: 10` or `1000`. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).

## Roles

Color defaults are stated on `:root` and again on `[theme]`. Layout defaults are on `:root` only. Shipped library themes are not required to bind any `--juice-badge-*` name. Bundled theme CSS does not contain these names. Generated `--jx-*` themes do not emit them either.

A custom property resolves `var()` on the element that sets it. `currentColor` stays inside the color values and resolves where the badge paints, so the wash and the hairline follow inherited body ink on light and dark pages. Geometry stays on `:root` so a theme does not have to restate lengths.

| Role | Where | Default |
|---|---|---|
| `--juice-badge-bg` | `:root`, `[theme]` | `color-mix(in srgb, currentColor 1%, transparent)` |
| `--juice-badge-ink` | `:root`, `[theme]` | `currentColor` |
| `--juice-badge-border` | `:root`, `[theme]` | `color-mix(in srgb, currentColor 24%, transparent)` |
| `--juice-badge-padding` | `:root` only | `0.375rem 0.75rem` |
| `--juice-badge-radius` | `:root` only | `999px` |
| `--juice-badge-radius-square` | `:root` only | `0.375rem` |
| `--juice-badge-font-size` | `:root` only | `0.8125rem` |
| `--juice-badge-gap` | `:root` only | `0.375rem` |

Ink is inherited body ink, not muted copy ink. The fill is a 1% `currentColor` wash. The border is a 24% hairline, the same weight as the table grid. It is decorative, not a control boundary. There is no `--juice-badge-focus-ring`.

The 1% wash is the ceiling because of Citrusmint. Body ink there is 4.62:1 on the page. The same ink on a 2% wash falls to 4.499:1. 1% stays at 4.56:1 on the page and 5.10:1 on the strong surface. Every other shipped theme has more room on both backdrops.

See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md).

## Cascade and specificity

`[badge]` and `[theme] [badge]` share one rule. The theme half is what beats copy rules.

| Selector | Specificity | What it wins |
|---|---|---|
| `[badge]` | 0,1,0 | Unthemed pill. Same declarations as the theme half. |
| `[theme] [badge]` | 0,2,0 | Ink, fill, hairline, `line-height: 1`, `background-image: none`, `box-shadow: none`. Beats a theme copy rule at 0,1,0. |
| `[theme] [badge="square"]` | 0,2,0 | Square radius. The unthemed half is 0,1,0. |
| `[theme] [badge="ribbon"]` | 0,2,0 | Ribbon position. The unthemed half is 0,1,0. Does not set `color`. |
| `[theme] [cta] [badge]` | 0,3,0 | Restates ink, fill, border color, `background-image: none`, and `box-shadow: none` inside `[cta]`. |
| `:where(a, button)[badge]:focus-visible` | 0,2,0 | 2px `currentColor` outline, offset 2px, `box-shadow: none`. `:where()` adds nothing. |
| `[theme] :where(a, button)[badge]:focus-visible` | 0,3,0 | The same outline on a themed link or button badge. |
| `[dev-hero-header] > [badge]` | 0,2,0 | `display: inline-block` and `margin-bottom: 1.5rem`. Later in core than the badge rule. |
| `[wizard-header] [brand] [badge]` | 0,3,0 | Tighter box. Later in core. Beats `[theme] [badge]` for the properties it sets. |

`[theme] [badge]` beats theme copy rules for `span` / `p` / `li` / `label` (`(0, 1, 0)`), including Citrusmint’s muted ink and the `line-height: 1.6` rules in KiwiPress, Afterburn, Arcade Glow, and Boardwalk. Those four copy rules used to tie the old literal `line-height: 1` when the theme file loaded after core. The badge’s own `line-height: 1` now wins.

`[theme] [cta] [badge]` beats a `[cta]` copy rule that only sets `color` at `(0, 2, 0)`. It sets ink, fill, and border together, and it also clears `background-image` and `box-shadow`. A later theme rule at `(0, 3, 0)` or higher still wins. That is how `[badge][warm]` keeps its paint when the theme file loads after core.

The focus rule does not set `transform`, so a ribbon keeps `translateX(-50%)`. There is no `--juice-badge-focus-ring`.

`[theme] [badge]` sets `box-shadow: none` at `(0, 2, 0)`. A theme button shadow on `:where(button)` or `:where(button:hover, button:focus-visible)` is `(0, 1, 0)`, so a button badge loses that shadow, including on hover and focus.

The rule does not set `transform`. A non-ribbon button badge can still pick up a theme hover `translateY` when that declaration is only `(0, 1, 0)`.

A ribbon’s `transform` is `(0, 2, 0)` and keeps the centering translate.

`[dev-hero-header] > [badge]` is the same specificity as `[theme] [badge]` and comes later in `components.scss` (`badge.scss` is forwarded first, then `developers.scss`). It switches that direct child to `inline-block`, so the pill’s `gap` no longer applies between its children. It does not set color or background.

`[wizard-header] [brand] [badge]` is `(0, 3, 0)` and comes later (`wizard.scss` is forwarded after badge). It tightens the box: `font-size: 0.75rem` (12px), padding `0.25rem 0.625rem`, radius `0.375rem`, `font-weight: 500`, `line-height: 1.4`.

That radius applies even when the attribute is boolean `[badge]`, not `badge="square"`. Those declarations beat the core roles for the properties they set.

`[wizard-header]` itself is `z-index: 50`. The badge does not add a band of its own.

### KiwiPress selectors

Paint is on `[theme="kiwipress"]`, in `kiwipress.scss`. The tokens below are custom properties on that same block. They are not on `:root`. The Sass sources are the color token files under `libraries/juice/src/tokens/color/`. The numbers are the compiled values in `dist/themes/kiwipress.css`. The theme file was not edited when the core roles landed.

| Rule | Text | Background | Tokens |
|---|---|---|---|
| `[badge]`, and `[badge="square"]` | `--kw-accent` | `--kw-accent-tint` | `$kiwi-700` → `hsl(161, 94%, 30%)` `#059467`. `$kiwi-200` → `hsl(149, 80%, 90%)` `#d1fae5`. Does not set `border-color`. |
| `[badge][warm]` | `--kw-warm` | `--kw-surface` | `$marmalade-600` → `hsl(38, 92%, 50%)` `#f59f0a`. `$white-100` → `hsl(0, 0%, 100%)` `#ffffff`. Border is `--kw-warm-tint` (`$marmalade-300` → `hsl(48, 96%, 76%)` `#fde587`). |
| `[badge="ribbon"]` | `$white-100` | `--kw-accent` | White is a literal in the rule, compiled to `hsl(0, 0%, 100%)`. Background is the same kiwi-700 as the default text. Does not set `border-color`. |
| `[wizard-header] [brand] [badge]` | `--kw-text-muted` | `--kw-surface-muted` | `$slate-600` → `hsl(220, 9%, 46%)` `#6b7280`. `$slate-100` → `hsl(210, 20%, 98%)` `#f9fafb`. Border is `--kw-border` (`$slate-300` → `hsl(220, 13%, 91%)` `#e5e7eb`). |

| Selector | Specificity |
|---|---|
| `[theme="kiwipress"] [badge]` | 0,2,0 |
| `[theme="kiwipress"] [badge="ribbon"]` | 0,2,0 |
| `[theme="kiwipress"] [badge][warm]` | 0,3,0 |
| `[theme="kiwipress"] [cta] :where(p, span, li, small)` | 0,2,0 |
| `[theme="kiwipress"] [wizard-header] [brand] [badge]` | 0,4,0 |
| `[theme] [badge]` | 0,2,0 |
| `[theme] [cta] [badge]` | 0,3,0 |

Outside `[cta]`, KiwiPress `[badge]` and `[badge="ribbon"]` are `(0, 2, 0)` and load after core, so they still override core `color` and `background-color`. `[warm]` is `(0, 3, 0)` and wins the same way. The wizard brand slot is `(0, 4, 0)` and wins over default, warm, ribbon, and the CTA companion when the badge sits in that slot.

`[warm]` beats ribbon for `color`, `background-color`, and `border-color`. Ribbon positioning still applies, because the warm rule does not set `position`.

Default and ribbon do not set `border-color`. They pick up the core 24% `currentColor` hairline. On a default badge that `currentColor` is `--kw-accent`. On a ribbon it is white. Warm still sets `--kw-warm-tint`. The wizard brand slot still sets `--kw-border` and replaces the hairline.

`[theme="kiwipress"] :where(button)` is `(0, 1, 0)`. `[theme] [badge]` clears its shadow. KiwiPress badge color still wins for `color` and `background-color` outside `[cta]`.

### Generated themes

`libraries/juice/src/tools/theme-generator/index.ts` still emits this for an app-owned theme. It is not in the fourteen shipped theme files.

```css
[theme="<id>"] :where([badge]) {
  background: var(--jx-accent-tint);
  color: var(--jx-accent);
}

[theme="<id>"] :where([badge][warm]) {
  background: var(--jx-warm-soft);
  color: var(--jx-warm);
}
```

`:where([badge])` adds no specificity, so each rule is only the theme attribute `(0, 1, 0)`. Core `[theme] [badge]` is `(0, 2, 0)` and wins `color` and `background-color` regardless of source order.

The generator paint does not show. The generator does not emit `--juice-badge-*`, does not paint `[badge="ribbon"]`, and does not paint the wizard brand slot.

The warm source still names `--jx-warm-soft`. KiwiPress warm still names `--kw-surface`.

Those recipes are not the same, and only the KiwiPress one still paints, because it is `(0, 3, 0)`.

## Contrast

Text versus the background the core roles actually composite. Ratios use the WCAG 2 relative-luminance formula. The fill is the 1% `currentColor` wash over the backdrop. `--juice-surface-strong-bg` is composited over the page first when it is translucent. These are the ratios recorded with the chrome. This pass does not change the CSS.

Before is body ink on a transparent chip. After is body ink on the badge fill. A Citrusmint `span` / `p` / `li` / `label` did not use body ink before the roles; that row is under the table.

For Afterburn, Arcade Glow, and Boardwalk, an older “on the surface” column used the theme surface token. This table uses `--juice-surface-strong-bg`. Those are different backdrops. The other themes’ strong plate matches the surface the older column used.

The KiwiPress row is body ink on the core wash. It is not the KiwiPress paint. Outside `[cta]`, that paint still replaces the pair. See the KiwiPress table below.

| Theme | Before page | Before strong | After page | After strong |
|---|---:|---:|---:|---:|
| Aquaflux | 10.55:1 | 10.55:1 | 10.37:1 | 10.37:1 |
| Citrusmint (body ink) | 4.62:1 | 5.17:1 | 4.56:1 | 5.10:1 |
| KiwiPress (core roles) | 7.60:1 | 7.60:1 | 7.49:1 | 7.49:1 |
| Tide | 15.66:1 | 15.66:1 | 15.31:1 | 15.31:1 |
| retro-afterburn | 14.01:1 | 9.91:1 | 13.69:1 | 9.65:1 |
| retro-arcade-glow | 16.52:1 | 11.73:1 | 16.26:1 | 11.42:1 |
| retro-boardwalk | 13.85:1 | 12.99:1 | 13.60:1 | 12.75:1 |
| retro-denim-dial | 13.95:1 | 13.95:1 | 13.70:1 | 13.70:1 |
| retro-forest-radio | 14.20:1 | 14.20:1 | 13.94:1 | 13.94:1 |
| retro-orchard-club | 14.32:1 | 14.32:1 | 14.05:1 | 14.05:1 |
| retro-poolside-pop | 15.64:1 | 15.64:1 | 15.34:1 | 15.34:1 |
| retro-signal-garden | 16.72:1 | 16.72:1 | 16.39:1 | 16.39:1 |
| retro-sunset-motel | 15.63:1 | 15.63:1 | 15.34:1 | 15.34:1 |
| retro-violet-parlor | 15.75:1 | 15.75:1 | 15.44:1 | 15.44:1 |

Citrusmint `span` / `p` / `li` / `label` before the roles used `--cm-text-muted`: **1.95:1** on the page and **2.18:1** on the strong surface. Those elements now use body ink on the fill: **4.56:1** and **5.10:1**. `[theme] [badge]` is what beats the muted copy rule.

`[badge]` text is `0.8125rem` (13px) at `font-weight: 600`. The wizard brand slot is `0.75rem` (12px) at `font-weight: 500`. WCAG large text is 18pt (24px), or 14pt (18.67px) and bold. Both slots are normal text. The bar is 4.5:1.

## KiwiPress paint

Outside `[cta]`, KiwiPress color and background are unchanged. They are `(0, 2, 0)` or higher and load after core, so they override the new color and background roles.

| Variant | Before | After, outside `[cta]` | Still overrides? |
|---|---:|---:|---|
| `[badge]`, `[badge="square"]` | 3.39:1 | 3.39:1 | Yes. `(0, 2, 0)`, later than core. |
| `[badge][warm]` | 2.14:1 | 2.14:1 | Yes. `(0, 3, 0)`. |
| `[wizard-header] [brand] [badge]` | 4.64:1 | 4.64:1 | Yes. `(0, 4, 0)`. |
| `[badge="ribbon"]` | 3.84:1 | 3.84:1 | Yes. `(0, 2, 0)`, later than core. |

Default (3.39:1), warm (2.14:1), and ribbon (3.84:1) stay under 4.5:1. The wizard brand slot stays over it, at 4.64:1.

The warm border `#fde587` on white is 1.26:1. The wizard border `#e5e7eb` on `#f9fafb` is 1.18:1. Those are borders, not the text pair. Both are under the 3:1 non-text bar if a border is the only warm or chrome cue.

`[badge][warm][badge="ribbon"]` uses the warm colors `(0, 3, 0)` and the ribbon position. That pair is the 2.14:1 warm row. Default and ribbon now also show the core hairline. Warm and the wizard brand slot keep their own border colors.

## CTA

`[theme="kiwipress"] [cta] :where(p, span, li, small)` is `(0, 2, 0)` and comes later than `[theme="kiwipress"] [badge]`, so it used to replace ink and leave the fill (1.12:1 on the default tint, 3.40:1 on the ribbon).

`[theme] [cta] [badge]` is `(0, 3, 0)`. Inside a KiwiPress `[cta]`, `currentColor` is the CTA’s white (`$white-100` on `[theme="kiwipress"] [cta]`), and the fill is a 1% white wash over the CTA gradient (`--kw-cta-background`, `$kiwi-700` to `$kiwi-800`):

- Light stop `#059467`: **3.79:1** (was 1.12:1 on the accent tint for a default badge, and 3.40:1 for a ribbon).
- Dark stop `#047756` (`hsl(163, 94%, 24%)`): **5.47:1**.

That removes the split pair. It does not clear 4.5:1 on the light stop, because the CTA’s own color is white and the gradient’s light stop is the accent green. Default and ribbon KiwiPress paint do not apply inside `[cta]`. `[badge][warm]` is `(0, 3, 0)` and loads later, so warm inside a CTA stays **2.14:1**.

The same companion beats the `[cta]` copy rules in Afterburn, Arcade Glow, and Boardwalk. Those rules are `(0, 2, 0)` and only set `color`:

- Afterburn: `[theme="retro-afterburn"] [cta] :where(p, span, li, a)`
- Arcade Glow: the same shape, with `retro-arcade-glow`
- Boardwalk: `[theme="retro-boardwalk"] [cta] :where(p, span, li, a)`

Afterburn and Arcade Glow also paint `[cta] :where(button)` at `(0, 2, 0)`. The companion beats that too, so a button badge inside those CTAs keeps the core pair.

Boardwalk’s plain CTA button is different: `[theme="retro-boardwalk"] [cta] button:not([btn])` is `(0, 3, 1)` and beats the companion. A `<button badge>` inside a Boardwalk `[cta]` that does not also carry `[btn]` keeps that button’s background, color, and `border-color`, not the core wash.

A theme-file change that would put the KiwiPress pairs back inside `[cta]` (still under 4.5:1, but the theme’s own colors) was written for `libraries/juice/src/themes/kiwipress/kiwipress.scss`, after the CTA copy rule. It was not applied. Themes are paused. The snippet is:

```scss
[theme="kiwipress"] [cta] [badge] {
    background-color: var(--kw-accent-tint);
    color: var(--kw-accent);
}

[theme="kiwipress"] [cta] [badge="ribbon"] {
    background-color: var(--kw-accent);
    color: hsl(0, 0%, 100%);
}
```

## Shapes and the pieces around a badge

The pill is the default. Square only changes the radius to `0.375rem`, the same radius `[avatar="square"]` and `[skeleton]` use.

Ribbon is absolutely positioned. `[card="pricing"]` in `card.scss` is `position: relative`, which is the containing block the pricing examples rely on (`top: -0.75rem` hangs the label above that card). Core badge CSS does not set `position: relative` on any other parent. A ribbon outside a pricing card anchors to whatever positioned ancestor it finds.

Nothing in badge, button, avatar, tabs, or list SCSS restyles a badge inside those components beyond the focus outline above. A badge in `[list-trailing]` is an ordinary flex child. The list does not size it. An `[avatar]` status dot is the avatar’s `::after`, not a badge.

### Still open: hero, card, and panel

Hero, card, and panel copy rules in Afterburn, Arcade Glow, and Boardwalk are `(0, 2, 0)` and only set `color`. They tie `[theme] [badge]`.

When the theme file loads after core, they replace badge ink and leave the core fill. The selectors look like `[theme="retro-afterburn"] [hero] :where(p, span, li)` and the matching `[card]` and `[panel]` rules (the same shape in Arcade Glow and Boardwalk, including the `afb-hero` / `acg-hero` / `bdw-hero` aliases).

A hero link rule (`:where(a)`) and a hero `small` / `figcaption` rule sit at the same specificity and do this to an `<a badge>` or a `<small badge>`.

Beating them from core would take a context selector at `(0, 3, 0)` for each of those attributes, which would also cover KiwiPress badges inside cards and heroes. This chrome only adds the `[cta]` companion.

Footer copy is not in that set. Boardwalk’s footer text rule is `[theme="retro-boardwalk"] :where(footer) :where(p, span, li, label, dt, dd, blockquote)`.

`:where(footer)` adds nothing, so the rule is `(0, 1, 0)` and loses to `[theme] [badge]`. The nested footer card rule is inside `:where()` as well and is also `(0, 1, 0)`.

Afterburn, Arcade Glow, and KiwiPress paint the `<footer>` element with `:where(footer)` at `(0, 1, 0)`. They do not have a `(0, 2, 0)` footer copy rule for `p` or `span`.

There is no `[footer]` attribute in the theme files. Footer copy does not replace badge ink.

## Accessibility

A badge is static text unless the author puts it on a link or a button. Chrome does not set `role`, `aria-label`, or a live region.

The visible words are the accessible name when the badge is a `span` with text. A count or a status needs words that make sense alone, or a name on the parent. “3” is weaker than “3 unread” or a visually hidden phrase next to the numeral. An `aria-label` on the parent can carry the context when the badge is only the count.

Do not use color as the only signal. `[warm]` versus the default pill is a color change. KiwiPress default, warm, and ribbon are also under 4.5:1, so the color difference is hard to see and the text is hard to read. Put the meaning in the words.

There is no dot shape in this CSS. An empty `[badge]` is padding with no text. A decorative dot still needs a text equivalent on the parent, the same way an avatar status dot does. Do not ship an empty badge as the only status.

A `span` badge is not a control. It has no `:focus-visible` ring, no hover fill, and no disabled style. Do not put the only action on that span. An `a` or `button` badge takes the 2px `currentColor` outline, offset 2px, and loses the theme button shadow. That control still needs its own name. The outline does not add a hover fill.

`[badge="ribbon"]` is removed from flow. The words are still in the accessibility tree, in DOM order, which may be before the plan name they decorate.

## Philosophy badge

`[philosophy-badge]` is not `[badge]`. `how-it-works.scss` draws a `4rem` square, radius `0.875rem`, `font-size: 1.125rem` (18px), `font-weight: 700`, and `color: #ffffff`. KiwiPress sets the fill:

| Value | Background | Text on fill | 4.5:1 |
|---|---|---|---|
| `philosophy-badge="content"` | `--kw-tier-content` `#1c46b0` (`$cornflower-700`) | `#ffffff` | 8.24:1, clears |
| `philosophy-badge="application"` | `--kw-tier-application` `#059467` | `#ffffff` | 3.84:1, under |
| `philosophy-badge="runtime"` | `--kw-tier-runtime` `#f59f0a` | `#ffffff` | 2.14:1, under |

18px at weight 700 is 13.5pt. The large-text bold line is 14pt, so the bar stays 4.5:1. The white is hardcoded in the component file, not a token. The core badge roles do not paint this attribute.

## Limitations

- CSS-only. No `Badge()` factory, no `createBadge`, and no auto-enhance. The JS entry does not boot a badge runtime. There is no `juice:change` and no `getState()`. `@citrusworx/sigjs/juice` `bind()` does not accept `[badge]`.
- Emerging, not Stable. The base layout shipped in `@citrusworx/juiceui@0.9.2`. The `--juice-badge-*` roles, the `[theme] [badge]` ink, the `[cta]` companion, and the focus outline shipped in 0.9.3. The thirty-two Emerging runtimes stay thirty-two.
- Shipped themes are not required to bind `--juice-badge-*`. Bundled theme CSS does not contain those names.
- No `[scale]`. The only size step is `[wizard-header] [brand] [badge]`, which overrides the layout roles for that slot.
- Values other than `square` and `ribbon` are the pill. There is no dot, count, or tone value. `[warm]` is a separate boolean. Core does not paint it.
- KiwiPress default (3.39:1), warm (2.14:1), and ribbon (3.84:1) stay under 4.5:1 outside `[cta]`. The wizard brand slot stays at 4.64:1. Default and ribbon pick up the core hairline. Warm and the wizard slot keep their own borders.
- Inside a KiwiPress `[cta]`, core roles replace default and ribbon paint. The light stop is 3.79:1 and the dark stop is 5.47:1. Warm inside that CTA stays 2.14:1. The KiwiPress `[cta]` snippet that would restore the theme pairs was not applied.
- A Boardwalk `[cta] button:not([btn])` is `(0, 3, 1)` and beats the CTA companion.
- Hero, card, and panel copy rules in Afterburn, Arcade Glow, and Boardwalk are `(0, 2, 0)` and can replace badge ink over the core fill. Footer copy rules are `(0, 1, 0)` and do not.
- The generator’s `:where([badge])` and `:where([badge][warm])` rules are `(0, 1, 0)` and lose to core. It does not paint ribbon.
- Ribbon position is absolute. Only `[card="pricing"]` is positioned for it. Other parents are not.
- `[dev-hero-header] > [badge]` switches the badge to `inline-block`, which drops the flex `gap`.
- A `span` badge has no focus ring, no hover fill, and no disabled style. An `a` or `button` badge has the 2px `currentColor` outline and loses the theme button shadow. There is no `--juice-badge-focus-ring` and no z-index. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- `[philosophy-badge="application"]` and `[philosophy-badge="runtime"]` are under 4.5:1. They are not `[badge]`.

## Where this sits

Cards, stats, skeleton, list, and safe area are the other CSS-only structural hooks. Badge is the label.

Skeleton holds a loading shape. List holds rows, and a badge can sit in `[list-trailing]` without a special rule.

Safe area only pads. Avatar is a face, not this pill.

See [Cards](./juice-cards.md) [Skeleton](./juice-skeleton.md)

[List](./juice-list.md) [Safe Area](./juice-safe-area.md)

[Avatar](./juice-avatar.md) [Styles](./juice-styles.md)

[Attributes](./juice-attributes.md) and the [maturity matrix](./juice-maturity-matrix.md).
