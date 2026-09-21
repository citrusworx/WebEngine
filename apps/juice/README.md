# Juice showcase (`apps/juice`)

Vanilla Vite + HTML / TypeScript site that consumes the workspace package `@citrusworx/juiceui`. First slice: site chrome and a landing page that mirrors the Honest Beta positioning in `docs/juice`.

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
- Default theme: **KiwiPress** (richest product reference)
- Cheap theme switcher: KiwiPress, Tide, Citrusmint, Aquaflux (never blush / `_draft`)
- Chrome: Juice nav (including mobile + sidebar), footer, stub routes for Getting started / Demos / Themes / Reference
- JS entry imported so Emerging runtimes can auto-enhance when demo markup lands

## What this slice does not include

- Full live demos for every runtime
- Getting-started walkthrough content (docs stay in `docs/juice`)
- Combobox demos
- Animations / WebGL / Spline

## Next

- Getting started page that stays short and points at `docs/juice/juice-getting-started.md`
- Live runtime demos (nav, accordion, tabs, modal, drawer, toast, popover) across the four shipped themes
