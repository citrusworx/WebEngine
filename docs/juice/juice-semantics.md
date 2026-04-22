# Juice Semantics

## Purpose

Juice uses HTML5 elements semantically first.

That means semantic elements should describe what the content is, while Juice attributes shape how that content is laid out and styled.

This rule matters because Juice is not meant to turn semantic HTML into random layout wrappers.

## Core Rule

Use one section per meaning.

In practice:

* `section` should represent one meaningful content section
* `aside` should represent supporting or secondary content
* `nav` should represent navigation
* `header` should represent heading or masthead content
* `footer` should represent page or section footer content
* `main` should represent the primary page content

Use `div` for most visual grouping.

## Good Example

```html
<section>
  <div stack gap="1">
    <h2>Featured Products</h2>
    <div row wrap gap="1">
      ...
    </div>
  </div>
</section>
```

The `section` names the meaning.
The `div` handles the visual grouping.

## Bad Example

```html
<section>
  <section>
    <section>
      ...
    </section>
  </section>
</section>
```

This usually means semantic structure is being misused to solve layout.

## Practical Rule

Before adding an HTML5 element, ask:

* does this element describe a real content role?

If yes, use it.

If not, use `div` and apply Juice layout attributes there.

## Where This Matters Most

This rule matters especially in:

* dashboards
* retail homepages
* content feeds
* marketing pages
* app shells

These page types often need a lot of grouping, and it is easy to start nesting semantic elements just to get layout behavior.

Juice should avoid that.

## Relationship to Layout

Semantics and layout are not the same thing.

A section can contain:

* `div stack`
* `div row`
* `div container`
* `div content`

The semantic boundary says what the content is.
The layout primitive says how it flows.

## Summary

In Juice:

* HTML5 elements describe meaning
* `div` usually handles visual grouping
* semantic nesting should stay intentional and shallow
* layout should not depend on abusing semantic elements
