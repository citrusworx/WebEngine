# Blackwater Sound App Roadmap

## Slice 1 — Stabilize the Figma export

Goal: make the prototype runnable inside the KiwiEngine monorepo without touching business logic yet.

- [x] Create `apps/blackwater-sound` package.
- [x] Split routes and shared brand components.
- [x] Move product catalog into `src/data/catalog.ts`.
- [x] Add initial blueprint YAML for app sections and product data.
- [x] Run the app in the real KiwiEngine repo and fix environment-specific package/version issues.

## Slice 2 — Make it a real Blackwater Sound site

- [ ] Replace placeholder Unsplash images with owned product, studio, and artist photography.
- [x] Replace generated copy with Blackwater Sound positioning.
- [x] Turn the coming-soon form into a real waitlist capture flow (API errors surface; no silent offline success).
- [x] Add Studio, Lessons, Store, and Publishing top-level navigation.

## Slice 3 — Connect KiwiEngine modules

- [ ] KiwiPress: blog posts, course lessons, announcements.
- [ ] Nectarine: products, orders, waitlist, studio sessions, lesson inquiries.
- [ ] Juice: design tokens, layout primitives, form components.
- [ ] Sugar: visual builder bridge for landing pages.

## Slice 4 — Portal architecture

Create separate experiences instead of forcing every audience into one layout.

- Artist portal: songs, mixes, sessions, deliverables, invoices.
- Studio portal: session transfer, file notes, mix versions, approvals.
- Label portal: roster projects, release assets, approvals, metadata.
- Learner portal: courses, workbook resources, assignments, practice logs.
