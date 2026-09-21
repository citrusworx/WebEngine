# KiwiPress Architecture Spec

## Purpose

KiwiPress is a standalone WordPress application layer and a Nectarine-shaped CMS. Other projects can depend on `@citrusworx/kiwipress` without WebEngine.

People often start with WordPress Headless because they already have content, editors, and plugins. KiwiPress talks to that install through domain objects. When they are ready, `WPSync` transfers that content into a native CMS (`NectarineStore` / `NativeCollection`). That store is KiwiPress's — persist it with a file or with Nectarine's Postgres adapter. WebEngine may orchestrate those modules later. It is not hardwired in.

KiwiPress is built on:

- `Seltzer` for route registration, endpoint execution, and request lifecycle
- `Nectarine` for model/API YAML and optional SQL adapters

KiwiPress is not a bag of REST helpers. It is not a WebEngine plugin. Each of those libraries stays usable on its own.

## Current Status

Shipped:

- `WPCore` as shared WordPress config/infrastructure
- `WPAuth` as credential strategy and header generation
- `WPClient` as the executable WordPress client layer
- `WPRead` / `WPCreate` / `WPUpdate` / `WPDelete`
- `Users`, `Posts`, `Pages`, `Categories`, `Tags`, and `Comments` with CRUD
- `Media` with list/get, file create (raw binary or multipart), update, and delete
- generic WordPress CPT client (`CustomPostType` / `kiwi.wordpress.cpt(restBase)`) for `/wp/v2/{restBase}`
- generic WordPress taxonomy client (`CustomTaxonomy` / `kiwi.wordpress.taxonomy(restBase)`) for `/wp/v2/{restBase}`
- route alias translation from clean KiwiPress shapes into WordPress query strings
- response normalization onto `ContentRecord` / Nectarine post shapes
- dual raw/rendered text on `ContentRecord.meta`, plus WordPress `meta` / `acf` pass-through
- `loadNectarineApi` for nested or flat Nectarine API YAML
- `WPSync` transfer from WordPress collections into a `NectarineStore`
- media and named CPT transfer through `WPSync` (`includeMedia` / `cpts`)
- named taxonomy transfer through `WPSync` (`taxonomies`)
- WordPress type discovery (`WordPressTypes` / `kiwi.wordpress.types`) for `/wp/v2/types`
- WordPress taxonomy discovery (`WordPressTaxonomies` / `kiwi.wordpress.taxonomies`) for `/wp/v2/taxonomies`
- WordPress REST search (`WordPressSearch` / `kiwi.wordpress.search`) for `/wp/v2/search`
- `KiwiPress.connect()` facade with `wordpress` (entry) and `nectarine` (destination) modes
- opt-in `CmsPersistence` (`createFilePersistence`, `createPostgresPersistence` via Nectarine `PgSql`)
- `registerKiwiPressGateway` for the `apps/kiwipress` Seltzer proxy
- live app at `apps/kiwipress` (marketing, wizard, dashboard Content + Types)
- native custom type registry (definitions + items)

Not finished yet:

- MySQL / Mongo persistence adapters
- a full visual CMS UI (Echo)
- plugin adapters (WooCommerce, BuddyPress, MemberPress)

## The on-ramp

```
WordPress (headless REST)          optional — skip with mode: "nectarine"
        │  KiwiPress domain objects
        ▼
 ContentRecord (normalized)
        │  WPSync.transfer()
        ▼
 NectarineStore / NativeCollection
        │  CmsPersistence (file or Nectarine PgSql)
        ▼
 Durable native CMS in this process — or any host that imports the library
```

WordPress is the usual entry, not a required runtime. Transfer is explicit: nothing overwrites WordPress until `sync.transfer()` runs. Persistence is also explicit: without `persistence`, the store stays in memory.

`Blueprint.adapters.cms = "kiwipress"` is Types / WebEngine vocabulary for a future kernel. KiwiPress does not import it.

## Stack Roles

### `Seltzer`

Owns route definitions, registration, endpoint execution, and inbound request context.

Does not own WordPress business rules.

### `Nectarine`

Owns parsing config files such as `userAPI.yml` and `models/blog/post/schema.yml`, plus thin DB sockets (`PgSql`, MySQL, Mongo).

Does not own route execution or WordPress runtime behavior. KiwiPress may use `PgSql` as a persistence backend; that does not make Nectarine a CMS host.

### `KiwiPress`

Owns:

- WordPress-specific architecture
- CRUD service boundaries
- auth header workflow (`WPAuth`)
- sync and transfer workflow (`WPSync`)
- composition of Seltzer and Nectarine
- the native CMS store and its persistence interface

### `WebEngine`

