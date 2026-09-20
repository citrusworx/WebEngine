# 09 — Capstone: a branded system slice

[Previous](./08-hybrid-authoring.md) · [Course](./README.md) · [Answers](./answers.md)

**Goal:** compose a small Harbor Press page as a design system, not as a screenshot, and explain every layer. Allow 2–3 hours.

## Learning goals

- Build a page that uses Juice structure, a real theme, and at most a thin app CSS file
- Reuse patterns from Lessons 4–5 without pasting the page tutorial
- Survive a narrow viewport without leftover desktop widths
- Write a short layer map another author could follow

## Your brief

Harbor Press needs a **public home slice** that a visiting bookseller could understand in one screen and one scroll. This is not the CitrusWorx infrastructure landing page in [juice-page-tutorial.md](../juice-page-tutorial.md). Do not submit that tutorial with the nouns swapped.

Required regions:

1. **Primary top bar** — brand, two or three links, one action
2. **Hero** — name, one-sentence promise, optional named surface
3. **Catalog** — at least three titles as `card` compositions with slots (`media` or `header`, `body`, `action`)
4. **Subscribe** — a form that uses `field` *inside* the form; stacked or a row that collapses cleanly
5. **Footer** — a short action cluster or colophon

Required system work (not just HTML volume):

- Import Juice **core + one theme**. Library `citrusmint` / `tide` / `aquaflux` / `kiwipress` is acceptable. An app-owned generated theme is better if you can run the generator; a complete YAML sketch counts if you cannot.
- Prefer theme identity for page/heading/body. Local token attributes are allowed where you are making a *local* decision.
- No invented Juice attributes. If you need something unspecified (`adapt`), leave it out and say so. Shipped `variant="monochromatic|glass|tinted"` is allowed.
- At most **one** app CSS file with a short comment at the top stating what it is allowed to do.
- Sig.js is optional and small: a subscribe confirmation, a “saved title” flag. Do not rebuild the page as a SPA to finish this course. This course stays CSS and design-system focused — finishing without Sig is full credit.

Keep behavior honest. A `<form>` that does not POST anywhere is fine if you say so. Juice’s nav/accordion/tabs/modal/drawer/toast/popover/wizard runtimes are optional; they are not the grading surface.

## Make three deliveries

**1. The page.** One HTML file (or a small app route) that includes the five regions. Work in your own folder so the course markdown stays a curriculum, not your source tree.

**2. The identity artifact.** Either:

- `theme="..."` pointing at a shipped library theme you did not fight with leftover `bgColor="white-100"` on a dark page, or
- an app-owned `juice.theme.yaml` (generated CSS optional) with `id`, typography, palette, and at least one named surface you actually use.

**3. The layer map.** A short markdown note (twenty to forty lines) with:

- what Juice owns on this page
- what the theme owns
- what app CSS owns (or “none, and here is the exception I would allow”)
- one leftover you *refused* (a width, a nested section, a BEM slot, a second palette)
- one Juice limit you hit (emerging cards, draft generator, `span` unfinished, no `adapt` API)

## Review rubric

| Area | Points | Evidence |
|---|---:|---|
| Structure | 20 | Semantic regions, primitives chosen on purpose, slots not BEM |
| Visual language | 20 | Restrained tokens, neutrals first, readable type pairing |
| Identity | 20 | Theme contract is the source of brand; named surface used or explicitly declined |
| Responsive honesty | 20 | No leftover `%`/`vw` on collapsing rows; padding over hero height |
| Explanation | 20 | Layer map names owners and a real limit |

A score is feedback, not a certification. A beautiful page that reimplements `stack` in CSS has failed the course. A plain page with a precise layer map has not.

## Suggested build order

Do not start in Figma-to-CSS translation. Rebuild from the course sequence:

1. Shell: `main container stack gap="2"` and five semantic regions
2. Tokens only where the theme does not already speak
3. Layout primitives; no catalog widths
4. `hero` / `card` / `panel` or `card="cta"`
5. Slots, form fields, nav regions
6. Theme import or YAML
7. Narrow-viewport pass
8. One app exception, or none
9. Layer map

If you get stuck on look, restyle with theme and tokens. If you get stuck on arrangement, change the primitive, not the CSS file.

## Optional extensions (not required)

- A pricing row with `card="pricing"`, `plan`, and one `featured` tier (editions, not SaaS seats)
- `nav type="strip"` with a single announcement
- `accordion` for shipping FAQ, with a library theme that binds `--juice-accordion-*`
- `tabs` for “Shop / About” only if the content is actually exclusive panels
- A second page (title detail) that **reuses** the same theme and card slots

Do not turn optional widgets into the capstone. A FAQ accordion that leaks `field` or a tab set used as a grid is a regression.

## Questions for a review conversation

Hand someone the HTML with the CSS files linked. Before they resize, ask them to name:

- the catalog primitive and its collapse
- where heading type comes from
- whether subscribe will stay usable at 360px
- which file they would edit to change the accent

If they have to open DevTools to guess the accent source, the identity layer is not yet a contract.

## Where to go next

- [Juice README](../README.md) — reference front door
- [Page tutorial](../juice-page-tutorial.md) and [Patterns](../juice-patterns.md) — more assemblies
- [Maturity matrix](../juice-maturity-matrix.md) and [Roadmap](../juice-roadmap.md) — what will move
- [Make a web app](../../webengine/make-a-web-app.md) — Sig.js, Nectarine, Seltzer as the next libraries
- Sibling courses: [HTTP through Seltzer](../../seltzer/http-course/README.md), [SQL through Nectarine](../../nectarine/database-course/README.md)

You are done with the curriculum when you can start at the hub and teach the next person from Lesson 01 without opening the attribute encyclopedia first. The encyclopedia is still how you look up `font="playfair-display"` at 11 p.m.
