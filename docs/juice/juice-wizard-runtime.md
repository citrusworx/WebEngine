# Juice Wizard Runtime

This document explains the current wizard step runtime in `libraries/juice/src/js/src/wizard/wizard-runtime.ts` (monorepo path; outside this vault).

The key idea is the same as navigation, accordion, tabs, modal, drawer, toast, and popover:

> If a user writes valid Juice wizard markup and it exists in the browser, the step behavior should just work.

That is the standard.

## The Goal

The wizard runtime is not a framework adapter and not a second component API.

It is a browser-side Juice feature that works regardless of how the markup got into the DOM.

That means it should work for:

- raw HTML pages
- Twig or other server-rendered templates
- Sig-rendered DOM
- React-rendered DOM
- any other environment that eventually produces browser DOM

The user should not need to manually initialize wizard behavior in their app code.

There is no `Wizard()` Sig factory. Markup plus the runtime is the contract. Form validation and provisioning stay in the app.

This surface is Emerging, not Stable-ish. Valid markup should work after importing the JS entry, but the API is still likely to evolve.

Wizard is a multi-step onboarding shell. It is not a dialog, not a toast stack, and not APG Tabs.

## Markup Contract

The runtime is aligned with Juice’s wizard chrome:

```html
<div wizard-shell name="onboard">
  <aside wizard-rail="left">
    <nav step-tracker>
      <ol steps>
        <li step="active" data-step="welcome">Welcome</li>
        <li step="pending" data-step="domain">Domain</li>
        <li step="pending" data-step="plan">Plan</li>
      </ol>
    </nav>
  </aside>
  <main wizard-content>
    <section step-page="welcome">Welcome page</section>
    <section step-page="domain" hidden>Domain page</section>
    <section step-page="plan" hidden>Plan page</section>
    <div step-nav>
      <button type="button" wizard-prev>Back</button>
      <button type="button" wizard-next>Continue</button>
    </div>
  </main>
</div>
```

It requires a `[wizard-shell]` root. Orphan `[step]` / `[step-page]` / `[step-nav]` nodes outside a shell are ignored.

**Steps:** `[step]` tracker items. Paint values are `[step="pending"|"active"|"completed"]` (bare `[step]` paints as pending). The runtime writes those values: completed before the current index, active at the current index, pending after.

**Pages:** `[step-page]` panels. Visible vs hidden uses the native `hidden` attribute. The runtime does **not** write `content="active"` or `content="hidden"`. Those values clash with Juice layout `[content]`.

**Pairing:** first match wins, then document order.

1. `aria-controls` on a tracker `[step]` → page `id`
2. shared `data-step` / `name` / `[step-page="…"]` / `id`
3. index order

**Nav:** `[wizard-prev]` / `[wizard-next]`, or unmarked buttons in `[step-nav]` (first button is prev when two or more are present; last is next). Prev is disabled on the first step, next on the last. Optional `[wizard-complete]` is enabled only on the last step. A complete click is claimed so it does not also advance; the runtime does not submit or provision.

**Modes:**

- bare `[wizard-shell]` — jump to completed + current only; no skip ahead
- `wizard-shell="linear"` — prev/next only; tracker clicks do nothing
- `wizard-shell="free"` — jump to any step

Programmatic `next` / `prev` / `goTo` always work. Linear and default only constrain tracker clicks.

**Content hook:** `sync` writes `data-step` on `[wizard-content]` from the current page or step pairing token so product CSS can keep matching (`[wizard-content][data-step="welcome"]`).

Prefer shipping `aria-current="step"` on the active tracker item and `role="region"` on pages. The runtime fills missing step / page ids, `aria-controls`, page `role="region"`, and `aria-labelledby` from the paired step when unlabeled. This is a step indicator plus one visible region — not APG Tabs.

Theme paint uses `--juice-wizard-*` roles. See the [Theme Contract](./juice-theme-contract.md) and [Attributes](./juice-attributes.md). `[wizard-shell]` is a multi-step onboarding shell, not a dialog overlay, not a toast stack, and not the surface `overlay="frost|tint"` utility.

## Automatic Boot

The runtime starts automatically in the browser.

At the bottom of the file, Juice checks whether it is running in a browser environment and then boots the wizard runtime:

```ts
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startWizardRuntime();
    });
  } else {
    startWizardRuntime();
  }
}
```

Importing the Juice JS entrypoint is enough for the normal behavior.

`stopWizardRuntime()` also cancels a deferred `DOMContentLoaded` boot, so a test or host that stops the singleton before ready does not get a surprise start.

## Public API

The runtime still exposes functions, but they are secondary to the automatic behavior.

```ts
createWizard(options?)
initWizard(options?)
startWizardRuntime()
stopWizardRuntime()
```

These are useful for internal control, tests, or advanced cases.

`createWizard()` can run alongside the automatic document runtime. Each click or key event is claimed once, so a custom-root controller does not double-fire with the singleton.

## WizardOptions

The configurable shape is:

```ts
type WizardOptions = {
  root?: ParentNode;
  shellSelector?: string;
  trackerSelector?: string;
  stepsSelector?: string;
  stepSelector?: string;
  pageSelector?: string;
  navSelector?: string;
  nextSelector?: string;
  prevSelector?: string;
  completeSelector?: string;
};
```

