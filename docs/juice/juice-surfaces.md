# Juice surfaces (Beta)

Surfaces describe **how a region looks** without replacing structural attributes (`card`, `hero`, etc.). Themes still own brand-specific painting of those structures.

## Beta-stable: `surfaceTone`

Implemented in `libraries/juice/src/styles/surface/surface.scss`. Core CSS consumes shared `--juice-surface-<tone>-*` roles with light fallbacks, so unthemed markup keeps the original frost. Themes bind those roles from existing surface/page tokens. Selectors include `[theme] [surfaceTone]` so the attribute wins over theme semantic defaults on `section` / `article` / `aside`.

Shipped values:

| Value | Intent |
|-------|--------|
| `soft` | Frosted / translucent panel |
| `strong` | More opaque, elevated solid panel |
| `muted` | Quieter recessed wash (no elevation) |

`muted` ships because every library theme already has a recessed surface token (`--*-surface-muted`) that stays distinct from frost and elevation.

```html
<section
  bgColor="white-100"
  rounded="xl"
  padding="1rem"
  shadow
  depth="xs"
  surfaceTone="soft"
>
  …
</section>
```

```html
<article card="feature" surfaceTone="strong">…</article>
<aside surfaceTone="muted">…</aside>
```

Combine with layout attributes (`stack`, `gap`, `padding`) and optional `theme="..."` on an ancestor.

## Beta-stable: `borderStrength`

Composable border weight / contrast. Soft is a 1px hairline; bold is a 2px heavier rule. Themes bind `--juice-border-strength-<soft|bold>-width|color` from existing `--*-border` / `--*-border-strong` tokens so dark themes (Tide) keep their lagoon line instead of the unthemed light gray.

| Value | Intent |
|-------|--------|
| `soft` | Lighter hairline (1px, `--*-border`) |
| `bold` | Heavier contrast (2px, `--*-border-strong`) |

Standalone `borderStrength` sets `border-width`, `border-style: solid`, and a themeable color. It does **not** replace the `borderColor="…"` swatch system — those utilities still win on `border-color` when both are present.

### Compose with `surfaceTone`

When both attributes are set, `borderStrength` refines **width only**. The tone keeps its background, shadow, blur, and themed border color.

```html
<article card="feature" surfaceTone="soft" borderStrength="bold">…</article>
<aside surfaceTone="muted" borderStrength="soft">…</aside>
```

```html
<!-- Optional swatch still paints the line; strength only changes weight. -->
<section surfaceTone="strong" borderStrength="bold" borderColor="blue-400">…</section>
```

```html
<!-- Standalone: themeable hairline / heavy rule, no surfaceTone required. -->
<div rounded="lg" padding="1rem" borderStrength="soft">…</div>
```

Core selectors include `[theme] [borderStrength]` (same specificity pattern as tones) and `[surfaceTone][borderStrength]` so the compose rule cannot wipe tone paint.

## Beta-stable: `blur`

Composable backdrop-filter length. Standalone — no `surfaceTone` required. `sm` is `6px`; `md` is `16px`. Those sit off the typical unthemed soft-tone default (`10px`) so the utilities read as a lighter frost and a heavier frost, not a restatement of `surfaceTone="soft"`.

Optional `--juice-blur-sm` / `--juice-blur-md` restyles exist with those fallbacks. Themes do **not** bind a second blur scale; tone frost stays on `--juice-surface-<tone>-blur` (soft is `10px` unthemed / Kiwi / Citrusmint, `14px` Aquaflux, `16px` Tide).

| Value | Length | Intent |
|-------|--------|--------|
| `sm` | `6px` | Lighter frost than every shipped soft-tone default |
| `md` | `16px` | Heavier frost than the typical `10px` soft default |

### Compose with `surfaceTone`

When both attributes are set, explicit `blur` overrides **backdrop-filter length only**. The tone keeps its background, border, and shadow. Author intent wins: `surfaceTone="soft" blur="sm"` is the tone's fill with a `6px` frost, not the tone's `10px` / `14px` / `16px` role.

```html
<!-- Standalone: blur the element, no tone required. -->
<div rounded="lg" padding="1rem" blur="sm">…</div>
<section hero blur="md">…</section>
```

```html
<!-- Explicit blur wins the length; tone paint stays. -->
<article card="feature" surfaceTone="soft" blur="sm">…</article>
<aside surfaceTone="muted" blur="md">…</aside>
```

```html
<!-- A–C together: tone fill, strength width, explicit frost. -->
<section surfaceTone="soft" borderStrength="bold" blur="md">…</section>
```

Core selectors include `[theme] [blur]` (same specificity pattern as tones) and `[surfaceTone][blur]` so the compose rule cannot wipe tone paint.

