# Juice Badge

This document explains the current badge chrome in `libraries/juice/src/components/badge/badge.scss` (monorepo path; outside this vault). Related layout lives in `developers/developers.scss` and `wizard/wizard.scss`. The only shipped theme that paints `[badge]` is `libraries/juice/src/themes/kiwipress/kiwipress.scss`.

Badge is CSS-only. Importing the core stylesheet is enough for the shape. There is no JS entry, no `createBadge`, no auto-enhance, and no `Badge()` Sig factory. Markup is the contract.

This surface is Emerging, not Stable. The layout, and the KiwiPress paint, shipped in the published `@citrusworx/juiceui@0.9.2` npm cut. It is not one of the twenty-eight Emerging auto-enhance runtimes. That count stays twenty-eight. There is no `juice:change`, no `getState()`, and `@citrusworx/sigjs/juice` `bind()` does not accept it. There is no runtime to infer and no `JuiceRuntimeName` for it.

How the shipped cut was checked: `npm view @citrusworx/juiceui@0.9.2` reports `gitHead` `03cf749c8e8ddc740e7613f398840864bc5ba827` (published 2026-10-14). That commit contains `badge.scss` and the compiled `[badge]`, `[badge=square]`, `[badge=ribbon]`, `[dev-hero-header] > [badge]`, and `[wizard-header] [brand] [badge]` rules in `dist/index.css`. `git diff` of `badge.scss` from that commit to HEAD is empty. The same commit’s KiwiPress file and the theme-generator badge block are unchanged through HEAD. The published tarball `juiceui-0.9.2.tgz` contains those core rules and the four KiwiPress `[badge]` rules in `dist/themes/kiwipress.css`. This is the opposite of skeleton and list, which were added after 0.9.2.

`dist/index.css` matches `badge.scss`. The compiler drops quotes on attribute values (`[badge=square]`, `[badge=ribbon]`). The declarations are the same.

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

`[warm]` is a separate boolean. Core CSS does not paint it. KiwiPress does, and the theme generator does for app-owned themes. See [Attributes](./juice-attributes.md).

| Attribute | What it does |
|---|---|
| `[badge]` | Pill. `inline-flex`, centered, `gap: 0.375rem`, padding `0.375rem 0.75rem`, radius `999px`, `font-size: 0.8125rem` (13px at a 16px root), `font-weight: 600`, `line-height: 1`, `border: 1px solid transparent`, `box-sizing: border-box`. |
| `[badge="square"]` | Same pill, with `border-radius: 0.375rem`. |
| `[badge="ribbon"]` | `position: absolute`, `top: -0.75rem`, `left: 50%`, `transform: translateX(-50%)`. Radius stays the pill unless `square` is also set. |
| `[warm]` | No core geometry. Color only, and only where a theme paints `[badge][warm]`. |

Any other value, including `badge="dot"` or `badge="lg"`, is the pill. Only `square` and `ribbon` change geometry. There is no `[scale]`, no size token, and no count, tone, or dot variant.

`square` and `ribbon` compose. Square sets the radius. Ribbon sets the position. KiwiPress ribbon colors still apply to `[badge="ribbon"]`. `[warm]` on a ribbon is a specificity question, covered under KiwiPress.

Core CSS does not give `[badge]` a z-index. A ribbon is taken out of flow and paints in document order. It is not `z-index: 10` or `1000`. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).

## Roles

There are no `--juice-badge-*` roles. Nothing in core sets badge color or background on `:root` or on `[theme]`. Geometry is literal in `badge.scss`. It is not a custom property.

Shipped library themes are not required to bind a badge role, because the contract does not list one. Thirteen of the fourteen shipped themes do not paint `[badge]` at all. The chip stays transparent and the text is inherited, except where that theme’s copy rule sets `color` on `span`, `p`, `li`, or `label`.

### KiwiPress

Paint is on `[theme="kiwipress"]`, in `kiwipress.scss`. The tokens below are custom properties on that same `[theme="kiwipress"]` block. They are not on `:root`. The Sass sources are the color token files under `libraries/juice/src/tokens/color/`. The numbers are the compiled values in `dist/themes/kiwipress.css`.

