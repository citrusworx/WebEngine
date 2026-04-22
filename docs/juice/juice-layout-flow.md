# Juice Layout Flow

## Purpose

This document explains how to construct layouts in Juice so they flow naturally with the framework instead of fighting it.

The goal is not just to make layouts “work.”

The goal is to make them:

* readable
* predictable
* responsive by default
* easier to refine visually later

This guide reflects the lessons learned while refactoring the strongest current Juice templates:

* [Game Store Inspired Template](/d:/CitrusWorx/libraries/juice/src/templates/html/bigbox-retail/gamestore-inspired.html)
* [cPanel Clone Template](/d:/CitrusWorx/libraries/juice/src/templates/html/cpanel-clone/index.html)

These two templates exposed the most important layout truths in Juice so far.

---

## Core Principle

Juice already has built-in responsiveness.

That means layout construction should focus on:

* choosing the right primitive
* letting the framework collapse and wrap naturally
* avoiding unnecessary width constraints

Do not approach Juice like a system where every breakpoint must be manually authored.

Instead:

* build a strong default structure
* use Juice primitives intentionally
* let responsive behavior emerge from those primitives

---

## Semantic Rule First

Before choosing a layout primitive, apply this Juice rule:

* one section per meaning

Juice uses HTML5 elements semantically first.

That means:

* `section` describes a meaningful content grouping
* `header`, `main`, `aside`, `footer`, `nav`, and similar elements should be used when their semantic meaning is true
* `div` should do most of the visual grouping work

Another way to say it:

* HTML5 elements describe what the content is
* visual composition should usually be built with `div`

In practice, Juice should rarely produce deep patterns like:

```html
<section>
  <section>
    ...
  </section>
</section>
```

That usually means the semantic layer and the layout layer have been mixed together.

A better pattern is:

```html
<section>
  <div stack gap="1">
    ...
  </div>
</section>
```

or:

```html
<section>
  <div row gap="1">
    ...
  </div>
</section>
```

So the first question is not:

* what layout do I need?

It is:

* what does this content mean?

Then choose the layout primitive inside that semantic boundary.

---

## The Main Layout Primitives

### `stack`

Use `stack` when the layout should stay vertical in every context.

Examples:

* page flow
* feed lanes
* control panel sections
* cards with internal content
* promo copy blocks
* sidebars that should read top-to-bottom

Good mental model:

> A `stack` is a content lane.

If something should read as one item after another, use `stack`.

### `row`

Use `row` when the layout is horizontal on larger screens and allowed to collapse vertically on smaller screens.

Examples:

* masthead groups
* sidebar + workspace shells
* split hero sections
* two-column callout areas
* action/button groups

Important:

Juice already collapses `row` on smaller screens.

That means `row` is usually the right shell primitive when desktop is horizontal and mobile should stack.

### `section`

Use `section` when the content is one meaningful section of the page.

Examples:

* a featured products section
* a pickup and delivery section
* a membership section
* a help section
* a services section

Good mental model:

> A `section` names a meaning, not just a shape.

Inside that `section`, use `div` plus Juice attributes to create the visual layout.

That means `section` should not be treated like a generic layout wrapper.

### `container`

Use `container` when you want built-in spacing and internal breathing room.

This is especially useful when:

* inner content is pressing too hard against edges
* a grouped set of cards needs more natural inset spacing
* you want a local “comfort zone” inside a larger panel

`container` is a spacing tool, not a shell layout tool.

### `content`

Use `content` when you want a page area centered and constrained to Juice’s content width.

This is especially important for:

* headers
* promo strips
* main page shells
* footer groups

Good mental model:

> `content` sets the readable page frame.

It should be used more often than ad hoc page-width control.

---

## The Most Important Rule

Use the outermost primitive that matches the real behavior of the layout.

Examples:

* A feed should be `stack`, not `section`
* A sidebar + workspace shell should be `row`, not `section`
* A shelf of cards should be `section`, not a hand-built width grid
* A centered page frame should use `content`, not just repeated padding everywhere

Many Juice layout problems come from choosing the wrong primitive first and then trying to patch around that mistake later.

---

## Layout Flow Patterns

## Pattern 1: Page Frame

Use this when constructing the overall page shape.

```html
<main stack gap="0">
  <header>
    <div content>...</div>
  </header>

  <div content stack gap="1">
    ...
  </div>
</main>
```

Why this works:

