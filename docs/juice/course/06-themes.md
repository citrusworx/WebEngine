# 06 — Themes and brand identity

[Previous](./05-composition.md) · [Course](./README.md) · [Next](./07-responsive.md)

**Goal:** separate library themes from app-owned identity, and write a theme config that paints Harbor Press without stealing layout. Allow 70 minutes.

## Learning goals

- State what a theme must decide, and what it must not
- Load a shipped library theme and swap it without changing structure
- Sketch an app-owned `juice.theme.yaml` and know how generation works
- Use named surfaces for a few branded moments, not every block

## Concepts

**Identity** is the set of decisions that make a product recognizable: type pair, page atmosphere, accent, how a card feels, how a heading sits on a hero. **Structure** is the set of decisions that make a page hold together across products: stack, gap, card slots, form fields.

A design system that ships one look is a theme pretending to be a system. A system that ships no look forces every app to invent identity in random CSS.

Two healthy sources for identity:

1. **Library-owned themes** — shared presets for demos, products that want a CitrusWorx look, or starting points
2. **App-owned themes** — the product’s brand contract, generated into app-local CSS

The second is the recommended path for product branding. The library should not become a graveyard of every customer palette.

Generation is a **draft** pipeline (maturity matrix). The config shape is usable today; the workflow is still early. Treat your YAML as the source you own, and the CSS as an artifact. Do not hand-edit generated files as if they were the system.

Named surfaces are branded recipes (`surface="harbor-stage"`). They are how a theme exposes a marquee without inventing `harbor-hero-layout`. If you need a new *arrangement*, that is still `stack` / `grid` / `card`. If you need a new *atmosphere*, that is a named surface or a theme variable.

## Juice mapping

[Theme contract](../juice-theme-contract.md) is the required-versus-optional checklist. [Theme authoring](../juice-theme-authoring.md) and [Theme manual](../juice-theme-manual.md) are the how-to. This lesson does not reprint them.

### Shipped library themes

Under `libraries/juice/src/themes/<id>/` as `<id>.scss` + `<id>.yaml`:

| id | Character |
|---|---|
| `aquaflux` | light, aqua hospitality / product |
| `citrusmint` | mint / citrus marketing |
| `kiwipress` | richest current product reference |
| `tide` | dark SaaS, lagoon/teal — not Aquaflux |

Drafts such as blush live under `src/themes/_draft/` and do not ship as package exports.

Import is always **core + theme**:

```ts
import "@citrusworx/juiceui/styles";
import "@citrusworx/juiceui/styles/themes/tide";
```

```html
<body theme="tide"></body>
```

### App-owned config (required keys)

```yaml
id: harborpress
name: Harbor Press

typography:
  body:
    family: '"lato"'
    fallback: sans-serif
  heading:
    family: '"oswald"'
    fallback: sans-serif

palette:
  page:
    background: "#f6f3ee"
  text:
    default: "#211c1b"
    muted: "#6f6660"
    heading: "#211c1b"
  accents:
    primary: "#2f6f6a"
  surfaces:
    default: "#fffdf8"
    border: "rgba(33, 28, 27, 0.12)"
```

Optional: `selector`, `summary`, `philosophy`, `typography.variants`, `named_surfaces`, accordion/tabs notes as the authoring doc describes.

Variants emit `--jx-font-<role>`. Juice does not guess where to apply them; app or theme selectors do.

Named surfaces:

```yaml
named_surfaces:
  - name: harbor-stage
    purpose: Quiet marquee for the press intro.
    background: "#211c1b"
    color: "rgba(246, 243, 238, 0.92)"
    border: "rgba(246, 243, 238, 0.12)"
```

```html
<section hero surface="harbor-stage" stack gap="1" padding="2rem">...</section>
```

### Generation

```bash
yarn workspace @citrusworx/juiceui generate:themes
```

```bash
yarn workspace @citrusworx/juiceui generate:themes \
  --config ../../apps/my-app/juice.theme.yaml \
  --css-out ../../apps/my-app/src/generated/harborpress-theme.css \
  --yaml-out ../../apps/my-app/src/generated/harborpress-theme.yaml
```