| Rule | Text | Background | Tokens |
|---|---|---|---|
| `[badge]`, and `[badge="square"]` | `--kw-accent` | `--kw-accent-tint` | `$kiwi-700` → `hsl(161, 94%, 30%)` `#059467`. `$kiwi-200` → `hsl(149, 80%, 90%)` `#d1fae5`. |
| `[badge][warm]` | `--kw-warm` | `--kw-surface` | `$marmalade-600` → `hsl(38, 92%, 50%)` `#f59f0a`. `$white-100` → `hsl(0, 0%, 100%)` `#ffffff`. Border is `--kw-warm-tint` (`$marmalade-300` → `hsl(48, 96%, 76%)` `#fde587`). |
| `[badge="ribbon"]` | `$white-100` | `--kw-accent` | White is a literal in the rule, compiled to `hsl(0, 0%, 100%)`. Background is the same kiwi-700 as the default text. |
| `[wizard-header] [brand] [badge]` | `--kw-text-muted` | `--kw-surface-muted` | `$slate-600` → `hsl(220, 9%, 46%)` `#6b7280`. `$slate-100` → `hsl(210, 20%, 98%)` `#f9fafb`. Border is `--kw-border` (`$slate-300` → `hsl(220, 13%, 91%)` `#e5e7eb`). |

Specificity, from the KiwiPress file:

| Selector | Specificity |
|---|---|
| `[theme="kiwipress"] [badge]` | 0,2,0 |
| `[theme="kiwipress"] [badge="ribbon"]` | 0,2,0 |
| `[theme="kiwipress"] [badge][warm]` | 0,3,0 |
| `[theme="kiwipress"] [wizard-header] [brand] [badge]` | 0,4,0 |

`[warm]` beats ribbon for `color`, `background-color`, and `border-color`. Ribbon positioning still applies, because the warm rule does not set `position`. The wizard brand rule beats default, warm, and ribbon when the badge sits in that slot.

`[theme="kiwipress"] :where(p, span, li, label, dt, dd, blockquote)` sets `color: var(--kw-text)` at 0,1,0. The badge rules win, so a span badge keeps the badge ink. That copy rule also sets `line-height: 1.6`, which ties `[badge]`’s `line-height: 1` (both 0,1,0). Afterburn, Arcade Glow, and Boardwalk set the same `line-height: 1.6` on their copy rule. If the theme file loads after core, a `span` / `p` / `li` / `label` badge in those four themes uses 1.6.

`[theme="kiwipress"] [cta] :where(p, span, li, small)` sets `color` to `rgba($white-100, 0.9)` at 0,2,0, and it comes later in the file than the badge rules. On a `span`, `p`, `li`, or `small` inside `[cta]`, that rule replaces the default badge ink and the ribbon ink. It does not replace the background. `[warm]` stays at 0,3,0, so a warm badge inside a CTA keeps `--kw-warm`. The wizard brand rule stays at 0,4,0.

### Generated themes

`libraries/juice/src/tools/theme-generator/index.ts` emits this for an app-owned theme. It is not in the fourteen shipped theme files, so this pass does not invent `--jx-*` ratios.

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

`:where([badge])` adds no specificity, so each rule is only the theme attribute (0,1,0). The generator writes these after its `span` copy rule, so the badge ink wins over that copy rule inside a generated theme. The generator does not paint `[badge="ribbon"]` and does not paint the wizard brand slot. Warm uses `--jx-warm-soft` as the fill. KiwiPress warm uses `--kw-surface` instead, with `--kw-warm-tint` on the border. Those two warms are not the same recipe.

## Shapes and the pieces around a badge

The pill is the default. Square only changes the radius to `0.375rem`, the same radius `[avatar="square"]` and `[skeleton]` use.

Ribbon is absolutely positioned. `[card="pricing"]` in `card.scss` is `position: relative`, which is the containing block the pricing examples rely on (`top: -0.75rem` hangs the label above that card). Core badge CSS does not set `position: relative` on any other parent. A ribbon outside a pricing card anchors to whatever positioned ancestor it finds.

`[dev-hero-header] > [badge]` in `developers.scss` sets `display: inline-block` and `margin-bottom: 1.5rem`. The direct child stops being a flex box, so the pill’s `gap` no longer applies between its children.

`[wizard-header] [brand] [badge]` in `wizard.scss` tightens the box: `font-size: 0.75rem` (12px), padding `0.25rem 0.625rem`, radius `0.375rem`, `font-weight: 500`, `line-height: 1.4`. That radius applies even when the attribute is boolean `[badge]`, not `badge="square"`. KiwiPress then paints the muted pair above. `[wizard-header]` itself is `z-index: 50`. The badge does not add a band of its own.

Nothing in badge, button, avatar, tabs, or list SCSS restyles a badge inside those components. A badge in `[list-trailing]` is an ordinary flex child. The list does not size it. An `[avatar]` status dot is the avatar’s `::after`, not a badge. Putting `[badge]` on a `button` does not add a badge focus ring. Under KiwiPress, `[theme="kiwipress"] [badge]` (0,2,0) beats `:where(button)` (0,1,0) for background and color, and the button’s `:focus-visible` shadow can still show because badge CSS does not clear it.

## Contrast

Text versus the background the CSS actually sets. Ratios use the WCAG 2 relative-luminance formula on sRGB. Colors are the compiled custom properties in `dist/themes/<id>.css`, after Sass resolved the token files. A translucent surface is composited over that theme’s page color. The root font size used for the size check is 16px.

