# Sig.js + Juice

Juice owns layout and theme. Sig owns values that change after paint. They meet on the DOM: Sig writes elements, Juice CSS matches attributes on those elements.

Juice is not a component kit you import as `{ Button }`. Write HTML, or Sig JSX, and put Juice attributes on the tags.

## The split

| Concern | Owner |
|---|---|
| Layout and spacing | Juice attributes: `stack`, `row`, `grid`, `gap`, `card`, `panel`, `hero`, `surface` |
| Color and type | Theme CSS, `theme="…"` on the root |
| One-off polish | App CSS |
| Counters, fields, lists, routes | Sig signals and effects |
| Widget state (`checked`, `open`, sort) | Juice runtimes. Optional [`bind`](#runtime-binding) copies that state into a signal |

The main Sig entry does not import Juice. Juice does not import `@citrusworx/sigjs/juice`. The packages do not cycle.

## Setup

```bash
npm install @citrusworx/sigjs @citrusworx/juiceui
```

```ts
import "@citrusworx/juiceui/styles";
import "./generated/my-theme.css";
import { mount } from "@citrusworx/sigjs";

mount(<App />, document.getElementById("root")!);
```

```html
<body theme="my-theme">
  <div id="root"></div>
</body>
```

The stylesheet entry is `@citrusworx/juiceui/styles`. Core CSS does not include a theme. Import a library theme or an app theme beside it. See [Juice getting started](../juice/juice-getting-started.md).

Unknown JSX keys become attributes, so `stack` and `card` survive. `true` sets an empty attribute. A function value stays live. `padding={size.get()}` is a snapshot.

```tsx
<section card padding="1.25rem" stack gap="1rem" />
<section padding={() => size.get()} />
```

## A counter on a Juice page

```tsx
import { Signal, mount } from "@citrusworx/sigjs";

function App() {
  const count = Signal(0);

  return (
    <main stack gap="2rem">
      <section card padding="1.25rem" stack gap="0.75rem">
        <h2>Count</h2>
        <p>{() => String(count.get())}</p>
        <button type="button" onClick={() => count.set(count.get() + 1)}>
          Add one
        </button>
      </section>
    </main>
  );
}

mount(<App />, document.getElementById("root")!);
```

The card is created once. Only the text node updates. The [page tutorial](./sig-page-tutorial.md) builds a larger page in the same shape.

## Runtime binding

`bind` copies a Juice host into a Sig signal and, for five runtimes, writes back. Juice widgets already work without this import. Listen for `juice:change` or call `getState()` yourself. That contract is [juice:change](../juice/juice-runtime-behavior.md#juicechange).

It ships as `@citrusworx/sigjs/juice` in `@citrusworx/sigjs@0.4.0`. Published npm **1.0.0** binds 28 names, through `table`. Workspace **1.1.0** (not published) adds `pressable`, `touchable-row`, and `keyboard-avoider`. `@citrusworx/juiceui` is an optional peer (`>=0.9.1 <1`), so installing Sig does not install Juice. The main entry does not import Juice. `sheet` is the thirty-second Juice runtime, on master and not in npm 0.9.5. It is not a `JuiceRuntimeName`. Binding it waits until `@citrusworx/juiceui` publishes `sheet`.

```ts
import "@citrusworx/juiceui";
import { bind } from "@citrusworx/sigjs/juice";

const host = document.querySelector<HTMLElement>("[switch]")!;
const notes = bind(host, "switch");

notes.state.get(); // { checked: boolean }
notes.state.set({ checked: true }); // setChecked on the host
notes.dispose(); // safe to call again
```

Import the Juice JS entry, or call the matching `start*Runtime`, before `bind`. `getState()` on a host that was never enhanced returns null, and `bind` throws.

| Field | Behavior |
|---|---|
| `state.get` | Latest copied state. Subscribes a surrounding effect |
| `state.set` | Deep-equal values do not notify. Five runtimes also call a controller |
| `dispose` | Removes host listeners. A second call does nothing |

A `bind` call during a Sig component function disposes with that view. A bind outside a component needs `dispose()` when the host goes away. Listeners are `juice:change`, plus native `input` and `change` for select, input, and textarea.

### Juice versions

The published-Sig column was checked against the tarballs of `@citrusworx/sigjs@1.0.0` and `@citrusworx/juiceui` 0.9.1 through 0.9.5. The optional peer range is still `>=0.9.1 <1`. Workspace **1.1.0** uses the same feature detection: a missing start function throws, and the module still loads when the named imports of the original 25 succeed.

| Juice | `import "@citrusworx/sigjs/juice"` | Published Sig 1.0.0 | Workspace Sig 1.1.0 |
|---|---|---|---|
| 0.9.1 | Throws. Missing named export `startDisclosureRuntime`. Also missing field, input, select, spinner, and textarea | None. The module does not evaluate | None. The module does not evaluate |
| 0.9.2 | Loads | 25. Icon button, avatar, and table throw | 25. The six newer names throw |
| 0.9.3 | Loads | All 28 | 28. Pressable, touchable-row, and keyboard-avoider throw. Icon button, avatar, and table shipped in this cut |
| 0.9.4 | Loads | All 28. Pressable and touchable row are not names | 30. Keyboard-avoider throws. Pressable and touchable row shipped in this cut |
| 0.9.5 | Loads | All 28. Keyboard avoider is not a name | All 31. Keyboard avoider shipped in this cut |

The 0.9.2 error is exact:

```text
Sig juice bind: "icon-button" needs a newer @citrusworx/juiceui that exports startIconButtonRuntime.
```

Avatar, table, pressable, touchable-row, and keyboard-avoider use the same sentence with their start functions. The message has no version number. The other 25 runtimes still bind on 0.9.2.

`sheet` is not in either column. It is on Juice master, not in npm 0.9.5, and binding it waits until juiceui publishes it.

### What the signal follows

| Hosts | Events |
|---|---|
| select, input, textarea | Native `input` and `change`, then `getState()` |
| The other 28, including icon button, avatar, table, pressable, touchable-row, and keyboard-avoider | Bubbling `juice:change` with `detail: { runtime, state }` |

The event counts only when `event.target` is the bound host and `detail.runtime` matches. A change that bubbles from a descendant is ignored. An equal state does not notify.

`state` starts as `structuredClone(getState())`.

Pressable with `[pressable-longpress]` also dispatches a bubbling, cancelable `juice:longpress`. Its detail is `{ pressed: true, longPressed: true }`, not `{ runtime, state }`. `bind` does not listen for it. The runtime then dispatches `juice:change` with `{ pressed, longPressed }`, and the signal follows that.

Keyboard-avoider dispatches `juice:change` from each `[keyboard-avoider]` host with state `{ open, inset }`. The first observation is silent. Later events fire when `open` flips, or when `inset` moves by at least the runtime threshold (default 80) from the last published inset while open. It also writes `--juice-keyboard-inset` on `<html>` and `[keyboard-open]` on `<html>` and each host. Smaller inset steps update those and `getState()` without an event. `bind` does not read them, so the signal stays on the last `juice:change`.

### Inference

Omit the runtime name and the first matching row wins. Pass the name when you want the type, or when inference throws `could not infer a runtime`.

| Runtime | Host |
|---|---|
| `select` | `<select select>` |
| `textarea` | `<textarea textarea>` |
| `switch` | `[switch]` |
| `checkbox` | `[checkbox]` |
| `input` | `<input input>` |
| `disclosure` | `[disclosure]` |
| `accordion` | `[accordion]` |
| `modal` | `[modal-overlay]` |
| `drawer` | `[drawer-overlay]` |
| `popover` | `[popover-root]` |
| `menu` | `[menu-root]` |
| `combobox` | `[combobox]` |
| `slider` | `[slider]` |
| `progress` | `[progress]` |
| `radio` | `[radiogroup]` |
| `tabs` | `[tabs]` |
| `pagination` | `[pagination]` |
| `breadcrumb` | `[breadcrumb]` |
| `wizard` | `[wizard-shell]` |
| `toast` | `[toast]` |
| `banner` | `[banner]` |
| `tooltip` | `[tooltip-root]` |
| `spinner` | `[spinner]` |
| `nav` | `<nav type="sidebar">` |
| `field` | `[field]` |
| `icon-button` | `[icon-button]` |
| `avatar` | `[avatar]` |
| `table` | `<table table>` only. A `<div table>` is not a host |
| `pressable` | `[pressable]` |
| `touchable-row` | `[touchable-row]` |
| `keyboard-avoider` | `[keyboard-avoider]` |

A host that matches an earlier row stays on that runtime. `[switch]` wins over `[icon-button]`. `[icon-button]` wins over `[pressable]`. A host with both `[pressable]` and `[touchable-row]` infers pressable. Pass `"touchable-row"` to bind the row.

### Write-back

| Runtime | `state.set` calls | Read-only |
|---|---|---|
| `switch` | `setChecked(state.checked, host)` | |
| `checkbox` | `setChecked(state.checked, host)` | |
| `disclosure` | `expand` or `collapse` on `[disclosure-trigger]` (the host, or the first descendant) | |
| `modal` | `open(host)` or `close(host)` | |
| `icon-button` | `toggle(host)` only when the host has `[toggle]` and `pressed` changes. The signal is then read back from `getState()` | A disabled host, or a host without `[toggle]`, refuses the write. The signal stays on the host |
| avatar | | No write API |
| table | | No API to set sort |
| pressable | | `getState` only. Opt-in `juice:longpress` is not the state channel |
| touchable-row | | `getState` only |
| keyboard-avoider | | `getState` only. Sub-threshold inset steps do not move the signal |
| The other 21 | | `set` updates the signal only. The next host event overwrites it |

Local state shapes for the six newer names. Icon button, avatar, and table are in published Sig 1.0.0. Pressable, touchable-row, and keyboard-avoider are in workspace 1.1.0.

| Runtime | State |
|---|---|
| `icon-button` | `{ pressed: boolean; disabled: boolean; named: boolean }` |
| `avatar` | `{ loaded: boolean; fallback: boolean; hasImage: boolean }` |
| `table` | `{ column: number \| null; direction: "ascending" \| "descending" \| "none" }` |
| `pressable` | `{ pressed: boolean; longPressed: boolean }` |
| `touchable-row` | `{ selected: boolean; disabled: boolean }` |
| `keyboard-avoider` | `{ open: boolean; inset: number }` |

The other state types are imported from the installed Juice package. Those six are read from `startIconButtonRuntime`, `startAvatarRuntime`, `startTableRuntime`, `startPressableRuntime`, `startTouchableRowRuntime`, and `startKeyboardAvoiderRuntime` on the Juice module. A build that does not export one still loads this adapter. Binding that runtime throws `needs a newer @citrusworx/juiceui`. The message names the missing start function and has no version number.

```tsx
import { effect, mount } from "@citrusworx/sigjs";
import { bind } from "@citrusworx/sigjs/juice";

function SwitchLabel(props: { host: HTMLElement }) {
  const notes = bind(props.host, "switch");

  return (
    <span row gap="0.5rem">
      <span>{() => (notes.state.get().checked ? "On" : "Off")}</span>
      <button type="button" onClick={() => notes.state.set({ checked: true })}>
        Turn on
      </button>
    </span>
  );
}

const switchHost = document.querySelector<HTMLElement>("[switch]")!;
mount(<SwitchLabel host={switchHost} />, document.getElementById("root")!);
```

## Without the adapter

A page that never imports `@citrusworx/sigjs/juice` still gets every Juice runtime. Attributes such as `stack` and `card` do not need `bind`. Widget state without the adapter is [juice:change](../juice/juice-runtime-behavior.md#juicechange).

## Practices

| Do | Why |
|---|---|
| Import Juice CSS before `mount` | Unstyled markup is not a Sig bug |
| Set `theme` on `body` or the app root | Not on every card |
| Leave `stack`, `row`, and `gap` in markup | Do not rebuild layout in an effect |
| Keep effects on the node that changes | The card around it stays put |

Composition rules for the attributes themselves are [Juice best practices](../juice/juice-best-practices.md). Sig rules are [Best practices](./sig-best-practices.md).

## What this guide will not show

Invented values such as `stack="vertical"`, `bg="primary-50"`, or `cols={{ md: 3 }}` are not Juice's attribute contract. Use the attributes documented under [Juice](../juice/README.md).
