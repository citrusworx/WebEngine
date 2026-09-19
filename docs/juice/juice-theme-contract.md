# Juice Theme Contract

Canonical required-versus-optional checklist for Juice themes.

[Theme authoring](./juice-theme-authoring.md) and the [theme manual](./juice-theme-manual.md) keep how-to detail. This page is the list those docs point at. It documents what already ships after Tide and surface language A–C (`surfaceTone`, `borderStrength`, standalone `blur`). It does not add contract tests, and it does not change theme SCSS or YAML.

## 1. Layer rule

Juice owns structure. Themes own identity.

A theme decides brand voice, type pair, page/text/accent/surface color, semantic defaults, named surfaces, and chrome paint. It does not redefine `stack`, `row`, `grid`, `gap`, padding, sizing primitives, or responsive layout.

## 2. Shipped references

Treat these four library themes as equal references. Each lives at `libraries/juice/src/themes/<id>/` as `<id>.scss` + `<id>.yaml` and ships as `@citrusworx/juiceui/styles/themes/<id>`.

| id | Character | Identity prefix |
|---|---|---|
| `aquaflux` | light hospitality / wellness | `--aqua-*` |
| `kiwipress` | richest product / publishing reference | `--kw-*` |
| `citrusmint` | mint / citrus marketing | `--cm-*` |
| `tide` | dark product / SaaS, teal/lagoon | `--tide-*` |

**Blush** remains `_draft` (`src/themes/_draft/blush/`). It is YAML-only, unpublished, and not a reference for this contract. Package `exports` still block `@citrusworx/juiceui/themes/_draft/*`.

App-owned generated themes are a second, recommended source for product branding. They use the `--jx-*` prefix. See [Theme authoring](./juice-theme-authoring.md).

## 3. Required YAML / identity

Do not invent a second schema. The generator already has one: `ThemeGeneratorConfig` in `libraries/juice/src/tools/theme-generator/index.ts`. `normalizeConfig()` requires `id`, `name`, `typography`, and `palette`. Missing those fields fail generation.

Required shape (same as the authoring “Required config shape”):

```yaml
id: mytheme
name: My Theme
selector: theme="mytheme"   # optional in the generator; defaults to theme="<id>"

typography:
  body:
    family: '"noto-sans"'
    fallback: sans-serif
  heading:
    family: '"citrus-gothic"'
    fallback: sans-serif

palette:
  page:
    background: "#f4f0e8"
  text:
    default: "#211c1b"
    muted: "#6f6660"
    heading: "#211c1b"
  accents:
    primary: "#ff7716"
  surfaces:
    default: "#fffdf8"
    border: "rgba(33, 28, 27, 0.12)"
```

Minimum palette keys the generator reads:

| Group | Required | Optional extras the generator already accepts |
|---|---|---|
| `page` | `background` | `tint`, `deep` |
| `text` | `default`, `muted`, `heading` | `soft`, `inverse` |
| `accents` | `primary` | `primaryStrong`, `secondary`, `secondaryStrong`, `soft`, `tint`, `warm`, `warmSoft`, `warmTint` |
| `surfaces` | `default`, `border` | `muted`, `strong`, `deep`, `borderStrong`, `hero`, `cta`, `panel`, `shadow`, `shadowStrong` |

Optional config sections (not chrome roles): `selector`, `summary`, `philosophy`, `recommended_use_cases`, `authoring_rules`, `typography.variants`, `named_surfaces`, `version`, `example`.

**Named surfaces** are required only when the theme has a branded recipe that Juice primitives (`[hero]`, `[card]`, `[panel]`) should not invent a second layout system for. Aquaflux (`aqua-card` / `aqua-panel` / `aqua-hero`) and Tide (`tide-card` / `tide-panel`) ship them. KiwiPress paints Juice primitives instead. Citrusmint has none.

Library companion YAML (`<id>.yaml` next to `<id>.scss`) is an identity record, not always a generator input. Hand-authored library YAML may use token names and extra sections (`warm`, `semantic_elements`). The **enforceable** CSS contract is the `--juice-*` bind list below. New app-owned themes should follow the generator shape above.

## 4. Required `--juice-*` binds

Set every name in this section on `[theme="…"]` for every shipped library theme. Bind from existing identity tokens. Do not invent a new hue family for chrome. Accordion and tab triggers stay surface/text controls, not the CTA button gradient.

