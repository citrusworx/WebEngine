# Glossary

Everyday language for this course. API lists stay in the [Juice reference](../README.md).

**Attribute-first.** Intent lives on HTML attributes (`stack`, `card`, `fontColor`) instead of long class strings or closed component props.

**Design system.** Shared decisions — values, names, composition rules, identity — not a single file or a component folder.

**Field (scoped).** A form-control region. Legal inside `form`. Undefined elsewhere. See `docs/juice/rules/001-Field Scrope.md` (*scope*).

**Hybrid styling.** Juice for structure, theme for identity, a small app CSS file for product-only polish.

**Identity.** Brand decisions: type pair, atmosphere, accent, default paint for semantic elements and hooks.

**Layer.** A job boundary. Juice, theme, and app CSS are layers. When one file does two jobs, the system has collapsed.

**Named surface.** A theme recipe exposed as `surface="..."`. Atmosphere, not layout.

**Pattern.** A recommended assembly of existing primitives. Not a new API. [Patterns](../juice-patterns.md).

**Primitive.** A layout building block: `stack`, `row`, `grid`, `gap`, `content`, `container`.

**Role (surface).** What a region *is* — hero, card, panel, CTA — independent of its fill.

**Slot.** A bare region name (`header`, `body`, `action`) whose meaning comes from its parent. Not `card-header`.

**Structure.** How parts relate and nest. Juice’s primary job.

**Surface tone.** Shipped paint contract: `surfaceTone="soft|strong|muted"` bound to `--juice-surface-*` roles.

**Theme.** Identity stylesheet plus config. Library-owned (`citrusmint`, `tide`, …) or app-owned YAML → generated CSS.

**Token.** A named design value (`gray-700`, `gap="2"`). Raw data lives in `tokens/`; selectors in `styles/` expose it.

**Utility soup.** Every visual decision encoded as a class on the element. Complete, noisy, hard to change as a system.

**Visual language.** The small set of tokens a product actually uses: pairing, palette restraint, rhythm.
