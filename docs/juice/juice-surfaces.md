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

`muted` ships because every library theme already has a recessed surface token (`--*-surface-muted`) that stays distinct from frost and elevation. `borderStrength` and standalone `blur="sm|md"` are **not** implemented.

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

## Theme role contract

Set these on `[theme="..."]`. Each tone uses the same four roles:

| Role | Used as |
|------|---------|
| `--juice-surface-<tone>-bg` | `background-color` |
| `--juice-surface-<tone>-border` | `1px solid` color |
| `--juice-surface-<tone>-shadow` | `box-shadow` |
| `--juice-surface-<tone>-blur` | `backdrop-filter: blur(...)` length |

`<tone>` is `soft`, `strong`, or `muted`.

Unthemed fallbacks (no theme binding):

- **soft** — near-white frost (`rgba(white-100, 0.88)`), gray border, soft shadow, `10px` blur
- **strong** — near-opaque white, stronger gray border and elevation, `0px` blur
- **muted** — `gray-100` wash, quieter border, no shadow, `0px` blur

Shipped binds (existing tokens only; no new hue family):

| Theme | soft | strong | muted |
|-------|------|--------|-------|
| Aquaflux | `--aqua-surface` + 14px blur | `--aqua-surface-strong` | `--aqua-surface-muted` |
| KiwiPress | `--kw-surface-strong` (frosted nav fill) | `--kw-surface` (opaque) | `--kw-surface-muted` |
| Citrusmint | `color-mix` of `--cm-surface` at 88% | `--cm-surface` | `--cm-surface-muted` |
| Tide | `--tide-surface` + line glow + 16px blur | `--tide-surface-strong` | `--tide-surface-muted` |

Tide must read as a **dark** frosted or elevated panel, not a white frost. Light themes stay close to the original soft look.

App-owned generated themes bind the same `--juice-surface-*` roles from `--jx-surface` / `--jx-surface-strong` / `--jx-surface-muted`.

## Relationship to themes

| Layer | Owns |
|-------|------|
| Juice utilities | `surfaceTone`, `shadow`, `rounded`, `bgColor`, … |
| Theme | Colors, typography, `--juice-surface-*` paint, how `[card]`, `[hero]`, and semantic elements render under `theme="..."` |

```html
<body theme="aquaflux">
  <article card="feature" surfaceTone="soft">…</article>
</body>
```

Import core + theme CSS separately (see [Theme authoring](./juice-theme-authoring.md)).

## Still planned

These stay specified, not shipped:

- `borderStrength="soft|bold"`
- standalone `blur="sm|md"`
- `overlay`, `variant`, `shadowTone`
