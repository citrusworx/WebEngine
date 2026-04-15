# Juice Protocol — Rule #002: Texture Layering

## Overview

Juice textures are visual overlays, not content containers. To keep texture behavior predictable, texture wrappers must be used as a layer between the base background and the element content.

---

## Rule #002 — `texture` sits between background and content

The structure for a texture wrapper must be:

1. `div` with a background layer
2. nested `div` with `texture="..."`
3. inner content inside the textured wrapper

### Valid Usage

```html
<div bgColor="green-400">
  <div texture="grid.pat-001">
    <h1>Headline</h1>
    <p>Supporting copy.</p>
  </div>
</div>
```

### Invalid Usage

```html
<!-- ❌ Texture should not be applied as the outermost wrapper for page content -->
<div texture="grid.pat-001">
  <h1>Headline</h1>
</div>
```

---

## Behavior

A texture wrapper should act as a visual layer, not a structural container. In CSS, this means the texture is applied via a pseudo-element and the wrapper itself remains the stacking context for its child content.

### Required implementation pattern

```css
[texture] {
  position: relative;
  overflow: hidden;
  z-index: 0;
  isolation: isolate;
}

[texture^="grid.pat-"]::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background-repeat: repeat;
  background-position: center;
}
```

This produces the intended order:

- base background layer
- texture overlay layer
- content layer

---

## Why this rule exists

Texture behavior must be consistent across layouts. By enforcing a dedicated texture wrapper that renders its texture behind its own content, Juice avoids:

- textures obscuring text or controls
- ambiguous stacking order across nested elements
- unexpected layout effects when textures are applied directly to the page root

---

*Juice Protocol — Rules Engine v0.1*  
*Part of the [CitrusWorx](https://citrusworx.com) ecosystem.*