Future orchestrator. Not a dependency of this package. Do not import `@citrusworx/webengine` from KiwiPress.

## Core Design

KiwiPress is split into these object areas:

- `WPCore`
- `WPAuth`
- `WPCreate`
- `WPRead`
- `WPUpdate`
- `WPDelete`
- `WPSync`
- `NectarineStore` / `NativeCollection`
- `CmsPersistence`

The implemented spine is:

- `WPCore` + `WPAuth`
- `WPClient`
- `WPRead` and write wrappers
- domain objects on `WPRead`
- `KiwiPress` facade + `WPSync` + native store + opt-in persistence

## Class Responsibilities

### `WPCore`

Shared WordPress infrastructure: base URL, env/config, endpoint interpolation, low-level request plumbing. Delegates headers to `WPAuth`.

### `WPAuth`

Identity for talking to WordPress:

- application password (Basic)
- bearer token
- API key
- extra headers

`WPAuth` knows which strategy is configured. It does not own sign-in UI.

### `WPCreate` / `WPRead` / `WPUpdate` / `WPDelete`

CRUD execution boundaries on top of `WPClient`. Domain objects extend `WPRead`. Create goes through a `WPCreate` collaborator; update goes through a `WPUpdate` collaborator; delete goes through a `WPDelete` collaborator. Updates use `PUT`, matching Posts/Pages/Users.

`Media.create` accepts a JSON `WordPressPayload` or a file upload `{ file, filename, contentType?, …fields }`. File-only uploads send the binary body with `Content-Type` and `Content-Disposition: attachment; filename="…"`. Extra metadata fields (`title`, `alt_text`, …) switch the request to `multipart/form-data` with a `file` part — do not set `Content-Type` yourself so fetch can supply the boundary. Seltzer has no upload helper; this path lives on `WPClient.mutateUpload`.

### `WPSync`

Operational data movement from WordPress into Nectarine-shaped records.

- `preview()` / `transfer()` — default is still the six built-in collections (`posts`, `pages`, `users`, `categories`, `tags`, `comments`)
- `media` is a first-class `CMS_COLLECTIONS` slug. Opt in with `transfer(["media"])` or `transfer({ includeMedia: true })`
- named CPT rest bases opt in with `transfer({ cpts: ["books", "product"] })` (same shape for `preview`). Records land under that rest base; the type is registered if needed
- named taxonomy rest bases opt in with `transfer({ taxonomies: ["genre"] })` (same shape for `preview`). Terms land under that rest base; the type is registered if needed. Default six collections are unchanged unless you pass `collections`
- array form (`transfer(["posts"])`) is unchanged
- transfer queries that already used `context=edit` go through `withEditContext()` so raw title/content is available when credentials allow it. Public `getAll()` stays view-context.

### Raw vs rendered text

WordPress REST returns `title` / `content` / `excerpt` as `{ raw, rendered }` **only** when the request uses `context=edit` and is authenticated. View context (the `getAll()` default) usually has `rendered` only.

`ContentRecord.title` / `content` still store the best-available string (`raw`, then `rendered`) so sync and UI keep working. Dual values live on `meta`:

- `titleRaw` / `titleRendered`
- `contentRaw` / `contentRendered`
- `excerptRaw` / `excerptRendered` when WordPress sent an excerpt
- `wpMeta` — the WordPress REST `meta` object, when present
- `acf` — passed through when the payload has an `acf` key (no ACF SDK)
- `raw` — the original item, unchanged

Use `withEditContext(query)` (or `editContextQuery()`) when you want raw fields. Do not pass that helper as a silent default on public reads.

Featured images prefer `_embedded["wp:featuredmedia"][0].source_url`, then the existing normalize fallbacks. `resolveFeaturedImageUrl(mediaClient, id)` is an optional `Media.getById` lookup.

### Native CMS

`NectarineStore` holds `ContentRecord`s keyed by collection. `NativeCollection` exposes get/create/update/delete against that store and flushes after mutations.

`CmsPersistence` is a two-method interface (`load` / `save`). Implementations:

- `createFilePersistence(path)` — JSON on disk, Node `fs` only
- `createPostgresPersistence({ database, executor? })` — Nectarine `PgSql` by default; inject `SqlExecutor` in tests so `pg` is not loaded until you opt in

`KiwiPress.connect({ persistence })` then `await kiwi.ready()` hydrates once. Default remains in-memory.

