# 01 — What a design system is, and why Juice

[Previous](./00-first-look.md) · [Course](./README.md) · [Next](./02-tokens.md)

**Goal:** describe a design system as layered decisions, and place Juice in that stack without treating it as a utility kit or a component library. Allow 45 minutes.

If you have not opened a pretty page yet, start with [00 — See it in 10 minutes](./00-first-look.md). Then come back here to understand why that Harbor Press markup is shaped this way.

## Learning goals

- Say what a design system owns, and what it does not
- Contrast attribute-first composition with utility-class soup and heavyweight components
- Load Juice core + a theme and write one honest page shell
- Know where this course stops and the reference docs begin

## Concepts

A design system is a shared language for making interfaces that belong together. It is not a Figma file, a component folder, or a CSS framework by itself. Those are artifacts. The system is the set of decisions they encode:

- **Values** — what “spacing 2” or “heading color” means
- **Vocabulary** — the names authors are allowed to use
- **Composition rules** — how parts nest, and which parts own placement vs structure vs paint
- **Identity** — how a brand applies those parts without rewriting layout

CSS already has a cascade, inheritance, and custom properties. A design system decides which of those knobs are public, which are theme-owned, and which stay in product CSS.

Two common substitutes fail in opposite directions.

**Utility soup** puts every visual decision on the element (`flex flex-col gap-8 p-8 text-xl`). The markup is complete and also noisy. Shared meaning (“this is a card”) lives in the author’s head, not in the system. Changing a product-wide rhythm means hunting class strings.

**Heavyweight components** hide structure behind `<Card variant="feature">`. Authors get consistency and lose visibility. Layout becomes a prop API. Product-specific polish either forks the component or fights it with `!important`.

A third model keeps **intent in markup** without turning every declaration into a class or a React prop. Attributes name structure and token roles. Themes bind identity. App CSS handles exceptions that should not become framework behavior.

That is a design system only if the names are stable, the layers do not steal from each other, and authors can predict what a page will do without reading generated CSS.

## Juice mapping

Juice is a CSS-first, attribute-driven styling library. The current public model, from [Getting Started](../juice-getting-started.md) and the [Juice README](../README.md):

| Layer | Owns | Does not own |
|---|---|---|
| Juice attributes | Structure, spacing, responsive primitives, surface *hooks* | Brand voice, product state |
| Theme CSS | Typography, color relationships, semantic defaults, named surfaces | `stack` / `row` / `gap` behavior |
| App CSS | Small product-specific polish | Shared layout language |
| Sig.js or app JS | Behavior and local state | Styling contract |

Shipped entrypoints:

```ts
import "@citrusworx/juiceui/styles";
import "@citrusworx/juiceui/styles/themes/citrusmint";
```

```html
<body theme="citrusmint">
  <main stack gap="2">
    <section padding="2rem">
      <h1>Harbor Press</h1>
    </section>
  </main>
</body>
```

`stack` and `gap` are Juice. `theme="citrusmint"` is identity. Neither is a Vue/React component. Importing `@citrusworx/juiceui` (the JS entry) also auto-starts navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, and banner runtimes for valid markup. You do not need that for this lesson.

Juice is **stable-ish** as an attribute model and **emerging** as a theme and component system. See the [maturity matrix](../juice-maturity-matrix.md). Do not wait for a finished “Juice Design System 1.0” to start thinking in layers.

What Juice is not:

- a utility-class clone with shorter names
- a replacement for semantic HTML
- a behavior framework
- a promise that every visual idea belongs in an attribute

## Worked example

Harbor Press begins as a single meaning: this page is a small press introducing itself. One `main`, one `section`, Juice for vertical flow.

```html
<body theme="citrusmint">
  <main stack gap="2">
    <section stack gap="1" padding="2rem">
      <p>Independent publishing</p>
      <h1>Harbor Press</h1>
      <p>
        Short-run books, careful typesetting, and a catalog that still fits on one shelf.
      </p>
    </section>
  </main>
</body>
```

Why this is a system move, not just HTML:

- `main` and `section` name meaning. They are not layout wrappers. [Semantics](../juice-semantics.md) is the rule: one section per meaning; `div` does most visual grouping later.
- `stack` + `gap` name flow and rhythm. You did not write `display: flex; flex-direction: column`.
- `theme="citrusmint"` is a brand contract, not a background class on every child.
- The first paragraph is just copy. Do not invent a kicker attribute; themes may style `p` by context later.

A utility-soup version of the same page would encode mint, padding, and flex on every node. A component-library version would hide the section inside `<Hero kicker="...">`. Juice leaves the structure readable.

Save this into the Harbor Press workbench from [00 — See it in 10 minutes](./00-first-look.md) (or the [course hub](./README.md) Workbench). You will keep growing this file.

## Exercises

1. Rewrite the hero as utility-class markup (invent the class names if you want). Then write one sentence: what shared decision became invisible?
2. Rewrite it as a single fictional `<PressHero>` component with props. Then write one sentence: what can a later author no longer see in the page?
3. Add a second `section` for “This season” with one paragraph. Do not add cards, grids, or colors yet. The job is meaning + stack, not a landing page.

## Checkpoint

In your own words: what does Juice own on this page, what does the theme own, and what would be wrong to solve with a new CSS class? Why is `section` the right element for the introduction and the wrong element for “a vertical lane of wrappers”?

[Answers](./answers.md#lesson-01)

## Go deeper

- [Getting Started](../juice-getting-started.md) — install, imports, mental model
- [Styles](../juice-styles.md) — the three-layer public shape
- [Layers](../juice-layers.md) — Juice vs theme responsibilities
- [Maturity matrix](../juice-maturity-matrix.md) — what is ready today
- [Make a web app](../../webengine/make-a-web-app.md) — where Juice sits in the stack-wide outline

## Next lesson

[02 — Tokens and visual language](./02-tokens.md) turns “mint and large type” into shared values instead of one-off taste.
