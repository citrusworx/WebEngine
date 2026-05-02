# KiwiPress Architecture Spec

## Purpose

KiwiPress is an object-oriented WordPress integration layer built on top of:

- `Seltzer` for route registration, endpoint execution, and request lifecycle
- `Nectarine` for model and API configuration parsing

KiwiPress is not intended to be a loose collection of REST helpers. It is a structured WordPress application layer with clear boundaries between transport, configuration, CRUD behavior, authentication, and synchronization.

## Current Status

KiwiPress is currently in an early but working read-side phase.

What is working now:

- `WPCore` as the shared WordPress config/infrastructure layer
- `WPClient` as the executable WordPress client layer
- `WPRead` as the shared read behavior layer
- `Users`, `Posts`, and `Pages` as read-side domain objects
- route alias translation from clean KiwiPress shapes into WordPress-compatible query shapes
- live smoke testing through `apps/kiwipress`
- package consumption through `@citrusworx/kiwipress`

What is not finished yet:

- `WPCreate`
- `WPUpdate`
- `WPDelete`
- `WPAuth`
- `WPSync`
- full response normalization
- full write/auth workflow coverage

## Stack Roles

### `Seltzer`

`Seltzer` owns:

- route definitions
- route registration
- endpoint execution
- request context for incoming server requests
- handler lifecycle

`Seltzer` does not own WordPress business rules.

### `Nectarine`

`Nectarine` owns:

- parsing config files such as `userAPI.yml`
- exposing structured model and route metadata
- compiler and adapter infrastructure for future config-driven behavior

`Nectarine` does not own route execution or WordPress runtime behavior.

### `KiwiPress`

`KiwiPress` owns:

- WordPress-specific architecture
- CRUD service boundaries
- auth workflow
- sync and migration workflow
- composition of `Seltzer` and `Nectarine`

## Core Design

KiwiPress is split into six main object areas:

- `WPCore`
- `WPCreate`
- `WPRead`
- `WPUpdate`
- `WPDelete`
- `WPAuth`
- `WPSync`

These objects are intentionally separated so each area has a single responsibility.

The current implemented spine is:

- `WPCore`
- `WPClient`
- `WPRead`
- read-side domain objects built on `WPRead`

## Class Responsibilities

### `WPCore`

`WPCore` is the shared WordPress infrastructure layer.

It owns:

- WordPress base URL
- environment/config loading
- common headers
- endpoint interpolation
- shared low-level request plumbing

It does not own request execution directly.

`WPCore` knows how to talk to WordPress.

It should not contain:

- sign-in workflow
- user permission logic
- CRUD-specific behavior
- backup or sync workflow

### `WPAuth`

`WPAuth` is responsible for identity and authorization.

It owns:

- sign-in flow
- application password flow
- API token handling
- authorization header generation
- session or credential validation

`WPAuth` knows who is allowed to talk to WordPress.

It should collaborate with `WPCore`, not replace it.

### `WPCreate`

`WPCreate` owns WordPress create operations.

Examples:

- create user
- create post
- create taxonomy entry

It should build on `WPCore` for execution details.

### `WPRead`

`WPRead` owns WordPress read operations.

Examples:

- get all users
- get user by id
- get user by email
- get posts
- get media

It should build on `WPCore` for execution details.

In the current implementation, `WPRead` builds on `WPClient`, which itself builds on `WPCore`.

### `WPUpdate`

`WPUpdate` owns WordPress update operations.

Examples:

- update user
- update post
- patch metadata

It should build on `WPCore` for execution details.

### `WPDelete`

`WPDelete` owns WordPress delete operations.

Examples:

- delete user
- delete post
- remove media

It should build on `WPCore` for execution details.

### `WPSync`

`WPSync` owns operational data movement concerns.

Examples:

- import/export
- migration
- backup
- restore
- cross-instance synchronization

It should remain separate from CRUD behavior so operational workflows do not pollute the core data-access classes.

## Route Layer

KiwiPress routes are thin.

Routes should not own large amounts of WordPress logic.

Routes should:

- define the clean KiwiPress-facing route shape
- translate that shape into the real underlying WordPress request when necessary
- keep WordPress-specific query quirks inside handlers rather than leaking them into the public API

Example intent:

```ts
export const getUserByEmail: Route<Endpoint> = {
  method: "GET",
  path: "/users/:email",
  handler: async (ctx) => {
    const email = decodeURIComponent(ctx.path.split("/").pop() ?? "");
    const baseUrl = ctx.options?.baseUrl ?? "";

    return fetch(`${baseUrl}/users?email=${encodeURIComponent(email)}`);
  }
}
```

The important rule is that KiwiPress keeps a clean public route shape while handlers absorb WordPress-specific query formats underneath.

## Config-Driven Routing

KiwiPress uses `Nectarine` model API config such as:

- `libraries/nectarine/models/user/userAPI.yml`

These files define:

- HTTP method
- endpoint pattern
- resource grouping

KiwiPress consumes those definitions and maps them into object-oriented WordPress behavior.

This means:

- `Nectarine` supplies the route metadata
- `Seltzer` supplies route execution
- `KiwiPress` supplies the object model and business behavior

Current practical note:

- the package architecture is still aligned with `Nectarine`
- but the browser-safe smoke-test path currently uses static route definitions instead of runtime YAML parsing
- this is a current implementation constraint, not the long-term design target

## Direction of Dependency

Dependency direction should remain:

1. `Nectarine` provides configuration
2. `Seltzer` provides execution primitives
3. `KiwiPress` composes both into WordPress services

`KiwiPress` depends on `Seltzer` and `Nectarine`.

`Seltzer` should not depend on `KiwiPress`.

`Nectarine` should not depend on `KiwiPress`.

## Why This Design

This design is intended to provide:

- clear separation of concerns
- strong object boundaries
- easier testing
- thin route handlers
- centralized WordPress behavior
- flexibility to grow into a larger framework

It also prevents `Seltzer` from becoming WordPress-aware and prevents route files from becoming the main business layer.

## Near-Term Implementation Path

Near-term implementation should proceed in this order:

1. Stabilize `WPCore`
2. Stabilize `WPClient`
3. Finish `WPRead`
4. Expand read-side domain objects consistently
5. Build `WPCreate`
6. Build `WPUpdate`
7. Build `WPDelete`
8. Add `WPAuth`
9. Add `WPSync`
10. Keep route handlers thin and delegated throughout

## Current Exported Surface

The current package exports:

- `WPCore`
- `WPClient`
- `WPRead`
- `Users`
- `Posts`
- `Pages`
- read-side route definitions for each domain

The app-level smoke test currently proves:

- `Posts.getAll()`
- `Posts.getBySlug()`
- `Pages.getAll()`
- `Users.getByEmail()`

## Non-Goals

KiwiPress is not intended to be:

- a random collection of fetch utilities
- a route-handler-heavy architecture
- a place where WordPress logic leaks into `Seltzer`
- a place where config parsing leaks into route handlers

## Summary

KiwiPress is a WordPress application layer composed from:

- `Seltzer` for route/runtime execution
- `Nectarine` for config and metadata
- `WPCore` plus CRUD/Auth/Sync service objects for WordPress behavior

The defining principle is:

WordPress behavior lives in KiwiPress objects, not in Seltzer and not directly in route handlers.
