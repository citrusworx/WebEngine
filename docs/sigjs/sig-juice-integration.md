# Sig.js + Juice

Juice owns structure and identity. Sig.js owns values that change after paint. They compose because they do not fight for the same job.

## The split

| Concern | Owner |
|---|---|
| Layout, spacing, surfaces | Juice attributes (`stack`, `row`, `grid`, `gap`, `card`, `panel`, `hero`, `surface`) |
| Brand, type, color defaults | Theme CSS (`theme="…"` on the root) |
| One-off brand polish | Small app CSS |
| Counters, toggles, forms, routes | Sig.js signals and effects |

Juice is not a component runtime. Do not import `{ Button }` from `@citrusworx/juiceui` — that export is not the integration path. Write HTML (or Sig JSX) and put Juice attributes on the tags.

## Setup

```bash
yarn add @citrusworx/juiceui @citrusworx/sigjs
```

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@citrusworx/sigjs"
  }
}
```

```ts
import "@citrusworx/juiceui/styles";
import "./generated/my-theme.css";
import { mount } from "@citrusworx/sigjs";
import { App } from "./App";

mount(<App />, document.getElementById("root")!);
```

```html
<body theme="my-theme">
  <div id="root"></div>
</body>
```

The stylesheet path is `@citrusworx/juiceui/styles`, not a `dist/juice.css` file. Core CSS does not include a theme; import a library theme or an app-generated theme separately. See [Juice getting started](../juice/juice-getting-started.md).

## Why attributes survive Sig JSX

Sig's `setProp` treats unknown keys as attributes. Juice's `stack`, `gap`, `padding`, `card`, and `surface` are not DOM properties, so they land on the element as attributes. Juice CSS then matches `[stack]`, `[gap="2rem"]`, and so on.

Static Juice flags (`stack`, `card`) should still be `true`. Function-valued Juice attributes subscribe:

```tsx
// Static Juice — correct
<section card padding="1.25rem" stack gap="1rem">…</section>

// Live Juice attribute
<section padding={() => size.get()}>…</section>

// Snapshot — first value, forever
<section padding={size.get()}>…</section>
```

`ref` + `effect` + `setAttribute` is still valid when several attributes should move together.

## Showcase: Juice page, Sig counter

```tsx
import "@citrusworx/juiceui/styles";
import "./generated/my-theme.css";
import { Signal, effect, mount } from "@citrusworx/sigjs";

function App() {
  const count = Signal(0);
  const label = <span>0</span> as HTMLSpanElement;

  effect(() => {
    label.textContent = String(count.get());
  });

  return (
    <main stack gap="2rem">
      <section hero surface="brand-stage" padding="2rem" stack gap="1rem">
        <p muted>Publishing</p>
        <h1>Juice structure, Sig behavior</h1>
        <p>
          Juice keeps layout in markup. Sig.js updates the count without
          re-rendering the page.
        </p>
      </section>

      <section grid gap="1rem">
        <article card padding="1.25rem" stack gap="0.75rem">
          <h2>Count</h2>
          <p>{label}</p>
          <button
            type="button"
            onClick={() => count.set(count.get() + 1)}
          >
            Add one
          </button>
        </article>

        <aside panel surface="brand-panel" padding="1.25rem" stack gap="0.75rem">
          <h2>Identity</h2>
          <p>Theme CSS still owns type and color. This panel does not re-mount.</p>
        </aside>
      </section>
    </main>
  );
}

mount(<App />, document.getElementById("root")!);
```

The hero, grid, card, and panel are ordinary elements. Only `label` is subscribed.

## Showcase: filter chips that rewrite a list

```tsx
import { Signal, effect } from "@citrusworx/sigjs";

type Item = { id: string; title: string; tag: "docs" | "app" };