The native `type-registry` (`kiwi.store.registerType` / `kiwi.native.collection`) is the in-process CMS. It is not the WordPress CPT or taxonomy client: `CustomPostType` / `kiwi.wordpress.cpt("books")` talks to a remote `/wp/v2/{restBase}` collection, and `CustomTaxonomy` / `kiwi.wordpress.taxonomy("genre")` does the same for terms. `WordPressTypes` / `kiwi.wordpress.types` reads `/wp/v2/types` so callers can discover CPT `rest_base` values; `WordPressTaxonomies` / `kiwi.wordpress.taxonomies` reads `/wp/v2/taxonomies`. `restBasesFromTypes()` maps the type catalog onto CPT rest bases for `transfer({ cpts })`. `restBasesFromTaxonomies()` maps the taxonomy catalog onto rest bases for `taxonomy()` / `transfer({ taxonomies })`, skipping built-in `categories` and `tags` by default (dedicated clients exist; pass `{ includeBuiltins: true }` to keep them). `WordPressSearch` / `kiwi.wordpress.search` is a read-only client for core `/wp/v2/search`. Hits are `SearchHit`s (`id`, `title`, `url`, `type`, `subtype`), not `ContentRecord`s — they are not full posts, not Elasticsearch, and not native store search.

## Route Layer

KiwiPress routes are thin. They define a clean public path and translate WordPress query quirks inside handlers (`createAliasedQueryRoute`). Search follows that pattern: `/search/:term` becomes `?search=`, and extra REST args (`type`, `subtype`, `page`, `per_page`, `exclude`, `include`) are serialized onto the same collection query string.

Inbound app routes live in `registerKiwiPressGateway`. Seltzer matches exact pathnames, so item updates use `?id=` rather than `/posts/:id`.

## Config-Driven Routing

`loadNectarineApi` walks Nectarine API YAML — nested (`user.get.allUsers.api`) or flat (`get.allUsers.api`) — into `{ method, endpoint }` records.

The live WordPress client still uses static `routes.ts` files because WordPress query aliases are not in those YAML files. The CPT and taxonomy clients are the exception: `createCptRoutes(restBase)` and `createTaxonomyRoutes(restBase)` build the same `createWordPressRoute` / `createAliasedQueryRoute` shapes at runtime for any collection base. Native CMS paths follow the Nectarine contracts.

## Direction of Dependency

1. `Nectarine` provides configuration, destination schema, and optional SQL adapters
2. `Seltzer` provides execution primitives
3. `KiwiPress` composes both into WordPress services and a native CMS

`Seltzer` should not depend on `KiwiPress`.
`Nectarine` should not depend on `KiwiPress`.
`KiwiPress` should not depend on `WebEngine`.

## Near-Term Implementation Path

1. Stabilize `WPCore` / `WPAuth` / `WPClient`
2. Keep read/write domain objects honest
3. Normalize WordPress JSON → `ContentRecord`
4. Transfer through `WPSync` into `NectarineStore`
5. Persist that store with file or Nectarine Postgres adapters
6. Grow the Echo UI on top of native collections
7. Keep route handlers thin throughout
8. Let WebEngine orchestrate only when a host app asks it to

## Current Exported Surface

- `WPCore`, `WPAuth`, `WPClient`, `WPRead`, `WPCreate`, `WPUpdate`, `WPDelete`, `WPSync`, `createWordPressClients`
- `Users`, `Posts`, `Pages`, `Categories`, `Tags`, `Comments`, `Media`, `CustomPostType`, `CustomTaxonomy`, `WordPressTypes`, `WordPressTaxonomies`, `WordPressSearch`
- `KiwiPress`, `NectarineStore`, `NativeCollection`
- `CmsPersistence`, `createFilePersistence`, `createPostgresPersistence`, `persistenceFromEnv`
- `normalizeWordPressItem`, `toNectarinePost`, `extractTextValue`, `extractTextParts`, `extractRaw`, `extractRendered`, `featuredImageFrom`, `resolveFeaturedImageUrl`, `withEditContext`, `editContextQuery`, `loadNectarineApi`
- `restBasesFromTypes`, `normalizeWordPressType`
- `restBasesFromTaxonomies`, `normalizeWordPressTaxonomy`
- `SearchHit`, `normalizeSearchHit`, `buildSearchQuery`
- `registerKiwiPressGateway`

## Non-Goals

KiwiPress is not intended to be:

- a random collection of fetch utilities
- a route-handler-heavy architecture
- a place where WordPress logic leaks into Seltzer
- a forever-WordPress product — WordPress is the entry, not the destination
- a WebEngine module that cannot run outside the kernel

## Summary

WordPress behavior lives in KiwiPress objects, not in Seltzer and not directly in route handlers.

The defining product principle is:

Start on WordPress Headless if you have it. Transfer into a Nectarine CMS. Run that CMS as this library — in this app, another Node project, or later under WebEngine.
