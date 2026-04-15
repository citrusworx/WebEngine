# Juice

Attribute-based UI for developers who want expressive markup without utility-class soup.

Juice is a UI system for building interfaces with HTML attributes instead of long class strings. It exists to make layout, styling, motion, and tokens readable in the markup itself while staying flexible enough to work in plain HTML or alongside frameworks like React and Vue.

It’s part of the CitrusWorx ecosystem, alongside projects like KiwiEngine and Citrode.

## Why Juice

Tailwind is fast, but it pushes design intent into dense class lists.

```html
<!-- Tailwind -->
<section class="flex flex-col items-center justify-center gap-4 p-8 bg-gradient-to-r from-lime-200 to-green-400 rounded-xl shadow-md">
  <h1 class="text-4xl font-bold text-green-950">Stewarded Infrastructure</h1>
  <p class="max-w-2xl text-center text-green-900">Governed execution for modern platforms.</p>
  <button class="rounded-lg border border-green-700 px-6 py-3 text-green-900 hover:bg-green-100">
    Get Started
  </button>
</section>
```

```html
<!-- Juice -->
<section stack centered gap="2" padding="2rem" gradient="citrusmint-300" rounded="lg" shadow depth="md">
  <h1 font="korolev-rounded-bold" fontSize="xxl" fontColor="green-950">
    Stewarded Infrastructure
  </h1>
  <p width="50%" align="center" fontColor="green-900">
    Governed execution for modern platforms.
  </p>
  <div center>
    <button btn="outline" theme="citrusmint-300" scale="lg">Get Started</button>
  </div>
</section>
```

## Features

- Attribute-based styling for layout, spacing, sizing, typography, color, and structure
- Built-in flex, grid, content, container, and card patterns
- Design tokens for colors, fonts, spacing, and themes
- Responsive behavior baked into the system
- Native motion attributes for quick animation effects
- Optional GSAP adapter support for advanced animation workflows
- Works in plain HTML, server-rendered apps, or frameworks like React and Vue
- Can be used standalone or as part of the CitrusWorx stack

## Quick Start

```bash
npm install @citrusworx/juice
```

```ts
import "@citrusworx/juice/styles";
```

```html
<main gradient="citrusmint-300" stack gap="2" padding="2rem">
  <section card bgColor="white-100" rounded shadow depth="sm">
    <h1 fontSize="xxl">Hello Juice</h1>
    <p>Attribute-based UI, no class soup required.</p>
  </section>
</main>
```

## Example

```html
<section content stack gap="2" padding="2rem">
  <div center>
    <h2 font="korolev-rounded-bold" fontSize="xl">
      Start with your domain
    </h2>
  </div>

  <div card card="cta" bgColor="white-100" rounded shadow depth="sm">
    <div card-body stack gap="1">
      <p align="center">
        Search, register, or transfer your domain from one place.
      </p>

      <form type="search">
        <div row gap="1" centered>
          <div field width="40vw">
            <input type="text" placeholder="Search for your domain" scale="lg" rounded />
          </div>
          <button btn="flat" theme="citrusmint-300">Search</button>
        </div>
      </form>
    </div>
  </div>
</section>
```

## Animations

Juice supports native attribute-driven motion for fast UI feedback.

```html
<h1 motion="blink">Animated headline</h1>
<div gradient="citrusmint-300" motion="flow"></div>
```

For more advanced animation control, Juice can also be paired with a GSAP adapter. Use the built-in motion attributes for the simple cases, then layer GSAP on top when you need orchestration, timelines, or app-driven transitions.

## Philosophy

### Attributes over classes

Juice keeps styling intent in readable markup.

```html
<div row gap="2" space="between" padding="1rem"></div>
```

### Expressive UI

The goal is not minimal syntax. The goal is clear syntax.

### Scalable system

Juice is designed to grow from prototypes to full applications through tokens, structure, and repeatable patterns.

## Use Cases

- Dashboards
- Product apps
- Marketing pages
- Internal tools
- Rapid prototyping
- Design-system experimentation

## Status

Juice is currently in **ALPHA**.

The core direction is solid, but APIs and patterns may still evolve. Feedback, issues, and real-world usage are welcome.

## Links

- Docs: `TODO`
- Ecosystem: KiwiEngine and the broader CitrusWorx stack