This finishes the approved A→B→C surface utility pass (`surfaceTone`, `borderStrength`, standalone `blur`).

## Beta-stable: `shadowTone`

Composable shadow cast temperature. Standalone — no `surfaceTone` required. `cool` is a bluish drop; `warm` is amber-ish. Themes bind `--juice-shadow-tone-<cool|warm>-color|shadow` from existing tokens so dark themes (Tide) keep a lagoon / ink cast instead of the unthemed light-theme drop.

| Value | Intent |
|-------|--------|
| `cool` | Cooler / bluish shadow cast |
| `warm` | Warmer / amber-ish shadow cast |

Standalone `shadowTone` sets `--shadow-color` and a themeable `box-shadow`. It does **not** replace the `shadow="…"` swatch + `depth` geometry system — those utilities still own offset / blur when `[shadow][depth]` is present. `shadowTone` then supplies only the cast color.

### Compose with `surfaceTone`

When both attributes are set, `shadowTone` paints **shadow cast only**. The tone keeps its background, border, and blur.

```html
<article card="feature" surfaceTone="soft" shadowTone="cool">…</article>
<aside surfaceTone="strong" shadowTone="warm">…</aside>
```

```html
<!-- Existing shadow / depth geometry; shadowTone supplies temperature. -->
<section shadow depth="md" shadowTone="cool">…</section>
```

```html
<!-- Standalone: themeable cool / warm drop, no surfaceTone required. -->
<div rounded="lg" padding="1rem" shadowTone="warm">…</div>
```

```html
<!-- A–C plus depth slice A: tone fill, strength width, explicit frost, cool cast. -->
<section surfaceTone="soft" borderStrength="bold" blur="md" shadowTone="cool">…</section>
```

Core selectors include `[theme] [shadowTone]` (same specificity pattern as tones) and `[surfaceTone][shadowTone]` so the compose rule cannot wipe tone paint. Standalone box-shadow is gated with `:not([depth])` so `[shadow][depth]` geometry wins.

## Beta-stable: `overlay`

Composable frost / tint wash. Standalone — no `surfaceTone` required. `frost` is a translucent frosted veil; `tint` is a subtler theme-colored wash. Themes bind `--juice-overlay-<frost|tint>-wash|layer` from existing tokens so dark themes (Tide) keep a near-black / lagoon veil instead of the unthemed white frost.

| Value | Intent |
|-------|--------|
| `frost` | Translucent frosted wash / veil |
| `tint` | Subtle colored wash (theme-tinted) |

Standalone `overlay` paints via `background-image` (a `linear-gradient` of the wash). It does **not** replace `bgColor="…"` or a tone's `--juice-surface-*-bg` — those still own `background-color`. Overlay is the wash layer only.

### Compose with `surfaceTone`

When both attributes are set, `overlay` adjusts **wash only**. The tone keeps its background, border, shadow, and blur.

```html
<article card="feature" surfaceTone="soft" overlay="frost">…</article>
<aside surfaceTone="muted" overlay="tint">…</aside>
```

```html
<!-- Swatch fill stays; overlay is the veil on top. -->
<section bgColor="white-100" rounded="xl" overlay="frost">…</section>
```

```html
<!-- Standalone: themeable frost / tint veil, no surfaceTone required. -->
<div rounded="lg" padding="1rem" overlay="tint">…</div>
```

```html
<!-- A–C plus depth slices A+B: tone fill, strength width, explicit frost, cool cast, tint wash. -->
<section surfaceTone="soft" borderStrength="bold" blur="md" shadowTone="cool" overlay="tint">…</section>
```

Core selectors include `[theme] [overlay]` (same specificity pattern as tones) and `[surfaceTone][overlay]` so the compose rule cannot wipe tone paint.

## Beta-stable: `variant`

Composable surface-depth recipes. Standalone — no `surfaceTone` required. Recipes wire **existing** overlay / blur / border / shadow roles instead of a new `--juice-variant-*` bind family. Themes already paint those roles, so Tide stays a dark frost / lagoon chrome, not a white glass.

| Value | Intent | Existing roles |
|-------|--------|----------------|
| `monochromatic` | Restrained neutral chrome | `--juice-border-strength-soft-*` hairline + `--juice-surface-soft-shadow` |
| `glass` | Frosted translucent recipe | `--juice-overlay-frost-*` wash + `--juice-surface-soft-blur` |
| `tinted` | Theme-tinted wash recipe | `--juice-overlay-tint-*` wash |

`glass` and `tinted` paint via `background-image` (same as `overlay`). `monochromatic` uses border longhands and a restrained drop. None of the recipes set `background-color`, so `surfaceTone` fill and `bgColor` swatches stay.

