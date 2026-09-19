# 05 — Composition patterns

[Previous](./04-surfaces.md) · [Course](./README.md) · [Next](./06-themes.md)

**Goal:** assemble cards, forms, and navigation from shared slots and scoped attributes, instead of one-off wrapper trees. Allow 70 minutes.

## Learning goals

- Use card variants and bare slot names (`header`, `body`, `action`, …)
- Keep `field` inside forms; treat it as a protocol, not a page layout tool
- Compose a top bar as brand + links + actions
- See patterns as recommended assemblies, not new APIs

## Concepts

A **pattern** is a repeatable assembly of primitives. It is not a new component and not a screenshot. “Feature grid,” “sign-in form,” and “primary top bar” are patterns. They stay valid across brands because they name structure.

Composition in a design system usually follows four jobs:

| Job | Owner |
|---|---|
| Placement | Outer wrappers (`section`, `center`, `grid`) |
| Structure | The pattern root (`card`, `form`, `nav`) |
| Visual language | Tokens and theme |
| Behavior | App JS / runtime |

If the card also tries to center itself on the page, you will fight the next grid you drop it into. If the form’s `field` escapes onto the marketing page, “field” stops meaning “form control region.”

**Slots** are how structure stays a small vocabulary. A card has a header, a body, an action row. Those names do not include the parent (`card-header`). The parent already scopes them. That is the opposite of BEM. [Naming](../juice-naming.md).

**Scoped attributes** are legal only in a context. `[field]` is form-scoped. Using it on a catalog card is undefined. That rule lives in `docs/juice/rules/001-Field Scrope.md` (the filename typo is *scope*). You do not need the rules engine as a spine; you do need to respect the form boundary.

State flags (`featured`, `active`, `full`) mark structural state. Themes decide how they look. Do not invent `class="most-popular"` when `featured` exists.

## Juice mapping

Patterns are collected in [Patterns](../juice-patterns.md). They copy current primitives; they do not extend the API.

### Cards

[Cards](../juice-cards.md) — emerging, but the structure is real.

- `card` boolean, or `card="compact|feature|interactive|split|cta|pricing|large|muted|hero"`
- `size="sm|md|lg"` on the card
- `flow="vertical|horizontal"`
- slots: `header`, `body`, `action`, `meta`, `media`, `divider`
- pricing adds `plan` with `name`, `price`, `features`

```html
<div card="feature" size="md" bgColor="white-100" shadow="gray-400" depth="sm">
  <div media center>
    <i icon="book" width="2rem" height="2rem" iconcolor="gray-700"></i>
  </div>
  <div body stack gap="0.75rem">
    <h3 font="oswald">The Inlet</h3>
    <p font="lato">Essays on harbors and tide tables.</p>
  </div>
  <div action>
    <button btn="outline" theme="citrusmint-300" scale="lg">View title</button>
  </div>
</div>
```

Buttons: `btn="flat|outline|text|3d|metallic"`, `scale="lg"`, `theme="citrusmint-300"`. Emerging, useful.

Icons: `icon` + `iconcolor` with Font Awesome Free keys. [Icons](../juice-icons.md).

### Forms

[Forms](../juice-forms.md) — emerging.

- `form type="signin|search|checkout|..."`
- `field`, often combined with `stack`, `label`, `help`, `error`, `invalid`, `group`
- `form actions` or an `action` slot for the submit row
- inputs may take `scale="lg"` and `rounded`

```html
<form type="search">
  <div row gap="1" centered width="100%">
    <div field width="40vw">
      <input type="email" placeholder="you@harbor.press" scale="lg" rounded />
    </div>
    <button btn="flat" theme="citrusmint-300" scale="lg">Subscribe</button>
  </div>
</form>
```

`width="40vw"` is a real pattern in the docs and a real risk on small screens. Lesson 7 will make you drop or soften it. For this lesson, prefer `field` without a viewport width when you can.

### Navigation

[Navigation patterns](../juice-navigation-patterns.md) — emerging.

- `nav type="bar|strip|subnav"` (and related types in that guide)
- `sticky`, `fixed` modifiers
- regions: brand, link list (`ul row`), actions

The navigation *runtime* (active states, mobile behavior) starts if you import `@citrusworx/juiceui`. Markup-first composition still works as CSS. [Navigation runtime](../juice-navigation-runtime.md) is the deep dive, not this lesson.

Accordion and tabs are widgets with their own runtimes. Use them when the content is disclosure or mutually exclusive panels. Do not use them to fake a layout.

## Worked example

Harbor Press becomes a small site slice: bar, hero, feature cards, subscribe form.

