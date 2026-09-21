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

The navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, and banner runtimes are the current examples.

They work by:

* watching for valid Juice nav, `[accordion]`, `[tabs]`, `[modal-overlay]`, `[drawer-overlay]`, `[toast-region]`, `[popover-root]`, `[wizard-shell]`, `[tooltip-root]`, `[combobox]`, or `[banner]` markup
* booting automatically in the browser
* responding to DOM changes
* applying behavior without user init code

See [Juice Navigation Runtime](./juice-navigation-runtime.md), [Juice Accordion Runtime](./juice-accordion-runtime.md), [Juice Tabs Runtime](./juice-tabs-runtime.md), [Juice Modal Runtime](./juice-modal-runtime.md), [Juice Drawer Runtime](./juice-drawer-runtime.md), [Juice Toast Runtime](./juice-toast-runtime.md), [Juice Popover Runtime](./juice-popover-runtime.md), [Juice Wizard Runtime](./juice-wizard-runtime.md), [Juice Tooltip Runtime](./juice-tooltip-runtime.md), [Juice Combobox Runtime](./juice-combobox-runtime.md), and [Juice Banner Runtime](./juice-banner-runtime.md). Toast is a non-modal stack (`[toast-region]` / `[toast]`), not a dialog. Popover is a non-modal anchored dialog (`[popover-root]` / `[popover-panel]`), not a modal, drawer, or toast. Wizard is a multi-step onboarding shell (`[wizard-shell]` / `[step-page]`), not a dialog and not APG Tabs. Tooltip is a hover/focus tip (`[tooltip-root]` / `[tooltip-panel]`), not a popover and not native `title`. Combobox is an input + listbox popup (`[combobox]` / `[combobox-list]`), not a native `<select>` and not a popover. Banner is an inline alert / callout (`[banner]` / `[banner-close]`), not a toast stack and not a dialog.

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
* banners / inline alerts

Future built-in runtime features could include:

* additional disclosure patterns

But each should follow the same rule:

* valid Juice markup should be enough

## Escape / layering

When several Emerging surfaces are open, Escape is owned in this order (highest first):

1. **Modal / drawer overlays** — an open `[modal-overlay]:not([hidden])` or `[drawer-overlay]:not([hidden])` owns Escape. Modal and drawer stay independently exclusive: both may be open at once. This slice does not make them exclusive across types.
2. **Popover** — an open `[popover-root]:not([hidden])` owns Escape after dialogs, and yields when a dialog overlay is open.
3. **Combobox** — an open `[combobox-list]:not([hidden])` owns Escape after popover, and yields when a dialog overlay or open popover exists.
4. **Toast** — the most recent visible toast owns Escape after the above, and yields when a dialog overlay, open popover, open combobox list, or open tooltip exists.
5. **Tooltip** — an open tip hides last among these, and yields when a dialog overlay, open popover, or open combobox list exists. Toast does not block tooltip Escape: the tip can hide while toasts remain.
6. **Banner** — never steals Escape. Dismiss stays on `[banner-close]`.
7. **Accordion** — Escape collapses the focused or last open item only when that accordion context already owns the key. There is no global accordion Escape. Tabs, navigation, and wizard leave Escape out of scope (tabs explicitly ignores it).

Yield checks live in the individual runtimes. Shared helpers are a later extract.

## Summary

Juice runtime behavior should feel like a natural extension of the markup system, not a separate app framework.