function Catalog(props: { items: Item[] }) {
  const tag = Signal<"all" | Item["tag"]>("all");
  const list = <div stack gap="0.75rem"></div> as HTMLDivElement;

  function Chip(value: "all" | Item["tag"], label: string) {
    const button = (
      <button type="button" onClick={() => tag.set(value)}>
        {label}
      </button>
    ) as HTMLButtonElement;

    effect(() => {
      button.setAttribute("aria-pressed", String(tag.get() === value));
    });

    return button;
  }

  effect(() => {
    const selected = tag.get();
    const visible =
      selected === "all"
        ? props.items
        : props.items.filter((item) => item.tag === selected);

    list.replaceChildren(
      ...visible.map((item) => (
        <article card padding="1rem" stack gap="0.5rem">
          <h3>{item.title}</h3>
          <p muted>{item.tag}</p>
        </article>
      )),
    );
  });

  return (
    <section stack gap="1.5rem" padding="2rem">
      <div row gap="0.5rem">
        {Chip("all", "All")}
        {Chip("docs", "Docs")}
        {Chip("app", "Apps")}
      </div>
      {list}
    </section>
  );
}
```

Juice lays out the chips and cards. Sig.js decides which cards exist.

(The `Chip` generic above is illustrative; in app code, type the union explicitly.)

## Runtime binding

Juice widgets already change on their own. `bind` is how a Sig signal follows that host, and how five of them accept a write back. Juice works without this module. The DOM contract (`juice:change`, `getState()`) is enough for any other script. This subpath is the only Sig import that talks to Juice controllers.

The hookup is done. It ships as `@citrusworx/sigjs/juice` in `@citrusworx/sigjs@0.4.0`. Icon-button, avatar, and table are in npm `@citrusworx/sigjs@0.7.2` and in **1.0.0**. Pressable, touchable-row, and keyboard-avoider are in workspace **1.1.0**, which is not published yet. npm `latest` stays **1.0.0**. `@citrusworx/juiceui` is an optional peer (`>=0.9.1 <1`), so installing Sig does not install Juice. The main entry `@citrusworx/sigjs` does not import Juice. Juice depends on Sig's main entry, not on `./juice`. `sheet` is on Juice master and is not a `JuiceRuntimeName`. Binding it waits until `@citrusworx/juiceui` publishes `sheet`.

```bash
yarn add @citrusworx/sigjs @citrusworx/juiceui
```

Import the JS entry (or call the matching `start*Runtime`) so the host is enhanced before you bind it. Import styles the same way as any other Juice page.

```ts
import "@citrusworx/juiceui";
import { bind } from "@citrusworx/sigjs/juice";

const host = document.querySelector<HTMLElement>("[switch]")!;
const notes = bind(host, "switch");

notes.state.get(); // { checked: boolean }
notes.state.set({ checked: true }); // writes the host via setChecked
notes.dispose(); // drop listeners; safe to call again
```

`bind` returns `{ state, dispose }`.

| Field | What it is |
| --- | --- |
| `state` | A Sig signal, `{ get, set }`, seeded from that host's `getState()`. Later host changes update it. |
| `dispose` | Removes the host listeners. A second call does nothing. |

`bind(host)` infers the runtime from the host element. `bind(host, runtime)` uses the name you pass and types `state` to that runtime's `getState()` shape. Pass the name when inference fails, or when you want the type. Icon-button matches `[icon-button]`. Avatar matches `[avatar]`. Table matches a `<table table>` only; a `<div table>` is not a host. Pressable matches `[pressable]`. Touchable-row matches `[touchable-row]`. Keyboard-avoider matches `[keyboard-avoider]`. Those six matchers run after the original ones, in that order, so a host that already matches (for example `[switch]`, or `[icon-button]` on a pressable) stays on that runtime. A host with both `[pressable]` and `[touchable-row]` infers pressable. Pass `"touchable-row"` to bind the row. A missing host shape throws: inference failure (`could not infer a runtime`) or `getState()` returning `null`. Binding one of those six when Juice does not export that start function throws `needs a newer @citrusworx/juiceui` instead. Icon-button, avatar, and table shipped in `@citrusworx/juiceui` 0.9.3. Pressable and touchable-row shipped in 0.9.4. Keyboard-avoider shipped in 0.9.5.

### What the signal follows

`state` starts as a copy of `getState()`. After that it follows the host:

- Twenty-eight Juice runtimes dispatch a bubbling `juice:change` whose `detail` is `{ runtime, state }`. Icon button, avatar, table, pressable, touchable-row, and keyboard-avoider are six of those twenty-eight. `bind` accepts the event when `event.target` is the bound host and `detail.runtime` matches the binding.
- Pressable with `[pressable-longpress]` also dispatches a bubbling, cancelable `juice:longpress`. Its detail is `{ pressed: true, longPressed: true }`, not `{ runtime, state }`. `bind` does not listen for it. The runtime then dispatches `juice:change` with `{ pressed, longPressed }`, and the signal follows that.
- Keyboard-avoider dispatches `juice:change` from each `[keyboard-avoider]` host with state `{ open, inset }`. The first observation is silent. Later events fire when `open` flips, or when `inset` moves by at least the runtime threshold (default 80) from the last published inset while open. It also writes `--juice-keyboard-inset` on `<html>` and `[keyboard-open]` on `<html>` and each host. Smaller inset steps update those and `getState()` without an event. `bind` does not read them, so the signal stays on the last `juice:change`.
- Select, input, and textarea do not dispatch `juice:change`. `bind` also listens for native `input` and `change` on those hosts and reads `getState()` again.

An equal state does not notify. That includes a `state.set` of the current shape, and a host event whose state matches the signal. The table in [Juice runtime behavior](../juice/juice-runtime-behavior.md#juicechange) lists the thirty-one published Juice runtimes. `bind` accepts all thirty-one names in `JuiceRuntimeName`. `sheet` is on Juice master and is not in that set. Binding it waits until `@citrusworx/juiceui` publishes `sheet`.

### Write-back and read-only

`state.set` stores the next value on the signal. It writes the widget for these five:

| Runtime | `state.set` calls |
| --- | --- |
| `switch` | `setChecked(state.checked, host)` |
| `checkbox` | `setChecked(state.checked, host)` |
| `disclosure` | `expand` or `collapse` on the first `[disclosure-trigger]` (or the host, when the host is that trigger) |
| `modal` | `open(host)` or `close(host)` |
| `icon-button` | `toggle(host)` only when the host has `[toggle]` and `pressed` changes. The signal is then republished from `getState()`. A disabled host, or a host without `[toggle]`, refuses the write, and the signal snaps back to the host so it does not drift. |

The other twenty-six runtimes are read-only: accordion, drawer, popover, menu, combobox, slider, progress, radio, tabs, pagination, breadcrumb, wizard, toast, banner, tooltip, spinner, nav, field, select, input, textarea, avatar, table, pressable, touchable-row, and keyboard-avoider. Avatar has no write API. Table has no Juice API to set sort. Pressable, touchable-row, and keyboard-avoider expose `getState` only. A read-only runtime still seeds a signal from `getState()`. `set` updates the signal and does not call a controller, so the host stays where the runtime left it. The next `juice:change` (or native `input` / `change`) copies the host back over the signal.

Icon-button, avatar, table, pressable, touchable-row, and keyboard-avoider are read from `startIconButtonRuntime`, `startAvatarRuntime`, `startTableRuntime`, `startPressableRuntime`, `startTouchableRowRuntime`, and `startKeyboardAvoiderRuntime` on the Juice module. A Juice build that does not export one of those still loads this adapter. Binding that runtime, by name or from the host, throws `Sig juice bind: "table" needs a newer @citrusworx/juiceui that exports startTableRuntime.` The other five errors use the same sentence with their own names. The message has no version number. Icon-button, avatar, and table shipped in juiceui 0.9.3. Binding switch and the other existing runtimes keeps working.

```tsx
import { effect, mount } from "@citrusworx/sigjs";
import { bind } from "@citrusworx/sigjs/juice";

