# Runtime behavior

Import `@citrusworx/juiceui` and valid markup runs in the browser. Most pages never call `init`.

Juice does not load Sig. Observation is the DOM contract below. The optional adapter is `@citrusworx/sigjs/juice`.

Twenty-five runtimes, navigation through field, shipped in `@citrusworx/juiceui@0.9.2`. Icon button, avatar, and table shipped in 0.9.3. Pressable and touchable row shipped in 0.9.4. Keyboard avoider shipped in 0.9.5. All thirty-one stay Emerging.

## Components

### Navigation

| Component | Markup hook | What it's for | Docs |
| --- | --- | --- | --- |
| Navigation | `nav[type="bar\|links\|mobile\|sidebar"]` | Shows bar and links on desktop, and a mobile toggle for the sidebar. | [Navigation](./juice-navigation-runtime.md) |
| Menu | `[menu-root]` | Action menu on a button. | [Menu](./juice-menu-runtime.md) |
| Tabs | `[tabs]` | One selected panel. All 14 themes bind `--juice-tabs-*`. | [Tabs](./juice-tabs-runtime.md) |
| Breadcrumb | `[breadcrumb]` | A trail of links. Landmark name `Breadcrumb`. | [Breadcrumb](./juice-breadcrumb-runtime.md) |
| Pagination | `[pagination]` | A set of pages. Landmark name `Pagination`. | [Pagination](./juice-pagination-runtime.md) |

### Overlays

| Component | Markup hook | What it's for | Docs |
| --- | --- | --- | --- |
| Modal | `[modal-overlay]` | Centered dialog. Focus trap. One modal at a time. | [Modal](./juice-modal-runtime.md) |
| Drawer | `[drawer-overlay]` | Edge dialog, `left` or `right`. Focus trap. | [Drawer](./juice-drawer-runtime.md) |
| Popover | `[popover-root]` | Panel anchored to a control. Surface is `[popover-panel]`. | [Popover](./juice-popover-runtime.md) |
| Tooltip | `[tooltip-root]` | Hover or focus tip. Surface is `[tooltip-panel]`. | [Tooltip](./juice-tooltip-runtime.md) |
| Toast | `[toast-region]` | Corner stack of messages. Default `top-right`. | [Toast](./juice-toast-runtime.md) |

### Forms

| Component | Markup hook | What it's for | Docs |
| --- | --- | --- | --- |
| Input | `<input input>` | Native text field. | [Input](./juice-input-runtime.md) |
| Textarea | `<textarea textarea>` | Native multiline field. | [Textarea](./juice-textarea-runtime.md) |
| Select | `<select select>` | Native dropdown. The open list stays the platform popup. | [Select](./juice-select-runtime.md) |
| Combobox | `[combobox]` | Text field plus a filtered list. | [Combobox](./juice-combobox-runtime.md) |
| Checkbox | `[checkbox]` | Binary checkbox. | [Checkbox](./juice-checkbox-runtime.md) |
| Radio | `[radiogroup]` | One option in a group. `[radio]` outside the group is ignored. | [Radio](./juice-radio-runtime.md) |
| Switch | `[switch]` | Binary toggle on a button. A checkbox host is secondary. | [Switch](./juice-switch-runtime.md) |
| Slider | `[slider]` | Single horizontal value the user sets. | [Slider](./juice-slider-runtime.md) |
| Field | `[field]` | Help and error text around a control. Not a validator. | [Field](./juice-field-runtime.md) |
| Icon button | `[icon-button]` | Square icon-only control. Shipped in 0.9.3. | [Icon button](./juice-icon-button-runtime.md) |
| Pressable | `[pressable]` | Transient press. Shipped in 0.9.4. | [Pressable](./juice-pressable.md) |
| Touchable row | `[touchable-row]` | 44px row. Shipped in 0.9.4. | [Touchable row](./juice-touchable-row.md) |

### Feedback

| Component | Markup hook | What it's for | Docs |
| --- | --- | --- | --- |
| Banner | `[banner]` | Inline alert. Stays until dismiss. | [Banner](./juice-banner-runtime.md) |
| Progress | `[progress]` | Meter the user does not set. | [Progress](./juice-progress-runtime.md) |
| Spinner | `[spinner]` | Busy indicator with no value. | [Spinner](./juice-spinner-runtime.md) |

### Disclosure

