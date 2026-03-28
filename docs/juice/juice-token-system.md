# Juice Token System

Tokens are the source of truth for Juice. They define reusable design values first, and the `styles/` layer turns those values into attribute selectors.

## Token flow

```text
tokens/     raw design values
styles/     selectors that consume tokens
juice.scss  bundles core + tokens + styles
dist/       compiled package output
```

In practice, the flow looks like this:

```text
src/tokens/color/green/green.scss
  -> src/styles/color/green/green/background.scss
  -> src/styles/styles.scss
  -> src/juice.scss
  -> dist/index.css
```

## Token types in this repo

The current tree includes:

- color tokens
- gradient tokens
- font tokens
- theme YAML definitions

Representative paths:

```text
src/tokens/color/
src/tokens/gradients/
src/tokens/fonts/
src/themes/
```

## Color tokens

Each color family has a base token file and, in many cases, named swatches beneath it.

Example structure:

```text
src/tokens/color/green/
  green.scss
  green.yaml
  swatch/
    citrusmint/
      citrus-mint.scss
      citrus-mint.yaml
    freshgreen/
      freshgreen.scss
      freshgreen.yaml
    lime/
      lime.scss
      lime.yaml
    wintergreen/
      wintergreen.scss
      wintergreen.yaml
```

SCSS files define variables used at build time:

```scss
$green-100: ...;
$green-200: ...;
```

YAML files store the structured token data used by tooling and future generator work:

```yaml
green:
  100: hsl(...)
  200: hsl(...)
```

## Swatches

Swatches are named variants inside a color family. They let Juice expose more expressive palettes without giving up the base family structure.

Examples in this repo include:

- `obsidian` and `onyx` under black
- `cornflower`, `morningblue`, `royalblue`, and `skyblue` under blue
- `citrusmint`, `freshgreen`, `lime`, and `wintergreen` under green

Styles consume swatches the same way they consume base colors:

```scss
[fontColor="obsidian-700"] { color: $obsidian-700; }
[bgColor="royalblue-500"] { background-color: $royalblue-500; }
```

## Font tokens

Font tokens are split by source:

- `src/tokens/fonts/google.*`
- `src/tokens/fonts/adobe.*`

The token files define SCSS variables such as:

```scss
$lato: 'Lato', sans-serif;
$bebas-neue: 'Bebas Neue', sans-serif;
$korolev-rounded: 'korolev-rounded', sans-serif;
```

The style layer then maps those variables to selectors:

```scss
[font="lato"] { font-family: $lato; }
[font="korolev-rounded-bold"] {
  font-family: $korolev-rounded;
  font-weight: 700;
}
```

## Gradient tokens

Gradient tokens live separately from flat color tokens.

Example:

```text
src/tokens/gradients/green/swatches/citrus-mint/citrus-mint.scss
```

Those values are consumed by selectors like:

```scss
[gradient="citrusmint-500"] { background: $citrusmint-500; }
```

## Themes

Theme data currently exists as YAML definitions in `src/themes`, for example:

- `src/themes/aquaflux/aquaflux.yaml`
- `src/themes/blush/blush.yml`

At the moment, themes are better understood as early configuration/schema artifacts than a complete runtime theming system. The docs should treat them that way until the JS and CSS integration is wired through.

## Working with tokens

When adding a new token, keep the source-of-truth pair together:

1. Add the SCSS token file with the value definitions.
2. Add the matching YAML file with the structured token data.
3. Wire the token into the relevant `styles/` file if it should become a public selector.
4. Ensure `src/juice.scss` reaches that styles entrypoint through `src/styles/styles.scss`.

## Why this split matters

Juice keeps tokens separate from selectors so we can:

- reuse values consistently
- evolve the public attribute API without redefining the raw values
- support future config or generation work from YAML without rewriting the SCSS layer
