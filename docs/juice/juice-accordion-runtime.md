# Accordion

An accordion expands one or more sections under `[accordion]`.

Emerging. Shipped in `@citrusworx/juiceui@0.9.2`. All 14 shipped themes bind `--juice-accordion-*`.

Importing `@citrusworx/juiceui` enhances valid markup. [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior).

## Markup

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

A root may hold one trigger and panel, or several. Multi-item roots stay multi-open.

## Attributes

| Hook | What it does |
| --- | --- |
| `[accordion]` | Root. Orphan `[accordion-item]` nodes outside it are ignored. |
| `[accordion-item]` | Trigger. Paired with its panel by `aria-controls`, then the next sibling. |
| `hidden` | Native closed state on the panel. The runtime does not write layout `content`. |
| `[motion="accordion"]` | On the panel, not the trigger. Animates height. Without it, show and hide are instant. |
| `name` | On the root. Becomes the slug for generated ids. |

## JavaScript

| Export | What it does |
| --- | --- |
| `createAccordion(options?)` | Controller for `options.root`, or the document. |
| `initAccordion(options?)` | Same call as `createAccordion`. |
| `startAccordionRuntime()` | Document controller. A second call syncs and returns it. Returns `null` when there is no document. |
| `stopAccordionRuntime()` | Destroys that controller and cancels a deferred boot. |

A custom-root controller can run beside the document runtime. Each click or key is claimed once.

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Node to search. |
| `accordionSelector` | `[accordion]` | Root query. |
| `triggerSelector` | `[accordion-item]` | Trigger query. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Disconnects this controller. |
| `sync()` | Wires ids, ARIA, and panel state. |
| `expand(trigger?)` | Opens that trigger's panel. |
| `collapse(trigger?)` | Closes that trigger's panel. |
| `toggle(trigger?)` | Expands or collapses that trigger. |
| `isExpanded(trigger?)` | Reads one trigger. |
| `getState(target?)` | Returns `{ expanded: boolean[] }` in trigger order, or `null`. |

### Events

A real expand or collapse dispatches a bubbling [juice:change](./juice-runtime-behavior.md#juicechange) from `[accordion]`.

`detail` is `{ runtime: "accordion", state: { expanded: boolean[] } }` in trigger order. An unchanged list does not dispatch. This surface stays Emerging.

## Accessibility

- Enter and Space activate non-button `[accordion-item]` triggers. Native buttons already synthesize a click.
- Escape collapses the focused open item, or the last opened item, and returns focus to that trigger. [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- There is no global accordion Escape, and no arrow-key roving tabindex.
- Sync fills missing ids, `aria-controls`, panel `role="region"`, and `aria-labelledby`.
- Accordion does not set a stacking band. [Z-index bands](./juice-runtime-behavior.md#z-index-bands).

## Behavior

1. Find `[accordion]` roots and their `[accordion-item]` triggers.
2. Pair each trigger with its panel (`aria-controls`, then the next sibling).
3. Fill missing ids, `aria-controls`, `role="region"`, and `aria-labelledby`.
4. Toggle `aria-expanded`, panel `hidden`, and `aria-hidden` on click.
5. Handle Enter and Space on non-button triggers, and Escape to close.

Open and closed state uses native `hidden` plus ARIA. The runtime does not write `content="active"` or `content="hidden"`.

### Motion

`[motion="accordion"]` must be on the panel. The runtime measures `scrollHeight`, sets an explicit pixel height, and transitions height on `--juice-motion-duration-base` and `--juice-motion-ease-in-out`.

`aria-expanded` updates immediately. Expand removes `hidden` before the height runs. Collapse sets `hidden` only after the height finishes, because native `hidden` cannot interpolate to or from `auto`.

Reduced motion stays instant even when the attribute is present. [Animations](./juice-animations.md).

### `Accordion()`

`Accordion()` is the only shipped Sig factory among the auto-enhance runtimes. It emits markup and the initial expanded state.

The runtime owns clicks. The factory does not attach a private `onclick`, so a click cannot expand and immediately collapse.

- Exclusive accordion is out of scope. Multi-item roots stay multi-open.
- Orphan `[accordion-item]` nodes outside `[accordion]` are ignored.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| Multi-item, multi-open sections | Disclosure (one trigger, one panel) |
| `[accordion]` / `[accordion-item]` | APG Tabs |
| Inline disclosure | A dialog or layered overlay |

## Related

- [Attributes](./juice-attributes.md)
- [Theme contract](./juice-theme-contract.md)
- [Runtime behavior](./juice-runtime-behavior.md)
- [Disclosure](./juice-disclosure-runtime.md)
- [Tabs](./juice-tabs-runtime.md)
