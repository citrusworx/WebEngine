# Seltzer Design Overview

**Rationale — not a backlog of missing stages.**

This document explains why Seltzer is a named request pipeline instead of Express middleware or WordPress-style hooks. The lifecycle it describes (`parse` → `context` → `route` → `validate` → `handle` → `response` → `send`) is **implemented** in `@citrusworx/seltzer` **0.8.1**. Parametric routes, JSON body parsing, `ResponseData` returns, `before` / `replace`, default `.required` validate, `generateRoutes`, CORS, and `HttpError` are source, not electives.

**Product path (use the package):** [README](./README.md) → [Getting Started](./seltzer-getting-started.md) → [JSON API tutorial](./seltzer-api-tutorial.md) → [Pipeline](./seltzer-pipeline.md).

**Contributor path (rebuild internals by hand):** [study guide](./courses.md) and [exercises](./exercises/README.md). Those exercises reconstruct what already ships. They are not “implement the missing stage.”

Open questions that are *not* shipped yet (HTTPS listen, Zod on `validate`, `after`, form bodies) live on [Roadmap](./seltzer-roadmap.md).

---

## What Seltzer Is

Seltzer is a **structured HTTP runtime** that turns raw HTTP requests into predictable application behavior.

It is not “just another Express alternative,” and it is not a thin routing helper. Its purpose is to serve as a **request processing engine** that fits the broader KiwiEngine philosophy:

* structured systems over ad hoc patterns
* explicit execution over implicit flow
* contract-aware behavior over manual wiring
* extensibility through pipelines instead of middleware or hooks

At its core, Seltzer takes in an HTTP request, normalizes it into a structured context object, runs that context through a named execution pipeline, executes a handler, formats the result, and sends a response.

---

## Why Seltzer Exists

Modern Node HTTP development often falls into one of two camps:

1. Very low-level server code using Node’s built-in `http` primitives
2. Middleware-heavy frameworks that are flexible, but can become difficult to reason about

Seltzer sits between those extremes.

The goal is to keep the **control and clarity** of a lower-level runtime while providing a more structured development model for real applications.

Seltzer exists because raw HTTP is messy, and because overly flexible middleware systems often become hard to trace, hard to validate, and hard to scale cleanly.

The design direction is based on a few beliefs:

* Request handling should be **deterministic**
* HTTP complexity should be **owned by the runtime**
* Handlers should focus on **behavior**, not protocol plumbing
* Extensibility should be **explicit and structured**
* Contracts should become **first-class citizens**

---

## What Seltzer Is Not

Seltzer is not intended to be:

* a clone of Express
* a middleware-first framework
* a WordPress-style hook system
* a giant plugin-driven abstraction machine
* a route-only microframework with no larger philosophy

If Seltzer were only a cleaner syntax for route definitions, it would not justify its existence.

Its differentiation comes from its structure.

---

## The Foundational Design Decisions

Several key design decisions define what Seltzer is. Each of these is in `libraries/seltzer/src` at 0.8.1.

### 1. Structured Context Instead of Raw `req` / `res`

Instead of exposing raw Node request and response objects as the primary developer interface, Seltzer transforms incoming HTTP traffic into a normalized `RequestContext`.

Handlers still *see* `req` / `res` as escape hatches. They should not need them for JSON APIs.

### 2. Automatic Request Body Parsing

Seltzer parses request bodies before handlers run (`parse` stage). JSON with `Content-Type: application/json` becomes `ctx.body`. Invalid JSON is 400, not a preserved raw string.

### 3. Structured Handler Responses

Handlers do not manually write to the response stream by default.

They return `ResponseData`:

* status
* headers
* body

The runtime `send`s. Bare objects are not wrapped (0.4.0 breaking change). There is no `ctx.json`.

### 4. Support for Multiple Response Types

`send` JSON-encodes objects/arrays/null/numbers/booleans, writes strings and buffers as-is, and respects an explicit `Content-Type`. First-class file streaming remains a [roadmap](./seltzer-roadmap.md) item.

### 5. Dynamic Route Support

`/users/:id` and `/posts/:slug` compile to regexes. Captures land on `ctx.params`. Static prefixes win over params so `/items/new` is not an id.

### 6. Contract Awareness

A route may carry `Route.contract`. Default `validate` enforces `.required` keys from YAML-style `body` specs. `generateRoutes` copies `ApiOperation.body` onto that field. Nectarine hangs richer checks with `replace("validate", …)`.

### 7. Pipelines Instead of Middleware or Hooks

Seltzer is not designed around generic middleware chains or hook systems. It uses a **named request pipeline** with explicit stages. `before` / `replace` are the modification API. There is no `next()`.

---

## Why Node’s Built-in `http` Module Was Chosen

Seltzer is built on Node’s built-in `http` module rather than starting from Express or another higher-level library.

Using Node’s built-in `http` module gives Seltzer direct access to the actual request and response lifecycle.

That matters because Seltzer is not trying to become a wrapper around another framework’s assumptions. It needs to define its own request processing model.

When using Node’s `http` module, the runtime receives:

* an `IncomingMessage` object for the request
* a `ServerResponse` object for the response

These are lower-level abstractions that expose the underlying HTTP transaction.

By starting here, Seltzer gets full control over body parsing, URL parsing, header handling, route matching, response formatting, and pipeline execution order.