By default, Juice uses:

```ts
{
  root: document,
  shellSelector: '[wizard-shell]',
  trackerSelector: '[step-tracker]',
  stepsSelector: '[steps]',
  stepSelector: '[step]',
  pageSelector: '[step-page]',
  navSelector: '[step-nav]',
  nextSelector: '[wizard-next]',
  prevSelector: '[wizard-prev]',
  completeSelector: '[wizard-complete]',
}
```

## WizardController

```ts
type WizardController = {
  destroy: () => void;
  sync: () => void;
  next: (target?: HTMLElement | null) => void;
  prev: (target?: HTMLElement | null) => void;
  goTo: (step: number | string, target?: HTMLElement | null) => void;
  current: (target?: HTMLElement | null) => number;
};
```

`goTo` accepts a zero-based index or a pairing token (`id`, `data-step`, `name`, or `[step-page="…"]`). `current` returns the inferred index (from `step="active"`, a visible page, or `data-step` on the shell / `[wizard-content]`).

## What the Runtime Actually Does

The runtime performs eight main jobs:

1. Find `[wizard-shell]` roots. Orphan `[step]` / `[step-page]` / `[step-nav]` nodes outside a shell are ignored. `[step]` nodes inside a `[step-page]` are ordinary content, not tracker items
2. Pair each tracker `[step]` to a `[step-page]`: `aria-controls` → page `id`, else shared `data-step` / `name` / `[step-page="…"]` / `id`, else index order
3. Paint `[step="pending"|"active"|"completed"]` and write `aria-current="step"` on the active tracker item
4. Show only the active `[step-page]` via native `hidden` (never layout `content=`)
5. Write `data-step` on `[wizard-content]` from the current pairing token so product CSS keeps matching
6. Wire `[wizard-prev]` / `[wizard-next]` (or unmarked buttons in `[step-nav]`); disable prev on the first step and next on the last; enable optional `[wizard-complete]` only on the last step
7. Apply nav mode: bare shell jumps completed + current only; `linear` is prev/next only; `free` jumps to any step. Programmatic `next` / `prev` / `goTo` always work
8. Fill missing step / page ids, `aria-controls`, page `role="region"`, and `aria-labelledby` from the paired step. Jumpable non-native steps get `tabindex="0"`. This is not APG Tabs

When `[wizard-shell]` has a `name`, that value becomes the slug used for generated ids (`onboard-step-1`, `onboard-page-1`).

`[wizard-complete]` does not submit a form or call a provisioner. The runtime claims the click so it does not also fire next.

## Navigation Modes

Modes live on the shell attribute. They constrain tracker clicks only.

| Markup | Tracker clicks | Prev / next |
|---|---|---|
| `[wizard-shell]` (bare) | completed + current | yes |
| `wizard-shell="linear"` | ignored | yes |
| `wizard-shell="free"` | any step | yes |

`next()`, `prev()`, and `goTo(index|id)` ignore the mode.

## Why MutationObserver Is Used

The DOM may change after the initial page load. That is what happens in reactive or server-hydrated environments.

If a wizard appears later, the observer schedules a `sync()` call so Juice can pair steps and pages, paint progress, and start handling clicks.

## Why Sync Is Scheduled

Mutation-heavy environments can change the DOM a lot in a short burst.

So instead of calling `sync()` immediately for every change, the runtime schedules it with `requestAnimationFrame`.

That keeps the runtime from reacting too aggressively while still updating quickly enough for UI behavior.

## Keyboard

- Enter and Space activate jumpable non-button `[step]` items and non-button `[wizard-prev]` / `[wizard-next]` controls (native buttons already synthesize a click)
- There is no focus trap. Tab is not wrapped. The runtime does not move focus into the page on change
- Escape is not handled. Wizard is not a dialog. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).

Arrow-key roving is intentionally out of scope. This is not APG Tabs.

## Limitations

- No `Wizard()` factory. Author markup (or emit it from Sig/React) and let the runtime enhance it.
- No form validation or async provisioning. Those stay in the app.
- Orphan `[step]` / `[step-page]` / `[step-nav]` nodes that are not inside `[wizard-shell]` are ignored.
- Pages use native `hidden`, never layout `content=`.
- Linear and default modes only constrain tracker clicks. Programmatic `next` / `prev` / `goTo` always work.
- `[wizard-complete]` is enabled on the last step only. The runtime does not submit or provision.
- A11y is `aria-current="step"` plus pages as `role="region"`. This is not APG Tabs.
- Escape is out of scope. See [Runtime Behavior](./juice-runtime-behavior.md#escape--layering).
- `[wizard-header]` sticky chrome is `z-index: 50`. That is a structural band, not a theme contract. See [Runtime Behavior](./juice-runtime-behavior.md#z-index-bands).
- Centered modal / dialog, edge-docked drawer, toast-stack, and popover behavior are not part of this runtime. See [Modal Runtime](./juice-modal-runtime.md), [Drawer Runtime](./juice-drawer-runtime.md), [Toast Runtime](./juice-toast-runtime.md), and [Popover Runtime](./juice-popover-runtime.md).

## Why This Matches Navigation

The wizard runtime copies the navigation, accordion, tabs, modal, drawer, toast, and popover lifecycle by convention:

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
