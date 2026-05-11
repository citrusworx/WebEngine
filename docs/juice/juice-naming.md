# Juice Naming

How Juice names attributes — and why it deliberately avoids BEM-style compound names.

## The rule

A child's identity comes from its parent.

Children get **bare structural slot names** (`header`, `body`, `action`, `name`, `price`).
They never get compound names that repeat the parent (`card-header`, `plan-price`).

```html
<!-- Good -->
<div card="pricing">
  <div plan>
    <div header>
      <div name>Pro</div>
      <div price>
        <span currency>$</span>
        <span amount>20</span>
        <span period>/month</span>
      </div>
    </div>
    <ul features>...</ul>
    <div action><button>Start Free Trial</button></div>
  </div>
</div>
```

```html
<!-- Don't -->
<div card="pricing">
  <div plan>
    <div plan-header>
      <div plan-name>Pro</div>
      <div plan-price>
        <span plan-currency>$</span>
        <span plan-amount>20</span>
      </div>
    </div>
    <ul plan-features>...</ul>
  </div>
</div>
```

## Why

CSS selectors handle context natively. The selector for a price element inside a pricing card is:

```css
[card="pricing"] [plan] [price] { ... }
```

That selector already says "the price inside a plan inside a pricing card." Repeating that scope in the attribute name (`plan-price`) is duplicate work — it was a BEM workaround for problems the attribute-based system does not have.

The payoff is a small, predictable, reusable vocabulary. The same slot names appear across many components and always mean the same thing in context.

## The universal slot vocabulary

These names show up across components. Their meaning comes from whatever parent they live in.

| Slot | Typical use |
| --- | --- |
| `heading` | Top-of-section title block |
| `content` | Main supporting text |
| `action` | Buttons, CTAs, links |
| `header` | Top region of a component |
| `body` | Main content region |
| `footer` | Bottom region |
| `media` | Icons, illustrations, images |
| `meta` | Pills, labels, small supporting facts |
| `divider` | Visual divider |
| `name` | Identity label (e.g. plan name, card title) |
| `description` | Short prose explaining the parent |
| `note` | Fine-print sibling to an action |
| `price`, `currency`, `amount`, `period` | Price composition |
| `features` | List of items |

Authors can add new slot names as new patterns appear. The rule is the same: name what the child *is*, not what its parent is.

## Two patterns, side by side

### CTA

```html
<section cta>
  <h2 heading>Launch Your WordPress Site Today</h2>
  <p content>Join thousands building blazing-fast experiences.</p>
  <div action>
    <button scale="lg">Get Started Free</button>
    <p note>Free forever &bull; No credit card required</p>
  </div>
</section>
```

### Pricing card

```html
<div card="pricing" featured>
  <span badge="ribbon">Most Popular</span>
  <div plan>
    <div header>
      <div name>Pro</div>
      <div price>
        <span currency>$</span>
        <span amount>20</span>
        <span period>/month</span>
      </div>
      <p description>For professional WordPress sites</p>
    </div>
    <ul features>
      <li>10 WordPress sites</li>
      <li>1TB bandwidth</li>
    </ul>
    <div action><button full>Start Free Trial</button></div>
  </div>
</div>
```

`header`, `action`, `description` carry the same meaning in both. The parent supplies the rest.

## Scalar attributes on the parent

Scalars that describe *the parent itself* (its size, padding, flow) drop the parent prefix too. They behave like `gap`, `scale`, `paddingY` already do.

```html
<!-- Good -->
<div card size="md" padding="lg" flow="horizontal">...</div>

<!-- Don't -->
<div card card-size="md" card-padding="lg" card-flow="horizontal">...</div>
```

Selector scoping is still handled by combining attributes:

```css
[card][size="md"] { ... }
[card][flow="horizontal"] { ... }
```

## Variant shorthands

Variants live as values on the parent attribute, not as separate compound flags.

```html
<!-- Good -->
<div card="large">...</div>
<div card="muted">...</div>
<section hero>...</section>

<!-- Legacy (deprecated) -->
<div card-large>...</div>
<div card-muted>...</div>
<section hero-panel>...</section>
```

## The documented tension

Contextual slot names mean **a slot has no meaning in isolation**. `<div header />` at the page level is not a Juice component — it is just a bare HTML element with a non-standard attribute.

That is intentional. It is the cost of giving up BEM. The benefit is a vocabulary you do not have to relearn for every component.

When this matters in practice:

- **Selectors must always be scoped.** Never write `[header] { ... }` globally. Always go through a parent: `[card] [header]`, `[plan] [header]`, `[section-shell] [header]`.
- **Reusable slot names are not portable.** `<div features>` inside `[plan]` is a list of plan features. `<div features>` inside a page hero would be a different thing — and the styling has to come from a different parent scope, not from `[features]` alone.
- **Authors should mentally read context.** When reading Juice markup, the meaning of a child slot is always "this thing's role inside its parent."

## Quick rules

1. Children get bare slot names. Parents supply the scope.
2. Scalars that describe the parent drop the parent prefix.
3. Variants are values on the parent attribute, not separate flags.
4. Selectors are scoped through the parent. Slot names alone are never load-bearing.

## See also

- [Layers](./juice-layers.md) — what Juice owns vs. what themes own
- [Cards](./juice-cards.md) — slot vocabulary applied to card composition
- [Anti-Patterns](./juice-anti-patterns.md) — common naming mistakes
