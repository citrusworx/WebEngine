# Juice UI — Attribute-Driven Coding Philosophy

Package: `@citrusworx/juiceui` (survey reported 0.9.7; verify actual installed/current version).

Juice is an attribute-driven, CSS-first UI and design system. Its markup expresses layout, spacing, surfaces, and component intent declaratively. Prefer its supported primitives (`stack`, `row`, `grid`, `gap`, `padding`, `card`, `panel`, `hero`, `surface` were identified in the survey) **only after verifying their exact syntax and meaning**.

## Conventions

1. Start with semantic HTML, then apply verified Juice attributes and components.
2. Express common layout and design intent in supported attributes instead of defaulting to arbitrary utility classes or inline styles.
3. Reuse theme tokens and generated CSS contracts; avoid hardcoded values when a supported token exists.
4. Prefer CSS-first behavior. Add a JS runtime only if the behavior genuinely needs one.
5. Preserve framework independence and progressive enhancement.
6. Keep keyboard, focus, labeling, contrast, and reduced-motion behavior accessible.
7. Understand selector precedence, variant behavior, defaults, and attribute parsing from source before changing them.

## Stability and compatibility

- Read `docs/juice/public-contract.md`, `docs/juice/rules/`, `docs/juice/README.md`, `docs/juice/theme-quality.md`, plus relevant runtime docs and tests.
- Distinguish `Frozen`, `Emerging`, and `not-contract`. The survey reports ~32 Emerging runtimes and a v0.9.7 overlay stack; verify details before use.
- An emerging runtime is not automatically a stable public contract.
- Verify which runtime bindings are performed by Sig.js and which are Juice-only.
- Never invent attributes, values, component tags, imports, or responsive syntax.

## Implementation workflow

Find an actual nearby example; trace its CSS selectors or runtime source; implement the smallest matching change; test both CSS-only and enhanced paths as relevant. If an attribute does not exist, propose a design-system addition with its contract and tests rather than pretending it exists.

## Review questions

- Is markup semantically correct and genuinely Juice-native?
- Are all attributes and values verified?
- Are tokens/themes respected?
- Is JavaScript necessary and cleaned up properly?
- Is the feature Frozen or Emerging, and is the choice explicit?
