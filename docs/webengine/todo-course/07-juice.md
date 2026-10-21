# 07 — Style with Juice

[Previous](./06-mutations.md) · [Course](./README.md) · [Next](./08-conditionals.md)

**Goal:** paint the ToDo page with Juice's Tide theme, use a numeric `gap`, and keep the app stylesheet limited to what Tide cannot say.

## What you'll build

The attributes on `body`, `App`, the form, and the row. Plus `todo.css`, which exists where a Juice selector cannot see a Sig property, or where a Tide rule paints the wrong role.

## Steps

### 1. Theme

Tide is the shipped dark product theme. The Juice course lists it as "dark SaaS, lagoon/teal". Citrusmint is a light marketing theme. KiwiPress is a light product theme with a rounded face. Tide is the one that already has Inter, a near-black page, and one accent.

`body` in `index.html`:

```html
  <body theme="tide">
```

`main.tsx` imports core CSS, then the theme:

```ts
import "@citrusworx/juiceui/styles";
import "@citrusworx/juiceui/styles/themes/tide";
```

Core CSS is structure. The theme file is identity. They are separate imports on purpose. Juice's core sheet already loads Inter, which is the family Tide names in `--tide-body-font` and `--tide-heading-font`.

Tokens this page uses, all defined on `[theme="tide"]`:

| Token | Role |
|---|---|
| `--tide-page` | Page background, and the ink on the accent button |
| `--tide-heading` | Title and task name |
| `--tide-text` | Body |
| `--tide-text-muted` | Subtitle, labels, notes, quiet buttons, a finished task |
| `--tide-accent` | The one accent. Primary button and a checked `[checkbox]` |
| `--tide-accent-strong` | Hover on that button |
| `--tide-border` | Card edge and row dividers |
| `--tide-surface-muted` | Hover wash and the empty well |
| `--tide-banner-error` | The error line. On Tide this alias is the accent, not a red |

### 2. Page shell

The page shell in `App`:

```tsx
    <main container narrow stack gap="2" padding="comfortable" data-todo>
      <section tide-card stack gap="2" padding="comfortable">
        <header stack gap="1">
          <h1 fontSize="xl">ToDo</h1>
```

| Attribute | What it does here |
|---|---|
| `container` `narrow` | Centers a 960px page column |
| `stack` | Column flex |
| `gap="2"` | `2rem` between the header, form, and list. The generator also shrinks that on narrow viewports |
| `padding="comfortable"` | A named padding step (`2rem`). This name is real for padding |
| `tide-card` | Tide's centered surface: about `45rem`, radius, border, shadow. It does not set `margin-inline: auto`. `todo.css` does |
| `fontSize="xl"` | A type step from the utility scale (`2rem`) |
| `data-todo` | Not Juice. The hook for `todo.css` |

`gap="2"` is a number. The selector in `libraries/juice/src/core/mixins.scss` is `[gap="#{$i}"]` for `i` from 1 to 100, plus decimals and `rem` / `px` forms. It does not emit `[gap="comfortable"]`. The spacing names `snug`, `cozy`, `comfortable`, `roomy`, and `expansive` are generated for padding and margin. Using `gap="comfortable"` matches nothing.

So: `gap="0.5"`, `gap="0.75"`, `gap="1"`, `gap="2"`. Not a word. `padding="comfortable"` and `padding="cozy"` are fine.

The subtitle under the heading stays a normal `<p>`. Juice's next font step after `sm` (`0.75rem`) is `md` (`1.25rem`). `todo.css` sets that line to `0.875rem` and `--tide-text-muted`, because the scale has no step in between.

### 3. Surfaces and controls

The form is layout inside the card, not a second panel:

```tsx
    <form
      stack
      gap="1"
```

`field` and `field-label` mark the label stack. `gap="0.5"` is half a rem between a label and its control. Text fields carry the boolean attributes `input` and `textarea`, which is how Juice's field chrome (padding, radius, Tide's `--juice-input-*` colors) finds them. A bare `<input>` only gets Tide's generic element rule.

The primary button:

```tsx
        <button data-primary type="submit" btn="flat">Add todo</button>
```

`btn="flat"` is one of the button values Juice ships (`flat`, `outline`, `text`, `3d`, `metallic`). `data-primary` is not a Juice attribute. It is the hook that flattens Tide's gradient down to `--tide-accent`. Edit and Delete stay `btn="outline"`.

The row is a divider, not a nested panel. The checkbox is Juice's `[checkbox]` host, so the box is `1.25rem` with Tide's check color. The title and the actions use `data-inline` so they stay on one line. `row` with `space="between"` and `gap="0.75"` is the cluster. `ul[stack]` removes list bullets.

### 4. The stylesheet you do need

`apps/todo/front/src/todo.css` is the whole exception list. It is not a second theme.

