# Juice showcase (`apps/juice`)

Vanilla Vite + HTML / TypeScript site that consumes the workspace package `@citrusworx/juiceui`. Landing, Getting started, and live Emerging runtime demos.

Package name: `@citrusworx/juiceapp`.

## Run locally

From the monorepo root:

```bash
yarn install
yarn workspace @citrusworx/juiceui build
yarn workspace @citrusworx/juiceapp dev
```

Open [http://localhost:5173](http://localhost:5173).

`@citrusworx/juiceui` exports compiled CSS and JS from `libraries/juice/dist`. Build Juice if that output is missing or stale. Turbo `build` already depends on workspace dependencies, so `yarn workspace @citrusworx/juiceapp build` will build Juice first.

The KiwiPress app also uses port 5173. Run one Vite app at a time, or change the port in `apps/juice/package.json`.

## Scripts

| Command | What it does |
| --- | --- |
| `yarn workspace @citrusworx/juiceapp dev` | Vite dev server on `0.0.0.0:5173` |
| `yarn workspace @citrusworx/juiceapp build` | Typecheck, then production build to `dist/` |
| `yarn workspace @citrusworx/juiceapp preview` | Serve the production build |

## What this slice includes

- Landing page: CSS-first + attribute-driven pitch, structure vs identity, Emerging runtimes, Honest Beta
- Getting started: install → core CSS → theme import → `theme="…"` → first attribute-driven page, plus a live hero/card/panel demo under the active theme
- Demos: live navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, and combobox (markup + JS auto-enhance; toast show/dismiss via `createToast()`)
- Default theme: **KiwiPress** (richest product reference)
- Cheap theme switcher: KiwiPress, Tide, Citrusmint, Aquaflux (never blush / `_draft`)
- Chrome: Juice nav (including mobile + sidebar), footer, stub routes for Themes / Reference

## What this slice does not include

- Animations / WebGL / Spline
- Rewriting `docs/juice` into the site
- New library APIs

## Next

- Themes and Reference pages beyond their current stubs