| Component | Markup hook | What it's for | Docs |
| --- | --- | --- | --- |
| Accordion | `[accordion]` | Several sections, multi-open. All 14 themes bind `--juice-accordion-*`. | [Accordion](./juice-accordion-runtime.md) |
| Disclosure | `[disclosure]` | One trigger and one panel. | [Disclosure](./juice-disclosure-runtime.md) |
| Wizard | `[wizard-shell]` | Multi-step flow. One page visible. | [Wizard](./juice-wizard-runtime.md) |

### Data display

| Component | Markup hook | What it's for | Docs |
| --- | --- | --- | --- |
| Avatar | `[avatar]` | Initials or a photo. Shipped in 0.9.3. | [Avatar](./juice-avatar.md) |
| Table | `<table table>` | Sortable grid. Shipped in 0.9.3. | [Table](./juice-table.md) |

### Page chrome

| Component | Markup hook | What it's for | Docs |
| --- | --- | --- | --- |
| Keyboard avoider | `[keyboard-avoider]` | Inset while the software keyboard is open. Shipped in 0.9.5. Not a `JuiceRuntimeName`. | [Keyboard avoider](./juice-keyboard-avoider-runtime.md) |

CSS-only, and not part of the thirty-one:

- [Skeleton](./juice-skeleton.md)
- [List](./juice-list.md)
- [Badge](./juice-badge.md)
- [Safe area](./juice-safe-area.md)

## Choosing between similar components

| You need | Use | Not |
| --- | --- | --- |
| A centered dialog with a focus trap | Modal | Drawer, popover, toast |
| An edge-docked dialog | Drawer | Modal |
| A floating panel anchored to a control | Popover | Tooltip, menu, modal |
| A hover or focus tip with no interactive content | Tooltip | Popover, native `title` |
| A corner stack of messages | Toast | Banner, a dialog |
| An inline alert that stays until dismiss | Banner | Toast |
| An action menu | Menu | Popover, combobox, a menubar |
| A text field with a filtered list | Combobox | Native select, popover |
| The platform dropdown | Select | Combobox |
| A native text field | Input | Combobox, select |
| A native multiline field | Textarea | Input, select, combobox |
| Help and error text around a control | Field | A validation engine |
| A binary toggle that is not a form checkbox | Switch | Checkbox |
| A form checkbox | Checkbox | Switch |
| One option in a group | Radio | Checkbox |
| A value the user sets | Slider | Progress |
| A meter the user does not set | Progress | Slider, spinner |
| A busy indicator with no value | Spinner | Progress |
| One panel at a time in a tablist | Tabs | Accordion, wizard |
| Several sections, more than one open | Accordion | Disclosure |
| One trigger and one panel | Disclosure | Accordion |
| A multi-step flow | Wizard | Tabs, a dialog |
| A trail of links | Breadcrumb | Pagination, a router |
| A set of pages | Pagination | Breadcrumb, a router |
| A square icon-only control | Icon button | Switch, checkbox |
| A transient press | Pressable | A latched toggle |
| A 44px row | Touchable row | Table, list |
| Initials or a photo | Avatar | Badge, `[skeleton="circle"]` |
| A sortable grid | Table | List |
| Space for the software keyboard | Keyboard avoider | Safe area |

## Automatic behavior

The entry watches for the hooks in the tables above.

