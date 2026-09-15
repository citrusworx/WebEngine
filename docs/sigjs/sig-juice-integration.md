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