* `main stack` keeps page flow linear
* `content` centers the page and sets a readable max width
* inner layout decisions happen inside a stable frame

Use this pattern for:

* retail homepages
* dashboards
* product pages
* marketing sites

---

## Pattern 2: Sidebar + Workspace

Use this when the desktop layout is two-lane but should collapse naturally on smaller screens.

```html
<div content row gap="1">
  <aside stack gap="1">
    ...
  </aside>

  <div stack gap="1">
    ...
  </div>
</div>
```

Why this works:

* `row` gives the desktop shell
* Juice collapses it on smaller screens
* `stack` keeps each lane internally readable

This is the correct pattern for the cPanel-style template shell.

Do not use:

* `section` for the outer shell

Why:

`section` will treat the sidebar and workspace like peer responsive blocks instead of a shell structure.

---

## Pattern 3: Hero Split

Use this when one side is copy and the other is image/media/promo.

```html
<div bgColor="white-100" rounded="xl" paddingX="2rem" paddingY="2rem">
  <div row wrap centered gap="1">
    <div width="48%" stack gap="1">
      ...
    </div>

    <div width="48%" stack gap="1">
      ...
    </div>
  </div>
</div>
```

Why this works:

* `row` gives the desktop side-by-side composition
* `wrap` allows a clean collapse
* widths are light enough to leave room for gap

This is useful for:

* game store hero blocks
* product hero modules
* split promos

Important:

If you use percentages inside `row`, leave room for `gap`.

`48% + 48% + gap` works better than `50% + 50% + gap`.

---

## Pattern 4: Product Shelf / Deal Grid

Use this when multiple cards are peers and should auto-flow responsively.

```html
<section>
  <div stack gap="1">
    <div row wrap gap="1">
      <div bgColor="white-100" rounded="xl" paddingX="1rem" paddingY="1rem">
        ...
      </div>
      <div bgColor="white-100" rounded="xl" paddingX="1rem" paddingY="1rem">
        ...
      </div>
      <div bgColor="white-100" rounded="xl" paddingX="1rem" paddingY="1rem">
        ...
      </div>
    </div>
  </div>
</section>
```

Why this works:

* `section` provides the semantic boundary
* `div` handles the visual grouping
* cards stay visually consistent
* you avoid misusing semantic elements as generic wrappers

Use this for:

* product cards
* department tiles
* feature cards
* service modules

The Game Store template is strongest where it treats `section` as the meaning boundary and uses inner layout primitives for the shelf itself.

---

## Pattern 5: Operational Panel + Distinct Utility Panel

Use this when two cards should sit side-by-side but feel different in role.

Example:

* account summary + maintenance panel
* database activity + mailbox usage
* featured brand block + services block

Pattern:

```html
<section>
  <div bgColor="white-100" rounded="xl" paddingX="1.5rem" paddingY="1.5rem">
    ...
  </div>

  <div bgColor="obsidian-900" rounded="xl" paddingX="1.5rem" paddingY="1.5rem">
    ...
  </div>
</section>
```

Why this works:

* `section` handles responsive pairing
* the contrast between surfaces creates role clarity

This is one of the most useful layout + surface combinations in Juice so far.

---

## Width Rules

## Use Width Sparingly

Width should not be the first tool you reach for.

Use width only when:

* you are defining a real outer box
* a hero needs a balanced two-column split
* a row needs two-up or three-up math
* a child must intentionally occupy part of a row

Do not use width when:

* padding would solve the visual issue
* the layout is actually a `stack`
* `section` could already solve the grouping

---

## Width Must Respect Gap

This is one of the biggest recurring layout errors.

If a row contains two items and a gap:

* `50% + 50% + gap` will often wrap
* `48% + 48% + gap` is safer
* `46% + 46% + gap` is safer still

If Juice adds gap after your percentage math reaches 100%, wrapping is correct behavior.

The layout is not broken.
The math is.

---

## Never Leave Desktop Widths on Collapsed Mobile Shells

This was a major lesson in the cPanel refactor.

Example of what goes wrong:

```html
<div row>
  <aside width="24%">...</aside>
  <div width="74%">...</div>
</div>
```

On mobile, Juice will collapse the `row` to a column.

But the children still keep those explicit widths.

That creates tiny unusable stacked columns.

If the shell should collapse naturally, the children should often not carry explicit shell widths at all.

Use:

```html
<div row>
  <aside>...</aside>
  <div>...</div>
</div>
```

