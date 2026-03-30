# Juice Protocol — Rule #001: Form-Scoped Attributes

## Overview

Juice attributes are not globally applicable by default. Certain attributes are **context-scoped** — they are only valid as descendants of a specific parent element. Using a scoped attribute outside of its defined context is unsupported and produces undefined behavior.

This is the foundation of Juice's **rules engine**: a set of composability contracts that define where attributes are valid, how they interact, and what they mean in context.

---

## Rule #001 — `[field]` is Form-Scoped

The `[field]` attribute is only valid as a direct or nested descendant of a `form` element.

### Valid Usage

```html
<form type="signin">
    <div field>
        <label>Email</label>
        <input type="email" />
    </div>
</form>

<form type="signup">
    <div field stack>
        <label>Username</label>
        <input type="text" />
    </div>
</form>
```

### Invalid Usage

```html
<!-- ❌ field outside of a form element — undefined behavior -->
<div field>
    <label>Email</label>
    <input type="email" />
</div>
```

---

## Behavior

`[field]` establishes a composable layout unit for form elements. It handles the spatial relationship between a label and its input.

| Attribute Combination | Layout |
|---|---|
| `[field]` | `flex-direction: row` — label and input side by side |
| `[field][stack]` | `flex-direction: column` — label above input |

### Examples

```html
<!-- Label beside input -->
<form type="signin">
    <div field>
        <label>Email</label>
        <input type="email" />
    </div>
</form>

<!-- Label above input -->
<form type="signup">
    <div field stack>
        <label>Username</label>
        <input type="text" />
    </div>
</form>
```

---

## Why Context-Scoping?

Juice attributes are composable by design. Context-scoping ensures that attributes carry semantic meaning tied to their parent context — `[field]` means something specific inside a form, and that meaning should not be ambiguous or transferable to arbitrary elements.

This prevents:
- Accidental misuse of layout attributes outside their intended context
- Unpredictable cascade behavior from attributes applied in the wrong place
- Semantic drift where an attribute means different things in different contexts

---

## The Rules Engine

Rule #001 is the first entry in Juice's rules engine — a growing protocol that defines:

- Which attributes are context-scoped and what their valid parent contexts are
- How attributes compose and interact with each other
- What constitutes undefined behavior in Juice

As Juice grows, the rules engine will document every composability contract in the system.

---

*Juice Protocol — Rules Engine v0.1*  
*Part of the [CitrusWorx](https://citrusworx.com) ecosystem.*