`[badge]` text is `0.8125rem` (13px) at `font-weight: 600`. The wizard brand slot is `0.75rem` (12px) at `font-weight: 500`. WCAG large text is 18pt (24px), or 14pt (18.67px) and bold. Both slots are normal text. The bar is 4.5:1. This pass does not change the CSS.

### KiwiPress, where the theme sets both colors

| Variant | Text | Background | Ratio | 4.5:1 |
|---|---|---|---|---|
| `[badge]`, `[badge="square"]` | `#059467` `--kw-accent` | `#d1fae5` `--kw-accent-tint` | 3.39:1 | under |
| `[badge][warm]` | `#f59f0a` `--kw-warm` | `#ffffff` `--kw-surface` | 2.14:1 | under |
| `[badge="ribbon"]` | `#ffffff` `$white-100` | `#059467` `--kw-accent` | 3.84:1 | under |
| `[wizard-header] [brand] [badge]` | `#6b7280` `--kw-text-muted` | `#f9fafb` `--kw-surface-muted` | 4.64:1 | clears |
| `span`/`p`/`li`/`small` `[badge]` inside `[cta]` | `rgba(255, 255, 255, 0.9)` | `#d1fae5` accent-tint (background not overridden) | 1.12:1 | under |
| `span`/`p`/`li`/`small` `[badge="ribbon"]` inside `[cta]` | `rgba(255, 255, 255, 0.9)` | `#059467` accent | 3.40:1 | under |

`[warm]` inside a CTA keeps 2.14:1, because the warm rule wins. The warm border `#fde587` on white is 1.26:1. The wizard border `#e5e7eb` on `#f9fafb` is 1.18:1. Those are borders, not the text pair. Both are under the 3:1 non-text bar if a border is the only warm or chrome cue.

`[badge][warm][badge="ribbon"]` uses the warm colors (0,3,0) and the ribbon position. That pair is the 2.14:1 warm row.

### The other thirteen shipped themes

These themes do not set badge `color` or `background`. Square, ribbon, and `[warm]` do not change the pair. The background is transparent, so the ratio is the text against the surface showing through.

For a `span`, `p`, `li`, or `label`, the theme’s copy rule sets the color. On Aquaflux, Tide, and every retro theme, that color is the body text token. On Citrusmint it is `--cm-text-muted`, not `--cm-text`. A `div` or other element skips that copy rule and inherits the theme root’s text color.

| Theme | Text | On the page | On the surface | 4.5:1 |
|---|---|---|---|---|
| Aquaflux | `--aqua-text` `#0d4073` | 10.55:1 on `#ffffff` | 10.55:1 (surface is white at 78% over the white page) | clears |
| Citrusmint `span` / `p` / `li` / `label` | `--cm-text-muted` `#00cc03` | 1.95:1 on `#ccffcd` | 2.18:1 on `#ffffff` | under |
| Citrusmint other elements | `--cm-text` `#008002` | 4.62:1 on `#ccffcd` | 5.17:1 on `#ffffff` | clears |
| Tide | `--tide-text` `#f2f2f2` | 15.66:1 on `#1a1a1a` | 15.66:1 (surface is black at 62% over the page) | clears |
| retro-afterburn | `--afb-text` `#e8eaef` | 14.01:1 on `#1a1d24` | 10.81:1 on `#293141` | clears |
| retro-arcade-glow | `--acg-text` `#f3e9ff` | 16.52:1 on `#14081f` | 13.95:1 on `#2a1249` | clears |
| retro-boardwalk | `--bdw-text` `#1e2a36` | 13.85:1 on `#fff8f0` | 12.13:1 on `#ddeee5` | clears |
| retro-denim-dial | `--dnd-text` `#1a2430` | 13.95:1 on `#eef2f7` | 13.95:1 (surface is the page color at 78% over the page) | clears |
| retro-forest-radio | `--frr-text` `#1a2418` | 14.20:1 on `#f4f1e8` | 14.20:1, same composite | clears |
| retro-orchard-club | `--orc-text` `#1f2418` | 14.32:1 on `#f3f4eb` | 14.32:1, same composite | clears |
| retro-poolside-pop | `--psp-text` `#2a1a12` | 15.64:1 on `#fff6ea` | 15.64:1, same composite | clears |
| retro-signal-garden | `--sgn-text` `#141414` | 16.72:1 on `#f7f4e8` | 16.72:1, same composite | clears |
| retro-sunset-motel | `--ssm-text` `#2a1c16` | 15.63:1 on `#fff8f1` | 15.63:1, same composite | clears |
| retro-violet-parlor | `--vpr-text` `#1c1428` | 15.75:1 on `#f7f0e8` | 15.75:1, same composite | clears |