unless the width rule is absolutely necessary.

---

## When to Use `container`

Use `container` when grouped content is touching the edges too aggressively.

This came up in the cPanel “Account at a glance” panel.

Without a local container, the grouped stat tiles felt pressed against the panel edges.

With a local container:

* spacing became more natural
* the card cluster had breathing room
* the whole panel felt more deliberate

Pattern:

```html
<div bgColor="white-100" rounded="xl" paddingX="1.5rem" paddingY="1.5rem">
  <div container stack gap="1">
    ...
  </div>
</div>
```

Use this when the problem is interior comfort, not shell structure.

---

## When to Avoid `section`

Avoid `section` when you are only trying to solve layout.

Bad fits:

* feed columns with no distinct section meaning
* generic wrappers around another `section`
* stacked admin panels that are just visual subdivisions
* row/column containers whose only job is placement

If the content should stay vertical, use `div stack`.

If the content should split horizontally, use `div row`.

This was one of the biggest lessons from the Facebook-style and cPanel-style refactors:

the semantic boundary and the layout boundary are not always the same thing.

---

## Real Lessons From the Templates

## Lesson 1: The Feed Needed To Be a `stack`

In the Facebook-style template, using `section` for the feed caused wrapping behavior that broke the composition.

The fix was simple:

* the feed was not a new semantic section
* it was a vertical content lane inside a page area
* therefore it needed `div stack`

This is now one of the clearest layout rules in Juice.

---

## Lesson 2: The cPanel Shell Needed `row`, Not `section`

In the cPanel template, using `section` too high in the hierarchy turned the dashboard shell into a broken card grid.

The correct structure was:

* `div row` for sidebar + workspace
* `div stack` for the workspace flow
* `section` only where a real content section existed

This is a major pattern to reuse for admin interfaces and dashboard shells.

---

## Lesson 3: `content` Should Be Used More Often

Early template passes often relied too heavily on raw padding and ad hoc width choices.

The better pattern is:

* `content` for page framing
* `container` for local spacing comfort
* `stack`, `row`, and `section` for layout behavior

This gives pages a cleaner internal logic and makes future refinements easier.

---

## A Recommended Decision Tree

When building a new layout block, ask:

### 1. Is this a real semantic section?

If yes:

* use the HTML5 element that matches the meaning

Usually:

* `section`
* `aside`
* `nav`
* `header`
* `footer`

Then build the visual layout inside it with `div`.

### 2. Is this one vertical content lane?

If yes:

* use `div stack`

### 3. Is this a shell with horizontal desktop behavior that should collapse on smaller screens?

If yes:

* use `div row`

### 4. Is this a set of peer cards or modules that should auto-flow responsively inside a semantic section?

If yes:

* keep the semantic section, then use inner `div row wrap` or other visual grouping primitives

### 5. Does this part of the page need a centered readable frame?

If yes:

* use `content`

### 6. Does this grouped content need more interior breathing room?

If yes:

* use `container`

---

## Best Practices

* Start mobile-first in your thinking, even if the first visual pass is on desktop.
* Use semantic HTML5 elements for meaning, not for convenience.
* Use `div stack` more often than you think.
* Use `div row` for shell composition and horizontal grouping.
* Let Juice collapse `row` for you instead of manually rebuilding layouts.
* Keep width math light and always leave room for `gap`.
* Use `content` to control page framing.
* Use `container` to solve interior breathing problems, not shell problems.
* Do not over-constrain the layout early.
* Get the flow right first, then refine color, surface, and typography.

---

## Anti-Patterns

* Using `section` as a generic wrapper everywhere
* Nesting `section` inside `section` just to solve layout
* Building a feed with `section` instead of `div stack`
* Assigning desktop widths to shell children that need to collapse on mobile
* Using `50%` widths in a gapped row and then being surprised by wrapping
* Solving spacing problems with width or height instead of padding or container spacing
* Using semantic HTML5 elements as if they were generic layout divs

---

## Summary

Juice layout works best when the structure matches the real job of the content.

The most reliable pattern is:

* semantic HTML5 elements for meaning
* `content` for page framing
* `div stack` for linear lanes
* `div row` for shell splits and controlled horizontal composition
* `container` for interior breathing room

The Game Store and cPanel templates are currently the best examples of this approach.
They show that the most important part of layout in Juice is not complexity.

It is preserving semantic meaning first, then choosing the right layout primitive inside that boundary.
