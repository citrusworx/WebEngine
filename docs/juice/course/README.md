# Design systems, understood through Juice

Learn to think in design systems by composing real Juice markup.

This is a single progressive course, not a short series and not another encyclopedia. You will learn *why* tokens, surfaces, themes, and composition layers exist, then map each idea onto the attributes Juice actually ships. The [Juice reference set](../README.md) stays the deep dive.

**See it in 10 minutes.** Open [00 — See it in 10 minutes](./00-first-look.md) and paste the Harbor Press hero + cards before any Foundations essays. Then come back here, or go straight to Lesson 01 to understand why that markup is shaped this way.

## The promise

By the end you should be able to:

- explain a design system as layered decisions, not a pile of components
- choose Juice attributes for structure, tokens for visual language, and themes for identity
- compose a small branded page without inventing a parallel class system
- know when app CSS is the right tool, and when it is an escape hatch
- find the right reference page instead of rereading the whole docs tree

Juice is the vehicle. The subject is design-system thinking.

## Who it is for

Two audiences share the same path:

- people learning CSS and design systems who want a concrete system to practice in
- Juice users who have the reference pages and want a curriculum

You do not need prior Juice, Sig.js, or WebEngine experience. You should be comfortable reading HTML and CSS. You do not need to be a designer.

## Prerequisites

- HTML structure and semantic elements (`main`, `section`, `nav`, `form`)
- CSS ideas: cascade, inheritance, flex/grid, custom properties
- optional: Node.js and a package manager (npm, pnpm, yarn, or bun) if you want to install `@citrusworx/juiceui` and preview markup

You can complete the course as a reading-and-markup study. A local stylesheet import makes the worked examples visible; it is not required to understand the argument.

## How this relates to other docs

| Document | Job |
|---|---|
| **This course** | **Do this first.** Sequence, concepts, exercises, and a capstone |
| [Juice reference](../README.md) | Lookup for attributes, tokens, themes, and runtimes |
| [Page tutorial](../juice-page-tutorial.md) | A *second* build: a different CitrusWorx landing page. Same grammar, not a competing start |
| [Patterns](../juice-patterns.md) | Copyable compositions after you know *why* they are shaped that way |
| [Maturity matrix](../juice-maturity-matrix.md) | What is stable-ish vs emerging vs draft |
| [Make a web app](../../webengine/make-a-web-app.md) | Stack-wide hub. Its Juice chapter is a reading list; this course is the written Juice curriculum |
| [HTTP through Seltzer](../../seltzer/http-course/README.md) and [SQL through Nectarine](../../nectarine/database-course/README.md) | Sibling courses in other domains |

Do not rewrite your notes from the reference pages into this folder. When a lesson needs depth, it links out.

## What is real, and what is not promised

Juice is an active alpha (`@citrusworx/juiceui` 0.7.0 in the [maturity matrix](../juice-maturity-matrix.md)). Lessons use shipped attributes and current theme contracts. Three labels keep that honest:

- **Shipped:** present in `libraries/juice` and documented as usable today
- **Emerging / draft:** useful, still evolving; do not treat the spelling as frozen
- **Specified, not shipped:** described in philosophy or specs (`adapt` overrides) — not part of exercises. `variant="monochromatic|glass|tinted"` is shipped; structural `card="…"` recipes stay later.

The course will not invent attributes. If a lesson needs a gap, it says so.

## The running project

**Harbor Press** is a small independent publisher: a catalog of titles, a short subscribe form, and a calm brand. Each lesson adds one layer to the same site. Keep Harbor Press as this course's thread. After you finish, the [page tutorial](../juice-page-tutorial.md) is a *second* build — a different CitrusWorx landing page — not a competing start and not a substitute for the capstone.

Early lessons use token attributes and the shipped `citrusmint` theme. Lesson 6 introduces `tide` and app-owned theme config. Lesson 9 asks you to finish a branded slice you can defend.

This course stays CSS and design-system focused. Sig.js is optional and tiny (a subscribe confirmation, a “saved title” flag). Finishing without Sig is full credit. Juice owns structure and a few built-in widgets; application behavior is out of scope.

## Course route

Plan for roughly 8–12 hours including exercises. Read in order on the first pass. Experienced CSS authors can skim Lessons 1–2 and slow down at 4–8.

