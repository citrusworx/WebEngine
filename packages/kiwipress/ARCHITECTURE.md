# KiwiPress Architecture Spec

## Purpose

KiwiPress is the WordPress entry point into the WebEngine ecosystem.

People start with WordPress Headless because they already have content, editors, and plugins. KiwiPress talks to that install through a structured application layer. When they are ready, `WPSync` transfers that content into a Nectarine-shaped CMS — more expressive, modern, and easy to use — which WebEngine can run without WordPress.

KiwiPress is built on:

- `Seltzer` for route registration, endpoint execution, and request lifecycle
- `Nectarine` for model and API configuration (YAML contracts and the destination schema)

KiwiPress is not a bag of REST helpers. It is a WordPress application layer with a documented exit into WebEngine.

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
- `registerKiwiPressGateway` for the `apps/kiwipress` Seltzer proxy
- live app at `apps/kiwipress` (marketing, wizard, dashboard Content + transfer)

Not finished yet:

- persisting the Nectarine store through `PgSql` / MySQL / Mongo
- a full visual CMS UI (Echo)
- media and custom post type domain objects
- plugin adapters (WooCommerce, BuddyPress, MemberPress)

## The on-ramp

```
WordPress (headless REST)
        │  KiwiPress domain objects
        ▼
 ContentRecord (normalized)
        │  WPSync.transfer()
        ▼
 NectarineStore / Nectarine models
        │  WebEngine runtime
        ▼
 Native CMS the user actually wants
```

WordPress is the default `cms` adapter (`Blueprint.adapters.cms = "kiwipress"`). Nectarine is the destination. Transfer is explicit: nothing overwrites WordPress until `sync.transfer()` runs.

## Stack Roles

### `Seltzer`

Owns route definitions, registration, endpoint execution, and inbound request context.

Does not own WordPress business rules.

### `Nectarine`

Owns parsing config files such as `userAPI.yml` and `models/blog/post/schema.yml`.

Does not own route execution or WordPress runtime behavior.

### `KiwiPress`

Owns:

- WordPress-specific architecture
- CRUD service boundaries
- auth header workflow (`WPAuth`)
- sync and transfer workflow (`WPSync`)
- composition of Seltzer and Nectarine
- the native CMS store that transfer fills

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

The implemented spine is:

- `WPCore` + `WPAuth`
- `WPClient`
- `WPRead` and write wrappers
- domain objects on `WPRead`
- `KiwiPress` facade + `WPSync` + native store

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

CRUD execution boundaries on top of `WPClient`. Domain objects currently extend `WPRead` and call `mutate()` for writes.

### `WPSync`

Operational data movement from WordPress into Nectarine-shaped records.

- `preview()` — counts without writing
- `transfer()` — normalize and upsert into `NectarineStore`

This is the transfer users take when they leave WordPress for WebEngine.

### Native CMS

`NectarineStore` holds `ContentRecord`s keyed by collection. `NativeCollection` exposes the same get/create/update/delete verbs against that store. Persistence adapters (Postgres via Nectarine) are the next layer, not this one.

## Route Layer

KiwiPress routes are thin. They define a clean public path and translate WordPress query quirks inside handlers (`createAliasedQueryRoute`).

Inbound app routes live in `registerKiwiPressGateway`. Seltzer matches exact pathnames, so item updates use `?id=` rather than `/posts/:id`.

## Config-Driven Routing

`loadNectarineApi` walks Nectarine API YAML — nested (`user.get.allUsers.api`) or flat (`get.allUsers.api`) — into `{ method, endpoint }` records. That is the real importer the Nectarine integration docs asked for.

The live WordPress client still uses static `routes.ts` files because WordPress query aliases are not in those YAML files. Native CMS paths follow the Nectarine contracts.

## Direction of Dependency

1. `Nectarine` provides configuration and the destination schema
2. `Seltzer` provides execution primitives
3. `KiwiPress` composes both into WordPress services and the transfer into native CMS

`Seltzer` should not depend on `KiwiPress`.
`Nectarine` should not depend on `KiwiPress`.

## Near-Term Implementation Path

1. Stabilize `WPCore` / `WPAuth` / `WPClient`
2. Keep read/write domain objects honest
3. Normalize WordPress JSON → `ContentRecord`
4. Transfer through `WPSync` into `NectarineStore`
5. Persist that store with Nectarine DB adapters
6. Grow the Echo UI on top of native collections
7. Keep route handlers thin throughout

## Current Exported Surface

- `WPCore`, `WPAuth`, `WPClient`, `WPRead`, `WPCreate`, `WPUpdate`, `WPDelete`, `WPSync`
- `Users`, `Posts`, `Pages`, `Categories`, `Tags`, `Comments`
- `KiwiPress`, `NectarineStore`, `NativeCollection`
- `normalizeWordPressItem`, `toNectarinePost`, `loadNectarineApi`
- `registerKiwiPressGateway`

## Non-Goals

KiwiPress is not intended to be:

- a random collection of fetch utilities
- a route-handler-heavy architecture
- a place where WordPress logic leaks into Seltzer
- a forever-WordPress product — WordPress is the entry, not the destination

## Summary

WordPress behavior lives in KiwiPress objects, not in Seltzer and not directly in route handlers.

The defining product principle is:

Start on WordPress Headless. Transfer into a Nectarine CMS. Run it on WebEngine.
