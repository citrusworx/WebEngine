# 04 — Surfaces and semantics

[Previous](./03-layout.md) · [Course](./README.md) · [Next](./05-composition.md)

**Goal:** give regions a role — hero, card, panel, tone — without painting every box and without turning surfaces into a second layout system. Allow 50 minutes.

## Learning goals

- Separate *what a region is* from *how it is painted*
- Use Juice structural hooks (`hero`, `card`, `panel`, `cta`) as roles
- Apply `surfaceTone` as shipped paint, and named `surface` as a theme recipe
- Keep most surfaces neutral so accent still means something

## Concepts

A **surface** is a region that sits on the page: a hero, a card, a side panel, a quiet well. In a design system, surfaces have **roles**. The hero is a stage. The card is a unit of content. The panel is supporting material. The CTA is a decision point.

Paint is not the role. A card can be white, frosted, or dark and still be a card. If you encode “white box with shadow” as the only meaning of card, you cannot theme the product.

Elevation and contrast should follow role:

- most content sits on a **neutral** surface
- one region may be **strong** (opaque, slightly lifted)
- one region may be **muted** (recessed, no elevation)
- frost / blur is a *tone*, not a brand

If every block is a loud tinted card, hierarchy dies. [Visual design language](../juice-visual-design-language.md) says this directly: neutrals first, one primary accent.

Themes bind how roles look. The system binds which roles exist. Mixing those jobs produces either a theme that reimplements layout, or a layout library that hardcodes a brand.

## Juice mapping

### Structural hooks (Juice)

These are boolean (or valued) attributes that mark a region. Themes and utilities paint them.

| Hook | Role |
|---|---|
| `hero` | page or band stage |
| `card` | content unit; variants in Lesson 5 |
| `panel` | supporting well |
| `cta` | call-to-action band |
| `badge`, `stat` | small semantic marks |

Core files: `libraries/juice/src/components/hero/hero.scss`, `panel/panel.scss`, `cta/cta.scss`, plus card/badge/stat. Themes add identity on top, for example `[theme="kiwipress"] [hero]`.

`card` is more than a box. It has variants (`feature`, `cta`, `pricing`, …) and **slots** (`header`, `body`, `action`, …). Lesson 5. For this lesson, `card` means “this is a content unit,” optionally with `surfaceTone`.

### Paint utilities (Juice)

- `bgColor`, `rounded`, `shadow`, `depth` — token paint from Lesson 2
- `surfaceTone="soft|strong|muted"` — **beta-stable** shared tones

`surfaceTone` reads `--juice-surface-<tone>-bg|border|shadow|blur`. Unthemed fallbacks stay a light frost for `soft`. Themes rebind the roles. Tide must read as a dark panel, not a white frost. [Surfaces](../juice-surfaces.md).

**Not shipped:** `borderStrength`, standalone `blur="sm|md"`, `overlay`, `variant`, `shadowTone`. Do not use them in exercises.

### Theme recipes

- `theme="..."` on an ancestor
- `surface="brand-stage"` (or a theme’s named surface) for a specific branded moment

Named surfaces are optional recipes (`bw-stage`, `tide-card`). They are not a layout API. Juice still owns `hero` / `card` / `panel`. The theme owns what `surface="..."` looks like.

`[theme] [surfaceTone]` wins over theme defaults on `section` / `article` / `aside`, so authors can locally override paint without abandoning the hook.

## Worked example

Promote Harbor Press regions into roles. Catalog items become cards. The intro becomes a hero. Subscribe becomes a panel. Tones stay mostly neutral.

```html
<body theme="citrusmint">
  <main container stack gap="2" padding="2rem">
    <section hero padding="2rem" stack gap="1">
      <div center>
        <p font="lato" fontSize="sm" fontColor="gray-700">Independent publishing</p>
        <h1 font="oswald" fontSize="xxl" fontColor="obsidian-900">Harbor Press</h1>
      </div>
      <div content center>
        <p font="lato" fontSize="md" fontColor="gray-700">
          Short-run books, careful typesetting, and a catalog that still fits on one shelf.
        </p>
      </div>
    </section>

    <section>
      <div stack gap="1">
        <h2 font="oswald" fontSize="xl">This season</h2>
        <div grid="3x1" gap="1">
          <article card padding="1.25rem" stack gap="0.75rem" bgColor="white-100" shadow="gray-400" depth="sm">
            <h3 font="oswald" fontSize="lg">The Inlet</h3>
            <p font="lato">Essays on harbors and tide tables.</p>
          </article>
          <article card padding="1.25rem" stack gap="0.75rem" bgColor="white-100" shadow="gray-400" depth="sm">
            <h3 font="oswald" fontSize="lg">Letterpress Hours</h3>
            <p font="lato">A shop diary from a one-room bindery.</p>
          </article>
          <article card padding="1.25rem" stack gap="0.75rem" surfaceTone="muted">
            <h3 font="oswald" fontSize="lg">Fog Index</h3>
            <p font="lato">Poems that refuse a larger type size.</p>
          </article>
        </div>
      </div>
    </section>

    <aside panel surfaceTone="soft" padding="1.25rem" stack gap="0.75rem">
      <h2 font="oswald" fontSize="xl">The list</h2>
      <p font="lato">Season notes. No tracking pixel.</p>
    </aside>
  </main>
</body>
```

What to notice:

- `hero`, `card`, and `panel` are roles. You can still `stack` and `gap` on them; structure and surface compose.
- Two cards share a white elevated language. The third is `muted` so the grid has a quiet peer, not three identical stamps. Use that sparingly — one recessed item is a cue; three is a new default.
- Subscribe is `aside panel`, not a fourth card. Supporting material should not impersonate catalog items.
- No named `surface=` yet. Citrusmint can paint `[hero]` from the theme. Named surfaces wait until you have a recipe worth naming (Lesson 6).

A weaker page: `hero` plus `gradient="citrusmint-300"` plus three `bgColor="citrusmint-300"` cards plus a mint panel. Every surface shouts. None of them has a role.

## Exercises

1. Move `surfaceTone="strong"` onto the hero and `soft` onto every card. Then undo it. Which version still has a catalog vs a stack of glass?
2. Change the subscribe `aside` to `article card`. What did the outline and the role vocabulary lose?
3. Read [Surfaces](../juice-surfaces.md) through the Tide row of the theme table. Why would copying the unthemed `soft` fallback onto a dark theme be a bug?

## Checkpoint

Write a three-row table for your page: region, structural hook, paint (token vs `surfaceTone` vs theme default). If two regions share the same hook *and* the same paint, is that repetition useful or a missing role?

[Answers](./answers.md#lesson-04)

## Go deeper

- [Surfaces](../juice-surfaces.md) — `surfaceTone` contract and theme binds
- [Surface spec](../juice-surface-spec.md) — specified vs shipped
- [Styles](../juice-styles.md) — `hero` / `panel` / `surface` in the public shape
- [Cards](../juice-cards.md) — structure the hook will grow into
- [Visual design language](../juice-visual-design-language.md)
- [Layers](../juice-layers.md)

## Next lesson

[05 — Composition patterns](./05-composition.md) assembles cards, forms, and navigation from slots and scoped attributes.