### Compose with finer attributes

When both a recipe and a finer attr are set, the finer attr wins **its property**. The recipe keeps the rest.

| Finer attr | Wins |
|------------|------|
| `overlay` | wash / `background-image` |
| `blur` | backdrop-filter length |
| `borderStrength` | border width (and standalone color) |
| `shadowTone` | shadow cast (`:not([depth])` still leaves geometry to `depth`) |

```html
<article card="feature" variant="glass">…</article>
<aside variant="tinted">…</aside>
<section rounded="lg" padding="1rem" variant="monochromatic">…</section>
```

```html
<!-- Tone fill stays; glass adds frost wash + soft-tone frost length. -->
<article card="feature" surfaceTone="soft" variant="glass">…</article>
```

```html
<!-- Finer attrs win their property: tint wash, 6px frost, bold rule, cool cast. -->
<section
  surfaceTone="soft"
  variant="glass"
  overlay="tint"
  blur="sm"
  borderStrength="bold"
  shadowTone="cool"
>
  …
</section>
```

```html
<!-- A–C plus depth slices A–C: tone fill, strength width, explicit frost, cool cast, tint wash, glass recipe. -->
<section surfaceTone="soft" borderStrength="bold" blur="md" shadowTone="cool" overlay="tint" variant="glass">…</section>
```

Core selectors include `[theme] [variant]` (same specificity pattern as tones) and `[surfaceTone][variant]` so the recipe cannot wipe tone paint. `:not([overlay])` / `:not([blur])` / `:not([borderStrength])` / `:not([shadowTone])` gates keep finer attrs in charge of their property.

This finishes remaining surface-depth slice C. Structural `card="…"` recipes stay a later cross-link — see [Cards](./juice-cards.md).

## Theme role contract

Required-versus-optional names for every shipped theme live in the [Theme Contract](./juice-theme-contract.md). Surface-specific roles:

Set these on `[theme="..."]`. Each tone uses the same four roles:

| Role | Used as |
|------|---------|
| `--juice-surface-<tone>-bg` | `background-color` |
| `--juice-surface-<tone>-border` | `1px solid` color |
| `--juice-surface-<tone>-shadow` | `box-shadow` |
| `--juice-surface-<tone>-blur` | `backdrop-filter: blur(...)` length |

`<tone>` is `soft`, `strong`, or `muted`.

Border strength roles:

| Role | Used as |
|------|---------|
| `--juice-border-strength-soft-width` | `border-width` (default `1px`) |
| `--juice-border-strength-soft-color` | standalone `border-color` |
| `--juice-border-strength-bold-width` | `border-width` (default `2px`) |
| `--juice-border-strength-bold-color` | standalone `border-color` |

Standalone color is applied only when the element has neither `surfaceTone` nor `borderColor`, so a tone's `--juice-surface-*-border` and the swatch system stay intact.

Shadow tone roles:

| Role | Used as |
|------|---------|
| `--juice-shadow-tone-cool-color` | `--shadow-color` for `shadow` / `depth` |
| `--juice-shadow-tone-cool-shadow` | standalone / `surfaceTone` `box-shadow` |
| `--juice-shadow-tone-warm-color` | `--shadow-color` for `shadow` / `depth` |
| `--juice-shadow-tone-warm-shadow` | standalone / `surfaceTone` `box-shadow` |

Overlay roles:

| Role | Used as |
|------|---------|
| `--juice-overlay-frost-wash` | frost pigment (themes mix this into `-layer`) |
| `--juice-overlay-frost-layer` | standalone / `surfaceTone` `background-image` |
| `--juice-overlay-tint-wash` | tint pigment (themes mix this into `-layer`) |
| `--juice-overlay-tint-layer` | standalone / `surfaceTone` `background-image` |

Unthemed fallbacks (no theme binding):

- **soft tone** — near-white frost (`rgba(white-100, 0.88)`), gray border, soft shadow, `10px` blur
- **strong tone** — near-opaque white, stronger gray border and elevation, `0px` blur
- **muted tone** — `gray-100` wash, quieter border, no shadow, `0px` blur
- **soft strength** — `1px` + `rgba(gray-300, 0.45)`
- **bold strength** — `2px` + `rgba(gray-400, 0.9)`
- **blur sm / md** — `6px` / `16px` (optional `--juice-blur-*` restyles; not theme-bound)
- **cool shadow tone** — `rgba(blue-900, 0.28)` drop
- **warm shadow tone** — `rgba(orange-800, 0.28)` drop
- **frost overlay** — `rgba(white-100, 0.42)` veil
- **tint overlay** — `rgba(blue-400, 0.18)` wash
- **glass variant** — frost overlay + soft-tone frost length (`10px` unthemed)
- **tinted variant** — tint overlay
- **monochromatic variant** — soft hairline + restrained gray drop (`0 10px 28px -22px` / `rgba(gray-900, 0.18)` unthemed)

