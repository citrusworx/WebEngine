# Seltzer Design Overview

## What Seltzer Is

Seltzer is a **structured HTTP runtime** designed to turn raw HTTP requests into predictable application behavior.

It is not intended to be “just another Express alternative,” and it is not being designed as a thin routing helper. Its purpose is to serve as a **request processing engine** that fits the broader KiwiEngine philosophy:

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

Seltzer is being designed to sit between those extremes.

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

Several key design decisions define what Seltzer is becoming.

### 1. Structured Context Instead of Raw `req` / `res`

Instead of exposing raw Node request and response objects as the primary developer interface, Seltzer transforms incoming HTTP traffic into a normalized `ctx` object.

This means the handler works with structured data instead of low-level protocol objects.

### 2. Automatic Request Body Parsing

Seltzer is responsible for parsing request bodies before handlers run.

This means handler authors do not need to manually read stream chunks or parse JSON. The body is already available on the context object.

### 3. Structured Handler Responses

Handlers do not manually write to the response stream by default.

Instead, handlers return structured response data such as:

* status
* headers
* body

This makes handlers more predictable, easier to test, and easier to integrate with other systems.

### 4. Support for Multiple Response Types

Seltzer should support more than just JSON responses.

It should be able to send:

* JSON
* plain text
* streams
* potentially files or other response formats later

### 5. Dynamic Route Support

Seltzer supports route parameters such as:

* `/users/:id`
* `/posts/:slug`

These parameters are extracted and placed on the context object.

### 6. Contract Awareness

Seltzer is intended to understand contracts as part of route processing.

At first, that may mean validation. Over time, it may also support generated behavior, shared typing, and response shaping based on contract definitions.

### 7. Pipelines Instead of Middleware or Hooks

This is one of the biggest design choices in the entire runtime.

Seltzer is not being designed around generic middleware chains or hook systems. It is being designed around a **named request pipeline** with explicit stages.

---

# Why Node’s Built-in `http` Module Was Chosen

Seltzer is built on Node’s built-in `http` module rather than starting from Express or another higher-level library.

## The Reason

Using Node’s built-in `http` module gives Seltzer direct access to the actual request and response lifecycle.

That matters because Seltzer is not trying to become a wrapper around another framework’s assumptions. It needs to define its own request processing model.

When using Node’s `http` module, the runtime receives:

* an `IncomingMessage` object for the request
* a `ServerResponse` object for the response

These are lower-level abstractions that expose the underlying HTTP transaction.

## Why That Matters

By starting here, Seltzer gets full control over:

* body parsing
* URL parsing
* header handling
* route matching
* response formatting
* pipeline execution order

That control is important because the runtime is designed to transform raw protocol details into structured system behavior.

If it started from Express, much of that lifecycle would already be shaped by middleware assumptions and plugin patterns that Seltzer is intentionally trying to avoid.

---

# HTTP Concepts Seltzer Is Built Around

To understand Seltzer, it helps to understand the HTTP model it sits on top of.

## Request / Response

HTTP is a request / response protocol.

A client sends a request containing things like:

* method
* path
* headers
* body

The server reads that request and sends back a response containing things like:

* status code
* headers
* body

Seltzer sits in the middle and interprets that exchange.

## Statelessness

HTTP is stateless.

Each request stands on its own unless the application adds persistence through:

* sessions
* tokens
* cookies
* databases
* external services

This means Seltzer should treat each incoming request as a fresh execution of the pipeline.

## Streams

In Node, request and response bodies are stream-based.

That means incoming request bodies do not just appear as finished objects. They arrive as chunks of data and must be assembled and interpreted.

Seltzer deliberately takes ownership of that complexity so handlers do not have to.

---

# The Core Request Lifecycle

Seltzer’s request lifecycle is pipeline-driven.

The conceptual flow looks like this:

```text
HTTP Request
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

Each stage has a clear responsibility.

---

## 1. Parse Request

This stage reads the raw Node request.

It is responsible for collecting body chunks, assembling them, and parsing the result into useful data.

For example, JSON bodies should be parsed into objects. If JSON parsing fails, the runtime may preserve the raw value instead.

The point of this stage is to turn stream-based raw input into usable data.

---

## 2. Build Context

This stage creates the main structured object the rest of the system uses.

The context contains normalized request information such as:

* method
* path
* query parameters
* headers
* body
* route params later in the flow
* potentially matched contract info
* other runtime-specific metadata over time

Instead of thinking in terms of raw HTTP objects, the runtime shifts into structured application state.

---

## 3. Match Route

This stage determines which route definition should handle the request.

It compares:

* request method
* request path

against the routes registered with the application.

If a route contains dynamic segments such as `:id`, those values are extracted into `ctx.params`.

This stage either enriches the context with route information or fails with a not found error.

---

## 4. Validate Contract

This stage is where Seltzer begins to integrate with the broader KiwiEngine philosophy.

If a route is associated with a contract, Seltzer can use that contract to validate things like:

* request body
* route params
* query string
* response shape later

This stage makes contracts part of request execution rather than something manually bolted on later.

Initially this may be light, but conceptually it is foundational.

---

## 5. Execute Handler

This is the stage developers usually think of as “the route.”

The handler receives the structured context and returns structured response data.

Instead of manipulating the raw response directly, the handler describes the response in a consistent format.

This keeps application behavior separated from protocol mechanics.

---

## 6. Format Response

Handlers may return different types of data.

This stage normalizes whatever the handler returned into a standard response shape that the runtime knows how to send.

For example, it may determine:

* default status if one was not set
* default headers
* whether the body should be JSON-stringified
* whether the body should be written as text
* whether the body is a stream and should be piped differently

This stage keeps output consistent.

---

## 7. Send Response

This is the final protocol-facing stage.

It takes the normalized response data and writes the actual HTTP response:

* status code
* headers
* body

After this stage, the request lifecycle is complete.

---

# The Context Object

The context object is one of the most important design decisions in Seltzer.

Its job is to provide a single, consistent object that every pipeline stage and handler can work with.

A conceptual version looks something like this:

```ts
type Context = {
  method: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: any;
  params: Record<string, string>;
  route?: RouteDefinition;
  contract?: string;
};
```

This may grow over time, but the main idea is fixed:

> The context object is the normalized representation of the request as it moves through Seltzer.

## Why This Matters

Without a context object, every stage would be dealing with raw request and response primitives, plus whatever extra data each developer decides to tack on.

That leads to inconsistency.

With a context object, the runtime has a consistent internal language.

This is also what makes contracts, validation, routing, transformation, and eventual cross-runtime behavior easier to reason about.

---

# The Structured Response Model

Handlers should return structured response data rather than writing directly to the response object.

A conceptual response shape looks like this:

```ts
type ResponseData = {
  status?: number;
  headers?: Record<string, string>;
  body?: any;
};
```

## Why This Matters

This design separates:

* application behavior
* protocol serialization

The handler decides **what** should happen.

The runtime decides **how** that becomes an HTTP response.

That makes the system cleaner and opens the door for:

* shared response shaping
* standardization across routes
* better testing
* contract-based response validation
* alternate output strategies

---

# Why Pipelines Were Chosen Over Middleware and Hooks

This is the defining architectural choice.

## Why Not Middleware

Traditional middleware chains often become difficult to trace because they depend on:

* registration order
* `next()` calls
* implicit side effects
* loosely scoped behavior

Middleware is flexible, but that flexibility often becomes ambiguity.

Seltzer is being designed to avoid that ambiguity.

## Why Not Hooks

Hook systems, especially global or loosely ordered ones, tend to create the same problems in a different form:

* behavior is hidden
* execution can be hard to trace
* state changes can happen from many places
* extension becomes unpredictable

This is especially undesirable in a system intended to feel clear and structured.

## Why Pipelines Fit Better

Pipelines provide:

* named stages
* explicit order
* visible lifecycle
* controlled modification points

Rather than saying “run this function somewhere before or after something else,” pipelines say:

> This request moves through a known sequence of transformations.

That makes debugging, reasoning, and extension much cleaner.

---

# The Pipeline Model

Seltzer’s pipeline is made of named steps.

A conceptual set of step names looks like this:

* parse
* context
* route
* validate
* handle
* response
* send

Each step is responsible for one clear part of request handling.

## Example Mental Model

```text
parse      → raw request becomes readable data
context    → normalized request state is created
route      → route and params are matched
validate   → contracts are applied
handle     → application logic runs
response   → result is normalized
send       → HTTP response is written
```

This is much closer to a compiler pipeline, render pipeline, or game engine system flow than a classic web middleware stack.

---

# Why the Pipeline Is User-Modifiable

One of the decisions made in the design session was that the pipeline should be **modifiable by the user**.

That means Seltzer is not only a runtime. It is an engine.

## What This Allows

Users should be able to do things like:

* replace a step
* insert a step before another
* insert a step after another
* potentially remove a step when appropriate

Examples of custom steps might include:

* authentication
* logging
* custom validation
* tracing
* performance instrumentation
* feature flags
* request decoration

## Why This Is Still Safe

The goal is not “anything goes” extensibility.

The goal is controlled extensibility.

Because each step is named and ordered, modifications happen against a known lifecycle rather than in a free-form chain.

That helps prevent the chaos commonly associated with middleware or hook systems.

---

# Pipeline Modification Philosophy

The pipeline should be extensible, but not vague.

That means user modifications should be explicit.

Conceptually, Seltzer should support operations like:

* replace `"validate"` with a custom validation step
* insert a step before `"handle"` to authenticate a request
* insert a step after `"parse"` to log inbound metadata

This keeps extension declarative and intentional.

The design principle is:

> Extensibility should preserve structure, not destroy it.

---

# Mutation vs Immutability in the Pipeline

A major unresolved but important question in the design is whether pipeline steps should:

* mutate the context object directly
* or return a new enriched context object

This is an important architectural fork.

## Mutation

This is simpler and likely faster.

It also feels more natural in some Node environments.

However, it can become harder to trace where state changed.

## Immutability

This is more predictable and functional in style.

It makes the transformation model clearer, but can feel heavier and may be slightly more expensive.

This question is still worth exploring, because it affects how Seltzer feels to use internally and how debuggable complex pipelines become.

At the conceptual level, though, the important part is already decided:

> Pipeline steps transform context in a known order.

---

# Dynamic Routing

Seltzer supports dynamic route segments such as:

* `/users/:id`
* `/articles/:slug`

When a request path matches one of these patterns, the captured values are added to the context.

## Why This Matters

Dynamic routing is essential for any real application runtime.

But in Seltzer, it is not just a routing convenience. It is part of the context normalization process.

Once route parameters are extracted into `ctx.params`, they become available for:

* handler logic
* contract validation
* eventual type generation
* response shaping

This means routing and contracts can work together more naturally.

---

# Contract Awareness

Seltzer is not just route-aware. It is intended to become contract-aware.

## What That Means

A route can be associated with a contract identifier or contract definition.

That allows Seltzer to understand that request handling is not just:

* method + path + handler

but potentially:

* method + path + contract + handler

## Early Responsibilities

At first, contract integration may only mean validation.

For example:

* validate route params
* validate query params
* validate request body

## Later Responsibilities

Over time, contracts could also be used to:

* define response shapes
* generate route definitions
* share types between systems
* connect directly to Nectarine schemas and behaviors
* reduce manual route boilerplate

This is one of the largest long-term differentiators for Seltzer.

---

# The Relationship Between Seltzer and Nectarine

Seltzer is the runtime layer. Nectarine is the data and contract layer.

They are separate concerns, but they are intended to integrate tightly.

## Seltzer’s Role

Seltzer handles:

* HTTP lifecycle
* routing
* parsing
* context creation
* handler execution
* response formatting
* pipeline execution

## Nectarine’s Role

Nectarine handles:

* schemas
* contracts
* validation
* query generation
* data/API definitions

## Together

Seltzer can become the execution engine for contract-defined application behavior, while Nectarine provides the structural rules.

This is where Seltzer moves beyond being a web server helper and becomes a real system runtime.

---

# What Makes Seltzer Different from Express

The difference is not just syntax.

It is architectural.

## Express Leans Toward

* raw request / response access
* middleware chains
* manual parsing via plugins
* highly flexible but loosely structured behavior

## Seltzer Leans Toward

* normalized context objects
* structured response returns
* explicit pipeline stages
* contract-aware execution
* controlled extensibility
* a runtime model that fits a larger engine philosophy

Seltzer is not trying to win by having more plugins or by being a slightly nicer router.

It wins, if it wins, by being:

* more structured
* easier to reason about
* more compatible with contract-driven systems
* better suited for a broader engine ecosystem

---

# How Seltzer Fits into KiwiEngine

Seltzer is not an isolated library conceptually. It is part of a broader runtime philosophy.

Within KiwiEngine, Seltzer can become the layer responsible for:

* HTTP request orchestration
* API handling
* route execution
* runtime service coordination
* bridging contracts to actual behavior

That means it is not just a server library. It is one of the mechanisms through which KiwiEngine can expose application behavior to the outside world.

Where Juice addresses UI expression, Seltzer addresses HTTP execution structure.

---

# The Current Identity of Seltzer

At this stage in its design, Seltzer can be described as:

> A structured, contract-aware HTTP runtime built around explicit request pipelines instead of middleware or hooks.

That identity has several key characteristics:

* it starts from raw HTTP, not another framework
* it normalizes request data into a context object
* it expects structured handler results
* it supports multiple response formats
* it supports dynamic route matching
* it is intended to integrate with contracts
* it uses named, ordered pipelines for execution
* it allows controlled modification of that pipeline

This is already enough to define a real design direction.

---

# Long-Term Potential

If the design direction remains consistent, Seltzer could grow into:

* a contract-native API runtime
* the default HTTP runtime for KiwiEngine
* a bridge between web services and other engine systems
* a structured alternative to middleware-heavy frameworks
* a runtime that can coordinate HTTP, events, and service pipelines in a unified way

But all of that only works if the design stays disciplined.

The core strength of Seltzer is not “more features.”

Its strength is:

> clarity through structure

---

# Summary

Seltzer was designed to be more than a router and more disciplined than a typical middleware framework.

It is intended to turn HTTP into a predictable, explicit processing pipeline.

Its core ideas are:

* raw HTTP should be normalized by the runtime
* handlers should focus on behavior, not protocol details
* request handling should be explicit and traceable
* extensibility should happen through named pipeline stages
* contracts should become part of the execution model
* the runtime should fit into a larger engine architecture

In practical terms, Seltzer is becoming:

> a request processing engine for structured, contract-aware applications

That is the design target.