`--css-out` is required with `--config`. The generator writes page/text/accent/surface variables, semantic defaults, base `[hero]` / `[card]` / `[panel]` / `[cta]` treatments, accordion and tabs chrome roles, and `surfaceTone` binds from `--jx-surface*`.

Blackwater Sound is the practical app-owned example cited in the Juice README. You do not need that app to finish this lesson.

### What themes must not own

Layout primitives, responsive collapse, app state, feature behavior. If a theme redefines `[stack]` or `[gap]`, it has left its layer.

## Worked example

**Part A — swap a library theme.** Take the Lesson 5 page. Change only the imports and `theme="..."` from `citrusmint` to `tide`. Keep the same `stack` / `grid` / `card="feature"` markup.

```ts
import "@citrusworx/juiceui/styles";
import "@citrusworx/juiceui/styles/themes/tide";
```

```html
<body theme="tide">
```

Tide will rebind `--juice-surface-*` so `surfaceTone="soft"` becomes dark frost, not the unthemed white fallback. Explicit `bgColor="white-100"` on cards will still be white stamps on a dark page — that is the lesson. Token paint you stamped in Lessons 2–5 can **fight** the theme. Identity wants roles (`heading` color from the theme) more than repeated `fontColor="obsidian-900"`.

After the swap, remove a few explicit light-theme tokens from the hero and cards. Let Tide paint `section` / `article` / `[card]`. Put tokens back only where the catalog still needs a local decision.

**Part B — sketch the app-owned contract.** You do not have to run the generator to learn the split. Write `harborpress.theme.yaml` with the required keys above plus:

```yaml
named_surfaces:
  - name: harbor-stage
    purpose: Intro band.
  - name: harbor-well
    purpose: Subscribe and quiet supporting copy.
```

If you *do* generate, import the CSS artifact and set `theme="harborpress"`. Markup stays:

```html
<body theme="harborpress">
  <section hero surface="harbor-stage" padding="2rem" stack gap="1">
    <div center>
      <h1>Harbor Press</h1>
    </div>
  </section>
</body>
```

No `font="oswald"` required if the theme bound heading font. Keeping a local `font=` is allowed on nodes the theme does not restyle; it is no longer the identity source. On themed `h1`–`h6` / `p`, theme fonts currently win at equal specificity — see the [Typography Contract](../juice-typography-contract.md).

## Exercises

1. Theme-swap the Lesson 5 page to `tide`, then `aquaflux`, then back. List three things that correctly changed and one explicit token that did not (and should not, because you authored it).
2. Write a ten-line `philosophy` / `owns` / `does_not_own` block for Harbor Press, modeled on `libraries/juice/src/themes/tide/tide.yaml`. If “gap” appears under `owns`, delete it.
3. Add one named surface and use it on the hero. If you want a second atmosphere, add a second named surface — do not clone the hero with a new layout attribute.

## Checkpoint

What file would you edit to change Harbor Press’s heading face across the app? What file would you edit to change how a feature card’s slots are arranged? If those are the same file, the layers have collapsed.

[Answers](./answers.md#lesson-06)

## Go deeper

- [Typography contract](../juice-typography-contract.md) — theme body/heading vs local `font=`
- [Theme contract](../juice-theme-contract.md)
- [Theme authoring](../juice-theme-authoring.md)
- [Theme manual](../juice-theme-manual.md)
- [Getting started](../juice-getting-started.md) — app-owned generation
- [Layers](../juice-layers.md)
- [Surfaces](../juice-surfaces.md) — theme binds for `surfaceTone`
- [Maturity matrix](../juice-maturity-matrix.md) — themes emerging, generator draft
- Tide FAQ sketch: `libraries/juice/src/templates/html/tide-faq/index.html`

## Next lesson

[07 — Responsive systems](./07-responsive.md) asks the identity to survive a narrow viewport without a breakpoint novel.
