# Juice Component Authoring

## Purpose

This guide explains how to think about components in Juice.

Juice components should feel native to the attribute system, not like hidden black boxes with random internal styling.

## Core Principle

A Juice component should preserve the same worldview as normal Juice markup:

* semantics first
* layout through Juice primitives
* styling through attributes and tokens
* behavior through runtime or app code

## Component Responsibilities

A Juice component can own:

* internal structure
* accessibility wiring
* behavior
* region boundaries

It should not unnecessarily hide:

* layout flow
* theming opportunities
* styling hooks for meaningful internal parts

## Internal Styling Hooks

Components should allow internal parts to be styled intentionally.

A good pattern is named attribute bags or prop groups like:

* root attrs
* trigger attrs
* panel attrs

This keeps the component readable and keeps Juice composability intact.

## Example Direction

```tsx
<Accordion
  name="faq"
  title="What is Juice?"
  triggerAttrs={{
    bgColor: "blue-700",
    fontColor: "white-100"
  }}
  panelAttrs={{
    bgColor: "white-100",
    paddingX: "1rem",
    paddingY: "1rem"
  }}
/>
```

## Component Semantics

Components should still emit meaningful HTML when possible.

Examples:

* accordions should use buttons and panels correctly
* nav components should still rely on `nav`
* cards should not fake semantics unless needed

## Reactive Attributes

If a component depends on reactive state:

* reactive attributes should use the supported reactive mapping style
* avoid mixing reactive and non-reactive state on the same concern

The component should either:

* drive output declaratively
* or deliberately manage DOM state in the runtime layer

but not half-do both.

## Good Juice Component Traits

A strong Juice component should be:

* semantically meaningful
* attribute-friendly
* structurally clear
* accessible
* not dependent on hidden class soup

## Summary

Juice components should feel like Juice markup with structure and behavior, not like an unrelated component system pasted on top.
