# KiwiPress Best Practices

How to compose KiwiPress so it stays a client + a small CMS, not a second WordPress.

## Core principle

Use KiwiPress to express:

- WordPress collection access (`Posts`, `Pages`, …)
- an explicit transfer onto `ContentRecord`
- a persistable `NectarineStore`

Use Seltzer to express HTTP **you** own (`ResponseData`). Use Nectarine for YAML models and optional `PgSql`. Use Juice/Sig for pages. Use WebEngine only if a future kernel actually wires this package — it does not today.

## Treat WordPress JSON as foreign

`getAll()` / `getBySlug()` are raw. Normalize or transfer before application logic. Do not spread `{ rendered }` objects into native `create`.

## Use `listAll` when you mean the site

`getAll()` is a first page. Transfer, backups, and “export everything” should call `listAll` (or `sync.transfer`).

## Persist only when you need a restart

In-memory is the library default on purpose. Add `createFilePersistence` or Postgres when a process death would lose work. Call `await kiwi.ready()` once at startup.

## Keep credentials off the frontend

The dashboard front sends a **gateway** token, not `WP_APP_PASSWORD`. WordPress secrets stay on the Node process that constructs `Posts` / `KiwiPress`.

## Prefer application passwords

Basic + app password is the tested self-hosted path. Bearer is a fallback. `X-API-Key` is extra, not a WordPress core feature.

## Promote is a mode flag

`promote()` does not copy data. `transfer()` does. Call transfer first, then promote if a gateway should flip to native.

## Share a store, do not clone snapshots by hand

`toNectarine()` shares `store`. `connect({ store })` shares `store`. Two `createFilePersistence` paths to the same file still need `ready()` / `flush()` discipline.

## Be honest about the gateway

`registerKiwiPressGateway` returns Seltzer `ResponseData` and hosts posts/pages plus native custom types. Transfer stays WordPress-only. Do not treat a CPT slug as a WordPress collection.

## Label dashboard-only UI

Wizard, billing, projects, “KiwiPress Cloud” — those are `apps/kiwipress` chrome. Do not teach them as `@citrusworx/kiwipress` APIs.

## Keep custom collections thin

New `WPRead` subclasses should be route + `this.read`. Do not reimplement `fetch`. Do not put WordPress query translation in the page.

## Postgres: inject in tests, name the crash window

Production Postgres uses Nectarine `PgSql` and a delete-then-insert save. Tests should pass `executor`. Do not document a transaction that is not there.
