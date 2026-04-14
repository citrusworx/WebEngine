# Juice Forms

This guide documents how to compose forms with Juice's current form attributes and rules.

Juice form composition is intentionally scoped. The `field` attribute and related modifiers are part of a form protocol, not a general-purpose layout system.

## Core rule

Use `field` and related field modifiers inside form composition. They are meant to describe form structure and state, not arbitrary page layout.

Related reading:

- [Rule #001 - Form-Scoped Attributes](./rules/001-Field%20Scrope.md)

## Base form patterns

### Sign-in form

```html
<form type="signin" stack gap="1">
  <div field stack label>
    <label>Email</label>
    <input type="email" scale="lg" rounded />
  </div>

  <div field stack label>
    <label>Password</label>
    <input type="password" scale="lg" rounded />
  </div>

  <div form actions center>
    <button btn="flat" theme="citrusmint-300" scale="lg">Sign In</button>
  </div>
</form>
```

### Search form

```html
<form type="search">
  <div row gap="1" centered width="100%">
    <div field width="40vw">
      <input type="text" placeholder="Search for your domain name" scale="lg" rounded />
    </div>
    <button btn="flat" theme="citrusmint-300">Search</button>
  </div>
</form>
```

### Checkout form

```html
<form type="checkout" stack gap="1">
  <div field stack label>
    <label>Card number</label>
    <input type="text" rounded />
  </div>

  <div field group>
    <div field stack label>
      <label>Exp</label>
      <input type="text" rounded />
    </div>

    <div field stack label>
      <label>CCV</label>
      <input type="text" rounded />
    </div>
  </div>

  <div form actions>
    <button btn="flat" theme="citrusmint-300" scale="lg">Pay now</button>
    <button btn="outline" theme="citrusmint-300" scale="lg">Cancel</button>
  </div>
</form>
```

## Field composition model

### `field`

The base field container.

Use it to establish a form control region.

```html
<div field>
  <label>Email</label>
  <input type="email" />
</div>
```

### `field stack`

Use this for the most common label-over-input composition.

```html
<div field stack>
  <label>Email</label>
  <input type="email" />
</div>
```

### `field label`

Use when the field explicitly includes a label relationship and you want the label spacing behavior to apply.

```html
<div field stack label>
  <label>Password</label>
  <input type="password" />
</div>
```

### `field help`

Use when the field includes supporting helper copy.

```html
<div field stack label help>
  <label>Domain</label>
  <input type="text" />
  <small>Search, register, or transfer your domain.</small>
</div>
```

### `field error`

Use when the field includes an error message region.

```html
<div field stack label error>
  <label>Email</label>
  <input type="email" />
  <small>Enter a valid business email.</small>
</div>
```

### `field invalid`

Use this as the actual invalid state modifier. This should visually affect descendant inputs, textareas, or selects.

```html
<div field stack label error invalid>
  <label>Email</label>
  <input type="email" />
  <small>Enter a valid business email.</small>
</div>
```

### `field group`

Use when multiple controls belong inside one field context.

```html
<div field group>
  <div field stack label>
    <label>First name</label>
    <input type="text" />
  </div>

  <div field stack label>
    <label>Last name</label>
    <input type="text" />
  </div>
</div>
```

## Best practices

### 1. Prefer `field stack label` for most text inputs

This is the clearest and most resilient default composition.

### 2. Let `invalid` mean state, not just extra layout

Use:

- `error` to indicate error content is present
- `invalid` to indicate the control is in an error state

Good:

```html
<div field stack label error invalid>
  ...
</div>
```

### 3. Keep grouped fields explicit

If multiple controls belong together, wrap them in `field group` instead of relying on ad hoc row wrappers.

### 4. Use `form actions` for submit areas

Action rows deserve a consistent pattern.

```html
<div form actions center>
  <button btn="flat" theme="citrusmint-300" scale="lg">Continue</button>
</div>
```

### 5. Avoid using `field` outside form composition

`field` is a form-scoped protocol attribute, not a generic layout utility.

## Recommended composition examples

### Auth form

```html
<form type="signin" stack gap="1" width="100%">
  <div field stack label>
    <label>Email address</label>
    <input type="email" scale="lg" rounded />
  </div>

  <div field stack label>
    <label>Password</label>
    <input type="password" scale="lg" rounded />
  </div>

  <div form actions right>
    <button btn="flat" theme="citrusmint-300" scale="lg">Sign In</button>
  </div>
</form>
```

### Field with help and error states

```html
<form stack gap="1">
  <div field stack label help>
    <label>Domain</label>
    <input type="text" rounded />
    <small>Use your business domain if available.</small>
  </div>

  <div field stack label error invalid>
    <label>Email</label>
    <input type="email" rounded />
    <small>This email address is not valid.</small>
  </div>
</form>
```

## Notes

- Juice forms are still early compared with the layout and token layers.
- The current form API is strongest when used as a protocol for composition rather than a full component framework.
- If you add new field modifiers, prefer ones that describe structure or state clearly and fit the scoped rules model.
