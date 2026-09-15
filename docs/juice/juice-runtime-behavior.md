# Juice Runtime Behavior

## Purpose

Juice is not only a CSS system.

It also has a browser runtime layer for built-in interactive behavior.

This document explains how to think about that layer.

## Core Rule

If valid Juice markup exists in the browser, the feature should work automatically.

That is the desired standard for Juice runtime behavior.

Users should not need to manually initialize built-in Juice features in normal cases.

## What This Means

Juice runtime behavior should be:

* browser-driven
* framework-agnostic
* aligned with Juice markup conventions
* automatic when possible

It should not require:

* app glue
* framework-specific adapters
* custom user bootstrapping for basic behavior

## Current Examples

The navigation and accordion runtimes are the current examples.

They work by:

* watching for valid Juice nav or `[accordion]` markup
* booting automatically in the browser
* responding to DOM changes
* applying behavior without user init code

See [Juice Navigation Runtime](./juice-navigation-runtime.md) and [Juice Accordion Runtime](./juice-accordion-runtime.md).

## Runtime Scope

The runtime should own:

* built-in interaction logic
* automatic behavior tied to Juice markup
* accessibility state where appropriate

It should not try to own:

* business logic
* app-specific workflows
* framework state management

## Good Runtime Features

Shipped built-in runtime features include:

* navigation
* accordion / disclosure behavior

Future built-in runtime features could include:

* tabs
* drawers
* additional disclosure patterns

But each should follow the same rule:

* valid Juice markup should be enough

## Summary

Juice runtime behavior should feel like a natural extension of the markup system, not a separate app framework.
