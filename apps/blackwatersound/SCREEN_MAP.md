# Blackwater Sound — KiwiStage Screen Map

Visual reference: `d:\CitrusWorx\.mockups\KiwiStage.zip` (reference only — never import as source).

Implementation target: `apps/blackwatersound/front` (Juice + Sig).

## Public site screens

| Screen | Route | Component | KiwiStage source | Parity |
|--------|-------|-----------|------------------|--------|
| Coming Soon / Home | `/` | `routes/ComingSoon.tsx` | `ComingSoon` | done |
| Store catalog | `/products` | `routes/ProductsPage.tsx` | `ProductsPage` | done |
| Product detail | `/product` | `routes/ProductPage.tsx` | `ProductPage` | done |
| Publishing / blog | `/blog` | `routes/BlogPost.tsx` | `BlogPost` | done |
| Course lesson | `/lesson` | `routes/CourseLesson.tsx` | `CourseLesson` | done |
| Studio | `/studio` | `routes/StudioPage.tsx` | (not in Figma zip) | removed |
| Sig router demo | `/sig-router` | `routes/SigRouterShowcase.tsx` | — | dev-only |

## Portal shells (Slice 4 preview)

| Portal | Route | Component | KiwiStage hub reference | Parity |
|--------|-------|-----------|-------------------------|--------|
| Artist Hub | `/artist` | `routes/ArtistHub.tsx` | `ArtistHub` | done (wired in `App.tsx`; hub chrome hides `SiteNav`) |
| Hub — Dashboard | `/artist` (screen) | `components/hub/screens/HubDashboard.tsx` | `HubDashboard` | done |
| Hub — Audience | `/artist` (screen) | `components/hub/screens/HubAudience.tsx` | `HubAudience` | done |
| Hub — Similar Artists | `/artist` (screen) | `components/hub/screens/HubArtists.tsx` | `HubArtists` | done |
| Hub — Fan Segments | `/artist` (screen) | `components/hub/screens/HubSegments.tsx` | `HubSegments` | done |
| Hub — Campaign Builder | `/artist` (screen) | `components/hub/screens/HubCampaigns.tsx` | `HubCampaigns` | done |
| Hub — Leverage Reports | `/artist` (screen) | `components/hub/screens/HubReports.tsx` | `HubReports` | done |
| Hub — Mgmt Report | `/artist` (screen) | `components/hub/screens/HubMgmtReport.tsx` | `HubMgmtReport` | done |
| Studio ops portal | `/portal/studio` | `routes/portals/StudioPortal.tsx` | `HubMgmtReport` (studio ops) | done |
| Label | `/portal/label` | `routes/portals/LabelPortal.tsx` | `HubCampaigns`, `HubReports` | shell |
| Learner | `/portal/learner` | `routes/portals/LearnerPortal.tsx` | `CourseLesson` (extended) | shell |

## Planned (blueprint — not in KiwiStage zip)

| Section | Route | Status |
|---------|-------|--------|
| Lesson book | `/lesson-book` | planned |
| Session transfer | `/portal/session-transfer` | planned |
| Mix review | `/portal/mix-review` | planned |
| Commerce admin | `/portal/commerce` | planned |

## KiwiStage zip component inventory

Extracted from `src/app/App.tsx` in KiwiStage.zip:

**Public:** `ComingSoon`, `ProductsPage`, `ProductPage`, `ProductCard`, `BlogPost`, `CourseLesson`, `SiteNav`, `PageFooter`, `Logo`, `ColorBar`

**Hub (portal reference):** `ArtistHub`, `HubDashboard`, `HubAudience`, `HubArtists`, `HubSegments`, `HubCampaigns`, `HubReports`, `HubMgmtReport`, `HubSidebar`, `HubStatCard`, `HubBadge`, `HubBtn`, `ScoreRing`

---

## Figma → Juice attribute vocabulary

Map **intent**, not Tailwind classes.

| Figma / Tailwind intent | Juice + Blackwater pattern |
|-------------------------|----------------------------|
| `flex flex-col gap-4` | `stack gap="1rem"` |
| `flex flex-row items-center` | `row centered gap="0.75rem"` |
| `grid grid-cols-3 gap-6` | `grid` + app grid hook (`product-grid`, `hero-grid`) |
| `max-w-7xl mx-auto px-4` | `shell` |
| `p-8 bg-white rounded-xl shadow` | `panel surface="bw-panel" padding="2rem"` |
| Dark hero gradient overlay | `hero surface="bw-stage" stack gap="1rem"` |
| Section label / eyebrow | `kicker` or `kicker="light"` on dark surfaces |
| Page title | `heading="xl"` or `display` / `display="rough"` |
| Body copy | `copy`, `copy="sm"`, `copy="lead"`, `copy="inverse"` |
| Product tile | `product-card` + `data-tone="orange"` |
| Primary CTA button | `button-tone="cyan"` or `button-tone="orange"` |
| Ghost / secondary button | `button-tone="ghost"` or `button-tone="ink"` |
| Nav bar | `site-nav="bw-orange"` + `nav-link`, `nav-cta` |
| Editorial hero over photo | `article-hero` + `media-frame="banner"` + `article-hero-overlay` |
| Lesson sidebar | `panel surface="bw-panel"` + `lesson-course-card` |
| Form field | `input-shell` inside `form-shell stack` |
| Tag / chip filter | `chip` + `ChipSelect` component |

### Examples

```tsx
// Figma: flex flex-col gap-4 p-8 bg-white rounded-xl shadow
<section stack gap="1rem" padding="2rem" panel surface="bw-panel">

// Figma: dark hero with gradient overlay
<section hero surface="bw-stage" stack gap="1rem">

// Figma: product card with image + title + price
<article product-card stack data-tone="orange">
  <div product-media><img product-image /></div>
  <div product-body stack gap="0.9rem">
    <h3 product-title>Name</h3>
    <strong product-price>$349</strong>
  </div>
</article>
```

## Session checklist

1. Read THEME_MANUAL.md + this file + target row
2. Implement one screen only
3. Run `yarn workspace @citrusworx/blackwater-sound build`
4. Update parity column in this file
5. Then move to backend or next screen