If it started from Express, much of that lifecycle would already be shaped by middleware assumptions and plugin patterns that Seltzer is intentionally trying to avoid.

HTTPS `listen` is still not wrapped; that is a deliberate small surface, not a contradiction of “start from `http`.”

---

## HTTP Concepts Seltzer Is Built Around

### Request / Response

HTTP is a request / response protocol. Seltzer sits in the middle and interprets that exchange.

### Statelessness

Each request is a fresh execution of the pipeline. Sessions, tokens, cookies, and databases are application persistence, not runtime identity.

### Streams

In Node, request bodies arrive as chunks. The `parse` stage owns that complexity so handlers do not have to.

---

## The Core Request Lifecycle

```text
HTTP Request
  ↓
CORS / OPTIONS 204 (listen, not a stage)
  ↓
Parse Request
  ↓
Build Context
  ↓
Match Route
  ↓
Validate Contract
  ↓
Execute Handler
  ↓
Format Response
  ↓
Send Response
```

How-to detail is on [Pipeline](./seltzer-pipeline.md) and [Request and response](./seltzer-request-response.md). The important design claim is: each stage has one responsibility, and user code plugs in *by name*, not by registration order of anonymous middleware.

---

## Why Pipelines Were Chosen Over Middleware and Hooks

This is the defining architectural choice.

### Why Not Middleware

Traditional middleware chains often become difficult to trace because they depend on:

* registration order
* `next()` calls
* implicit side effects
* loosely scoped behavior

Middleware is flexible, but that flexibility often becomes ambiguity.

### Why Not Hooks

Hook systems, especially global or loosely ordered ones, tend to create the same problems in a different form: hidden behavior, hard-to-trace execution, state changes from many places.

### Why Pipelines Fit Better

Pipelines provide named stages, explicit order, a visible lifecycle, and controlled modification points.

Rather than saying “run this function somewhere before or after something else,” pipelines say:

> This request moves through a known sequence of transformations.

That is much closer to a compiler pipeline or game-engine system flow than a classic web middleware stack.

---

## Why the Pipeline Is User-Modifiable

Seltzer is not only a runtime. It is an engine.

Users can replace a step (`replace`) or insert a step before a named builtin (`before`). Returning `ResponseData` short-circuits to `send`.

Examples of custom steps: authentication, logging, tracing, feature flags, request decoration, full contract validation.

The goal is not “anything goes.” The goal is controlled extensibility against a known lifecycle.

There is no `after` yet. That is a roadmap item, not a hidden API.

---

## Mutation vs Immutability

The design session left this as a fork. **0.8.x chose mutation.** Stages mutate the shared `PipelineContext` in place and return `void` to continue. That is simpler in Node and matches the tests.

Immutability would make transformations easier to log as copies. It is not the current model. Do not write stages that expect to `return ctx`.

---

## The Relationship Between Seltzer and Nectarine

Seltzer is the runtime layer. Nectarine is the data and contract layer.

They are separate concerns, and they integrate at two explicit points:

* **`generateRoutes`** — Nectarine flattens YAML to `ApiOperation[]`; Seltzer builds `Route[]`; the host supplies `execute`
* **`Route.contract` + `validate` / `replace("validate")`** — presence checks by default; richer checks later

Seltzer does not compile SQL. Nectarine does not call `listen`.

---

## What Makes Seltzer Different from Express

The difference is not just syntax. It is architectural.

Express leans toward raw `req` / `res`, middleware chains, and manual parsing via plugins.

Seltzer leans toward normalized context, structured returns, explicit pipeline stages, contract-aware execution, and controlled extensibility.

Seltzer is not trying to win by having more plugins or by being a slightly nicer router.

It wins, if it wins, by being more structured, easier to reason about, more compatible with contract-driven systems, and better suited for a broader engine ecosystem.

---

## How Seltzer Fits into KiwiEngine

Within KiwiEngine, Seltzer is the layer responsible for HTTP request orchestration, API handling, and bridging contracts to actual behavior.

Where Juice addresses UI expression, Seltzer addresses HTTP execution structure.

---

## Identity (0.8.x)

> A structured, contract-aware HTTP runtime built around explicit request pipelines instead of middleware or hooks.

* it starts from raw HTTP, not another framework
* it normalizes request data into a context object
* it expects structured handler results
* it supports JSON and other bodies through `ResponseData`
* it supports dynamic route matching
* it integrates with Nectarine operations via `generateRoutes`
* it uses named, ordered pipelines for execution
* it allows `before` / `replace` on that pipeline

---

## Long-Term Potential

If the design direction remains consistent, Seltzer could grow into a contract-native API runtime, the default HTTP runtime for KiwiEngine, and a structured alternative to middleware-heavy frameworks.

That only works if the design stays disciplined. The core strength of Seltzer is not “more features.”

Its strength is:

> clarity through structure

See [Roadmap](./seltzer-roadmap.md) for what is actually next versus what would blur the split with Nectarine or Express.

---

## Summary

Seltzer was designed to be more than a router and more disciplined than a typical middleware framework.

It turns HTTP into a predictable, explicit processing pipeline.

In practical terms, Seltzer **is**:

> a request processing engine for structured, contract-aware applications

That is no longer only a design target. Use the [product README](./README.md) to call it.
