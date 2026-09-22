# Juice Theme Quality

Canonical visual and identity quality bar for Juice themes.

The [Theme Contract](./juice-theme-contract.md) checks that required `--juice-*` roles exist. The [Typography Contract](./juice-typography-contract.md) checks how authors use `font` / `fontSize` / related attributes. This page is separate: it is the ship bar for identity density so new colors and swatches do not repeat weak heading ink, cross-hue CTA gradients, outline chips filled with CTA paint, thin ink ladders, templated surfaces, or one shared type pair across a family of themes.

## Purpose

Role completeness ≠ identity quality.

A theme can bind every required chrome role and still fail visually: headings disappear on dark pages, surfaces are four copies of the same translucent page tint, primary buttons bleed into outline chips, and controls look like CTAs. This page is the bar for shipping a library theme or promoting a draft out of `_draft`.

Pass the Theme Contract machine check first. Then pass this page before merge or promote.

## References

| Theme | Job as reference |
|---|---|
| **KiwiPress** (`kiwipress`) | Fullest product / publishing density: ink ladder, surface recipes, semantic defaults, painting Juice primitives (`[hero]`, `[card]`, `[panel]`, `[cta]`). |
| **Tide** (`tide`) | Dark page atmosphere: dark frost surfaces, surface-not-CTA controls, in-family CTA gradient. |

Use them for denseness and atmosphere, not for copying voice.

- Do not copy KiwiPress green or Korolev into every theme.
- Retros must match denseness (readable ink ladder, distinct surface stack, purposeful recipes), not Korolev / kiwi voice.
- Aquaflux, Citrusmint, and app-owned `--jx-*` themes remain valid identities; they are not excused from this bar.

## Ink ladder (required)

Every theme needs a readable emphasis ladder:

| Role | Job |
|---|---|
| heading | Titles and strong display ink |
| text (body) | Default reading ink |
| text-muted | Secondary copy |
| text-soft | Tertiary / small / figcaption ink |
| text-inverse | Ink on accent or deep surfaces when needed |

Rules:

- Heading binds to the heading token. Do not bind heading to page-deep or near-black on dark themes (the retro heading→deep bug: titles vanish into the page).
- Perceived emphasis must read **soft < muted < body < heading**. If soft and muted are the same, or body and heading are the same, the ladder is incomplete.
- Small text and figcaptions use soft (KiwiPress pattern). Muted is for secondary body, not for every quiet label.

Optional extras the generator already accepts (`soft`, `inverse` under `palette.text`) are required for quality even when a thin YAML minimum only lists `default` / `muted` / `heading`.

## Surface stack (required)

Surfaces need distinct steps, not four identical `rgba(page)` copies:

```text
page → muted → default/soft → strong → deep
```

Each step must be visibly different on the page. Bind `--juice-surface-soft-*`, `--juice-surface-strong-*`, and `--juice-surface-muted-*` from those steps (see Theme Contract surface tones).

Prefer painting Juice primitives `[hero]`, `[card]`, `[panel]`, and `[cta]` (KiwiPress) over only theme-prefixed named attrs such as `[afb-card]`, unless the brand needs named surfaces. If named surfaces exist, keep Juice primitives looking intentional too — do not leave `[card]` / `[panel]` as unstyled leftovers.

Hero / CTA / workflow-style recipes should be purposeful. Do not ship one generic card gradient everywhere.

## Accent + controls (required)

Accent family stays one hue:

- primary / strong / soft / tint in the same family

Optional warm secondary is a deliberate second family (KiwiPress marmalade), not a random cross-hue CTA stop.

CTA / button fill gradient stays in-family: accent → accent-strong. Never accent → secondary-strong (cross-hue).

When the theme paints primary buttons with `background-image`:

- `btn="outline"` and `btn="secondary"` must set `background-image: none`
- Outline chips must not dissolve into the page or inherit the primary CTA paint

Accordion / tabs triggers, modal / drawer / toast / popover closes, breadcrumb ink, and the other surface/text controls stay surface/text controls — not the CTA button gradient. The Theme Contract already requires this as a bind rule; quality restates it as a visual QA item: if a close or trigger reads as a primary button, it fails.

## Typography (required)

- Body + heading pair with full fallback stacks (not bare `sans-serif`).
- Prefer catalog faces from the [Typography Reference](./juice-typography.md) when possible.
- Explicit heading / body metrics. KiwiPress reference: heading weight ~700, line-height ~1.1; body line-height ~1.6. Poster faces may differ but must remain readable.
- Do not ship a family of themes that all share one identical type pair unless that sameness is intentional. Use variants (condensed / display) when the brand needs more than one voice.

Authors still consume the pair through the [Typography Contract](./juice-typography-contract.md). This page only governs what the theme publishes as defaults.

## Semantic defaults (required)

YAML and SCSS must agree on section / article / nav / header / footer behavior (KiwiPress examples: translucent nav, inverted footer — use what fits the theme).

Authoring rules should list chrome binds so new chrome families do not become CTAs by default. Identity docs that omit chrome guidance tend to grow CTA-painted closes and triggers.

## Visual QA gate

Before merge, or before promoting a theme from `_draft`, run Showcase (or an equivalent page set) with the theme active and check:

- Page title / `h1`–`h3` readable on the page and on cards
- Body vs muted vs soft distinguishable
- Outline theme chips not half-dissolved into the page
- Primary CTA readable; secondary / outline distinct from primary
- One card plus one modal or drawer close looks like a control, not a CTA

Role-bind tests alone are not enough. `juice.theme-contract.test.ts` proves names exist; it does not prove headings are visible or that outline buttons cleared `background-image`.

## Relationship to other docs

| Doc | Job |
|---|---|
| [Theme Contract](./juice-theme-contract.md) | Required CSS roles / machine check |
| [Typography Contract](./juice-typography-contract.md) | How authors use `font` / `fontSize` / … |
| **This page** | Identity density + anti-regression ship bar |
| [Theme authoring](./juice-theme-authoring.md) | How-to detail for writing themes |
| [Theme manual](./juice-theme-manual.md) | Authoring flow; ship bullets point here for quality |

## Known quality gap (non-binding)

Library retros often feel loose relative to KiwiPress denseness for three recurring reasons — document them here so new colors / swatches do not repeat them; do not treat this section as a rewrite mandate in this PR:

1. Ink ladder missing soft (and sometimes heading bound toward page-deep on dark pages)
2. Surfaces templated as translucent page copies instead of a stepped stack
3. One shared type pair (for example Lato / Archivo Black) across many retros

Fix those themes in follow-up work against this bar. This page does not add roles or redesign palettes.

## Non-goals

- No new `--juice-*` roles on this page
- No requirement to rewrite theme SCSS in the PR that only adds this doc
- No palette hex redesign mandated here
- No copying KiwiPress green or Korolev as a default for other brands
