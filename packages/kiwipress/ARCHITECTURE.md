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
- `Users`, `Posts`, and `Pages` with CRUD
- `Categories`, `Tags`, and `Comments` as read-side domain objects
- route alias translation from clean KiwiPress shapes into WordPress query strings
- response normalization onto `ContentRecord` / Nectarine post shapes
- `loadNectarineApi` for nested or flat Nectarine API YAML
- `WPSync` transfer from WordPress collections into a `NectarineStore`
- `KiwiPress.connect()` facade with `wordpress` (entry) and `nectarine` (destination) modes
- opt-in `CmsPersistence` (`createFilePersistence`, `createPostgresPersistence` via Nectarine `PgSql`)
- `registerKiwiPressGateway` for the `apps/kiwipress` Seltzer proxy
- live app at `apps/kiwipress` (marketing, wizard, dashboard Content + Types)
- native custom type registry (definitions + items; not WordPress CPT sync)

Not finished yet:

- MySQL / Mongo persistence adapters
- a full visual CMS UI (Echo)
- media and WordPress custom post type sync
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

CRUD execution boundaries on top of `WPClient`. Domain objects extend `WPRead`. Create goes through a `WPCreate` collaborator; update goes through a `WPUpdate` collaborator; delete goes through a `WPDelete` collaborator.

### `WPSync`

Operational data movement from WordPress into Nectarine-shaped records.

- `preview()` — counts without writing
- `transfer()` — normalize, upsert into `NectarineStore`, then `flush()` if persistence is configured

### Native CMS

`NectarineStore` holds `ContentRecord`s keyed by collection. `NativeCollection` exposes get/create/update/delete against that store and flushes after mutations.

`CmsPersistence` is a two-method interface (`load` / `save`). Implementations:

- `createFilePersistence(path)` — JSON on disk, Node `fs` only
- `createPostgresPersistence({ database, executor? })` — Nectarine `PgSql` by default; inject `SqlExecutor` in tests so `pg` is not loaded until you opt in

`KiwiPress.connect({ persistence })` then `await kiwi.ready()` hydrates once. Default remains in-memory.

## Route Layer

KiwiPress routes are thin. They define a clean public path and translate WordPress query quirks inside handlers (`createAliasedQueryRoute`).

Inbound app routes live in `registerKiwiPressGateway`. Seltzer matches exact pathnames, so item updates use `?id=` rather than `/posts/:id`.

## Config-Driven Routing

`loadNectarineApi` walks Nectarine API YAML — nested (`user.get.allUsers.api`) or flat (`get.allUsers.api`) — into `{ method, endpoint }` records.

The live WordPress client still uses static `routes.ts` files because WordPress query aliases are not in those YAML files. Native CMS paths follow the Nectarine contracts.

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

- `WPCore`, `WPAuth`, `WPClient`, `WPRead`, `WPCreate`, `WPUpdate`, `WPDelete`, `WPSync`
- `Users`, `Posts`, `Pages`, `Categories`, `Tags`, `Comments`
- `KiwiPress`, `NectarineStore`, `NativeCollection`
- `CmsPersistence`, `createFilePersistence`, `createPostgresPersistence`, `persistenceFromEnv`
- `normalizeWordPressItem`, `toNectarinePost`, `loadNectarineApi`
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
