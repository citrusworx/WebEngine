# Juice Best Practices

This guide focuses on how to compose Juice attributes well in real app code. The goal is not to list every selector, but to show the patterns that keep Juice readable, scalable, and easy to maintain.

## Core principle

Use Juice attributes to express:

- layout intent
- spacing
- size
- typography
- token-backed color
- structural component behavior

Use app code and regular classes for:

- business logic
- JS state
- component-specific behavior
- one-off application styling that should not become part of Juice

## Prefer composition over one-off wrappers

Juice works best when each wrapper has a clear job.

Good:

```html
<section stack gap="2" padding="2rem">
  <div center>
    <h2 font="korolev-rounded-bold" fontSize="xl">Readable hierarchy</h2>
  </div>

  <div row gap="1" centered>
    <button btn="outline" theme="citrusmint-300" scale="lg">Primary action</button>
    <i icon="check" width="1rem" height="1rem" fontColor="green-600"></i>
  </div>
</section>
```

Less ideal:

```html
<section stack centered gap="2" padding="2rem">
  <h2>...</h2>
  <button>...</button>
</section>
```

In the second version, the same container is trying to own too many responsibilities at once.

## Let wrappers own placement

In Juice, parent wrappers should usually control placement and alignment.

Good:

```html
<div center>
  <button btn="outline" theme="citrusmint-300" scale="lg">Click Me</button>
</div>
```

That keeps the component focused on its own structure and styling while the wrapper controls positioning.

## Let components own structure

Structural components like cards and forms should define:

- internal spacing
- content flow
- region boundaries
- sizing behavior
- interaction affordances

They should not hardcode:

- app-specific brand colors
- arbitrary font taste
- page-level placement decisions

## Prefer token-backed values

When possible, use token-backed attributes instead of inline one-off CSS.

Good:

```html
<div bgColor="white-100" shadow="gray-400" depth="sm" rounded="md"></div>
```

This keeps design language consistent across the app.

## Prefer semantic region hooks when available

When a Juice component offers structural regions, use them.

Good:

```html
<div card card="cta" bgColor="white-100">
  <div card-header row space="between" centered>
    <h3 font="korolev-rounded-bold">Simple Mode</h3>
    <i icon="toggle-on" width="2rem" height="2rem" fontColor="red-800"></i>
  </div>

  <div card-body stack gap="1rem">
    <p font="korolev-rounded">Structured content.</p>
  </div>

  <div card-actions center>
    <button btn="outline" theme="citrusmint-300" scale="lg">Action</button>
  </div>
</div>
```

This reads more clearly than a sequence of anonymous wrappers.

## Keep responsive behavior simple

Use Juice layout primitives first:

- `stack`
- `row`
- `gap`
- `space`
- `container`
- `content`

Avoid hardcoding fixed heights on containers that need to hold variable text content, especially on smaller screens.

Good:

```html
<div bgColor="white-100" width="75%" stack padding="2rem" rounded>
  ...
</div>
```

Risky:

```html
<div bgColor="white-100" width="75%" height="40vh" stack padding="2rem" rounded>
  ...
</div>
```

Fixed heights are often where text overflow starts.

## Forms should use the rules engine

Juice form composition is intentionally scoped. Use the form-specific attributes inside forms and keep that protocol consistent.

Good:

```html
<form type="signin" stack gap="1">
  <div field stack label help>
    <label>Email</label>
    <input type="email" scale="lg" rounded />
    <small>We will never share your email.</small>
  </div>
</form>
```

Do not treat `field` as a global-purpose layout helper outside form composition.

## Use icons as color-inheriting masks

Juice icons inherit from `currentColor`, so use `fontColor` to tint them.

Good:

```html
<i icon="github" width="1.25rem" height="1.25rem" fontColor="gray-900"></i>
```

## Keep the public surface small and clear

When deciding whether to add a new Juice attribute, ask:

1. Is this structural and reusable?
2. Will multiple apps benefit from it?
3. Does it fit the existing composition model?
4. Is this better as app-level styling instead?

If the answer to those questions is unclear, it probably should not become a Juice attribute yet.

## A good mental model

Juice works best when:

- wrappers control placement
- components control structure
- tokens control visual language
- app code controls behavior

That split keeps the system readable and prevents the attribute model from turning into noise.