function SwitchLabel(props: { host: HTMLElement }) {
  const notes = bind(props.host, "switch");
  const label = <span>Off</span> as HTMLSpanElement;

  effect(() => {
    label.textContent = notes.state.get().checked ? "On" : "Off";
  });

  return (
    <span row gap="0.5rem">
      {label}
      <button type="button" onClick={() => notes.state.set({ checked: true })}>
        Turn on
      </button>
    </span>
  );
}

const switchHost = document.querySelector<HTMLElement>("[switch]")!;
mount(<SwitchLabel host={switchHost} />, document.getElementById("root")!);
```

A read-only host uses the same `bind`. Read `state.get()` from an effect. Leave `set` alone unless you only need a local copy that the next host event will replace.

### Disposal on unmount

`bind` registers its listeners with `effect`. Two cleanups apply:

- Call `dispose()` when you bound a host outside a Sig component and the host is going away.
- Call `bind` while a Sig component function is running, and the component cleanup scope owns that effect. `mount` and `SigRouter` call `disposeTree` on the way out, which runs the effect cleanup and removes the listeners. You can still call `dispose()` yourself first.

Listeners removed are `juice:change`, plus `input` and `change` for select, input, and textarea.

### Juice without this adapter

A page that never imports `@citrusworx/sigjs/juice` still gets every runtime. Listen for `juice:change` on the host, or call `getState()` from the controller. That path is [juice:change](../juice/juice-runtime-behavior.md#juicechange). Sig attributes on static markup (`stack`, `card`, `gap`) stay the other half of this guide and do not require `bind`.

## Practices

- Import Juice CSS before `mount`
- Set `theme="…"` on `body` or the app root, not on every card
- Let Juice own `stack` / `row` / `gap`; do not rebuild layout in JS on resize
- Keep Sig effects at the leaves (one label, one list)
- See [Juice best practices](../juice/juice-best-practices.md) for composition; see [Sig best practices](./sig-best-practices.md) for the behavior half of the same split
- See [Sig troubleshooting](./sig-troubleshooting.md) if a value changes and the DOM does not
- The [page tutorial](./sig-page-tutorial.md) is a Juice hero + cards with a Sig tally, disclosure, queue, and route

## What this guide will not show

Invented Juice APIs (`stack="vertical"`, `bg="primary-50"`, `cols={{ md: 3 }}`, `text="2xl"`) are not how Juice works today. If you need a visual token, use the attributes and theme contract documented under [docs/juice](../juice/README.md).
