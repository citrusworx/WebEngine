# Juice Navigation Runtime

This document explains the current navigation runtime in [navigation.ts](/d:/CitrusWorx/libraries/juice/src/js/src/navigation.ts).

The key idea is simple:

> If a user writes valid Juice navigation markup and it exists in the browser, the responsive behavior should just work.

That is the standard.

## The Goal

The navigation runtime is not meant to be a framework adapter.

It is meant to be a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize navigation behavior in their app code.

## What It Uses

The runtime is aligned with Juice’s built-in navigation surface:

- `nav[type="bar"]`
- `nav[type="links"]`
- `nav[type="mobile"]`
- `nav[type="sidebar"]`

It does not invent a second navigation API.

It does not rely on custom `data-*` state attributes.

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the navigation runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startNavigationRuntime();
    });
  } else {
    startNavigationRuntime();
  }
}
```

This means the user does not need to call anything for the normal Juice behavior.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createNavigation(options?)
initNavigation(options?)
startNavigationRuntime()
stopNavigationRuntime()
```

These are useful for internal control, tests, or advanced cases, but the main feature is the automatic runtime.

## NavigationOptions

The configurable shape is:

```ts
type NavigationOptions = {
  root?: ParentNode;
  navSelector?: string;
  sidebarSelector?: string;
  toggleSelector?: string;
  mobileBreakpoint?: number;
};
```

By default, Juice uses:

```ts
{
  root: document,
  navSelector: 'nav[type="bar"], nav[type="links"]',
  sidebarSelector: 'nav[type="sidebar"]',
  toggleSelector: 'nav[type="mobile"]',
  mobileBreakpoint: 768
}
```

## What the Runtime Actually Does

The runtime performs four main jobs:

1. Detect whether the viewport is mobile or desktop
2. Hide desktop nav types on mobile
3. Show mobile toggle nav types on mobile
4. Open and close the corresponding sidebar nav

On desktop:

- `nav[type="bar"]` and `nav[type="links"]` are shown
- `nav[type="mobile"]` is hidden
- `nav[type="sidebar"]` stays visible

On mobile:

- `nav[type="bar"]` and `nav[type="links"]` are hidden
- `nav[type="mobile"]` is shown
- `nav[type="sidebar"]` is hidden until toggled

## Why It Works Better Across Environments

The important detail is that the runtime is DOM-driven, not framework-driven.

It does not care whether the DOM came from:

- a static HTML file
- server-rendered templates
- a reactive render pass
- a client-side app shell

It only cares that the correct Juice markup exists.

That is what makes it framework-agnostic.

## Multiple Navigation Sets

The runtime is no longer built around one single nav element.

Instead, it queries collections:

- all matching desktop navs
- all matching mobile navs
- all matching sidebar navs

This matters because a page may contain:

- a primary header nav
- a local app nav
- a dashboard sidebar
- multiple layout shells on the same page

The runtime is designed to behave reasonably in those cases instead of assuming there is only one navigation instance in the entire document.

## How Toggle-to-Sidebar Pairing Works

The hardest part is deciding which sidebar a mobile toggle should control.

The runtime uses DOM locality heuristics:

1. look in the toggle's parent
2. walk upward through ancestors
3. fall back to the first available sidebar

This is not magical routing logic. It is simply a practical way to make “drop in Juice nav markup and it works” feasible for common document structures.

The same logic is used in reverse when a sidebar needs to find its nearest toggle.

## Why MutationObserver Is Used

The runtime also uses `MutationObserver`.

That is there for one reason:

> the DOM may change after the initial page load

This is exactly what happens in many reactive or server-hydrated environments.

If a nav appears later, the observer schedules a `sync()` call so Juice can re-apply the responsive behavior.

This is how the feature keeps working even when markup is rendered after the first boot.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Visibility and State

The runtime uses:

- `hidden`
- `aria-hidden`
- `aria-expanded`

This keeps the behavior aligned with:

- built-in HTML visibility semantics
- accessibility expectations
- Juice’s existing attribute model

It does not define a parallel custom state system.

## Why This Is Better Than the Original Script

The old version was:

- global
- singular
- ID-based
- style-mutation based
- page-load only

The current version is:

- automatic
- attribute-aligned
- collection-aware
- DOM-local
- responsive to late-rendered markup
- framework-agnostic

That is a much better fit for what Juice is trying to be.

## Limitations

This runtime is stronger than the original version, but it is still intentionally focused.

It does not yet handle:

- focus trapping
- escape-key close
- click-away close
- animated open/close transitions
- complex nested nav trees
- richer keyboard interaction rules

Those are possible future improvements, but they are not required for the core “works out-of-the-box” responsive nav feature.

## Design Rule Going Forward

Interactive Juice browser features should follow this standard:

> If valid Juice markup exists in the browser, the feature should activate automatically and work without app glue.

That is the right mental model for:

- navigation
- future accordions
- tabs
- drawers
- other built-in responsive interactions