Shipped binds (existing tokens only; no new hue family):

| Theme | soft tone | strong tone | muted tone | soft / bold strength | cool / warm shadow | frost / tint overlay |
|-------|-----------|-------------|------------|----------------------|--------------------|----------------------|
| Aquaflux | `--aqua-surface` + 14px blur | `--aqua-surface-strong` | `--aqua-surface-muted` | `--aqua-border` / `--aqua-border-strong` | `--aqua-shadow` / purple accent mix | `--aqua-page` / `--aqua-page-tint` |
| KiwiPress | `--kw-surface-strong` (frosted nav fill) | `--kw-surface` (opaque) | `--kw-surface-muted` | `--kw-border` / `--kw-border-strong` | cornflower tier / `--kw-warm` | `--kw-surface` / `--kw-accent-tint` |
| Citrusmint | `color-mix` of `--cm-surface` at 88% | `--cm-surface` | `--cm-surface-muted` | `--cm-border` / heading mix (no `--cm-border-strong`) | wintergreen / lime (same green family) | `--cm-surface` / `--cm-surface-muted` |
| Tide | `--tide-surface` + line glow + 16px blur | `--tide-surface-strong` | `--tide-surface-muted` | `--tide-border` / `--tide-border-strong` | lagoon mix + line glow / `--tide-shadow` | `--tide-page` / `--tide-page-tint` |

Tide must read as a **dark** frosted or elevated panel, not a white frost. Tide `borderStrength="bold"` uses `--tide-border-strong` (lagoon line at higher alpha, 2px) — not a light gray rule. Tide `shadowTone` uses `--tide-accent` mixed into `--tide-shadow` (cool, plus line glow) and `--tide-shadow` (warm ink) — not a light gray drop shadow. Tide `overlay` uses `--tide-page` (frost) and `--tide-page-tint` (tint) mixed into transparent — a dark veil, not a white wash. Tide `variant` recipes reuse those same binds (`glass` / `tinted` via overlay, `monochromatic` via soft hairline + `--tide-line-glow` soft shadow) — still dark, not a white glass. Light themes stay close to the original soft look.

`variant` recipes consume those same roles. There is no required `--juice-variant-*` bind family.

App-owned generated themes bind the same `--juice-surface-*`, `--juice-border-strength-*`, `--juice-shadow-tone-*`, and `--juice-overlay-*` roles from `--jx-surface*` / `--jx-border` / `--jx-border-strong` / `--jx-page-deep` / `--jx-warm` / `--jx-shadow` / `--jx-accent-tint`.

## Relationship to themes

| Layer | Owns |
|-------|------|
| Juice utilities | `surfaceTone`, `borderStrength`, `blur`, `shadowTone`, `overlay`, `variant`, `shadow`, `rounded`, `bgColor`, `borderColor`, … |
| Theme | Colors, typography, `--juice-surface-*` / `--juice-border-strength-*` / `--juice-shadow-tone-*` / `--juice-overlay-*` paint, how `[card]`, `[hero]`, and semantic elements render under `theme="..."` |

```html
<body theme="aquaflux">
  <article card="feature" surfaceTone="soft" borderStrength="bold">…</article>
</body>
```

Import core + theme CSS separately (see [Theme authoring](./juice-theme-authoring.md)).

## Still planned

A–C surface utilities and remaining depth slices A–C (`shadowTone`, `overlay`, `variant`) ship. Structural `card="…"` recipes can stay later — see [Cards](./juice-cards.md) and the [Surface Spec](./juice-surface-spec.md).

Modal / dialog **theme chrome** (`--juice-modal-*` on `[modal-overlay]` / `[modal]` / `[modal-close]`) also ships. That is a component scrim, not the surface `overlay="frost|tint"` utility. Optional `surfaceTone` on `[modal]` is allowed; do not force it. Closed vs open uses native `hidden`. The dialog runtime auto-enhances valid overlay markup — see [Modal Runtime](./juice-modal-runtime.md) and the [Theme Contract](./juice-theme-contract.md).

Drawer **theme chrome** (`--juice-drawer-*` on `[drawer-overlay]` / `[drawer]` / `[drawer-close]`) ships the same way: a component scrim and edge panel, not `overlay="frost|tint"`. Optional `surfaceTone` on `[drawer]` is allowed; do not force it. Closed vs open uses native `hidden`. Edge is `[drawer]` / `[drawer="right"]` / `[drawer="left"]`; optional width is `[drawer-size="sm|lg"]`. See the [Theme Contract](./juice-theme-contract.md).
