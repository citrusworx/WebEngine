# Disclosure

A disclosure is one trigger and one panel, rooted at `[disclosure]`.

Emerging. The twentieth runtime. Shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup. [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior).

## Markup

```html
<section disclosure name="shift-notes">
  <button type="button" disclosure-trigger aria-expanded="false">
    Shift notes
  </button>
  <div disclosure-panel hidden>
    Gate B closes at 9.
  </div>
</section>
```

A boolean `[disclosure]` attribute is valid. There is no HTML global `disclosure` attribute.

## Attributes

| Hook | What it does |
| --- | --- |
| `[disclosure]` | Root. Triggers and panels belong to the nearest root. Nested roots stay independent. |
| `[disclosure-trigger]` | The button. Orphans outside a root are ignored. |
| `[disclosure-panel]` | The controlled region. |
| `name` | Root slug. Trimmed, lowercased, non-alphanumeric runs become dashes. |
| `hidden` | Native closed state on the panel. The runtime does not write layout `content`. |
| `[motion="accordion"]` | On the panel. Same height opt-in as accordion. |
| `--juice-disclosure-*` | `surface`, `border`, `trigger`, `trigger-hover`, `trigger-open`, `ink`, `chevron`, `focus-ring`. |

`surface` is the panel, not a bar. The trigger is a surface, not the CTA gradient.

## JavaScript

| Export | What it does |
| --- | --- |
| `createDisclosure(options?)` | Controller for `options.root`, or the document. |
| `initDisclosure(options?)` | Same call as `createDisclosure`. |
| `startDisclosureRuntime()` | Document controller. A second call syncs and returns it. Returns `null` when there is no document. |
| `stopDisclosureRuntime()` | Destroys that controller and cancels a deferred boot. |

A custom-root controller can run beside the document runtime. Each click or key is claimed once.

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Node to search. |
| `disclosureSelector` | `[disclosure]` | Root query. |
| `triggerSelector` | `[disclosure-trigger]` | Trigger query. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Disconnects this controller. |
| `sync()` | Applies pairing, ids, and open state. |
| `expand(trigger?)` | Opens that pair and remembers it as last opened. |
| `collapse(trigger?)` | Closes that pair. |
| `toggle(trigger?)` | Expands when the panel is hidden, otherwise collapses. |
| `isExpanded(trigger?)` | Reads that trigger. |
| `getState(target?)` | Returns `{ expanded: boolean }` for the first trigger, or `null`. |

An element argument resolves to a `[disclosure-trigger]` inside a root, or to the closest trigger. Omitted, the first trigger in tree order is used. A node outside a root is ignored. These methods do not close siblings.

### Events

A real expand or collapse dispatches a bubbling [juice:change](./juice-runtime-behavior.md#juicechange) from `[disclosure]`.

`detail` is `{ runtime: "disclosure", state: { expanded: boolean } }` for the first trigger. An unchanged value does not dispatch. This surface stays Emerging.

## Accessibility

- Sync sets `aria-controls` on the trigger, and `role="region"` plus `aria-labelledby` on the panel.
- A trigger that is not a `<button>` and not an `<a href>` gets `role="button"`, and `tabindex="0"` only when `tabindex` is missing.
- Authors own the trigger name. The runtime does not invent a visible label.
- Enter and Space toggle non-button, non-link triggers. Those keys are prevented. Buttons and links keep the browser path.
- Escape collapses the focused open disclosure, the one whose panel contains the target, or the last opened disclosure. [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- Escape yields when the event is already handled, or when an open `[modal-overlay]`, `[drawer-overlay]`, or `[popover-root]` exists.
- There is no focus trap and no roving tabindex. Disclosure has no z-index. [Z-index bands](./juice-runtime-behavior.md#z-index-bands).

## Behavior

1. Find `[disclosure]` roots. Orphans and `[accordion]` markup are ignored.
2. Pair each trigger with one panel. `aria-controls` inside the root wins. Otherwise the next eligible sibling is the panel.
3. Fill ids from the root `name`, or `juice-disclosure-trigger-N` / `juice-disclosure-panel-N`. Author ids are kept.
4. Wire `aria-controls`, `role="region"`, and `aria-labelledby`.
5. Keep state on `aria-expanded`, native `hidden`, and `aria-hidden`. When a panel exists, `hidden` wins.
6. Toggle on click. Enter and Space toggle only non-button triggers that are not anchors with `href`.
7. Escape collapses one disclosure and returns focus to that trigger.

### Pairing

| Rule | Result |
| --- | --- |
| Trigger `aria-controls` | The element with that id inside the same root. An id that points at the trigger is ignored. |
| No `aria-controls` | The next sibling when it is a `[disclosure-panel]`, or when it is not another trigger and not a nested `[disclosure]`. |
| Next sibling is a trigger or nested root | A later sibling is used. |

Extra triggers in one root are not an exclusive group. Generated ids gain a numeric suffix (`name-trigger-1`). Opening one disclosure does not collapse another.

When a panel is paired, an author `aria-expanded="true"` on a still-hidden panel is corrected to closed. A trigger with no panel keeps an author `aria-expanded`. With none, sync writes `"false"`.

### Motion

`[motion="accordion"]` must be on `[disclosure-panel]`. Height uses `--juice-motion-duration-base` and `--juice-motion-ease-in-out`. `aria-expanded` updates immediately. Collapse sets `hidden` after the height finishes.

Without the attribute, show and hide are an instant `hidden` toggle. Reduced motion stays instant. [Animations](./juice-animations.md).

### Limits

- The runtime does not special-case `disabled` or `aria-disabled`. A native disabled button does not click. An `aria-disabled` trigger still toggles.
- A link trigger's click is not cancelled, so `<a href disclosure-trigger>` can navigate and toggle.
- There is no `Disclosure()` factory.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| One trigger, one panel | Accordion (`[accordion]` / `[accordion-item]`, multi-open) |
| Inline disclosure | A dialog or layered overlay |
| Independent pairs | An exclusive group or APG Tabs |

## Related

- [Attributes](./juice-attributes.md)
- [Theme contract](./juice-theme-contract.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Accordion](./juice-accordion-runtime.md)
