# Juice Accordion Runtime

This document explains the current accordion runtime in `libraries/juice/src/js/src/accordion/accordion-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation:

> If a user writes valid Juice accordion markup and it exists in the browser, the disclosure behavior should just work.

That is the standard.

## The Goal

The accordion runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM, including the `Accordion()` factory
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize accordion behavior in their app code.

## Markup Contract

The runtime is aligned with Juice’s accordion chrome:

```html
<section accordion name="faq-account">
  <button
    type="button"
    id="faq-account-trigger"
    accordion-item
    aria-expanded="false"
    aria-controls="faq-account-panel"
  >
    How do I update billing?
  </button>
  <div
    id="faq-account-panel"
    role="region"
    aria-labelledby="faq-account-trigger"
    hidden
  >
    Update billing from the account dashboard.
  </div>
</section>
```

It requires an `[accordion]` root. Orphan `[accordion-item]` nodes are ignored.

A root may contain one trigger/panel pair or several. Multi-item roots stay multi-open. Exclusive accordion behavior is not part of this runtime.

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the accordion runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startAccordionRuntime();
    });
  } else {
    startAccordionRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createAccordion(options?)
initAccordion(options?)
startAccordionRuntime()
stopAccordionRuntime()
```

These are useful for internal control, tests, or advanced cases.

A real expand or collapse dispatches a bubbling `juice:change` from `[accordion]`. `detail` is `{ runtime: "accordion", state: { expanded: boolean[] } }` in trigger order. `isExpanded()` reads one trigger. `getState()` returns the list. A write that leaves that list unchanged does not dispatch. This surface stays Emerging. See [juice:change](./juice-runtime-behavior.md#juicechange).

`createAccordion()` can run alongside the automatic document runtime. Each click or key event is claimed once, so a custom-root controller does not double-toggle with the singleton.

## AccordionOptions

The configurable shape is:

```ts
type AccordionOptions = {
  root?: ParentNode;
  accordionSelector?: string;
  triggerSelector?: string;
};
```

By default, Juice uses:

```ts
{
  root: document,
  accordionSelector: '[accordion]',
  triggerSelector: '[accordion-item]',
}
```

## AccordionController

```ts
type AccordionController = {
  destroy: () => void;
  sync: () => void;
  expand: (trigger?: HTMLElement | null) => void;
  collapse: (trigger?: HTMLElement | null) => void;
  toggle: (trigger?: HTMLElement | null) => void;
  isExpanded: (trigger?: HTMLElement | null) => boolean;
  getState: (target?: HTMLElement | null) => AccordionState | null;
};
```

## What the Runtime Actually Does

The runtime performs five main jobs:

1. Find `[accordion]` roots and their `[accordion-item]` triggers
2. Pair each trigger with its panel (`aria-controls`, then the next sibling)
3. Fill missing ids, `aria-controls`, `role="region"`, and `aria-labelledby`
4. Toggle `aria-expanded`, panel `hidden`, and `aria-hidden` on click. A panel with `[motion="accordion"]` animates height; `hidden` waits until collapse finishes
5. Handle Enter/Space on non-button triggers and Escape to close

Open/closed state uses native `hidden` plus ARIA. The runtime does **not** write `content="active"` or `content="hidden"`. Those values clash with Juice layout `[content]`.

## Motion

`[motion="accordion"]` must be on the panel, not the trigger. The runtime measures that panel's `scrollHeight`, sets an explicit pixel height, and transitions height on `--juice-motion-duration-base` and `--juice-motion-ease-in-out`. `aria-expanded` updates immediately. Expand removes `hidden` before the height runs. Collapse sets `hidden` only after the height finishes, because native `hidden` cannot interpolate to or from `auto`.

Without the attribute, show and hide stay an instant `hidden` toggle. Reduced motion stays instant even when the attribute is present. See [Animations](./juice-animations.md).

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If an accordion appears later, the observer schedules a `sync()` call so Juice can wire ids and ARIA and start handling clicks.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

- Enter and Space activate non-button `[accordion-item]` triggers (native buttons already synthesize a click)
- Escape collapses the focused open item, or the last opened item, and returns focus to that trigger

Arrow-key roving tabindex is intentionally out of scope. Escape is contextual, not global — see [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).

## Coexistence With `Accordion()`

The `Accordion()` factory emits markup and initial expanded state.

The runtime owns clicks. The factory does not attach a private `onclick`, so a click cannot expand and immediately collapse.

## Limitations

- Exclusive accordion is not in scope. Multi-item roots stay multi-open.
- Orphan `[accordion-item]` nodes outside `[accordion]` are ignored.
- Panels use native `hidden`, never layout `content=`.
- Arrow-key roving tabindex is out of scope.
- Escape is contextual: it collapses the focused or last open item only when that accordion already owns the key. There is no global accordion Escape. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- `Accordion()` is the only shipped Sig factory among the twenty-nine auto-enhance runtimes. Markup plus auto-enhance is still the contract. Checkbox and radio count as two of those runtimes. Breadcrumb is a light trail. Progress is a progressbar. Pagination is a page set. Disclosure is a standalone one-trigger / one-panel control, distinct from accordion, and shipped in 0.9.2. Spinner is a standalone indeterminate busy indicator, distinct from progress and disclosure, and shipped in 0.9.2. Select is a styled native `<select>`, distinct from combobox, and shipped in 0.9.2. Input is a styled native `<input>`, distinct from combobox and from select, and shipped in 0.9.2. Textarea is a styled native `<textarea>`, distinct from input, select, and combobox, and shipped in 0.9.2. Field is a wrapper around a control, distinct from input, textarea, select, and combobox, and shipped in 0.9.2. Icon button is a square icon-only control on button chrome, distinct from switch and from checkbox, and is on master, not in the published npm 0.9.2 release. Avatar is an initials-or-photo mark (`[avatar]`), distinct from a badge and from `[skeleton="circle"]`, and is on master, not in the published npm 0.9.2 release. Table is the twenty-eighth Emerging auto-enhance runtime and is on master, not in that cut. Pressable is the twenty-ninth Emerging auto-enhance runtime and is on master, not in that cut. `@citrusworx/sigjs/juice` `bind()` does not name pressable yet. Motion core shipped in 0.9.2 and stays Emerging.

## Why This Matches Navigation

The accordion runtime copies the navigation lifecycle by convention:

- DOM-first
- automatic boot
- event delegation
- MutationObserver plus rAF `sync()`
- idempotent singleton `start*Runtime` / `stop*Runtime`
- framework-agnostic

Shared internals under `libraries/juice/src/js/src/shared/` are not a public multi-feature runtime API.

## Design Rule Going Forward

Interactive Juice browser features should follow this standard:

> If valid Juice markup exists in the browser, the feature should activate automatically and work without app glue.
