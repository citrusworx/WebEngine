# Juice showcase (`apps/juice`)

Vanilla Vite + HTML / TypeScript site that consumes the workspace package `@citrusworx/juiceui`. Landing, Getting started, live Emerging runtime demos, a Themes gallery, a Reference hub, and an on-site Juice Docs reader for `docs/juice`.

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

- Landing page: adoption pitch for the attribute system (markup with intent, live Juice sample, themes as identity, Honest Beta, runtimes as optional)
- Getting started: install → core CSS → theme import → `theme="…"` → first attribute-driven page, plus a live hero/card/panel demo under the active theme
- Demos: live navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, and combobox (markup + JS auto-enhance; toast show/dismiss via `createToast()`)
- Themes: four shipped library faces (KiwiPress, Tide, Citrusmint, Aquaflux) as a gallery — same composition in isolated frames, live sample + identity lab under the page switcher, short import notes, pointers into Juice Docs theme pages
- Reference: browsable index into Juice Docs (attributes, layout, surfaces, typography, theme docs, responsive, runtimes, practice / status, course) with short blurbs, on-site docs links, and tiny live Juice samples
- Docs: windowed on-site reader for the whole `docs/juice` tree (sidebar, TOC, markdown pipeline). Open `/docs/`
- Default theme: **KiwiPress** (richest product reference)
- Cheap theme switcher: KiwiPress, Tide, Citrusmint, Aquaflux (never blush / `_draft`)
- Chrome: Juice nav (including mobile + sidebar) and footer on every marketing page; Docs uses its own top bar with Back to Juice

## What this slice does not include

- Animations / WebGL / Spline
- Full-text search (the Docs ⌘K field filters the sidebar)
- New library APIs