Core CSS reads `--juice-*`. Identity aliases (`--aqua-*`, `--kw-*`, `--cm-*`, `--tide-*`, `--jx-*`) are how themes name the same values.

### Accordion core

| Role | Job |
|---|---|
| `--juice-accordion-trigger` | idle trigger fill |
| `--juice-accordion-trigger-hover` | hover fill |
| `--juice-accordion-trigger-open` | expanded trigger fill |
| `--juice-accordion-chevron` | chevron pigment |
| `--juice-accordion-panel-rule` | panel divider |
| `--juice-accordion-focus-ring` | focus outline |

Consumed by `accordion.scss`. Aquaflux, KiwiPress, Citrusmint, Tide, and generated `--jx-*` themes all bind this set.

### Tabs core

| Role | Job |
|---|---|
| `--juice-tabs-trigger` | idle trigger fill |
| `--juice-tabs-trigger-hover` | hover fill |
| `--juice-tabs-trigger-active` | selected trigger fill |
| `--juice-tabs-text` | idle label |
| `--juice-tabs-text-hover` | hover label |
| `--juice-tabs-text-active` | selected label |
| `--juice-tabs-indicator` | selected underline |
| `--juice-tabs-list-rule` | strip bottom rule |
| `--juice-tabs-focus-ring` | focus outline |

Consumed by `tabs.scss`. Same four library themes plus generated `--jx-tabs-*`.

### Surface tones

`surfaceTone="soft|strong|muted"`. Each tone binds four roles:

| Role suffix | Used as |
|---|---|
| `-bg` | `background-color` |
| `-border` | tone border color |
| `-shadow` | `box-shadow` |
| `-blur` | `backdrop-filter` length |

Required names:

- `--juice-surface-soft-bg` / `-border` / `-shadow` / `-blur` — frosted / translucent
- `--juice-surface-strong-bg` / `-border` / `-shadow` / `-blur` — opaque elevated panel
- `--juice-surface-muted-bg` / `-border` / `-shadow` / `-blur` — quieter recessed wash

Consumed by `surface.scss` with light fallbacks (unthemed `soft` stays the original near-white frost). Per-theme mapping notes live in [Surfaces](./juice-surfaces.md) and [Theme authoring](./juice-theme-authoring.md). Tide must stay a dark frost, not a white glass.

### Border strength

`borderStrength="soft|bold"`. Required names:

| Role | Job |
|---|---|
| `--juice-border-strength-soft-width` | hairline width (`1px` in every shipped theme) |
| `--juice-border-strength-soft-color` | hairline color |
| `--juice-border-strength-bold-width` | heavier rule (`2px` in every shipped theme) |
| `--juice-border-strength-bold-color` | heavier rule color |

Bind colors from existing `--*-border` / `--*-border-strong` tokens. Citrusmint has no `--cm-border-strong`; bold mixes `--cm-heading` at low alpha. Tide uses `--tide-border` / `--tide-border-strong` so bold is a lagoon line, not a light gray.

Core applies the color roles only when the element has neither `surfaceTone` nor `borderColor`. Combined `[surfaceTone][borderStrength]` refines width only.

## 5. Optional hooks

Core consumes these with transparent / no-op fallbacks. Aquaflux, KiwiPress, and Citrusmint omit them. Tide binds several for dark FAQ pill chrome.

### Accordion (optional)

| Role | Job |
|---|---|
| `--juice-accordion-item-border` | idle trigger outline |
| `--juice-accordion-item-border-open` | expanded trigger / wrapping-item outline |
| `--juice-accordion-trigger-accent` | left bar on the open header (`::before`) |
| `--juice-accordion-panel` | recessed answer-well fill |
| `--juice-accordion-open-glow` | soft open-state shadow |
| `--juice-accordion-chevron-size` | CSS chevron silhouette size |
| `--juice-accordion-chevron-weight` | CSS chevron stroke |

Tide binds all of these (`--tide-item-border`, `--tide-trigger-accent`, `--tide-panel-well`, `--tide-open-glow`, plus chevron size `0.7rem` / weight `2.5px`).

### Tabs (optional)

| Role | Job |
|---|---|
| `--juice-tabs-panel` | panel fill |
| `--juice-tabs-panel-rule` | inset panel divider |

