# KiwiPress Architecture Spec

## Purpose

KiwiPress is an object-oriented WordPress integration layer built on top of:

- `Seltzer` for route registration, endpoint execution, and request lifecycle
- `Nectarine` for model and API configuration parsing

KiwiPress is not intended to be a loose collection of REST helpers. It is a structured WordPress application layer with clear boundaries between transport, configuration, CRUD behavior, authentication, and synchronization.

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

## Class Responsibilities

### `WPCore`

`WPCore` is the shared WordPress infrastructure layer.

It owns:

- WordPress base URL
- shared request execution
- endpoint interpolation
- common headers
- environment/config loading
- error normalization
- shared low-level request plumbing

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

- register the endpoint with `Seltzer`
- delegate behavior to the appropriate KiwiPress service object

Example intent:

```ts
const wpread = new WPRead();

const route = {
  method: "GET",
  path: "/users/:email",
  handler: () => {
    return fetch(wpread.getUserByEmail());
  }
};
```

The important rule is that route handlers delegate. They do not become the primary home for WordPress business behavior.

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
2. Build `WPRead`
3. Build `WPCreate`
4. Build `WPUpdate`
5. Build `WPDelete`
6. Add `WPAuth`
7. Add `WPSync`
8. Keep route handlers thin and delegated throughout

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
