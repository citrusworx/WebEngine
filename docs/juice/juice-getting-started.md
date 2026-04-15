# Getting Started With Juice

This guide is the onboarding entry point for Juice.

If you are new to Juice, start here before jumping into the deeper reference docs.

## What Juice is

Juice is a CSS-first, attribute-driven styling system for CitrusWorx apps.

It gives you:

- layout primitives
- typography utilities
- token-backed color and spacing
- structural component styles
- icon support
- composable page patterns

Juice is strongest when used as a shared styling layer rather than a heavy JavaScript component framework.

## What Juice is not

Juice is not primarily:

- a React-only component library
- a complete behavior framework
- a theme-locking visual preset system

Behavior belongs in app code. In CitrusWorx projects, that often means pairing Juice with Sig.

## Install and import

```bash
yarn add @citrusworx/juice
```

Import the stylesheet once near your app entrypoint:

```ts
import "@citrusworx/juice/styles";
```

If you want the small JS entrypoint too:

```ts
import "@citrusworx/juice";
```

## Use Juice from a CDN

Juice can also be consumed as built assets instead of as a package dependency.

The main distributable files are:

- `dist/index.css`
- `dist/index.mjs`

If you publish those files to your own CDN or static asset host, you can load them directly:

```html
<link rel="stylesheet" href="https://your-cdn.example.com/juice/index.css" />
<script type="module" src="https://your-cdn.example.com/juice/index.mjs"></script>
```

This mode is useful when:

- you are not bundling Juice through a package manager
- you want to use Juice in a static site or server-rendered app
- you want to expose one shared Juice build across multiple projects

Important note:

- the repo documents Juice's built artifacts, but it does not currently declare one official public CDN URL in these docs
- in practice, CDN usage means hosting the built `dist/` files somewhere your project can reference

## The basic mental model

Juice works best when you divide responsibilities like this:

- wrappers control placement
- components control structure
- tokens control visual language
- app code controls behavior

That means:

- use `stack`, `row`, `gap`, `space`, `content`, and `container` for layout
- use `font`, `fontSize`, `fontColor`, `bgColor`, `shadow`, `depth`, and `rounded` for visual language
- use `card`, `btn`, `field`, `nav`, and `icon` for reusable structure
- use Sig or app logic for state and interactivity

## The four main ways to use Juice

### 1. Use Juice as a stylesheet system

This is the simplest and most natural entry point.

Use Juice for:

- layout
- spacing
- type
- colors
- icons

Example:

```html
<section stack gap="2" padding="2rem">
  <h1 font="korolev-rounded-bold" fontSize="xl">Hello Juice</h1>
  <p font="korolev-rounded" fontColor="gray-700">
    A CSS-first way to compose interface structure and tokens.
  </p>
</section>
```

This mode is best when you want to move quickly without inventing custom CSS for every section.

### 2. Use Juice from built CSS and JS files

This is the CDN/static-asset version of Juice consumption.

Use Juice this way when:

- you want Juice in a non-bundled environment
- you want a shared hosted build
- you are integrating Juice into a static or progressively enhanced site

In this mode, you still use Juice the same way in markup. The difference is only how the assets are delivered.

### 3. Use Juice as a layout and token layer for your app

In this approach, your application code still owns the actual feature components, but Juice provides the shared structural language.

Use Juice for:

- page scaffolding
- section spacing
- cards
- forms
- buttons
- nav structure

Example:

```html
<main gradient="citrusmint-300" stack gap="2">
  <section stack gap="1" padding="2rem">
    <div center>
      <h1 font="korolev-rounded-bold" fontSize="xxl">App landing page</h1>
    </div>
  </section>

  <section padding="2rem">
    <div card card-size="md" bgColor="white-100" shadow="gray-400" depth="sm">
      <div card-header>
        <h2 font="korolev-rounded-bold">Card title</h2>
      </div>
      <div card-body>
        <p font="korolev-rounded">Card content</p>
      </div>
    </div>
  </section>
</main>
```

This is probably the best default way to adopt Juice in a real app.

### 4. Use Juice with Sig for interactive app UI

Juice handles styling and structure. Sig handles state and behavior.

This is the recommended pattern when elements need to update after render.

Example idea:

```tsx
import { Signal, effect } from "@citrusworx/sigjs";

export function ToggleCard() {
  const enabled = Signal(true);

  const icon = (
    <i
      icon="toggle-on"
      width="2rem"
      height="2rem"
      iconcolor="red-800"
      onclick={() => enabled.set(!enabled.get())}
    ></i>
  ) as HTMLElement;

  effect(() => {
    if (enabled.get()) {
      icon.setAttribute("icon", "toggle-on");
      icon.setAttribute("iconcolor", "red-800");
    } else {
      icon.setAttribute("icon", "toggle-off");
      icon.setAttribute("iconcolor", "blue-800");
    }
  });

  return (
    <div card bgColor="white-100">
      <div card-header row space="between" centered>
        <h3 font="korolev-rounded-bold">Interactive card</h3>
        {icon}
      </div>
    </div>
  );
}
```

