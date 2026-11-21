# Juice Naming

`@citrusworx/juiceui@1.0.0` selects compound names in `card.scss`, `plan.scss`, `cta.scss`, `hero.scss`, and `stat.scss`. Bare names such as `header`, `body`, `action`, `name`, `price`, `currency`, `amount`, `period`, `description`, and `features` are not selectors in that package.

## What the stylesheets select

Card regions are `card-header`, `card-body`, `card-actions`, `card-meta`, `card-media`, and `card-divider`. Sizing, padding, and flow are `card-size`, `card-padding`, and `card-flow`. `[card-large]` and `[card-small]` are legacy width shorthands. `card.scss` says to prefer `card-size`.

Plan regions are `plan-header`, `plan-price`, `plan-currency`, `plan-amount`, `plan-period`, `plan-description`, and `plan-features`.

Hero regions are `hero-eyebrow`, `hero-title`, `hero-subtitle`, `hero-actions`, and `hero-meta`. CTA regions are `cta-title`, `cta-subtitle`, `cta-actions`, and `cta-note`. Stat regions are `stat-value` and `stat-label` inside `[stats]` / `[stat]`.

```html
<div card="pricing" featured>
  <div plan>
    <div plan-header>
      <h3>Pro</h3>
      <div plan-price>
        <span plan-currency>$</span>
        <span plan-amount>20</span>
        <span plan-period>/month</span>
      </div>
      <p plan-description>For professional WordPress sites</p>
    </div>
    <ul plan-features>
      <li>10 WordPress sites</li>
    </ul>
    <div card-actions><button full>Start Free Trial</button></div>
  </div>
</div>
```

```html
<div card card-size="md" card-padding="lg" card-flow="horizontal"></div>
```

`card="large"`, `card="muted"`, and `card="hero"` are not selectors. A hero band is `[hero]`.

## Not selectors

This markup uses names the package does not style:

```html
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

`plan-name` in the second block is also not a selector. `plan-header`, `plan-price`, `plan-currency`, `plan-amount`, and `plan-features` are.

CTA children that the package selects are `cta-title`, `cta-subtitle`, `cta-actions`, and `cta-note`. `heading`, `content`, `action`, and `note` are not those selectors.

## See also

- [Layers](./juice-layers.md) — what Juice owns vs. what themes own
- [Cards](./juice-cards.md) — selectors in `card.scss`
- [Anti-Patterns](./juice-anti-patterns.md) — common naming mistakes
