# Wizard

A wizard is a multi-step shell rooted at `[wizard-shell]`.

Emerging. Shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup. [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior).

## Markup

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

Orphan `[step]`, `[step-page]`, and `[step-nav]` nodes outside a shell are ignored. `[step]` nodes inside a `[step-page]` are content, not tracker items.

## Attributes

| Hook | What it does |
| --- | --- |
| `[wizard-shell]` | Root. Bare, `linear`, or `free`. See modes below. |
| `[step]` | Tracker item. Paint is `pending`, `active`, or `completed`. Bare paints as pending. |
| `[step-page]` | Panel. Visibility is native `hidden`, never layout `content`. |
| `[step-nav]` | Holds prev and next. Unmarked buttons: first is prev when two or more are present, last is next. |
| `[wizard-prev]` / `[wizard-next]` | Explicit prev and next. Prev is disabled on the first step, next on the last. |
| `[wizard-complete]` | Optional. Enabled only on the last step. The click is claimed and does not advance. |
| `[wizard-content]` | Sync writes `data-step` from the current pairing token. |
| `[steps]` / `[step-tracker]` / `[wizard-rail]` | Tracker chrome. |
| `--juice-wizard-*` | Theme paint for the shell. |

Pairing, first match wins, then document order: `aria-controls` on a tracker `[step]` to a page `id`, then a shared `data-step`, `name`, `[step-page]`, or `id`, then index order.

When the shell has a `name`, generated ids use that slug (`onboard-step-1`, `onboard-page-1`).

## JavaScript

| Export | What it does |
| --- | --- |
| `createWizard(options?)` | Controller for `options.root`, or the document. |
| `initWizard(options?)` | Same call as `createWizard`. |
| `startWizardRuntime()` | Document controller. A second call syncs and returns it. Returns `null` when there is no document. |
| `stopWizardRuntime()` | Destroys that controller and cancels a deferred boot. |

A custom-root controller can run beside the document runtime. Each click or key is claimed once.

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Node to search. |
| `shellSelector` | `[wizard-shell]` | Root query. |
| `trackerSelector` | `[step-tracker]` | Tracker query. |
| `stepsSelector` | `[steps]` | Step list query. |
| `stepSelector` | `[step]` | Tracker item query. |
| `pageSelector` | `[step-page]` | Page query. |
| `navSelector` | `[step-nav]` | Nav query. |
| `nextSelector` | `[wizard-next]` | Next control. |
| `prevSelector` | `[wizard-prev]` | Prev control. |
| `completeSelector` | `[wizard-complete]` | Complete control. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Disconnects this controller. |
| `sync()` | Pairs steps, paints state, and shows the active page. |
| `next(target?)` | Advances one step. Ignores nav mode. |
| `prev(target?)` | Goes back one step. Ignores nav mode. |
| `goTo(step, target?)` | Zero-based index or a pairing token (`id`, `data-step`, `name`, or `[step-page]`). Ignores nav mode. |
| `current(target?)` | Inferred index from `step="active"`, a visible page, or `data-step` on the shell or `[wizard-content]`. |
| `getState(target?)` | Returns `{ current: number }`, or `null`. |

### Events

A real step change dispatches a bubbling [juice:change](./juice-runtime-behavior.md#juicechange) from `[wizard-shell]`.

`detail` is `{ runtime: "wizard", state: { current: number } }`, the same index `current()` returns. An unchanged index does not dispatch. This surface stays Emerging.

## Accessibility

- Sync fills missing step and page ids, `aria-controls`, page `role="region"`, and `aria-labelledby` from the paired step when unlabeled.
- The active tracker item gets `aria-current="step"`.
- Jumpable non-native steps get `tabindex="0"`. Enter and Space activate those steps and non-button prev and next controls.
- There is no focus trap. A step change does not move focus into the page.
- Escape is not handled. [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- `[wizard-header]` sticky chrome is `z-index: 50`. [Z-index bands](./juice-runtime-behavior.md#z-index-bands).

## Behavior

1. Find `[wizard-shell]` roots and ignore orphans.
2. Pair each tracker `[step]` to a `[step-page]`.
3. Paint `pending`, `active`, and `completed`, and write `aria-current="step"` on the active item.
4. Show only the active `[step-page]` with native `hidden`.
5. Write `data-step` on `[wizard-content]` from the current pairing token.
6. Wire prev and next, and enable `[wizard-complete]` only on the last step.
7. Apply the nav mode to tracker clicks.
8. Fill missing ids and region labels. This is not APG Tabs.

`[wizard-complete]` does not submit a form or call a provisioner. Validation and provisioning stay in the app.

### Modes

Modes constrain tracker clicks only.

| Markup | Tracker clicks | Prev / next |
| --- | --- | --- |
| `[wizard-shell]` | Completed steps and the current step | Yes |
| `wizard-shell="linear"` | Ignored | Yes |
| `wizard-shell="free"` | Any step | Yes |

`next()`, `prev()`, and `goTo()` ignore the mode.

There is no `Wizard()` factory.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| Multi-step shell, one visible page | A dialog (no focus trap, Escape is out of scope) |
| Step indicator plus one region | APG Tabs |
| In-page flow | A toast stack, or `overlay="frost"` / `overlay="tint"` |

## Related

- [Attributes](./juice-attributes.md)
- [Theme contract](./juice-theme-contract.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Tabs](./juice-tabs-runtime.md)
