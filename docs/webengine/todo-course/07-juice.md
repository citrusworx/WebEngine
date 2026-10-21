# 07 — Style with Juice

[Previous](./06-mutations.md) · [Course](./README.md) · [Next](./08-conditionals.md)

**Goal:** lay the page out with Juice attributes, use a numeric `gap`, and keep the one app stylesheet honest.

## What you'll build

The attributes already on `App`, the form, and the row. Plus `todo.css`, which exists because one Juice selector cannot see a Sig property.

## Steps

### 1. Theme and page stack

`body` in `index.html` carries `theme="citrusmint"`. `main.tsx` imports `@citrusworx/juiceui/styles` and `@citrusworx/juiceui/styles/themes/citrusmint`. Core CSS is structure. The theme file is identity. They are separate imports on purpose.

The page shell in `App`:

```tsx
    <main container stack gap="2" padding="comfortable" data-todo>
      <header stack gap="1">
        <h1 fontSize="xl">ToDos</h1>
```

| Attribute | What it does here |
|---|---|
| `container` | Page width and padding from Juice's container rules |
| `stack` | Column flex |
| `gap="2"` | `2rem` between the header, form, and list. The generator also shrinks that on narrow viewports |
| `padding="comfortable"` | A named padding step (`2rem`). This name is real for padding |
| `fontSize="xl"` | A type step from the utility scale |
| `data-todo` | Not Juice. A hook for the two rules in `todo.css` |

`gap="2"` is a number. The selector in `libraries/juice/src/core/mixins.scss` is `[gap="#{$i}"]` for `i` from 1 to 100, plus decimal and `rem` / `px` forms. It does not emit `[gap="comfortable"]`. The spacing names `snug`, `cozy`, `comfortable`, `roomy`, and `expansive` are generated for padding and margin. Using `gap="comfortable"` matches nothing.

So: `gap="1"`, `gap="2"`. Not a word. `padding="comfortable"` is fine.

### 2. Surfaces and controls

The form:

```tsx
    <form
      panel
      stack
      gap="1"
      bgColor="white-100"
```

`panel` is a surface: column, padding, radius. `bgColor="white-100"` is a token attribute so the panel reads on the mint page. `field` and `field-label` mark the label stack. `btn="flat"` and `btn="outline"` are the button values Juice ships (`flat`, `outline`, `text`, `3d`, `metallic`).

The row uses `panel="compact"` and `row` with `space="between"` and `gap="1"`. `ul[stack]` removes list bullets. That rule is in Juice's layout sheet, which is why the markup does not set `list-style` itself.

### 3. The stylesheet you do need

`apps/todo/front/src/todo.css`:

```css
/* Juice [width] is an attribute selector. Sig assigns the DOM property
   `width` instead, so [width="100%"] never matches these controls. */
[data-todo] input,
[data-todo] textarea {
  width: 100%;
  box-sizing: border-box;
}
```

Sig's JSX runtime treats `width` and `style` as DOM properties when the element has them (`"width" in input` is true). Assigning `input.width = "100%"` does not create the attribute Juice's `[width="100%"]` rule matches. The same trap exists for a `style` prop: the runtime assigns the `style` property, which is a `CSSStyleDeclaration`, not an attribute string.

The strikethrough on a finished todo is an effect writing `element.style.textDecoration`. That is DOM, not a Juice attribute. Juice does not ship a line-through attribute. The effect is in `TodoRow`. Lesson 08 reads it.

This file is the escape hatch. It is not a second design system.

## Checkpoint

In devtools, select the `<main>` element. Confirm it has attributes `container`, `stack`, `gap="2"`, and `padding="comfortable"`. Change `gap="2"` to `gap="comfortable"` in a local edit, reload, and watch the gap collapse to nothing. Put `gap="2"` back.

Narrow the window. Numeric gap rules include smaller values under the small breakpoint. The stack should remain one column.

## What's happening

Juice is CSS. Attributes are the API. Sig creates the elements and sets attributes it does not understand as attributes, which is why `stack`, `gap`, `panel`, and `btn` work. When Sig recognizes a DOM property, it writes the property instead, and the attribute selector misses. That boundary is why `todo.css` exists and why the done style is an effect.

The [Juice course](../../juice/course/README.md) is the design-system argument. This lesson only applies the attributes the ToDo page actually uses.

## Gap

**`[gap]` is numeric.** Words that work on `padding` do not work on `gap`. That is the generator, not a theme bug.

**Property versus attribute.** Coming soon would be Sig leaving `width` and `style` as attributes when the value is a Juice token. Today the app avoids those props and uses `todo.css` plus `element.style` in an effect.

## Next

[08 — Conditionals without Show](./08-conditionals.md)