Use this mode when the UI needs toggles, counters, dynamic sections, or reactive behavior.

## Optional configuration and branding

Juice is fairly expressive without any config at all. Many projects can simply import the stylesheet and start composing with the existing token and attribute surface.

That said, Juice also has an optional configuration layer in:

- `libraries/juice/juice.config.yaml`

This is where a project can define or describe higher-level branding concerns such as:

- base color families
- color swatches
- primary, secondary, and tertiary fonts
- typography sources
- experimental layout or framework integration settings

Current examples in the config include:

- color families like `black` and `blue`
- swatches like `Obsidian`, `Onyx`, `Cornflower`, and `Electric`
- typography roles like `primary`, `secondary`, and `tertiary`

Important note:

- the config surface exists today, but it is still early and not required for using Juice
- the most stable way to use Juice right now is still through the compiled stylesheet and the existing attribute system

Use config when:

- you want to define shared branding defaults for a project
- you want to describe your preferred token families up front
- you are evolving Juice into a more opinionated design layer for a specific app or organization

Do not wait on config to start using Juice. Config is optional, not a prerequisite.

## What to use first

If you are starting a new page or app, begin in this order:

1. import Juice styles
2. decide whether package import or hosted `dist/` files are the right delivery model
3. establish page layout with `stack`, `row`, `gap`, `content`, and `container`
4. add typography and token-backed colors
5. use cards, buttons, forms, and nav patterns where structure repeats
6. add optional config only if your project needs shared branding defaults
7. add Sig only where behavior is needed

That keeps the system readable and prevents overengineering.

## A simple starter page

```html
<main gradient="citrusmint-300" stack gap="2">
  <section stack gap="1" padding="2rem">
    <div center>
      <h1 font="korolev-rounded-bold" fontSize="xxl">
        Stewarded Infrastructure.
        <br />
        Governed Execution.
      </h1>
    </div>

    <div content center>
      <p font="korolev-rounded" fontSize="md">
        Juice gives you the layout, tokens, cards, forms, and icons needed to build pages quickly.
      </p>
    </div>
  </section>

  <section padding="2rem">
    <div card card="cta" card-size="lg" bgColor="white-100" shadow="gray-400" depth="sm">
      <div card-header center>
        <h2 font="korolev-rounded-bold" fontSize="xl">Start With Your Domain</h2>
      </div>

      <div card-body center>
        <p font="korolev-rounded">
          Search, register, or transfer your domain from one place.
        </p>
      </div>

      <div card-actions center>
        <button btn="flat" theme="citrusmint-300" scale="lg">Search</button>
      </div>
    </div>
  </section>
</main>
```

For motion and animated effects, prefer the `motion` attribute:

```html
<h1 motion="blink">Animated headline</h1>
```

Juice still accepts older `animation` and `animate` usage for compatibility, but `motion` is the preferred public API.

## Best practices

- Prefer wrapper composition over deeply overloaded single containers.
- Let the parent wrapper control placement.
- Let cards and forms control internal structure.
- Use token-backed color and spacing values instead of one-off CSS when possible.
- Avoid fixed heights on text-heavy containers.
- Keep `field` and related attributes inside form composition.
- Use `iconcolor` for icon tinting.

## Common mistakes

### Using Juice attributes for behavior

Juice should style and structure the interface, not control state changes.

Use app logic or Sig for behavior.

### Forcing fixed heights too early

Fixed-height sections often look fine on desktop and fail on smaller screens.

Prefer content-driven sizing until a fixed-height need is truly justified.

### Using form-scoped attributes as generic layout helpers

`field` is part of the form rules engine, not a general page-layout primitive.

### Over-customizing component internals

If a card or nav pattern already expresses the right structure, start there and customize with tokens rather than rebuilding from scratch.

## Where to go next

After this guide, the best next docs are:

- [Best Practices](./juice-best-practices.md)
- [Page Tutorial](./juice-page-tutorial.md)
- [Patterns](./juice-patterns.md)
- [Forms](./juice-forms.md)
- [Cards](./juice-cards.md)
- [Navigation Patterns](./juice-navigation-patterns.md)
- [Attributes Reference](./juice-attributes.md)
- [Token System](./juice-token-system.md)

## Recommended reading order

If you are completely new:

1. this guide
2. [Best Practices](./juice-best-practices.md)
3. [Page Tutorial](./juice-page-tutorial.md)
4. [Patterns](./juice-patterns.md)
5. [Token System](./juice-token-system.md)
6. deeper reference docs as needed
