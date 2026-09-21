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

The navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, and menu runtimes are the current examples.

They work by:

* watching for valid Juice nav, `[accordion]`, `[tabs]`, `[modal-overlay]`, `[drawer-overlay]`, `[toast-region]`, `[popover-root]`, `[wizard-shell]`, `[tooltip-root]`, `[combobox]`, `[banner]`, or `[menu-root]` markup
* booting automatically in the browser
* responding to DOM changes
* applying behavior without user init code

See [Juice Navigation Runtime](./juice-navigation-runtime.md), [Juice Accordion Runtime](./juice-accordion-runtime.md), [Juice Tabs Runtime](./juice-tabs-runtime.md), [Juice Modal Runtime](./juice-modal-runtime.md), [Juice Drawer Runtime](./juice-drawer-runtime.md), [Juice Toast Runtime](./juice-toast-runtime.md), [Juice Popover Runtime](./juice-popover-runtime.md), [Juice Wizard Runtime](./juice-wizard-runtime.md), [Juice Tooltip Runtime](./juice-tooltip-runtime.md), [Juice Combobox Runtime](./juice-combobox-runtime.md), [Juice Banner Runtime](./juice-banner-runtime.md), and [Juice Menu Runtime](./juice-menu-runtime.md). Toast is a non-modal stack (`[toast-region]` / `[toast]`), not a dialog. Popover is a non-modal anchored dialog (`[popover-root]` / `[popover-panel]`), not a modal, drawer, or toast. Wizard is a multi-step onboarding shell (`[wizard-shell]` / `[step-page]`), not a dialog and not APG Tabs. Tooltip is a hover/focus tip (`[tooltip-root]` / `[tooltip-panel]`), not a popover and not native `title`. Combobox is an input + listbox popup (`[combobox]` / `[combobox-list]`), not a native `<select>` and not a popover. Banner is an inline alert / callout (`[banner]` / `[banner-close]`), not a toast stack and not a dialog. Menu is an APG menu button (`[menu-root]` / `[menu]` / `[menuitem]`), not a popover, not a combobox, and not a menubar.

When several of those surfaces are open, [Escape / layering](#escape--layering) decides who owns the key. [Z-index bands](#z-index-bands) are a separate structural paint order.

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
* menus / menu buttons

Future built-in runtime features could include:

* additional disclosure patterns

But each should follow the same rule:

* valid Juice markup should be enough

## Escape / layering

When several Emerging surfaces are open, **later bands yield** so a higher band owns Escape. Highest band first. This is the keyboard contract, not the paint order — see [z-index bands](#z-index-bands).

The overlay band is the exception inside itself: modal and drawer do **not** yield to each other. If both overlays are open, one Escape closes both (separate capture handlers and per-runtime claims).

| Order | Surface | Owns Escape when | Yields when |
|---|---|---|---|
| 1 | Modal / drawer | An open `[modal-overlay]:not([hidden])` or `[drawer-overlay]:not([hidden])` | Does not yield to later bands. Modal and drawer stay independently exclusive: both may be open at once, and they do not yield to each other — one Escape closes both. This pass does not make them exclusive across types. |
| 2 | Popover / menu | An open `[popover-root]:not([hidden])` or an open `[menu-root] [menu]:not([hidden])` | An open dialog overlay exists. Popover and menu sit in the same band; they do not yield to each other. Closed vs open for menu is `hidden` on `[menu]`, not on `[menu-root]`. See [Menu Runtime](./juice-menu-runtime.md). |
| 3 | Combobox | An open `[combobox-list]:not([hidden])` | An open dialog overlay, open popover, or open menu exists |
| 4 | Toast / tooltip | See the interaction below | See the interaction below |
| — | Banner | Never. Dismiss stays on `[banner-close]` | — |
| — | Accordion | The focused open item, or the last opened item, when that accordion context already owns the key. There is no global accordion Escape. | — |
| — | Tabs, navigation, wizard | Out of scope. Tabs ignores Escape. Wizard is not a dialog. Navigation does not close on Escape. | — |

**Toast / tooltip interaction:** toast does **not** block tooltip Escape. With both open, the first Escape hides the tip and leaves toasts visible; the next Escape dismisses the most recently shown visible toast. Tooltip yields to an open dialog overlay, popover, menu, or combobox list. Toast yields to those plus an open tooltip.

Yield checks use internal shared overlay queries (`libraries/juice/src/js/src/shared/`); the public create / init / start / stop contract is unchanged.

## Z-index bands

Core chrome sets these stacking values. They are **structural bands**, not a theme contract: there is no `--juice-z-*` token, and authors should not treat the numbers as public API. Visual stacking is also **not** the Escape order (toast paints above tooltip; tooltip still owns Escape first when both are open).

| Band | Surfaces | `z-index` | Notes |
|---|---|---|---|
| Overlay | `[modal-overlay]`, `[drawer-overlay]` | `1000` | Dialog scrims |
| Anchored | `[popover-root]`, `[combobox-list]`, `[menu]` | `1050` | Floating panel, listbox, and menu |
| Tip | `[tooltip-root]` | `1060` | Slightly above anchored chrome |
| Snackbar | `[toast-region]` | `1100` | Highest overlay chrome |
| Wizard chrome | `[wizard-header]` | `50` | Sticky in-page header |
| Nav chrome | `nav[type="sidebar"]` | `30` | Sidebar / mobile panel |
| Banner | `[banner]` | none | Inline callout; no elevation in this cut |

Tabs and accordion do not set a stacking band.

## Summary

Juice runtime behavior should feel like a natural extension of the markup system, not a separate app framework.