| Lesson | Learn | Produce |
|---|---|---|
| [00. See it in 10 minutes](./00-first-look.md) | Open a pretty Harbor Press page before theory | A hero + two title cards in the browser |
| [01. Foundations](./01-foundations.md) | What a design system is; why Juice is attribute-first | A one-section Harbor Press shell |
| [02. Tokens and visual language](./02-tokens.md) | Color, type, spacing, sizing as shared values | Token-backed type and color on that shell |
| [03. Layout as structure](./03-layout.md) | Stack, row, grid, gap, flow; semantics vs wrappers | A page skeleton that reads as structure |
| [04. Surfaces and semantics](./04-surfaces.md) | Card, panel, hero, surface tone | Distinct roles without painting every box |
| [05. Composition patterns](./05-composition.md) | Cards, forms, nav as reusable assemblies | Catalog, subscribe, and top bar |
| [06. Themes and brand identity](./06-themes.md) | Library vs app-owned themes | A theme swap and a small config sketch |
| [07. Responsive systems](./07-responsive.md) | Built-in collapse and scale; when not to fight it | A layout that survives a narrow viewport |
| [08. Hybrid styling and authoring](./08-hybrid-authoring.md) | When app CSS is OK; anti-patterns | A short exception list you can justify |
| [09. Capstone](./09-capstone.md) | Independent composition of a branded slice | A Harbor Press page plus a layer map |

Lesson 00 is a preview, not a checkpoint. Lessons 01–09 each have a checkpoint. Try those before reading [the answer guide](./answers.md). Keep [the glossary](./glossary.md) nearby.

## How to use a lesson

Lessons 01–09 follow the same loop:

1. **Goals** — what you should be able to do afterward
2. **Concepts** — design-system language first, without Juice syntax
3. **Juice mapping** — the shipped attributes and files that express those concepts
4. **Worked example** — Harbor Press markup you can type or adapt
5. **Exercises** — short, local changes
6. **Go deeper** — reference pages, not extra lectures
7. **Next** — the following lesson only

## Workbench

Pick one path. The first-look page uses the same three recipes with a full Harbor Press paste.

### In this repo

From the repository root, after `yarn workspace @citrusworx/juiceui build`, save `harbor-press.html` **at the repo root** (not inside `docs/juice/course/`):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Harbor Press</title>
    <link rel="stylesheet" href="./libraries/juice/dist/index.css" />
    <link rel="stylesheet" href="./libraries/juice/dist/themes/citrusmint.css" />
  </head>
  <body theme="citrusmint">
    <main stack gap="2" padding="2rem">
      <h1>Harbor Press</h1>
    </main>
  </body>
</html>
```

Open that file in a browser. The two `href`s are relative to the repo root. If you insist on keeping the HTML next to these lessons, the same files are `../../../libraries/juice/dist/index.css` and `../../../libraries/juice/dist/themes/citrusmint.css` — but root placement is the path this course recommends.

### From the npm package

Shipped exports, from `libraries/juice/package.json`:

```ts
import "@citrusworx/juiceui/styles";
import "@citrusworx/juiceui/styles/themes/citrusmint";
```

```html
<body theme="citrusmint"></body>
```

`@citrusworx/juiceui/styles` is core CSS (`dist/index.css`). `@citrusworx/juiceui/styles/themes/citrusmint` is the theme (`dist/themes/citrusmint.css`). Library themes `tide`, `aquaflux`, and `kiwipress` use the same `./styles/themes/<id>` shape.

### Standalone HTML

Copy the two built files next to your HTML. Do not hunt through `src/`:

```bash
# after the in-repo build
cp libraries/juice/dist/index.css .
cp libraries/juice/dist/themes/citrusmint.css .

# or after adding @citrusworx/juiceui (npm / pnpm / yarn / bun)
cp node_modules/@citrusworx/juiceui/dist/index.css .
cp node_modules/@citrusworx/juiceui/dist/themes/citrusmint.css .
```

```html
<link rel="stylesheet" href="./index.css" />
<link rel="stylesheet" href="./citrusmint.css" />
```

There is no official CodePen or hosted Juice playground. A local HTML file is the supported outsider path.

Core CSS and theme CSS stay separate. That split is the first design-system lesson: structure is not identity.

## Advanced notes, not the spine

`docs/juice/rules/` holds design-protocol notes (form-scoped attributes, texture, padding over box size). The filename `001-Field Scrope.md` is a typo for *scope*. Useful once you care about where an attribute is legal. Do not start there.

## Start

Open [00 — See it in 10 minutes](./00-first-look.md). Then [Lesson 01 — Foundations](./01-foundations.md).
