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

Checked against the published tarballs of `@citrusworx/sigjs@1.0.0` and `@citrusworx/juiceui` 0.9.1 through 0.9.5. The optional peer range is still `>=0.9.1 <1`.

| Juice | `import "@citrusworx/sigjs/juice"` | Names you can bind |
|---|---|---|
| 0.9.1 | Throws. Missing named export `startDisclosureRuntime`. Also missing field, input, select, spinner, and textarea | None. The module does not evaluate |
| 0.9.2 | Loads | 25. Icon button, avatar, and table throw `needs a newer @citrusworx/juiceui` |
| 0.9.3 | Loads | All 28 `JuiceRuntimeName` values |
| 0.9.4 | Loads | All 28. Juice also ships pressable and touchable row, which Sig does not bind |
| 0.9.5 | Loads | All 28. Juice also ships keyboard avoider, which Sig does not bind |

The 0.9.2 error is exact:

```text
Sig juice bind: "icon-button" needs a newer @citrusworx/juiceui that exports startIconButtonRuntime.
```

Avatar and table use the same sentence with `startAvatarRuntime` and `startTableRuntime`. The message has no version number. The other 25 runtimes still bind on 0.9.2.

Sig 1.0.0 does not add names for the Juice runtimes that shipped after the adapter: pressable, touchable row, keyboard avoider.

### What the signal follows

| Hosts | Events |
|---|---|
| select, input, textarea | Native `input` and `change`, then `getState()` |
| The other 25, including icon button, avatar, and table | Bubbling `juice:change` with `detail: { runtime, state }` |

The event counts only when `event.target` is the bound host and `detail.runtime` matches. A change that bubbles from a descendant is ignored. An equal state does not notify.

`state` starts as `structuredClone(getState())`.

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

A host that matches an earlier row stays on that runtime. `[switch]` wins over `[icon-button]` when both are present.

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
| The other 21 | | `set` updates the signal only. The next host event overwrites it |

Local state shapes for the three newer names, as declared by Sig 1.0.0:

| Runtime | State |
|---|---|
| `icon-button` | `{ pressed: boolean; disabled: boolean; named: boolean }` |
| `avatar` | `{ loaded: boolean; fallback: boolean; hasImage: boolean }` |
| `table` | `{ column: number \| null; direction: "ascending" \| "descending" \| "none" }` |

The other state types are imported from the installed Juice package.

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
