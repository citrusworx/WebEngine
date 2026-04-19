# Juice Navigation Lesson

This lesson explains how the navigation runtime was designed and why it ended up in its current form.

It is less of an API reference and more of a design walkthrough.

## Lesson 1: The Wrong Starting Assumption

A common instinct is to design interactive behavior like this:

- expose a function
- make the user call it
- wire behavior inside the app

That is a normal pattern in framework code, but it is the wrong default for Juice navigation.

Why?

Because Juice navigation is supposed to be a built-in responsive feature, not an opt-in app integration.

If the user writes Juice nav markup, they should get Juice nav behavior automatically.

That means the right starting assumption is:

> navigation should boot itself in the browser

## Lesson 2: Juice Markup Must Stay the Source of Truth

Another easy mistake is inventing a second attribute contract in JavaScript.

For example:

- custom IDs
- custom `data-*` state attributes
- one-off toggle markers not part of Juice

That weakens the system because now there are two navigation APIs:

1. the SCSS/component API
2. the runtime API

The better approach is:

- use the built-in Juice nav types
- let the runtime recognize those types
- use plain browser state like `hidden` and ARIA where needed

That keeps the runtime in service of Juice instead of drifting away from it.

## Lesson 3: Framework-Agnostic Does Not Mean Framework-Integrated

To work with Sig, React, Twig, and raw HTML, the runtime does not need to be deeply integrated into each system.

It needs to be:

- browser-aware
- DOM-aware
- resilient to late-rendered markup

That is why the runtime is intentionally DOM-driven.

The browser is the common ground all those environments eventually share.

## Lesson 4: One Element Is Not Enough

An early implementation often assumes:

- one nav
- one mobile trigger
- one sidebar

That is too fragile.

Real pages may have:

- a top nav
- a subnav
- a sidebar
- repeated layout shells

So the runtime needs to think in collections, not singular elements.

That is why the current version queries arrays of:

- desktop navs
- mobile navs
- sidebars

and then applies behavior across them.

## Lesson 5: Pairing Matters

Once you support multiple nav instances, a new problem appears:

> which mobile trigger controls which sidebar?

The runtime solves this with proximity rules:

1. look nearby
2. walk upward
3. fall back safely

This is not a perfect universal matcher, but it is a practical browser-side heuristic that supports the out-of-the-box goal.

In other words, the runtime chooses reasonable behavior over requiring configuration in the common case.

## Lesson 6: Reactivity Is Really About DOM Timing

At first glance, “works in reactive environments” sounds like a framework problem.

In practice, for this feature, it is mostly a DOM timing problem.

The issue is:

- some markup exists at first paint
- some markup appears later
- some markup re-renders

So the runtime must survive DOM change after startup.

That is why `MutationObserver` matters.

It lets Juice respond when navigation markup is inserted later, which is exactly what many reactive systems do.

## Lesson 7: Automatic Features Still Need Discipline

An automatic runtime should not become messy or overly eager.

That is why the current version:

- schedules sync work
- avoids style-based mutation
- keeps visibility state simple
- centralizes responsive reconciliation in `sync()`

The goal is not just automatic behavior.

The goal is automatic behavior that stays understandable.

## Lesson 8: Accessibility State Should Not Be an Afterthought

Even in a lightweight runtime, some state should be expressed semantically.

That is why the current version uses:

- `hidden`
- `aria-hidden`
- `aria-expanded`

This is important because it keeps the runtime aligned with browser semantics and accessibility expectations without inventing a custom state layer.

## Lesson 9: Built-In Feature First, Manual API Second

The runtime still exports functions like:

- `createNavigation()`
- `startNavigationRuntime()`

That is useful for testing, manual control, and future internal integrations.

But those exports are not the main product.

The main product is:

> the feature runs automatically when Juice nav markup exists in the browser

That order matters.

## Lesson 10: The Real Standard

The design standard for this feature is not:

“Can a framework user integrate this?”

The design standard is:

“If valid Juice nav markup is rendered in the browser by any system, does the feature just work?”

That is the correct standard for a Juice runtime feature.

## Takeaway

The final design is shaped by a few strong rules:

- Juice markup is the contract
- browser DOM is the execution surface
- responsiveness is built in
- user init code should not be required
- late-rendered markup must still work
- the runtime must stay framework-agnostic

That is why the navigation runtime looks the way it does now.
