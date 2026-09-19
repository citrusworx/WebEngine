# 02 — Tokens and visual language

[Previous](./01-foundations.md) · [Course](./README.md) · [Next](./03-layout.md)

**Goal:** treat color, type, spacing, and sizing as shared values, then apply them through Juice attributes instead of one-off CSS. Allow 60 minutes.

## Learning goals

- Define a token as a named decision, not a hex code in a comment
- Separate raw token data from the selectors that expose it
- Use Juice color, type, spacing, and sizing attributes with shipped values
- Leave brand identity to the theme; use tokens for the visual language the page shares

## Concepts

A **token** is a name that stands for a design decision. `gray-700` is a token. `#3a3a3a` written in a component is a value that will drift.

Good tokens are:

- **Reusable** — many elements can point at the same name
- **Layered** — a raw swatch (`green-500`) is not the same thing as a role (`text.muted`)
- **Stable as names** — the hex can change; the name is the contract

Visual language is the small set of tokens a product actually uses: one display face and one reading face, a restrained palette, a spacing rhythm, a sizing scale. A design system that publishes 400 colors and no roles still leaves every page to invent taste.

Four families show up in almost every UI system:

| Family | Question it answers |
|---|---|
| Color | What hues and steps exist, and which roles use them? |
| Typography | Which faces, sizes, and weights are legal? |
| Spacing | How do we inset and separate, not “make it look boxed”? |
| Sizing | When do we constrain the outer box vs the interior? |

Spacing is not sizing. Padding changes the interior of a surface. Width and height constrain the box. If you use height to create breathing room, the surface stops flexing when type wraps. That is a system bug, not a preference.

## Juice mapping

Juice stores raw values under `libraries/juice/src/tokens/` and emits attribute selectors from `src/styles/`. [Token system](../juice-token-system.md) is the flow; [token architecture](../juice-token-architecture.md) is the split: tokens are data, styles are API.

### Color

Attributes consume token names, not arbitrary hex:

- `fontColor`, `bgColor`, `borderColor`, `hover`, `shadow`

Examples that exist: `white-100`, `gray-700`, `obsidian-900`, `green-500`, `citrusmint-300`, `lagoon-400`. Families use 100–900 steps; **swatches** (obsidian, citrusmint, lagoon) live inside families. Full catalog: [Colors](../juice-colors.md).

`depth="sm|md|lg|xl"` plus `shadow="gray-400"` tints elevation. `gradient="citrusmint-300"` uses named gradient tokens, not a CSS `linear-gradient` you invented in markup.

### Typography

- `font` — shipped family aliases (`lato`, `oswald`, `playfair-display`, `korolev-rounded`, `bebas-neue`, …)
- `fontSize` — `sm` (`0.75rem`), `md` (`1.25rem`), `lg` (`1.5rem`), `xl` (`2rem`), `xxl` (`3rem`)
- `fontColor` — token-backed text color (same families as the color attributes above)
- `lineHeight` — `"1rem"` through `"10rem"`
- `fontWeight` — `"100"` through `"900"`
- `align` — `center`, `right`, `justify` (`p` only)
- `decoration` — `underline` (`p` only)
- `weight` — Inter only (`font="Inter"` + `weight="normal"`). Prefer `fontWeight`.

Map display / title / body / caption onto `fontSize` + `font`. Those words are not attributes. The full face list is [Typography](../juice-typography.md). Authoring rules are the [Typography Contract](../juice-typography-contract.md). A theme can also bind `--jx-body-font` and `--jx-heading-font` so you stop stamping `font=` on every node. That is Lesson 6. Today, explicit `font` is legal and useful.

### Spacing

- `gap` on `stack` / `row` / `grid` — `"1"`–`"10"` means rem (`gap="2"` → `2rem`); explicit `"2rem"`, `"24px"`, `"10%"` also generate
- `padding`, `margin`, and the side attributes (`margin-top`, …)
- `paddingX` / `paddingY` exist in the compiled stylesheet

Prefer rem. `%` padding is legal and usually the wrong tool. [Spacing](../juice-spacing.md).

### Sizing

- `width` — `%`, `rem`, `vw`
- `height` — `%`, `rem`, `vh`

[Sizing](../juice-sizing.md). Use these for a real outer constraint (`width="40rem"`, `width="100%"`). Do not use them to fake padding. Protocol note: [Padding over box size](<../rules/003-Padding Over Box Size.md>) — advanced, not required reading yet.

Themes own *roles* (page background, heading color). Token attributes own *language* you can apply anywhere. Painting every card `bgColor="citrusmint-300"` is still one-off taste that happens to use a token.

## Worked example

Give Harbor Press a visual language without inventing a brand stylesheet.

```html
<body theme="citrusmint">
  <main bgColor="white-100" stack gap="2" padding="2rem">
    <section stack gap="1">
      <p font="lato" fontSize="sm" fontColor="gray-700">Independent publishing</p>
      <h1 font="oswald" fontSize="xxl" fontColor="obsidian-900">
        Harbor Press
      </h1>
      <div content>
        <p font="lato" fontSize="md" fontColor="gray-700">
          Short-run books, careful typesetting, and a catalog that still fits on one shelf.
        </p>
      </div>
    </section>

    <section stack gap="1" padding="1.5rem" bgColor="white-100" rounded="md" shadow="gray-400" depth="sm">
      <h2 font="oswald" fontSize="xl" fontColor="obsidian-900">This season</h2>
      <p font="lato" fontColor="gray-700">
        Three titles. No algorithm. The stack is the catalog.
      </p>
    </section>
  </main>
</body>
```

What to notice:

- Display + body pairing (`oswald` / `lato`) is a visual-language decision from [Visual design language](../juice-visual-design-language.md): one accent voice, one reading voice.
- `content` constrains measure. That is structure adjacent to type, not a font token.
- The season block uses a **neutral surface** and a gray shadow. The accent is not the background.
- `theme="citrusmint"` can still paint semantic defaults; the explicit tokens make the language visible while you learn.

A weaker version slaps `gradient="citrusmint-300"` on `main` and `bgColor="green-500"` on the season block. Tokens were used. Hierarchy disappeared.

## Exercises

1. Change only tokens: swap the heading to `playfair-display` and the body to `source-code-pro`. Does the page still feel like one system, or like two products? Write one sentence about pairing.
2. Recolor the season block to a loud swatch (`bubblegum-300` or `green-500`). Put it back. When is a loud fill a role, and when is it noise?
3. Replace the season block’s padding with `height="20rem"`. Resize the browser. Explain the difference.

## Checkpoint

Name one color token, one type token, one spacing attribute, and one sizing attribute on your page. For each, say whether you were setting a **role**, a **scale step**, or an **outer constraint**. Which of those four should become theme variables in Lesson 6 instead of repeating on every heading?

[Answers](./answers.md#lesson-02)

## Go deeper

- [Colors](../juice-colors.md) — families and swatches
- [Typography Contract](../juice-typography-contract.md) — size scale, hierarchy, theme vs `font=`
- [Typography](../juice-typography.md) — shipped faces
- [Spacing](../juice-spacing.md) / [Sizing](../juice-sizing.md)
- [Token system](../juice-token-system.md) / [Token architecture](../juice-token-architecture.md)
- [Visual design language](../juice-visual-design-language.md) — neutrals first, one accent
- [Attributes](../juice-attributes.md) — the compact API list

## Next lesson

[03 — Layout as structure](./03-layout.md) puts tokens on a skeleton that can survive a real page.
