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

The navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, and combobox runtimes are the current examples.

They work by:

* watching for valid Juice nav, `[accordion]`, `[tabs]`, `[modal-overlay]`, `[drawer-overlay]`, `[toast-region]`, `[popover-root]`, `[wizard-shell]`, `[tooltip-root]`, or `[combobox]` markup
* booting automatically in the browser
* responding to DOM changes
* applying behavior without user init code

See [Juice Navigation Runtime](./juice-navigation-runtime.md), [Juice Accordion Runtime](./juice-accordion-runtime.md), [Juice Tabs Runtime](./juice-tabs-runtime.md), [Juice Modal Runtime](./juice-modal-runtime.md), [Juice Drawer Runtime](./juice-drawer-runtime.md), [Juice Toast Runtime](./juice-toast-runtime.md), [Juice Popover Runtime](./juice-popover-runtime.md), [Juice Wizard Runtime](./juice-wizard-runtime.md), [Juice Tooltip Runtime](./juice-tooltip-runtime.md), and [Juice Combobox Runtime](./juice-combobox-runtime.md). Toast is a non-modal stack (`[toast-region]` / `[toast]`), not a dialog. Popover is a non-modal anchored dialog (`[popover-root]` / `[popover-panel]`), not a modal, drawer, or toast. Wizard is a multi-step onboarding shell (`[wizard-shell]` / `[step-page]`), not a dialog and not APG Tabs. Tooltip is a hover/focus tip (`[tooltip-root]` / `[tooltip-panel]`), not a popover and not native `title`. Combobox is an input + listbox popup (`[combobox]` / `[combobox-list]`), not a native `<select>` and not a popover.

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
* tabs
* modal / dialog
* drawers
* toasts / snackbars
* popovers
* wizards / multi-step shells
* tooltips / hover-focus tips
* comboboxes / list autocomplete

Future built-in runtime features could include:

* additional disclosure patterns

But each should follow the same rule:

* valid Juice markup should be enough

## Summary

Juice runtime behavior should feel like a natural extension of the markup system, not a separate app framework.
