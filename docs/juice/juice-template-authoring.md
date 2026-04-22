# Juice Template Authoring

## Purpose

Templates are one of the best ways to pressure-test Juice.

They reveal:

* where the primitives are strong
* where layout composition breaks down
* where visual language needs more support

This guide explains how to build templates that feel like real products instead of disconnected demo blocks.

## Start With the Real Page Type

Before building, identify what kind of page it is:

* retail homepage
* SaaS marketing page
* dashboard
* social feed
* booking/appointment site

Different page types need different flow.

Do not start with generic “hero + cards + footer” assumptions.

## Use a Page Frame

Most templates should start with:

* `main stack`
* `content` frames
* semantic page regions

This keeps the page readable and consistent.

## Use Repeating Pattern Families

A good template usually repeats a few strong patterns:

* hero split
* shelf/grid
* feature row
* services band
* footer cluster

That is better than inventing a new composition for every section.

## Use Layout First, Aesthetic Second

The strongest workflow is:

1. get the flow right
2. get the semantics right
3. then refine color, surface, and type

If the layout is wrong, aesthetic polish will not save the template.

## Good Template Signals

A good Juice template:

* has a clear shell
* uses meaningful section boundaries
* has repeating rhythm
* uses surfaces consistently
* uses color intentionally, not constantly

## Current Best Examples

The current strongest layout examples are:

* Game Store Inspired Template
* cPanel Clone Template

They are useful because they exposed:

* when `stack` should replace `section`
* when shell width math breaks responsive collapse
* when `content` and `container` should be used more deliberately

## Summary

Template authoring in Juice should be treated like system testing.

A template is not just an example page.
It is evidence of how the framework behaves in real composition.
