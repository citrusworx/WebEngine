# Juice Styles

Juice uses attribute selectors as its primary styling API. Rather than applying endless utility classes, styles are expressed as meaningful HTML attributes — keeping markup readable, intentional, and expressive.

---

## Philosophy

Class-based utility systems work but they come at a cost — markup becomes a wall of class names that is hard to read, hard to maintain, and disconnected from what the element actually is. Juice takes a different approach.

```html
<!-- Juice — readable and expressive -->
<p font="lato" fontSize="16" textColor="black-300" leading="relaxed">
  Hello world
</p>

<!-- Class utility approach — hard to read -->
<p class="font-lato text-base text-black-300 leading-relaxed tracking-normal">
  Hello world
</p>
```

Attribute selectors keep styling purposeful. Each attribute describes one thing clearly.

---

## Selector Types

Juice uses three selector types, each with a distinct role:

| Selector | Role | Example |
|----------|------|---------|
| Attribute | Style properties — the primary API | `[font="lato"]` |
| Class | State — active, disabled, open, etc. | `.is-active` |
| ID | Unique elements | `#hero` |

Avoid using classes for style properties — that is what attributes are for. Classes are reserved for state and behavior.

---

## How It Works

Each style attribute maps to a CSS property via a selector defined in Juice's `styles/` layer. The attribute value maps to a design token.

```scss
// styles/fonts/google.scss
@use '../../tokens/fonts/google/variables' as *;

[font="lato"]        { font-family: $lato; }
[font="roboto"]      { font-family: $roboto; }
[font="montserrat"]  { font-family: $montserrat; }
[font="inter"]       { font-family: $inter; }
[font="bebas-neue"]  { font-family: $bebas-neue; }
```

```scss
// styles/color/text.scss
@use '../../tokens/color/black' as *;

[textColor="black-100"] { color: $black-100; }
[textColor="black-200"] { color: $black-200; }
[textColor="black-300"] { color: $black-300; }
// etc.
```

Token values are never duplicated — styles always reference the token, never hardcode a value.

---

## Typography Attributes

### Font Family

```html
<p font="lato">Lato</p>
<h1 font="bebas-neue">Bebas Neue</h1>
<code font="source-code-pro">Source Code Pro</code>
```

### Font Size

```html
<p fontSize="12">Small</p>
<p fontSize="16">Base</p>
<p fontSize="24">Large</p>
```

### Line Height

```html
<p leading="tight">Tight line height</p>
<p leading="normal">Normal line height</p>
<p leading="relaxed">Relaxed line height</p>
<p leading="loose">Loose line height</p>
```

### Letter Spacing

```html
<p tracking="tight">Tight tracking</p>
<p tracking="normal">Normal tracking</p>
<p tracking="wide">Wide tracking</p>
```

---

## Color Attributes

### Text Color

```html
<p textColor="black-100">Light</p>
<p textColor="black-500">Mid</p>
<p textColor="obsidian-700">Dark warm</p>
<p textColor="onyx-900">Dark cool</p>
```

### Background Color

```html
<div bgColor="black-100">Light background</div>
<div bgColor="obsidian-500">Mid warm background</div>
```

### Border Color

```html
<div borderColor="black-300">Border</div>
```

---

## Spacing Attributes

### Margin

```html
<div margin="sm">Small margin</div>
<div margin="md">Medium margin</div>
<div margin="lg">Large margin</div>

<div marginTop="sm">Top only</div>
<div marginX="md">Horizontal only</div>
<div marginY="lg">Vertical only</div>
```

### Padding

```html
<div padding="sm">Small padding</div>
<div padding="md">Medium padding</div>
<div padding="lg">Large padding</div>

<div paddingTop="sm">Top only</div>
<div paddingX="md">Horizontal only</div>
<div paddingY="lg">Vertical only</div>
```

---

## Sizing Attributes

```html
<div width="full">Full width</div>
<div width="half">Half width</div>
<div height="screen">Full screen height</div>
<div maxWidth="lg">Max width large</div>
```

---

## Layout Attributes

```html
<div display="flex">Flex container</div>
<div display="grid">Grid container</div>
<div align="center">Centered</div>
<div justify="between">Space between</div>
<div gap="md">Gap medium</div>
```

---

## Animation Attributes

```html
<div animate="fade-in">Fades in</div>
<div animate="slide-up">Slides up</div>
<div animate="slide-down">Slides down</div>
<div animate="bounce">Bounces</div>
```

---

## State Classes

Classes are reserved for state. State classes describe what an element *is* at a given moment — not how it looks.

```html
<button class="is-active">Active</button>
<button class="is-disabled">Disabled</button>
<nav class="is-open">Open nav</nav>
<input class="is-error">Error input</input>
<div class="is-loading">Loading</div>
```

State classes are styled in Juice's component layer — each component defines what its states look like.

---

## Unique Elements

IDs are for elements that appear once on a page. Juice does not define styles for IDs — those are project-specific.

```html
<section id="hero">...</section>
<div id="root">...</div>
```

---

## Combining Selectors

Attribute, class, and ID selectors compose naturally:

```html
<button
  id="submit-btn"
  font="lato"
  fontSize="16"
  textColor="black-100"
  bgColor="obsidian-500"
  padding="md"
  class="is-active"
>
  Submit
</button>
```

Each selector is doing exactly one job. The markup is readable at a glance.

---

## Compound Attributes

Some attributes consolidate multiple related styles into a single expressive value. These are component-level attributes that apply a predefined set of styles in one declaration.

```html
<!-- btn applies shape, padding, typography, and interaction styles -->
<button btn="flat">Flat button</button>
<button btn="raised">Raised button</button>
<button btn="outlined">Outlined button</button>
<button btn="ghost">Ghost button</button>
```

```html
<!-- theme applies a color palette to the element and its children -->
<button theme="limegreen" btn="flat">Click me</button>
<section theme="obsidian">...</section>
```

Compound attributes combine cleanly with individual attributes:

```html
<button
  btn="flat"
  theme="limegreen"
  fontSize="16"
  padding="md"
  class="is-active"
>
  Click me
</button>
```

Each attribute still does one job — `btn` defines the button style, `theme` defines the color context, individual attributes handle the rest. No class bloat, no ambiguity.

### Defining Compound Attributes

```scss
// components/button.scss
[btn="flat"] {
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

[btn="outlined"] {
  background: transparent;
  border: 2px solid currentColor;
  border-radius: 4px;
  cursor: pointer;
}

// styles/theme.scss
[theme="limegreen"] {
  --theme-primary: #32cd32;
  --theme-text: #fff;
  background-color: var(--theme-primary);
  color: var(--theme-text);
}
```

---

## No Inline Styles

Juice does not use inline styles. All styling goes through the attribute selector system, backed by design tokens. This ensures:

- Styles are consistent and token-driven
- No specificity conflicts with inline styles
- Design tokens remain the single source of truth

---

## Adding Custom Attributes

The attribute selector pattern is extensible. Any CSS property can become an attribute in your project:

```scss
// your custom styles
[shadow="sm"]  { box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
[shadow="md"]  { box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
[shadow="lg"]  { box-shadow: 0 10px 15px rgba(0,0,0,0.1); }
```

```html
<div shadow="md">Card with shadow</div>
```