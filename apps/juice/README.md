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

- Landing page: product-marketing adoption pitch for the attribute system (split hero + live anatomy, windowed utilities-vs-Juice comparison, live sample with theme faces in the chrome, Honest Beta, runtimes as optional)
- Getting started: install (npm / pnpm / yarn / bun / CDN) → core CSS → theme import → `theme="…"` → first attribute-driven page, plus a live hero/card/panel demo under the active theme
- Demos: live navigation, accordion, tabs, modal, drawer, toast, popover, wizard, tooltip, combobox, banner, menu, switch, slider, checkbox, radio, breadcrumb, and progress (markup + JS auto-enhance; toast show/dismiss via `createToast()`)
- Themes: fourteen shipped library faces (KiwiPress, Tide, Citrusmint, Aquaflux, plus ten retro faces) as a gallery — core frames plus a retro grid, same composition in isolated frames, live sample + identity lab under the page switcher, short import notes, pointers into Juice Docs theme pages
- Reference: browsable index into Juice Docs (attributes, layout, surfaces, typography, theme docs, responsive, runtimes, practice / status, course) with short blurbs, on-site docs links, and tiny live Juice samples
- Docs: windowed on-site reader for the whole `docs/juice` tree (sidebar, TOC, markdown pipeline). Open `/docs/`
- Playground: edit Juice attribute markup and preview it in a CSS-only sandbox (`/playground.html`)
- Unknown routes: `404.html`, served with status 404 by the Vite dev and preview servers (`appType: "mpa"`)

## Favicon and social cards

`public/favicon.svg` is the tab icon. `public/og.png` is the Open Graph / Twitter image.

The site plugin injects root-relative `og:image` and `twitter:image` values (`/og.png`) plus a root-relative favicon (`/favicon.svg`). Those paths resolve on whatever host serves the built site. This repo does not invent an absolute image host. Social crawlers that ignore root-relative image URLs need the deploy origin filled in later (for example `https://<host>/og.png`). Docs routes share one HTML shell, so their crawler tags stay on that shell; the reader updates the title and description in the browser after a page loads.
- Default theme: **KiwiPress** (richest product reference)
- Theme switcher: fourteen shipped faces, grouped Core vs Retro, plus a compact select in nav chrome and Docs (never blush / `_draft`; no `themes/retro` barrel)
- Chrome: Juice nav (including mobile + sidebar) and footer on every marketing page; Docs uses its own top bar with Back to Juice and a Playground link
- Package links: npm `@citrusworx/juiceui`, `libraries/juice` on GitHub, and `libraries/juice/CHANGELOG.md` (there is no separate GitHub Releases feed for the package)

## What this slice does not include

- Animations / WebGL / Spline
- Full-text search (the Docs ⌘K field filters the sidebar)
- New library APIs
