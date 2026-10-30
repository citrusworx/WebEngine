# Tabs

Tabs keep one selected panel inside `[tabs]`.

Emerging. Shipped in `@citrusworx/juiceui@0.9.2`.

Importing `@citrusworx/juiceui` enhances valid markup. See [Automatic behavior](./juice-runtime-behavior.md#automatic-behavior).

## Markup

```html
<div tabs name="settings">
  <div tabs-list>
    <button type="button" tab active>Account</button>
    <button type="button" tab>Billing</button>
  </div>
  <div tab-panel>Account panel</div>
  <div tab-panel hidden>Billing panel</div>
</div>
```

The root owns the strip and the panels. Orphan `[tab]` and `[tab-panel]` nodes outside `[tabs]` are ignored.

## Attributes

| Hook | What it does |
| --- | --- |
| `[tabs]` | Root. `name` becomes the tablist `aria-label` when `aria-label` and `aria-labelledby` are absent, and it slugs generated ids. |
| `[tabs-list]` | Optional strip. Direct child `button` elements in the strip are triggers. |
| `[tab]` | Trigger. A `[role="tab"]` in the strip also counts. Buttons inside `[tab-panel]` stay ordinary controls. |
| `[tab-panel]` | Panel. Shown and hidden with native `hidden` and `aria-hidden`. |
| `[active]` | Selected trigger, written together with `aria-selected="true"`. |

Selection is exclusive. The runtime does not write layout `content`. Prefer shipping `[active]` and `aria-selected` together. Sync fills the missing one.

## JavaScript

| Export | What it does |
| --- | --- |
| `createTabs(options?)` | Controller for `options.root`, or the document. |
| `initTabs(options?)` | Same call as `createTabs`. |
| `startTabsRuntime()` | Document controller. A second call syncs and returns it. Returns `null` when there is no document. |
| `stopTabsRuntime()` | Destroys that controller and cancels a deferred boot. |

A custom-root controller can run beside the document runtime, and each click or key event is claimed once.

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `document` | Queries descendants. The document when omitted. |
| `tabsSelector` | `[tabs]` | Widget root. |
| `listSelector` | `[tabs-list]` | Optional strip. A direct child of the root. |
| `triggerSelector` | `[tab]` | Marked triggers. |
| `panelSelector` | `[tab-panel]` | Panels owned by that root. |

### Controller

| Method | What it does |
| --- | --- |
| `destroy()` | Removes click and keydown listeners and disconnects the observer. |
| `sync()` | Wires each root and selects the marked trigger, or the first when none are marked. |
| `select(trigger?)` | Selects the given trigger, or the first managed trigger when the argument is omitted. |
| `selected(target?)` | Returns the selected trigger, or the first trigger when none are marked, or `null` when there are none. |
| `getState(target?)` | `{ selected: number }`, or `null`. The index is 0-based, or `-1` when none are marked. |

### Events

A real selection change dispatches a bubbling [juice:change](./juice-runtime-behavior.md#juicechange) from `[tabs]`. `detail` is `{ runtime: "tabs", state: { selected: number } }`. `selected` is the 0-based trigger index, or `-1` when none are selected; `selected()` returns the trigger element, `getState()` returns the index, and an unchanged index does not dispatch.

## Accessibility

- The strip uses horizontal automatic activation. Moving focus selects that tab and shows its panel.
- ArrowRight and ArrowLeft wrap to the next and previous trigger, then select and focus it.
- Home and End jump to the first and last trigger, then select and focus it.
- Enter and Space activate a non-button `[tab]`. A native `button`, or an `a` with `href`, uses click.
- Escape, ArrowUp, and ArrowDown are ignored. There is no vertical orientation. See [Escape and layering](./juice-runtime-behavior.md#escape--layering).
- Keys from `input`, `textarea`, `select`, or `contenteditable` inside the strip are ignored.
- The selected trigger gets `tabindex="0"`. The others get `tabindex="-1"`. The selected panel gets `tabindex="0"`; the others lose `tabindex`.
- Sync fills `role="tablist"`, `role="tab"`, and `role="tabpanel"`, plus `aria-controls` and `aria-labelledby`. `role="tablist"` goes on `[tabs-list]`, or on `[tabs]` when the root has no panels.

## Behavior

1. Find each `[tabs]` root and ignore orphan `[tab]` and `[tab-panel]` nodes.
2. Collect triggers and pair each one with a panel.
3. Fill missing ids and the tab, tablist, and tabpanel roles.
4. Select one trigger, dual-write `[active]` and `aria-selected`, and hide the other panels with `hidden`.
5. When no trigger is `[active]` or `aria-selected="true"`, select the first trigger.
6. Handle click and horizontal arrow keys on the strip.

Pairing checks `aria-controls` when that id is a `[tab-panel]` in the same root, then the panel at the same index, then a following sibling panel. The sibling walk stops at another trigger.

A `name` on `[tabs]` becomes the tablist `aria-label` when `aria-label` and `aria-labelledby` are absent. Its slug is the generated-id prefix. With more than one trigger the ids look like `settings-tab-1` and `settings-panel-1`. With one trigger the numeric suffix is omitted.

### Markup modes

- `[tabs-list]` is the strip when it is a direct child of `[tabs]`.
- Strip-only markup is direct `[tab]` or `button` children and no panels. The root receives `role="tablist"`.
- Mixed markup is direct triggers plus `[tab-panel]` children, without `[tabs-list]`.

<details>
<summary>Edge cases</summary>

- A non-native trigger with no `tabindex` starts at `tabindex="-1"` until selection sets `0` or `-1`.
- Generated ids without a `name` use `juice-tabs-trigger-N` and `juice-tabs-panel-N`.
- The observer watches child list changes and `hidden`, `active`, `aria-selected`, `aria-controls`, `tabs`, `tabs-list`, `tab`, and `tab-panel`.

</details>

### Limits

- There is no `Tabs()` factory.
- Selection is one trigger per root.
- Panels use native `hidden`. The runtime does not write layout `content`.
- Keyboard movement is horizontal only.

Later DOM changes schedule `sync()` on the next animation frame. [Sync](./juice-runtime-behavior.md#sync).

## Not to be confused with

| This | Not this |
| --- | --- |
| One selected panel | An accordion |
| `[tab]` and `[tab-panel]` inside `[tabs]` | Orphan `[tab]` and `[tab-panel]`, which are ignored |

## Related

- [Attributes](./juice-attributes.md)
- [Runtime behavior](./juice-runtime-behavior.md)