Tide binds `--juice-tabs-panel` from `--tide-tabs-panel`. It does not bind `--juice-tabs-panel-rule`. Other shipped themes bind neither.

Generated app themes currently bind required accordion/tabs/surface/border-strength roles only. They do not emit these optional hooks.

## 6. Identity-prefix alias convention

| Source | Prefix | Example |
|---|---|---|
| Aquaflux | `--aqua-*` | `--aqua-trigger` → `--juice-accordion-trigger` |
| KiwiPress | `--kw-*` | `--kw-tabs-text-active` → `--juice-tabs-text-active` |
| Citrusmint | `--cm-*` | `--cm-surface` → `--juice-surface-strong-bg` |
| Tide | `--tide-*` | `--tide-border-strong` → `--juice-border-strength-bold-color` |
| Generated app themes | `--jx-*` | `--jx-trigger` → `--juice-accordion-trigger` |

`--juice-*` is what core CSS reads. Prefix aliases are theme-local names for the same values. Core accordion/tabs helpers also fall back through `--aqua-*` / `--kw-*` / `--cm-*` / `--tide-*` / `--jx-*` if a `--juice-*` bind is missing, but shipped themes must still set the `--juice-*` names. Do not add a fifth library prefix.

## 7. Not theme roles

Standalone `blur="sm|md"` is a **core utility**, not a theme role family.

- Lengths are fixed: `sm` = `6px`, `md` = `16px`
- Optional restyles: `--juice-blur-sm` / `--juice-blur-md` (core fallbacks already supply those lengths)
- Do **not** require a per-theme blur scale
- Tone frost stays on `--juice-surface-<tone>-blur`
- Combined `[surfaceTone][blur]` overrides backdrop-filter length only; tone background / border / shadow stay

See [Surfaces](./juice-surfaces.md).

Also not theme roles: layout primitives, responsive collapse, app state, feature behavior, `overlay` / `variant` / `shadowTone` (specified, not shipped).

## 8. Theme × role-family matrix

| Family | aquaflux | kiwipress | citrusmint | tide |
|---|---|---|---|---|
| Accordion core | bind | bind | bind | bind |
| Tabs core | bind | bind | bind | bind |
| Surface tones (`soft` / `strong` / `muted` × bg, border, shadow, blur) | bind | bind | bind | bind |
| Border strength (`soft` / `bold` × width, color) | bind | bind | bind | bind |
| Accordion optional | omit (core no-op) | omit | omit | bind all seven |
| Tabs optional | omit | omit | omit | `--juice-tabs-panel` only |
| Standalone blur scale | not a theme role | not a theme role | not a theme role | not a theme role |

Generated `--jx-*` themes bind the four required families and omit the optional accordion/tabs hooks.

## 9. Authoring checklist

A new theme is done when:

1. Identity is recorded: `id`, `name`, `selector` (`theme="<id>"`), body + heading typography, and palette groups for page, text, accents, and surfaces.
2. Named surfaces exist only when each has a one-sentence job; Juice `[hero]` / `[card]` / `[panel]` still do the structure.
3. Identity tokens use one prefix (`--aqua-*` / `--kw-*` / `--cm-*` / `--tide-*` for a library theme, `--jx-*` for a generated app theme).
4. `[theme="<id>"]` binds every **required** `--juice-*` name in section 4 from those existing tokens — no new hue family, no CTA paint on accordion/tab triggers.
5. Optional accordion/tabs hooks are bound only when the chrome needs them (Tide FAQ pills). Omitting them is valid.
6. Standalone `blur="sm|md"` is left to core. No second per-theme blur scale.
7. Semantic defaults and named-surface recipes stay on the identity layer. `stack` / `row` / `grid` / `gap` are untouched.
8. The app imports core CSS plus the theme stylesheet and sets `theme="<id>"` on the root.
9. Swapping `theme` on unchanged markup retints accordion, tabs, `surfaceTone`, and `borderStrength` without fighting layout.

How to generate, import, and map tokens is in [Theme authoring](./juice-theme-authoring.md) and the [theme manual](./juice-theme-manual.md).

## Status

This is the docs formalization of Priority 2 (slice A). Automated tests that assert every shipped theme binds the required families are **not** written yet (slice B). Filling any remaining SCSS/YAML gaps is later work (slice C). Blush, CLI, publish, and `overlay` / `variant` are out of scope here.
