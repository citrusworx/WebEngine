# KiwiPress Status

Snapshot of `@citrusworx/kiwipress` **0.4.3** against `packages/kiwipress/src` and `apps/kiwipress` on current `master`.

The goal is the same as Juice / Sig / Seltzer maturity writing: what is ready, what is usable but evolving, what is dashboard chrome.

Related: [Roadmap](./kiwipress-roadmap.md), [API](./kiwipress-api.md), [Tutorial](./kiwipress-tutorial.md).

Package changelog is mostly dependency bumps (Seltzer 0.8.1, Nectarine 0.3.0) plus a 0.4.0 “removed resolve()” note. Treat **source**, not the changelog prose, as the feature list.

## Maturity levels

### `Stable-ish`

Usable today, central to the product, unlikely to change in basic concept. Pre-1.0 still means the package version can move.

### `Emerging`

Present and useful; API or host integration still likely to evolve.

### `Early`

Exists, incomplete, or not something KiwiPress should strongly promise.

### `Draft`

Direction or app chrome, not a hardened public surface.

## Matrix

| Area | Maturity | Notes |
|---|---|---|
| `Posts` / `Pages` / `Users` WordPress CRUD | Stable-ish | Collaborator spine; raw JSON in/out |
| `Categories` / `Tags` / `Comments` WP reads | Stable-ish | No WP writes |
| `WPAuth` Basic / Bearer / API key | Stable-ish | Basic wins; key combines |
| Route aliases (`?slug=`, `?after=`, …) | Stable-ish | `createAliasedQueryRoute` |
| `listAll` paging | Stable-ish | `X-WP-TotalPages`, cap 1000 |
| `normalizeWordPressItem` / `ContentRecord` | Stable-ish | Status map documented |
| `WPSync.preview` / `transfer` | Stable-ish | Explicit; throws per collection |
| `KiwiPress.connect` wordpress + nectarine modes | Stable-ish | URL required only for wordpress mode |
| `NativeCollection` get/create/update/delete | Emerging | Partial field copy on write |
| File persistence | Stable-ish | Atomic rename; `{ version: 1, collections }` |
| Postgres persistence | Emerging | Nectarine `PgSql`; delete-then-insert; no tx |
| `persistenceFromEnv` | Stable-ish | File before PG |
| `loadNectarineApi` | Emerging | Walker only; `parser.yaml` logs |
| `registerKiwiPressGateway` | Early | Pre-`ResponseData` `ctx.json` + `readJson(req)` |
| Gateway token / loopback | Emerging | Timing-safe compare |
| `apps/kiwipress` Content + transfer UI | Early | Real consumer; depends on gateway shape |
| Dashboard wizard / billing / projects | Draft | Placeholders |
| Media / CPT / plugin adapters | Draft | Not in source |
| MySQL / Mongo persistence | Draft | Not in source |
| Echo visual CMS | Draft | Not in source |
| WebEngine orchestration | Draft | No import |

## What is shipped

| Area | Source |
|---|---|
| Facade | `cms/KiwiPress.ts` |
| Store / native | `cms/store.ts`, `native.ts` |
| Persistence | `file-persistence.ts`, `postgres-persistence.ts`, `env-persistence.ts` |
| Sync | `core/WPSync.ts` |
| Normalize | `core/normalize.ts` |
| Client spine | `WPCore`, `WPAuth`, `WPClient`, `WPRead`, `WPCreate`, `WPUpdate`, `WPDelete` |
| Domain | `posts/`, `pages/`, `users/`, `categories/`, `tags/`, `comments/` |
| Gateway | `gateway/register.ts`, `auth.ts` |
| YAML walker | `nectarine/api.ts` |
| Example | `src/example.ts` |
| App | `apps/kiwipress/front`, `apps/kiwipress/back` |

Tests exist beside the source (`*.test.ts`) and `vitest.config.ts`. The package.json has **no** `test` script (unlike Seltzer).

## Honesty: Seltzer

| Claim | Reality |
|---|---|
| KiwiPress is “Seltzer serving WordPress” | No. Outbound is `fetch` via `requestWordPress`. |
| `WPClient` uses Seltzer `client.*` | No. `Seltzer.init().handler()` only stores options. |
| Gateway is a 0.8.1 tutorial | No. Handlers call `ctx.json` and return `undefined`. |
| Seltzer cannot match `:id` | False as of 0.8.1. Gateway still uses `?id=`. |
| `ctx.json` is current Seltzer | Removed in 0.4.0. Gateway still types it locally. |

## Honesty: CMS

| Claim | Reality |
|---|---|
| Default persist to disk | Library: in-memory. App backend: file fallback. |
| Full parity of WP fields on native write | Only title/content/slug/status (+ string authorId/featuredImage on create) |
| Media transfer | Ids only |
| Users `getByCity` is core WP | KiwiPress sends the query; WP may ignore it |
| Dashboard is a complete PaaS | Content page is the live CMS demo |

## Myths that should stay closed

| Old claim | Now |
|---|---|
| Default `apiBase` is `wp-json/v2` | `wp-json/wp/v2` |
| KiwiPress requires WebEngine | Standalone package |
| Persistence requires the kernel | File or Nectarine `PgSql` |
| Categories have WP create | Read-only on WordPress |
| Transfer uses `getAll()` | Uses `listAll` |
| Seltzer inbound is exact-path only | Seltzer 0.8.1 is parametric; gateway is still query-id |
