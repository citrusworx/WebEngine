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

This finishes the approved A→B→C surface utility pass (`surfaceTone`, `borderStrength`, standalone `blur`). `variant`, `overlay`, and `shadowTone` stay specified, not shipped.

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

Unthemed fallbacks (no theme binding):

- **soft tone** — near-white frost (`rgba(white-100, 0.88)`), gray border, soft shadow, `10px` blur
- **strong tone** — near-opaque white, stronger gray border and elevation, `0px` blur
- **muted tone** — `gray-100` wash, quieter border, no shadow, `0px` blur
- **soft strength** — `1px` + `rgba(gray-300, 0.45)`
- **bold strength** — `2px` + `rgba(gray-400, 0.9)`
- **blur sm / md** — `6px` / `16px` (optional `--juice-blur-*` restyles; not theme-bound)

Shipped binds (existing tokens only; no new hue family):

| Theme | soft tone | strong tone | muted tone | soft / bold strength |
|-------|-----------|-------------|------------|----------------------|
| Aquaflux | `--aqua-surface` + 14px blur | `--aqua-surface-strong` | `--aqua-surface-muted` | `--aqua-border` / `--aqua-border-strong` |
| KiwiPress | `--kw-surface-strong` (frosted nav fill) | `--kw-surface` (opaque) | `--kw-surface-muted` | `--kw-border` / `--kw-border-strong` |
| Citrusmint | `color-mix` of `--cm-surface` at 88% | `--cm-surface` | `--cm-surface-muted` | `--cm-border` / heading mix (no `--cm-border-strong`) |
| Tide | `--tide-surface` + line glow + 16px blur | `--tide-surface-strong` | `--tide-surface-muted` | `--tide-border` / `--tide-border-strong` |

Tide must read as a **dark** frosted or elevated panel, not a white frost. Tide `borderStrength="bold"` uses `--tide-border-strong` (lagoon line at higher alpha, 2px) — not a light gray rule. Light themes stay close to the original soft look.

App-owned generated themes bind the same `--juice-surface-*` and `--juice-border-strength-*` roles from `--jx-surface*` / `--jx-border` / `--jx-border-strong`.

## Relationship to themes

| Layer | Owns |
|-------|------|
| Juice utilities | `surfaceTone`, `borderStrength`, `blur`, `shadow`, `rounded`, `bgColor`, `borderColor`, … |
| Theme | Colors, typography, `--juice-surface-*` / `--juice-border-strength-*` paint, how `[card]`, `[hero]`, and semantic elements render under `theme="..."` |

```html
<body theme="aquaflux">
  <article card="feature" surfaceTone="soft" borderStrength="bold">…</article>
</body>
```

Import core + theme CSS separately (see [Theme authoring](./juice-theme-authoring.md)).

## Still planned

A–C surface utilities ship (`surfaceTone`, `borderStrength`, `blur`). These stay specified, not shipped:

- `overlay`, `variant`, `shadowTone`
