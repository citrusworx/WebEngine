# 08 — Hybrid styling and authoring

[Previous](./07-responsive.md) · [Course](./README.md) · [Next](./09-capstone.md)

**Goal:** keep Juice as the structural language, use app CSS as a named exception layer, and recognize the anti-patterns that split a system in two. Allow 50 minutes.

## Learning goals

- Draw the hybrid split: attributes, theme, app selectors
- Write one product-specific rule you can defend
- Refuse a set of common Juice anti-patterns by name
- Know when a pattern should graduate into Juice vs stay in the app

## Concepts

No design system covers every product surface. A **hybrid** model is not a failure. It is a boundary:

- the system owns the language everyone shares
- the product owns art direction that would pollute that language
- exceptions are **few, named, and local**

The failure mode is a half-class, half-attribute page: `class="HarborHero HarborHero--wide"` wrapping `[stack][gap]` wrapping a BEM `card-header`, plus a theme file that redefines flex. Three systems, none accountable.

Ask of every custom selector:

1. Is this identity that belongs in the **theme** (heading face, page wash, named surface)?
2. Is this structure that belongs in **Juice** (a slot, a variant, a primitive)?
3. Is this a **one-off** the product will not reuse (an editorial illustration crop, a one-page marquee texture)?

If you cannot answer, it is too early to write the CSS. If you answer (3) but then copy the class to three pages, it is no longer (3).

Authoring components — Sig accordion factories, custom widgets — should expose Juice-shaped hooks, not hide markup behind an opaque class bag. [Component authoring](../juice-component-authoring.md). You will not write a Juice component in this lesson. You will avoid creating a private framework that only you can extend.

## Juice mapping

The recommended split is already the Juice front door:

| Layer | Typical selectors | Example |
|---|---|---|
| Juice | attributes | `stack`, `card="feature"`, `field` |
| Theme | `[theme="harborpress"]`, named surfaces, semantic element defaults | heading font, `--jx-page` |
| App | product classes or attribute hooks you own | `.harbor-colophon`, `[drop-cap]` if you truly need it |

[Styles](../juice-styles.md) shows hybrid markup from Blackwater Sound: Juice structure, `theme="blackwatersound"`, then small app selectors for editorial/retail polish.

[Best practices](../juice-best-practices.md):

- one job per wrapper
- wrappers own placement
- components own structure
- prefer token-backed values
- use slots when they exist
- keep custom classes small

[Anti-patterns](../juice-anti-patterns.md):

1. Semantic elements as generic layout wrappers
2. Building a feed with `section`
3. Desktop widths left on collapsing shells
4. Width used to solve spacing
5. Forgetting gap in width math
6. Loud surfaces everywhere
7. Class-based escape hatches for things that should be Juice
8. BEM-style compound child names

Rules in `docs/juice/rules/` (including the `Field Scrope` typo) are **advanced design notes**. Use them when you are deciding whether an attribute is legal in context, or whether padding should win over height. They are not a second course.

**When app CSS is OK**

- a colophon lockup that uses a one-off font optical size
- cropping a cover image to a specific ratio on one page
- a print stylesheet
- a motion flourish the `motion` attribute does not express, with `prefers-reduced-motion` respected
- bridging a legacy block you cannot yet rewrite

**When app CSS is not OK**

- reimplementing `stack` / `gap` because the class felt familiar
- `.card-header` next to `[card] [header]`
- global `section { display: grid }` that fights theme semantics
- copying Juice token hexes into a new `:root` instead of using attributes or theme variables
- “just this once” layout framework (`--harbor-gutter`, `--harbor-bp-md`) that authors must learn *and* Juice

Juice motion (`motion="fade.in"`) is emerging. Prefer it for catalog-level motion. Do not start an animation system in the app for a fade-in.

## Worked example

Harbor Press earns one honest exception: a colophon under the footer that the theme should not have to know about.

**Markup stays Juice**

```html
<footer stack gap="1" padding="2rem">
  <div row gap="1" centered>
    <button btn="outline" theme="citrusmint-300" scale="lg">Catalog</button>
    <button btn="text" theme="citrusmint-300" scale="lg">Contact</button>
  </div>
  <p class="harbor-colophon" font="lato" fontSize="sm">
    Set in the shop. Bound in editions of two hundred.
  </p>
</footer>
```

**App CSS names the exception**

```css
/* apps/harbor-press/front/src/harbor.css
   Product-only: optical sizing for the colophon line.
   Not a layout system. Not a color palette. */
.harbor-colophon {
  letter-spacing: 0.04em;
  max-width: 28rem;
  margin-inline: auto;
  text-wrap: pretty;
}
```

What this is *not*:

```html
<div class="harbor-footer harbor-footer--cluster">
  <div class="harbor-footer__actions">
    <button class="harbor-btn harbor-btn--outline">Catalog</button>
  </div>
</div>
```

That second block abandoned Juice for a private BEM island. The course will not finish that island for you.

**A theme-shaped need, wrongly put in app CSS**

```css
/* Wrong place if every heading should look like this */
h1, h2, h3 {
  font-family: Oswald, sans-serif;
}
```

That is identity. It belongs in `juice.theme.yaml` typography, not in `harbor.css`.

**A Juice-shaped need, wrongly put in app CSS**

```css
.harbor-stack {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
```

That is `stack gap="2"`.

## Exercises

1. Write three selectors you are *tempted* to add for Harbor Press. Sort them into theme / Juice / app. Delete or relocate the ones that do not belong in app CSS.
2. Find one anti-pattern in your current page (nested `section`, leftover width, BEM slot, loud fills). Fix it and name the anti-pattern.
3. Optional: add `motion="fade.in"` to one card if you have imported a Juice build that includes motion. Confirm it does nothing harmful under `prefers-reduced-motion` ([Animations](../juice-animations.md)). Skip if you are markup-only.

## Checkpoint

Show one app selector and defend it in two sentences: why it is not a theme variable, and why it is not a Juice attribute. If you have zero app CSS, say what you would allow later — “none ever” is not the hybrid lesson.

[Answers](./answers.md#lesson-08)

## Go deeper

- [Best practices](../juice-best-practices.md)
- [Anti-patterns](../juice-anti-patterns.md)
- [Styles](../juice-styles.md)
- [Component authoring](../juice-component-authoring.md)
- [Template authoring](../juice-template-authoring.md)
- [Naming](../juice-naming.md)
- [Rules](<../rules/001-Field Scrope.md>) — advanced, optional

## Next lesson

[09 — Capstone](./09-capstone.md) asks you to ship a Harbor Press slice and explain the layers.
