# Juice

Juice is an expressive design system. It provides a complete, opinionated visual foundation — colors with swatches, typography, components, gradients, animations, icons, and themes — while remaining flexible enough to work alongside other CSS frameworks.

Juice is a WebEngine native module but is fully independent. It can be used in any project with any stack.

---

## Philosophy

Design systems should be expressive, not restrictive. Juice gives developers and creators a rich visual language out of the box while staying out of the way when custom or external tools are preferred.

- **Expressive** — rich color system with swatches, themes, and gradients
- **Complete** — typography, components, icons, animations, and spacing included
- **Config driven** — customizable via `juice.config.yaml`
- **Framework flexible** — use Juice alone or alongside Tailwind, Bootstrap, or any CSS framework
- **Publishable** — each piece is independently usable
- **WebEngine integrated** — works seamlessly as a WebEngine UI module

---

## Installation

```bash
yarn add @citrusworx/juice
```

### Styles

```ts
// @ts-ignore
import "@citrusworx/juice/styles";
```

### Components (with Sig.js)

```ts
import { Button } from "@citrusworx/juice";
```

---

## Design Tokens

Tokens are the foundation of Juice. They define the raw values of the design system — colors, typography, spacing, and sizing — that everything else is built on.

Tokens are defined in YAML (source of truth) and implemented in SCSS.

```
tokens/
  color/         ← color scales and swatches
  fonts/         ← @font-face declarations and variables
  spacing/       ← spacing scale
  sizing/        ← sizing scale
```

---

## Color System

Juice provides a rich color system with base colors and named swatches. Each base color has a scale from 100 to 900 and a set of swatches — named variants with their own full scale.

### Base Colors

Each base color provides a full 100–900 lightness scale:

```scss
$black-100 through $black-900
$blue-100  through $blue-900
// etc.
```

### Swatches

Swatches are named color variants that belong to a base color family. They provide more expressive, specific color options within a base.

```
black
  ├── obsidian    ← warm black
  └── onyx        ← cool black

blue
  ├── cornflower
  └── electric
```

Each swatch has its own full 100–900 scale:

```scss
$obsidian-100 through $obsidian-900
$onyx-100     through $onyx-900
```

### Usage via Attribute Selectors

Juice exposes colors through attribute selectors so styles can be applied directly in HTML without writing custom CSS:

```html
<div textColor="black-100">Text</div>
<div bgColor="obsidian-500">Background</div>
```

---

## Typography

Juice includes an extensive font library sourced from Google Fonts, with CSS custom properties for each font family.

```html
<p font="lato">Body text</p>
<h1 font="bebas-neue">Heading</h1>
```

Available fonts include Lato, Roboto, Montserrat, Poppins, Inter, Playfair Display, Bebas Neue, and many more.

Font families are exposed as CSS custom properties:

```css
--lato: 'Lato', sans-serif;
--bebas-neue: 'Bebas Neue', sans-serif;
```

---

## Themes

Juice includes pre-built themes that apply a cohesive color palette, typography, and component styling across your entire application.

Available themes:

- **Aquaflux** — cool, modern
- **Blush** — warm, soft

Themes are applied at the root level and cascade through all Juice components and utilities.

---

## Components

Juice components are plain functions that return HTML elements. They are framework agnostic and work with any rendering approach — static HTML, Sig.js, React, or vanilla JS.

Components are styled via Juice's design tokens and themes automatically.

```ts
import { Button } from "@citrusworx/juice";

const btn = <Button label="Click me" onclick={handleClick} />;
```

Available components are actively being developed. The component library will include form elements, layout primitives, navigation, cards, modals, and more.

---

## Gradients

Juice provides a gradient system built on the color token foundation. Gradients are defined as utility classes and CSS custom properties.

```html
<div gradient="obsidian-to-onyx">...</div>
```

---

## Animations

Juice includes a set of CSS animations for common UI interactions — entrance, exit, attention, and transition effects.

```html
<div animate="fade-in">...</div>
<div animate="slide-up">...</div>
```

---

## Icons

Juice includes an icon system. Icons are available as components and inline SVGs.

```ts
import { Icon } from "@citrusworx/juice";

const icon = <Icon name="arrow-right" />;
```

---

## Using with Other CSS Frameworks

Juice is designed to coexist with other CSS frameworks. The `juice.config.yaml` allows enabling Tailwind or Bootstrap interop — Juice can generate a Tailwind config from its token system or wrap Bootstrap with Juice's theme layer.

```yaml
# juice.config.yaml
mode:
  tailwind:
    use: true
    config:
      entry: tailwind.config.js
  bootstrap:
    use: false
```

---

## Configuration

Juice is configured via `juice.config.yaml`. The config defines which colors, fonts, themes, and components are included in the build — allowing consumers to generate a custom, lean version of Juice tailored to their project.

```yaml
version: "0.1"
type: scss

colors:
  black:
    base: true
    swatches:
      - Obsidian
      - Onyx
  blue:
    base: true
    swatches:
      - Cornflower
      - Electric

typography:
  fonts:
    primary:
      family: "Inter"
      weights: [400, 600, 700]
      source: google
    secondary:
      family: "Bebas Neue"
      weights: [400]
      source: google

mode:
  tailwind:
    use: false
  bootstrap:
    use: false
```

### Config-Driven Builds (Planned)

The Juice generator reads `juice.config.yaml` and produces a custom build containing only the colors, fonts, themes, and components declared. This keeps CSS output lean and project-specific.

---

## Token Architecture

```
YAML token files     ← source of truth, drives generator
SCSS token files     ← actual styles consumed by the browser
styles/              ← attribute selectors that consume tokens
juice.scss           ← orchestrates everything
dist/index.css       ← compiled output
```

---

## Roadmap

```
v0.1  ← Color tokens + swatches         🔧 Active
       Typography + Google Fonts
       Attribute selector system
       Vite library build
v0.2  ← Component library
       Gradients
       Animations
v0.3  ← Icon system
       Theme system (Aquaflux, Blush)
v0.4  ← juice.config.yaml generator
       Tailwind / Bootstrap interop
v1.0  ← stable API
```

---

## Status

Juice is in active development as a WebEngine native module. The token system, typography, and color scales are functional. Components and the generator are planned for upcoming releases.