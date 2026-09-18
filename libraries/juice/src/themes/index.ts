/**
 * Theme metadata for JS consumers is not part of the Beta public API.
 * Theme contracts live beside SCSS as `<themeId>.yaml` under `src/themes/<themeId>/`.
 * Draft themes live under `src/themes/_draft/` and are not imported from juice.scss.
 * Draft SCSS compiles to `dist/themes/_draft/` for local demos.
 * Those files are blocked from package `exports` and omitted from the published tarball.
 */
export {};