- It boots on `DOMContentLoaded` when the document is still loading, and immediately otherwise.
- It responds to later DOM changes. [Sync](#sync).
- It does not need app init, a framework adapter, or business logic.

The same markup works in raw HTML, server templates, Sig, and React, because the runtime sees DOM.

`stop*Runtime()` destroys the document controller. A second `start*Runtime()` syncs and returns the same controller, or `null` when there is no document.

`stopNavigationRuntime()` does not cancel a deferred boot. That `DOMContentLoaded` listener is anonymous. Every other `stop*Runtime()` cancels its deferred boot.

Each runtime also exports `create*` and `init*`. `init*` is the same call as `create*`. A custom-root controller can run beside the document runtime. Where a runtime claims clicks or keys, each event is claimed once.

<details>
<summary>What a runtime owns</summary>

The runtime owns built-in interaction and the accessibility state that markup implies.

It does not own business logic, app workflows, or framework state.

If valid Juice markup is in the browser, the feature should run without app glue.

</details>

## Sync

The DOM can change after load, including in hydrated pages.

A mutation observer schedules `sync()` on the next animation frame, so a burst of edits becomes one pass.

Some events publish immediately and are not deferred to that frame. Avatar `load` and `error`, and a table sort click, are two of those. Each runtime page names its own.

Shared helpers under `libraries/juice/src/js/src/shared/` are not a public multi-feature API.

## Escape / layering

When several surfaces are open, later bands yield so a higher band owns Escape. Highest band first. This is the keyboard contract, not the paint order. See [z-index bands](#z-index-bands).

Modal and drawer do not yield to each other. If both overlays are open, one Escape closes both.

| Order | Surface | Owns Escape when | Yields when |
| --- | --- | --- | --- |
| 1 | Modal / drawer | An open `[modal-overlay]` or `[drawer-overlay]` without `hidden` | Does not yield to later bands, or to each other |
| 2 | Popover / menu | An open `[popover-root]` or an open `[menu]` | An open dialog overlay exists. Popover and menu do not yield to each other. Menu `hidden` is on `[menu]`, not `[menu-root]` |
| 3 | Combobox | An open `[combobox-list]` | An open dialog, popover, or menu exists |
| 4 | Toast / tooltip | See the note below | See the note below |
| — | Banner, switch, slider, checkbox, radio, breadcrumb, progress, spinner, select, input, textarea, field, icon button, avatar, table, pagination, pressable, touchable row, keyboard avoider | Never | Dismiss, toggle, sort, or value stays on the control |
| — | Accordion | The focused open item, or the last opened item, in that accordion | There is no global accordion Escape |
| — | Disclosure | The focused open disclosure, or the last opened one | An open modal, drawer, or popover exists |
| — | Tabs, wizard | Out of scope | Tabs ignores Escape. Wizard is not a dialog |
| — | Navigation | On a mobile viewport, Escape closes open sidebars | Desktop navigation does not close on Escape |

Toast does not block tooltip Escape. With both open, the first Escape hides the tip and leaves toasts visible. The next Escape dismisses the most recently shown visible toast.

Tooltip yields to an open dialog, popover, menu, or combobox list. Toast yields to those, plus an open tooltip.

Yield checks use internal overlay queries in `libraries/juice/src/js/src/shared/`. The public `create` / `init` / `start` / `stop` contract is unchanged.

## Z-index bands

Core chrome sets these stacking values. They are structural bands, not a theme contract. There is no `--juice-z-*` token. Visual stacking is not the Escape order: toast paints above tooltip, and tooltip still owns Escape first when both are open.

| Band | Surfaces | `z-index` | Notes |
| --- | --- | --- | --- |
| Overlay | `[modal-overlay]`, `[drawer-overlay]` | `1000` | Dialog scrims |
| Anchored | `[popover-root]`, `[combobox-list]`, `[menu]` | `1050` | Floating panel, listbox, and menu |
| Tip | `[tooltip-root]` | `1060` | Slightly above anchored chrome |
| Snackbar | `[toast-region]` | `1100` | Highest overlay chrome |
| Wizard chrome | `[wizard-header]` | `50` | Sticky in-page header |
| Nav chrome | `nav[type="sidebar"]` | `30` | Sidebar and mobile panel |
| Banner, switch, slider, checkbox, radio, breadcrumb, progress, spinner, select, input, textarea, field, icon button, pagination, pressable, touchable row, keyboard avoider | those hooks | none | Inline. Slider thumb is `z-index: 1` inside the track |
| Avatar | `[avatar]` | none | Photo is `1` and the status dot is `2`, inside the avatar. A group stacks the first eight faces from 8 down to 1 |
| Table | `[table]` | none | Sticky `thead` cells use `z-index: 1` inside the table |
| Skeleton, list, badge, safe area | those hooks | none | CSS-only. Badge layout shipped in npm 0.9.2. Badge `--juice-badge-*` roles, skeleton, list, and safe area shipped in 0.9.3 |

Tabs, accordion, and disclosure do not set a stacking band.

## juice:change

Interactive runtimes dispatch a bubbling, composed `juice:change` `CustomEvent` from the widget host when observable state changes. Clicks, keys, and programmatic writes all count.

A write that leaves the previous state unchanged does not dispatch. The first observation of a host is recorded and does not dispatch, so init can normalize ARIA without looking like a change.

```ts
type JuiceChangeDetail<TState> = {
  runtime: string;
  state: TState;
};
```

`JUICE_CHANGE_EVENT` is the string `'juice:change'`. It shipped in 0.9.3. It is not in the published 0.9.2 types.

Listen on the host or any ancestor. `detail.state` is a copy. `getState(target)` returns that same shape, or `null` when the host is missing.

Select, input, and textarea publish value changes through the native `input` and `change` events. They do not dispatch `juice:change`. `getState()` still returns `{ value: string }`.

```ts
import { startSwitchRuntime } from "@citrusworx/juiceui";

const host = document.querySelector<HTMLElement>("[switch]")!;

host.addEventListener("juice:change", (event) => {
  const { runtime, state } = (event as CustomEvent).detail;
  // runtime === "switch", state === { checked: boolean }
});

startSwitchRuntime()?.getState(host); // { checked: boolean } | null
```

The table is the whole contract. Pressable is the twenty-ninth runtime, touchable row is the thirtieth, and keyboard avoider is the thirty-first. `@citrusworx/sigjs/juice` `bind()` names twenty-eight runtimes, through `table`. It does not name pressable, touchable-row, or keyboard-avoider.

The last column is how `bind` treats `state.set`. Read-only means the signal can update from the host, and `set` does not call a controller. A read-only runtime still seeds a signal.

| Runtime | Host | `detail.state` / `getState()` | Readers | Sig `bind` |
| --- | --- | --- | --- | --- |
| `switch` | `[switch]` | `{ checked: boolean }` | `isChecked`, `getState` | write-back `setChecked` |
| `checkbox` | `[checkbox]` | `{ checked: boolean }` | `isChecked`, `getState` | write-back `setChecked` |
| `disclosure` | `[disclosure]` | `{ expanded: boolean }` | `isExpanded`, `getState` | write-back `expand` / `collapse` |
| `accordion` | `[accordion]` | `{ expanded: boolean[] }` | `isExpanded`, `getState` | read-only |
| `modal` | `[modal-overlay]` | `{ open: boolean }` | `isOpen`, `getState` | write-back `open` / `close` |
| `drawer` | `[drawer-overlay]` | `{ open: boolean }` | `isOpen`, `getState` | read-only |
| `popover` | `[popover-root]` | `{ open: boolean }` | `isOpen`, `getState` | read-only |
| `menu` | `[menu-root]` | `{ open: boolean }` | `isOpen`, `getState` | read-only |
| `combobox` | `[combobox]` | `{ open: boolean, value: string }` | `isOpen`, `getState` | read-only |
| `slider` | `[slider]` | `{ value: number }` | `getValue`, `getState` | read-only |
| `progress` | `[progress]` | `{ value: number, indeterminate: boolean }` | `getValue`, `isIndeterminate`, `getState` | read-only |
| `radio` | `[radiogroup]` | `{ value: string \| null, index: number }` | `getChecked`, `getState` | read-only |
| `tabs` | `[tabs]` | `{ selected: number }` | `selected`, `getState` | read-only |
| `pagination` | `[pagination]` | `{ current: number }` | `getCurrent`, `getState` | read-only |
| `breadcrumb` | `[breadcrumb]` | `{ current: number }` | `getCurrent`, `getState` | read-only |
| `wizard` | `[wizard-shell]` | `{ current: number }` | `current`, `getState` | read-only |
| `toast` | `[toast]` | `{ shown: boolean }` | `isShown`, `getState` | read-only |
| `banner` | `[banner]` | `{ shown: boolean }` | `isShown`, `getState` | read-only |
| `tooltip` | `[tooltip-root]` | `{ shown: boolean }` | `isShown`, `getState` | read-only |
| `spinner` | `[spinner]` | `{ shown: boolean }` | `isShown`, `getState` | read-only |
| `nav` | `nav[type="sidebar"]` | `{ open: boolean }` | `isOpen`, `getState` | read-only |
| `field` | `[field]` | `{ invalid: boolean }` | `isInvalid`, `getState` | read-only |
| `select` | `select[select]` | `{ value: string }` | `getState` (native `input` / `change`) | read-only |
| `input` | `input[input]` | `{ value: string }` | `getState` (native `input` / `change`) | read-only |
| `textarea` | `textarea[textarea]` | `{ value: string }` | `getState` (native `input` / `change`) | read-only |
| `icon-button` | `[icon-button]` | `{ pressed: boolean, disabled: boolean, named: boolean }` | `getState` | write-back `toggle` when `[toggle]` and `pressed` changes |
| `avatar` | `[avatar]` | `{ loaded: boolean, fallback: boolean, hasImage: boolean }` | `getState` | read-only |
| `table` | `[table]` | `{ column: number \| null, direction: "ascending" \| "descending" \| "none" }` | `getState` | read-only |
| `pressable` | `[pressable]` | `{ pressed: boolean, longPressed: boolean }` | `getState` | not a `JuiceRuntimeName` |
| `touchable-row` | `[touchable-row]` | `{ selected: boolean, disabled: boolean }` | `getState` | not a `JuiceRuntimeName` |
| `keyboard-avoider` | `[keyboard-avoider]` | `{ open: boolean, inset: number }` | `getState` | not a `JuiceRuntimeName` |

### State notes

| Runtime | Reading `state` |
| --- | --- |
| Accordion | `expanded` follows trigger order. |
| Disclosure | `expanded` is the first trigger. |
| Tabs, pagination, breadcrumb | Index is 0-based, or `-1` when nothing is current. Tabs `selected()` still returns the trigger element. |
| Radio | `value` is the checked option's `value` attribute. `index` is its position, or `-1`. `getChecked()` still returns the element. |
| Menu | `open` is whether `[menu]` is shown. |
| Nav | `open` means the sidebar lacks `hidden`. |
| Field | `invalid` is `[invalid]` on the wrapper. |
| Toast | `shown` is the `[toast]` host, not the region. |
| Icon button | `pressed` is `aria-pressed="true"` or `[pressed]`. `disabled` is `[disabled]`, `aria-disabled="true"`, or a native disabled control. `named` is a non-empty `aria-label`, an `aria-labelledby` that resolves to visible text, or visible text. `title` is not a name. A refused write snaps the signal back. |
| Avatar | `loaded` is true when at least one image has loaded. `fallback` is true when the avatar has an image, none have loaded, and none are still loading. `hasImage` is true when there is at least one `<img>`. Initials with no image are all false. |
| Table | `column` is `null` when `direction` is `"none"`. Otherwise it is the active header's `cellIndex`. There is no API to set sort. |
| Pressable | `pressed` is the transient gesture, not a latched `[pressed]`. `longPressed` is true only after `juice:longpress` for that gesture. |
| Touchable row | `selected` is `[selected]`, `aria-selected="true"`, or `aria-current` other than `"false"`. It is not the `select` word. `disabled` is `[disabled]`, `aria-disabled="true"`, or a native disabled control. |
| Keyboard avoider | `open` is inset above `threshold` (default 80) while an editable control is focused. `inset` is the measured overlap in pixels. |

## Sig adapter

`bind` lives in Sig. Juice runtimes do not import Sig, and Juice still runs when Sig is absent.

```ts
import { bind } from "@citrusworx/sigjs/juice";

const notes = bind(switchHost, "switch");
notes.state.get(); // { checked: boolean }, a Sig signal
notes.state.set({ checked: true }); // write-back
notes.dispose();
```

`bind(host, runtime?)` returns `{ state, dispose }`.

- `state` is seeded from `getState()` and follows `juice:change`.
- Select, input, and textarea follow native `input` and `change`.
- Write-back is switch, checkbox, disclosure, modal, and icon-button.
- Icon-button calls `toggle` only when the host has `[toggle]` and `pressed` changes. The signal is then republished from the host.
- A disabled host, or a host without `[toggle]`, refuses that write. The signal matches the host.
- Avatar and table are read-only. Table has no API to set sort.
- The other read-only names are accordion, drawer, popover, menu, combobox, slider, progress, radio, tabs, pagination, breadcrumb, wizard, toast, banner, tooltip, spinner, nav, field, select, input, and textarea.

`JuiceRuntimeName` is twenty-eight names, through `table`, on master and in `@citrusworx/sigjs@0.7.2`.

Published `@citrusworx/sigjs@0.7.0` and `@citrusworx/sigjs@0.7.1` stop at twenty-five names, through `textarea`.

Binding `icon-button`, `avatar`, or `table` against `@citrusworx/juiceui@0.9.1` or `@citrusworx/juiceui@0.9.2` throws, because those cuts do not export `startIconButtonRuntime`, `startAvatarRuntime`, or `startTableRuntime`. The three exports shipped in 0.9.3. The other runtimes still bind.

`dispose` drops the listeners, including when the binding was created during Sig render and the view unmounts.

`@citrusworx/juiceui` is an optional peer of Sig. The main Sig entry does not import it. The subpath shipped in `@citrusworx/sigjs@0.4.0` and is not part of `@citrusworx/juiceui`.

`juice:change` and `getState()` shipped in 0.9.3. Icon button, avatar, and table ship that contract from 0.9.3. Pressable and touchable row ship it from 0.9.4. Keyboard avoider ships it from 0.9.5.

How to call `bind`, including disposal, is [Runtime binding](../sigjs/sig-juice-integration.md#runtime-binding).