```css
/* Author CSS beats the user-agent [hidden] rule. :where([stack]) and
   `button { display: inline-flex }` keep a node on screen after Sig sets
   `hidden`. Restore the HTML behavior inside this app. */
[data-todo] [hidden] {
  display: none;
}

/* Juice [width] is an attribute selector. Sig assigns the DOM property
   `width` instead, so [width="100%"] never matches these controls.
   [checkbox] is the box, not a text field, so it keeps Juice's 1.25rem. */
[data-todo] input:not([checkbox]),
[data-todo] textarea {
  width: 100%;
  box-sizing: border-box;
}

/* Tide paints every form, header, and [field] as its own glass surface.
   Inside the one [tide-card], those regions are layout. */
[data-todo] form,
[data-todo] header,
[data-todo] [field] {
  background: transparent;
  background-image: none;
  border: none;
  box-shadow: none;
  backdrop-filter: none;
}

/* [tide-card] sets the measure. It does not center itself. */
[data-todo] [tide-card] {
  margin-inline: auto;
}

/* Tide's generic button is a lagoon gradient, at the same specificity as
   [btn], and the theme file loads after core. Quiet actions drop it.
   The primary action is a flat --tide-accent fill. */
[data-todo] button[btn="outline"] {
  background-image: none;
  background-color: transparent;
  color: var(--tide-text-muted);
  border: 1px solid transparent;
  box-shadow: none;
  border-radius: 0.5rem;
  padding: 0.35rem 0.6rem;
  font-size: 0.8125rem;
  font-weight: 500;
}

[data-todo] button[btn="outline"]:hover,
[data-todo] button[btn="outline"]:focus-visible {
  color: var(--tide-heading);
  background-color: var(--tide-surface-muted);
  border-color: var(--tide-border);
  box-shadow: none;
}

[data-todo] button[data-primary] {
  background-image: none;
  background-color: var(--tide-accent);
  color: var(--tide-page);
  border: 1px solid transparent;
  border-radius: 0.5rem;
  box-shadow: none;
  font-weight: 600;
  padding: 0.55rem 1.05rem;
}

[data-todo] button[data-primary]:hover,
[data-todo] button[data-primary]:focus-visible {
  background-color: var(--tide-accent-strong);
  color: var(--tide-page);
  box-shadow: none;
}

/* Juice [row] becomes a column at max-width 768px. These clusters stay inline. */
[data-todo] [data-inline] {
  flex-direction: row;
  align-items: flex-start;
  flex-wrap: wrap;
}

[data-todo] label[data-inline] {
  flex: 1 1 12rem;
  align-items: center;
  min-width: 0;
}

[data-todo] h1 {
  letter-spacing: -0.03em;
  font-weight: 600;
  line-height: 1.15;
}

[data-todo] header p,
[data-todo] [field-label],
[data-todo] [data-notes],
[data-todo] [data-meta] {
  color: var(--tide-text-muted);
}

[data-todo] header p,
[data-todo] [data-notes] {
  font-size: 0.875rem;
  line-height: 1.5;
}

[data-todo] [field-label] {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

[data-todo] [data-title] {
  color: var(--tide-heading);
  font-weight: 500;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

[data-todo] [data-notes],
[data-todo] [data-meta] {
  padding-left: 2rem;
}

[data-todo] ul:not(:empty) {
  border-top: 1px solid var(--tide-border);
}

[data-todo] [data-row] {
  padding: 0.85rem 0.25rem;
  border-bottom: 1px solid var(--tide-border);
  border-radius: 0.5rem;
}

[data-todo] [data-row]:last-child {
  border-bottom: none;
}

[data-todo] [data-row]:hover {
  background: color-mix(in srgb, var(--tide-text) 6%, transparent);
}

[data-todo] [data-empty] {
  border: 1px dashed var(--tide-border);
  border-radius: 0.75rem;
  background: var(--tide-surface-muted);
}

[data-todo] [data-error] {
  color: var(--tide-banner-error);
  font-size: 0.875rem;
}
```

Sig's JSX runtime treats `width` and `style` as DOM properties when the element has them (`"width" in input` is true). Assigning `input.width = "100%"` does not create the attribute Juice's `[width="100%"]` rule matches. The same trap exists for a `style` prop.

The strikethrough on a finished todo is an effect writing `element.style.textDecoration`, and the muted color is `element.style.color = "var(--tide-text-muted)"`. Juice does not ship a line-through attribute. The effect is in `TodoRow`. Lesson 08 reads it.

Tide also paints every `form`, `header`, and `[field]` as its own glass card, and every `button` as the accent gradient. Inside one product card that is too many surfaces and too many accents. The overrides above flatten the nested chrome, quiet `btn="outline"`, and keep a single flat accent on `[data-primary]`.

`[row]` becomes a column at `max-width: 768px`. There is no Juice attribute that opts out. `[data-inline]` keeps the checkbox with its title, and Edit beside Delete, at a phone width.

## Checkpoint

In devtools, select the `<section>`. Confirm it has `tide-card`, `stack`, `gap="2"`, and `padding="comfortable"`. `body` has `theme="tide"`. The Add button's background image is `none`, and its background color is the computed `--tide-accent`.

Change `gap="2"` to `gap="comfortable"` in a local edit, reload, and watch the gap collapse to nothing. Put `gap="2"` back.

Narrow the window below 768px. The checkbox stays beside the title. Numeric gap rules include smaller values under the small breakpoint.

## What's happening

Juice is CSS. Attributes are the API. Sig creates the elements and sets attributes it does not understand as attributes, which is why `stack`, `gap`, `tide-card`, and `btn` work. When Sig recognizes a DOM property, it writes the property instead, and the attribute selector misses.

Tide decides identity: page, type, accent, card, checkbox, field. The app decides the product layout and the few places Tide's element defaults are the wrong role. That boundary is why `todo.css` exists.

The [Juice course](../../juice/course/README.md) is the design-system argument, including [themes](../../juice/course/06-themes.md). This lesson only applies the attributes and tokens the ToDo page actually uses.

## Gap

**`[gap]` is numeric.** Words that work on `padding` do not work on `gap`. That is the generator, not a theme bug.

**Property versus attribute.** Coming soon would be Sig leaving `width` and `style` as attributes when the value is a Juice token. Today the app avoids those props and uses `todo.css` plus `element.style` in an effect.

**Tide has no quiet-button attribute that beats its generic button rule, and `[row]` has no "stay horizontal" switch.** Both are in `todo.css` on purpose. They are not a new theme.

## Next

[08 — Conditionals without Show](./08-conditionals.md)