Hero, CTA, footer, and named-card copy rules in several themes set a different `color` on `span`. The badge still has no fill there, so the ratio becomes that ink on whatever is behind the badge. Those nests are not in the table. The KiwiPress CTA rows above are the case where a later rule replaces a color the badge itself set.

## Accessibility

A badge is static text. Chrome does not set `role`, `aria-label`, or a live region.

The visible words are the accessible name when the badge is a `span` with text. A count or a status needs words that make sense alone, or a name on the parent. “3” is weaker than “3 unread” or a visually hidden phrase next to the numeral. An `aria-label` on the parent can carry the context when the badge is only the count.

Do not use color as the only signal. `[warm]` versus the default pill is a color change. KiwiPress default, warm, and ribbon are also under 4.5:1, so the color difference is hard to see and the text is hard to read. Put the meaning in the words.

There is no dot shape in this CSS. An empty `[badge]` is padding with no text. A decorative dot still needs a text equivalent on the parent, the same way an avatar status dot does. Do not ship an empty badge as the only status.

A badge is not a control. There is no `:focus-visible` ring, no hover fill, and no disabled style. Do not put the only action on the badge. If the badge sits on a button or a link, that control keeps its own name and focus treatment.

`[badge="ribbon"]` is removed from flow. The words are still in the accessibility tree, in DOM order, which may be before the plan name they decorate.

## Philosophy badge

`[philosophy-badge]` is not `[badge]`. `how-it-works.scss` draws a `4rem` square, radius `0.875rem`, `font-size: 1.125rem` (18px), `font-weight: 700`, and `color: #ffffff`. KiwiPress sets the fill:

| Value | Background | Text on fill | 4.5:1 |
|---|---|---|---|
| `philosophy-badge="content"` | `--kw-tier-content` `#1c46b0` (`$cornflower-700`) | `#ffffff` | 8.24:1, clears |
| `philosophy-badge="application"` | `--kw-tier-application` `#059467` | `#ffffff` | 3.84:1, under |
| `philosophy-badge="runtime"` | `--kw-tier-runtime` `#f59f0a` | `#ffffff` | 2.14:1, under |

18px at weight 700 is 13.5pt. The large-text bold line is 14pt, so the bar stays 4.5:1. The white is hardcoded in the component file, not a token.

## Limitations

- CSS-only. No `Badge()` factory, no `createBadge`, and no auto-enhance. The JS entry does not boot a badge runtime. There is no `juice:change` and no `getState()`. `@citrusworx/sigjs/juice` `bind()` does not accept `[badge]`.
- Emerging, not Stable. The layout and the KiwiPress paint shipped in `@citrusworx/juiceui@0.9.2`. The twenty-eight Emerging auto-enhance runtimes stay twenty-eight.
- No `--juice-badge-*` roles, on `:root` or on `[theme]`. Thirteen shipped themes do not paint `[badge]`.
- No `[scale]`. The only size step is `[wizard-header] [brand] [badge]`.
- Values other than `square` and `ribbon` are the pill. There is no dot, count, or tone value. `[warm]` is a separate boolean, painted by KiwiPress and by the generator, not by core.
- KiwiPress default (3.39:1), warm (2.14:1), and ribbon (3.84:1) are under 4.5:1. A span badge inside a KiwiPress CTA drops to 1.12:1 on the default fill. The wizard brand slot clears, at 4.64:1.
- A Citrusmint `span`, `p`, `li`, or `label` badge uses `--cm-text-muted` on a transparent chip: 1.95:1 on the page and 2.18:1 on the white surface.
- Ribbon position is absolute. Only `[card="pricing"]` is positioned for it. Other parents are not.
- `[dev-hero-header] > [badge]` switches the badge to `inline-block`, which drops the flex `gap`.
- KiwiPress, Afterburn, Arcade Glow, and Boardwalk copy rules set `line-height: 1.6` at the same specificity as the badge’s `line-height: 1`.
- The generator’s warm fill is `--jx-warm-soft`. KiwiPress warm fill is `--kw-surface`. The generator does not paint ribbon.
- There is no focus ring, no hover, and no disabled style. There is no z-index. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- `[philosophy-badge="application"]` and `[philosophy-badge="runtime"]` are under 4.5:1. They are not `[badge]`.

## Where this sits

Cards, stats, skeleton, and list are the other CSS-only structural hooks. Badge is the label. Skeleton holds a loading shape. List holds rows, and a badge can sit in `[list-trailing]` without a special rule. Avatar is a face, not this pill. See [Cards](./juice-cards.md), [Skeleton](./juice-skeleton.md), [List](./juice-list.md), [Avatar](./juice-avatar.md), [Styles](./juice-styles.md), [Attributes](./juice-attributes.md), and the [maturity matrix](./juice-maturity-matrix.md).