```html
<body theme="citrusmint">
  <nav type="bar" bgColor="white-100" shadow="gray-400" depth="sm">
    <div>
      <span font="oswald" fontSize="lg">Harbor Press</span>
    </div>
    <ul row gap="2" centered>
      <li><a href="#catalog">Catalog</a></li>
      <li><a href="#list">The list</a></li>
    </ul>
    <div row gap="1" centered>
      <button btn="text" theme="citrusmint-300" scale="lg">Sign in</button>
      <button btn="flat" theme="citrusmint-300" scale="lg">Subscribe</button>
    </div>
  </nav>

  <main container stack gap="2" padding="2rem">
    <section hero stack gap="1" padding="2rem">
      <div center>
        <h1 font="oswald" fontSize="xxl">Harbor Press</h1>
      </div>
      <div content center>
        <p font="lato">Short-run books, careful typesetting, one shelf.</p>
      </div>
    </section>

    <section id="catalog" stack gap="1">
      <div center>
        <h2 font="oswald" fontSize="xl">This season</h2>
      </div>
      <div grid="3x1" gap="1">
        <article card="feature" bgColor="white-100" rounded="md">
          <div media center>
            <i icon="water" width="2rem" height="2rem" iconcolor="blue-700"></i>
          </div>
          <div body center>
            <h3 font="oswald">The Inlet</h3>
            <p font="lato">Essays on harbors and tide tables.</p>
          </div>
          <div action center>
            <button btn="outline" theme="citrusmint-300" scale="lg">View title</button>
          </div>
        </article>
        <article card="feature" bgColor="white-100" rounded="md">
          <div media center>
            <i icon="clock" width="2rem" height="2rem" iconcolor="brown-700"></i>
          </div>
          <div body center>
            <h3 font="oswald">Letterpress Hours</h3>
            <p font="lato">A shop diary from a one-room bindery.</p>
          </div>
          <div action center>
            <button btn="outline" theme="citrusmint-300" scale="lg">View title</button>
          </div>
        </article>
        <article card="feature" bgColor="white-100" rounded="md">
          <div media center>
            <i icon="cloud" width="2rem" height="2rem" iconcolor="gray-700"></i>
          </div>
          <div body center>
            <h3 font="oswald">Fog Index</h3>
            <p font="lato">Poems that refuse a larger type size.</p>
          </div>
          <div action center>
            <button btn="outline" theme="citrusmint-300" scale="lg">View title</button>
          </div>
        </article>
      </div>
    </section>

    <section id="list" padding="2rem">
      <div card="cta" size="lg" bgColor="white-100" shadow="gray-400" depth="sm">
        <div header center>
          <h2 font="oswald" fontSize="xl">The list</h2>
        </div>
        <div body center>
          <form type="search">
            <div row gap="1" centered>
              <div field>
                <input type="email" placeholder="you@harbor.press" scale="lg" rounded />
              </div>
              <button btn="flat" theme="citrusmint-300" scale="lg">Subscribe</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  </main>
</body>
```

Compare this with [Page tutorial](../juice-page-tutorial.md). That tutorial builds a CitrusWorx infrastructure landing page (domain search, operator cards). Same composition rules, different product. If you have already walked that tutorial, treat this lesson as the same grammar on Harbor Press — do not paste the tutorial’s Korolev / citrusmint marketing copy into the capstone and call it done.

## Exercises

1. Convert one feature card into `card="pricing"` with a `plan`, `price`, and `featured` on a second tier. Use bare slot names only.
2. Build a stacked sign-in form (`type="signin"`, `field stack label`) in a separate `section`. Put `field` *outside* the form once, observe that the docs call it undefined, then delete it.
3. Add an announcement `nav type="strip"` above the bar with one sentence. If it grows a second link list, you have invented a second nav.

## Checkpoint

Point at three parents on your page (`nav`, `card`, `form`). For each child, say whether it is a **slot**, a **layout wrapper**, or a **token bearer**. If any child name repeats the parent (`card-header`), rename it.

[Answers](./answers.md#lesson-05)

## Go deeper

- [Patterns](../juice-patterns.md)
- [Page tutorial](../juice-page-tutorial.md)
- [Cards](../juice-cards.md) / [Forms](../juice-forms.md) / [Naming](../juice-naming.md)
- [Navigation patterns](../juice-navigation-patterns.md) / [Navigation lesson](../juice-navigation-lesson.md)
- [Best practices](../juice-best-practices.md)
- [Anti-patterns](../juice-anti-patterns.md) — BEM-style child names
- Rules (advanced): [Field scope](<../rules/001-Field Scrope.md>)

## Next lesson

[06 — Themes and brand identity](./06-themes.md) moves Harbor Press from “citrusmint plus tokens” to a real identity contract.
