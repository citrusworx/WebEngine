# Juice v2 — Development Plan

Project: Juice v2 Platform: citrusOS Primary integration: KiwiCMS v2 Major initiatives: OS Design System, 3D foundations, modern rendering architecture

## 1. Vision

Juice v2 will evolve Juice into the foundational design and interactive experience system for the citrusOS ecosystem.

The primary objective is to establish a unified visual language and component architecture that can be used across citrusOS applications, beginning with KiwiCMS v2 and eventually extending into WebEngine, WebStore, and other applications within the ecosystem.

Version 2 will also introduce the first foundations for native 3D experiences, allowing developers and designers to incorporate interactive 3D elements into their applications through Spline and browser-compatible graphics technologies.

Juice v2 should become more than a UI component library. It should be the design and presentation foundation for the citrusOS platform.

### Primary goals

1. Establish the citrusOS Design System.

2. Develop a reusable, themeable OS-style component library.

3. Introduce consistent application layouts, navigation, and workspace patterns.

4. Build the UI foundations for KiwiCMS v2.

5. Introduce Spline integration for interactive 3D content.

6. Establish a WebGL/WebGPU rendering architecture.

7. Provide an extensible foundation for future 3D interfaces, spatial experiences, and advanced visual effects.

8. Maintain accessibility, responsive design, performance, and developer usability.


## 2. Technical direction: 3D, WebGL, WebGPU, and Vulkan

Before defining the roadmap, one important architectural decision needs to be made.

For browser-based 3D, WebGPU is the technology to investigate alongside WebGL—not direct Vulkan integration.

WebGPU provides browser applications with a modern GPU interface that can be implemented over native graphics APIs such as Vulkan, Metal, and Direct3D. It supports advanced GPU capabilities, including compute operations. WebGL provides an established alternative with broader compatibility.

![](https://www.google.com/s2/favicons?domain=https://developer.mozilla.org\&sz=32)

MDN

+2

I would establish the following technical direction for Juice v2:

|
Technology

|

Role

|
| --- | --- |
|

Spline

|

Designer-friendly, interactive 3D scenes

|
|

WebGL

|

Established browser rendering backend

|
|

WebGPU

|

Modern rendering and compute foundation

|
|

Vulkan

|

Potential future native application backend

|
|

Three.js

|

Optional programmable 3D scene renderer

|
|

glTF/GLB

|

Interoperable 3D asset format

|

Spline already provides browser integration through its viewer and JavaScript runtimes, including APIs for scene variables, object properties, transitions, and events.

![](https://www.google.com/s2/favicons?domain=https://docs.spline.design\&sz=32)

Spline Documentation

+1

Juice should support both embedded scenes and more programmatic 3D experiences without requiring every application to use the same renderer.

### Proposed rendering architecture

```
Juice v2
│
├── citrusOS Design System
│   ├── Design Tokens
│   ├── UI Components
│   ├── Application Layouts
│   └── Interaction Patterns
│
├── Juice 3D
│   │
│   ├── Scene Components
│   │   ├── Scene
│   │   ├── Scene Container
│   │   ├── Scene Loader
│   │   ├── Scene Fallback
│   │   └── Scene Controls
│   │
│   ├── Integration Adapters
│   │   ├── Spline
│   │   └── Custom Renderer
│   │
│   ├── Rendering Layer
│   │   ├── WebGPU
│   │   ├── WebGL 2
│   │   └── Static Fallback
│   │
│   └── Asset Management
│       ├── Models
│       ├── Materials
│       ├── Textures
│       └── Environments
│
└── WebEngine / KiwiCMS Integration
```

The Spline adapter and custom rendering adapter should be separate. Juice must not assume that a Spline scene can automatically switch between WebGL and WebGPU simply because both are supported elsewhere in the package.

# 3. Major Development Initiatives

## Initiative A — The citrusOS Design System

Primary priority

### Objective

Create the definitive design language for the citrusOS platform.

The design system should give every application within citrusOS a recognizable identity while maintaining the flexibility required for different types of applications and workflows.

KiwiCMS v2 will become the first major implementation of the new design system.

### A.1 — Design foundations

Build a comprehensive system of design tokens.

Color system

* Brand colors

* Neutral palettes

* Surface colors

* Background colors

* Text colors

* Border colors

* Interactive states

* Success, warning, danger, and informational colors

* Light and dark themes

* High-contrast accessibility options

Typography

* Font families

* Type scale

* Font weights

* Line heights

* Letter spacing

* Display typography

* Headings

* Body text

* Labels

* Captions

* Code typography

Layout

* Spacing scale

* Container sizes

* Responsive breakpoints

* Grid system

* Z-index scale

* Border radius

* Elevation and shadows

Motion

* Animation durations

* Easing curves

* Component transitions

* Navigation transitions

* Window and panel transitions

* Loading animations

* Reduced-motion alternatives

Interaction

* Hover states

* Focus states

* Active states

* Disabled states

* Selected states

* Dragging states

* Validation states

### A.2 — Semantic tokens

Separate the underlying color palette from the purpose of each color.

For example:

CSS

```
:root {
  /* Primitive tokens */

  --juice-color-neutral-0: #ffffff;
  --juice-color-neutral-950: #09090b;

  /* Semantic tokens */

  --juice-surface-primary: var(--juice-color-neutral-0);

  --juice-text-primary: var(--juice-color-neutral-950);

  /* OS-specific tokens */

  --juice-os-window-background: var(--juice-surface-primary);
  --juice-os-window-border: var(--juice-border-default);
}
```

The values above are illustrative rather than the final citrusOS palette.

Developers should be able to customize a theme without rewriting individual component styles.

### A.3 — Theme architecture

Develop a theme system supporting:

* citrusOS Light

* citrusOS Dark

* System preference

* Custom application themes

* Brand-specific themes

* User-defined accent colors

* Accessibility preferences

Theme configuration should propagate across compatible Juice components.

### Deliverables

* Design token specification

* CSS variable architecture

* Light and dark themes

* Semantic color system

* Typography system

* Spacing and layout system

* Motion system

* Theme configuration API

* Design system documentation

## Initiative B — OS-Style Application Components

Primary priority

### Objective

Create reusable application components that establish the citrusOS visual language.

These components should make citrusOS applications feel like a cohesive software environment rather than collections of unrelated web pages.

### B.1 — Application shell

Create a standardized application shell that provides the foundation for KiwiCMS v2 and other citrusOS applications.

Components:

* AppShell

* AppHeader

* AppSidebar

* AppNavigation

* AppContent

* AppFooter

* AppToolbar

* AppBreadcrumbs

* AppSwitcher

* WorkspaceSwitcher

* UserMenu

The application shell should support desktop, tablet, and mobile layouts.

### B.2 — Window and workspace system

Introduce OS-inspired interface primitives.

Components:

* Window

* WindowHeader

* WindowContent

* WindowActions

* Panel

* SplitPanel

* ResizablePanel

* FloatingPanel

* Drawer

* Popover

* CommandPalette

* ContextMenu

* Dock

* StatusBar

Not every application needs literal desktop windows.

The design system should support both traditional application layouts and window-based experiences.

For example, KiwiCMS could use a persistent sidebar and content workspace, while a future visual editor could use floating tool panels.

### B.3 — Core UI components

Develop a cohesive collection of foundational controls.

|
Category

|

Components

|
| --- | --- |
|

Actions

|

Button, IconButton, ButtonGroup

|
|

Inputs

|

Input, Textarea, Select, Checkbox, Radio, Switch

|
|

Navigation

|

Tabs, Breadcrumbs, Pagination, NavigationMenu

|
|

Feedback

|

Alert, Toast, Tooltip, Progress, Spinner

|
|

Overlays

|

Dialog, Modal, Popover, Drawer

|
|

Data

|

Table, DataGrid, Badge, Avatar

|
|

Layout

|

Card, Container, Stack, Grid, Divider

|
|

Advanced

|

TreeView, CommandPalette, ContextMenu

|

Each component should provide consistent styling, keyboard accessibility, responsive behavior, and predictable APIs.

### B.4 — Application composition

Introduce higher-level patterns combining several components.

Examples:

* Dashboard layouts

* Settings pages

* Resource management pages

* Detail pages

* Content editors

* Inspector panels

* Search interfaces

* File browsers

* Data tables

* Multi-step workflows

* Empty states

* Loading states

* Error states

This is where the design system becomes especially valuable for KiwiCMS v2.

Instead of rebuilding every administrative interface, KiwiCMS can compose reusable Juice patterns.

### Deliverables

* Application shell

* Navigation components

* Window and panel primitives

* Core UI components

* Application composition patterns

* Responsive behavior

* Keyboard interaction support

* Component documentation

* Interactive component examples

## Initiative C — KiwiCMS v2 Integration

Primary priority

### Objective

Make KiwiCMS v2 the first reference implementation of the citrusOS Design System.

KiwiCMS should demonstrate that Juice v2 can power a complete production application, not merely individual components.

### C.1 — KiwiCMS application shell

Build the KiwiCMS application around the new citrusOS shell.

The primary layout should include:

```
KiwiCMS v2
│
├── Global Application Header
│
├── Workspace Navigation
│
├── Main Application Sidebar
│   ├── Dashboard
│   ├── Content
│   ├── Media
│   ├── Collections
│   ├── Users
│   ├── Extensions
│   └── Settings
│
├── Main Content Workspace
│
├── Contextual Inspector
│
└── Application Status / Notifications
```

The contextual inspector should be optional and change according to the active workflow.

### C.2 — Key KiwiCMS experiences

Use Juice v2 to establish consistent interface patterns for:

* Dashboard

* Content management

* Content editing

* Media library

* Collection management

* User management

* Application settings

* Extension management

### C.3 — Content editor architecture

The content editor should be a major demonstration of the new design system.

Provide reusable interface primitives for:

* Block selection

* Block insertion

* Drag handles

* Inline toolbars

* Formatting controls

* Inspector panels

* Document outline

* Preview controls

* Save status

* Publishing actions

Juice should provide the presentation and interaction primitives while KiwiCMS owns content schemas, persistence, authorization, and publishing logic.

### C.4 — Migration strategy

Avoid a complete rewrite of KiwiCMS simply to introduce the design system.

Instead:

1. Establish the Juice v2 application shell.

2. Migrate shared controls and navigation.

3. Migrate core management pages.

4. Integrate the content editor.

5. Introduce advanced workspace patterns.

6. Remove obsolete styling and components.

### Deliverables

* KiwiCMS v2 application shell

* Navigation integration

* Dashboard UI

* Content management UI

* Editor interface components

* Media management UI

* Settings UI

* Theme integration

* Migration documentation


## Initiative D — Juice 3D Foundations

New in v2

### Objective

Introduce a reusable 3D layer that allows citrusOS applications and WebEngine experiences to incorporate interactive 3D content without requiring application developers to manage the entire rendering lifecycle themselves.

Version 2 should establish the architecture, integrations, and fundamental components.

It should not attempt to become a complete 3D game engine or modeling application.

### D.1 — Spline integration

Develop a Spline adapter for Juice.

The initial integration should support:

* Loading published Spline scenes

* Embedding Spline experiences

* Scene loading states

* Scene errors

* Responsive containers

* Scene interaction events

* Scene variables

* Object interaction

* Animation triggers

* Cleanup when components unmount

Spline's JavaScript runtime offers controls for object properties, variables, events, and transitions, making it suitable for interactive application interfaces rather than only decorative 3D content.

![](https://www.google.com/s2/favicons?domain=https://docs.spline.design\&sz=32)

Spline Documentation

+1

Proposed public API

The following illustrates the desired developer experience rather than an implementation of Spline's existing API:

TypeScript

```
import {
  SplineScene,
  SceneFallback,
} from "@juice/3d";

export function ProductExperience() {
  return (
    <SplineScene
      scene="https://example.com/product-scene"
      interactive
      loading="lazy"
      fallback={<SceneFallback />}
      onLoad={(scene) => {
        console.log("Scene loaded", scene);
      }}
      onError={(error) => {
        console.error(error);
      }}
    />
  );
}
```

The exact package names and component signatures should be finalized against Juice's existing architecture.

### D.2 — Scene lifecycle

Establish a consistent lifecycle for all supported 3D experiences.

```
Initialize
    ↓
Detect Capabilities
    ↓
Prepare Renderer
    ↓
Load Assets
    ↓
Create Scene
    ↓
Ready
    ↓
Render / Interact
    ↓
Suspend / Resume
    ↓
Dispose
```

The lifecycle should accommodate externally managed scenes, such as Spline, as well as scenes managed by Juice's custom rendering adapter.

### D.3 — Core scene components

Establish the following initial component concepts:

|
Component

|

Responsibility

|
| --- | --- |
|

Scene

|

General 3D experience container

|
|

SplineScene

|

Spline-specific integration

|
|

SceneCanvas

|

Custom rendering surface

|
|

SceneLoader

|

Loading feedback

|
|

SceneFallback

|

Unsupported or failed scene

|
|

SceneErrorBoundary

|

Error isolation

|
|

SceneControls

|

User interaction controls

|
|

SceneOverlay

|

Conventional UI layered over 3D

|

For version 2, prioritize Scene, SplineScene, SceneCanvas, SceneLoader, SceneFallback, and SceneOverlay.

More advanced controls can follow as the renderer matures.

### D.4 — Interaction bridge

Allow ordinary Juice components to communicate with 3D scenes.

Example use case:

A user selects a guitar finish using a standard UI control, and the corresponding 3D guitar model updates.

```
Juice UI
   │
   ▼
Application State
   │
   ▼
3D Scene Adapter
   │
   ▼
Scene Variable / Object Property
   │
   ▼
Updated 3D Model
```

Support:

* UI-to-scene communication

* Scene-to-UI events

* Scene variable updates

* Animation triggers

* Object selection

* Application state synchronization

The bridge should use a predictable event and state interface without forcing the application to adopt a particular global state-management library.

### D.5 — Scene overlays

One particularly useful feature will be the ability to place conventional Juice UI over interactive 3D experiences.

Examples:

* Product configuration controls

* Interactive labels

* Scene navigation

* Information panels

* Call-to-action buttons

* Product specifications

These should remain accessible HTML-based controls rather than requiring every UI element to become a 3D object.

### Deliverables

* Spline integration package

* Scene lifecycle specification

* Scene container

* Scene loading states

* Scene fallback

* Scene error handling

* UI-to-scene communication

* Scene-to-UI communication

* Scene overlay support

* Spline integration examples

## Initiative E — WebGL and WebGPU Foundations

New in v2

### Objective

Create a rendering abstraction that allows Juice to support programmable 3D experiences independently of Spline.

WebGL and WebGPU should be implementation backends rather than APIs that every Juice application developer must understand.

### E.1 — Rendering strategy

Develop a capability-based renderer selection system.

The intended preference is:

```
Is WebGPU available and compatible?
│
├── Yes
│   └── Use WebGPU renderer
│
└── No
    │
    └── Is WebGL 2 available?
        │
        ├── Yes
        │   └── Use WebGL renderer
        │
        └── No
            └── Static fallback
```

WebGPU should be detected at runtime, including the availability of a suitable adapter and required device features. Its browser support is not universal, and access generally requires a secure context.

![](https://www.google.com/s2/favicons?domain=https://developer.mozilla.org\&sz=32)

MDN

+1

A renderer should not be selected solely because a browser exposes a WebGPU property.

### E.2 — Rendering interfaces

Define common interfaces for:

* Renderer

* Scene

* Camera

* Render target

* Asset loader

* Rendering lifecycle

* Renderer capabilities

Keep the version 2 abstraction deliberately small.

Do not attempt to hide every difference between WebGL and WebGPU.

### E.3 — Renderer selection

Support explicit and automatic configuration.

Illustrative API:

TypeScript

```
<Scene
  renderer="auto"
  fallback="static"
>
  {/* Scene content */}
</Scene>
```

Potential renderer values:

TypeScript

```
type RendererType =
  | "auto"
  | "webgpu"
  | "webgl";
```

### E.4 — Three.js investigation

Evaluate Three.js as the initial custom rendering implementation.

The objective is to avoid building every graphics capability directly on top of low-level browser APIs.

The investigation should determine:

* How it fits the existing Juice architecture

* Whether its rendering abstraction meets Juice's needs

* Support for WebGPU and WebGL fallback

* Bundle-size implications

* Integration with Spline-exported assets

* Asset loading and rendering lifecycle management

* Licensing and maintenance considerations

Make this a documented technical decision before implementing the renderer.

Spline's Three.js export path should be evaluated separately from its standard runtime because exported scene behavior is not identical across formats.

![](https://www.google.com/s2/favicons?domain=https://docs.spline.design\&sz=32)

Spline Documentation

### E.5 — Graphics capability detection

Create a capability utility that reports relevant browser capabilities.

Example:

TypeScript

```
interface GraphicsCapabilities {
  webgpu: boolean;
  webgl2: boolean;
  preferredRenderer: string;
}
```

Extend this as actual renderer requirements emerge.

### E.6 — Rendering proof of concept

The first programmable rendering demonstration should be intentionally simple:

* Render a 3D object.

* Support camera controls.

* Support basic lighting.

* Load a model.

* Respond to user interaction.

* Handle resizing.

* Dispose resources correctly.

* Demonstrate a fallback.

This establishes the viability of the rendering layer without expanding into game-engine development.

### Deliverables

* Rendering architecture specification

* Rendering engine evaluation

* WebGPU capability detection

* WebGL capability detection

* Renderer selection

* Custom scene container

* Model loading proof of concept

* Camera and lighting demonstration

* Resource cleanup

* Static fallback

# 4. Proposed Package Architecture

Juice v2 should use modular package boundaries to keep its components maintainable and avoid forcing every application to download functionality it does not need.

The following is a proposed architecture, not a requirement to rename existing Juice packages.

```
Juice
│
├── Core
│   ├── Configuration
│   ├── Utilities
│   ├── Hooks
│   └── Shared Types
│
├── Tokens
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   ├── Motion
│   └── Themes
│
├── UI
│   ├── Primitives
│   ├── Forms
│   ├── Navigation
│   ├── Feedback
│   ├── Overlays
│   └── Data
│
├── OS
│   ├── Application Shell
│   ├── Windows
│   ├── Workspaces
│   ├── Panels
│   ├── Command Palette
│   └── Application Patterns
│
├── 3D
│   ├── Core
│   ├── Spline Adapter
│   ├── Renderer Adapter
│   └── Asset Utilities
│
└── Documentation
    ├── Design System
    ├── Components
    ├── Application Patterns
    ├── 3D
    └── Examples
```

### Suggested package responsibilities

|
Package

|

Responsibility

|
| --- | --- |
|

`@juice/core`

|

Shared utilities and configuration

|
|

`@juice/tokens`

|

Design tokens and themes

|
|

`@juice/ui`

|

General-purpose components

|
|

`@juice/os`

|

OS-style application components

|
|

`@juice/3d`

|

Shared 3D interfaces

|
|

`@juice/3d-spline`

|

Spline integration

|
|

`@juice/3d-renderer`

|

Programmable rendering

|

The actual names should follow the project's established package conventions.

Important: Applications that only need conventional UI should not have to install or bundle Spline, Three.js, or other 3D dependencies.

# 5. Development Roadmap

The development sequence should prioritize the OS design system and KiwiCMS integration while allowing 3D work to proceed as a separate workstream once the core architectural decisions are established.

### Juice v2 delivery sequence

Dependency-based milestones, not calendar commitments.

* M1 — Foundations

  Design tokens, theming, package structure, architecture decisions.

* M2 — OS Components

  Application shell, navigation, panels, core UI, interaction patterns.

* M3 — KiwiCMS v2

  First application integration and design system validation.

* M4 — 3D Foundations

  Spline, renderer capability detection, WebGL/WebGPU prototype.

* M5 — Release Hardening

  Accessibility, performance, testing, documentation, release.

## Milestone 1 — Foundation and architecture

Goal: Establish the architectural and visual foundation of Juice v2.

Tasks:

* Audit existing Juice components and architecture.

* Identify reusable v1 functionality.

* Identify breaking changes.

* Define citrusOS visual principles.

* Create the token specification.

* Implement theme infrastructure.

* Establish package boundaries.

* Configure the component development environment.

* Create initial documentation.

* Define versioning and migration strategy.

Exit criteria: A working design foundation with light and dark themes, documented tokens, and a stable component development environment.

## Milestone 2 — OS design system

Goal: Deliver the components required to build a complete citrusOS application.

Tasks:

* Implement the application shell.

* Implement navigation.

* Implement foundational controls.

* Implement dialogs and overlays.

* Implement panels and split layouts.

* Implement data presentation components.

* Implement application composition patterns.

* Establish responsive behavior.

* Implement keyboard interactions.

* Document component APIs.

Exit criteria: A developer can construct a functional citrusOS-style application using Juice components without building a separate design system.

## Milestone 3 — KiwiCMS v2 reference integration

Goal: Validate the OS design system through an actual application.

Tasks:

* Implement KiwiCMS using the Juice application shell.

* Migrate global navigation.

* Migrate dashboard components.

* Migrate content management interfaces.

* Implement editor interface primitives.

* Integrate media management interfaces.

* Implement settings layouts.

* Validate themes and responsiveness.

* Identify missing design patterns.

* Feed reusable components back into Juice.

Exit criteria: KiwiCMS v2 demonstrates the new citrusOS design language through its core administrative workflows.

## Milestone 4 — 3D foundation

Goal: Demonstrate both designer-authored and programmable 3D experiences.

Tasks:

* Define the scene lifecycle.

* Implement Spline scene loading.

* Implement scene fallbacks.

* Implement scene interaction events.

* Create UI-to-scene communication.

* Research and select the initial programmable renderer.

* Implement WebGPU detection.

* Implement WebGL detection.

* Build a custom rendering proof of concept.

* Test unsupported-device behavior.

* Document integration examples.

Exit criteria: Juice can embed and interact with a Spline scene and render a simple independently controlled 3D experience with a graceful fallback.

## Milestone 5 — Stabilization and release

Goal: Prepare Juice v2 for practical use across the citrusOS ecosystem.

Tasks:

* Complete component API reviews.

* Audit accessibility.

* Audit responsive behavior.

* Test theme switching.

* Measure bundle sizes.

* Profile common UI interactions.

* Profile 3D experiences.

* Test resource cleanup.

* Complete migration documentation.

* Publish component documentation.

* Publish example applications.

* Finalize release notes.

* Complete version 2 release validation.

Exit criteria: The agreed v2 public APIs, component contracts, KiwiCMS integration, and 3D proof-of-concept requirements pass their release checks.


# 6. Quality and Engineering Requirements

## Accessibility

Juice v2 should establish accessibility as a core responsibility of the design system.

Requirements:

* Keyboard-operable controls

* Visible focus indicators

* Appropriate semantic HTML

* Screen-reader-compatible components

* Accessible application navigation

* Sufficient text and UI contrast

* Reduced-motion support

* Accessible alternatives to 3D interactions

Use WCAG 2.2 AA as the target for applicable user-interface behavior.

3D experiences should never be the only way to access essential application functionality.

## Performance

Performance should be treated as a release requirement, especially for the 3D packages.

|
Area

|

Requirement

|
| --- | --- |
|

Core UI

|

No mandatory 3D dependencies

|
|

Components

|

Support modular imports

|
|

Themes

|

Avoid unnecessary runtime style computation

|
|

Navigation

|

Minimize avoidable rerenders

|
|

3D

|

Load scenes on demand

|
|

Rendering

|

Use appropriate frame scheduling

|
|

Cleanup

|

Release scene resources when no longer needed

|
|

Fallback

|

Provide a usable experience without GPU rendering

|

Establish measurable bundle-size, interaction, and rendering budgets during Milestone 1, using the existing Juice baseline and representative KiwiCMS screens.

## Testing

Implement multiple layers of testing.

Unit tests

* Tokens and theme resolution

* Component state

* Component events

* Utilities

* Renderer capability logic

Component tests

* Accessibility

* Interaction states

* Keyboard navigation

* Responsive behavior

Integration tests

* Application shell

* Theme propagation

* KiwiCMS integration

* Scene lifecycle

* UI-to-scene communication

Browser tests

* Chrome

* Firefox

* Safari

* Edge

* Mobile browser coverage

The browser matrix for 3D must include WebGPU availability, WebGL fallback, and unsupported graphics environments.

# 7. Proof-of-Concept Applications

Instead of developing 3D features without an immediate purpose, use small demonstrations that exercise capabilities needed by future citrusOS applications.

## POC 1 — citrusOS Desktop

Design system validation

Create a small citrusOS desktop-style experience.

Demonstrate:

* Application shell

* Application switching

* Resizable panels

* Global navigation

* Command palette

* Theme switching

* Notification system

This becomes the design system's flagship demonstration.

## POC 2 — KiwiCMS v2

Application integration

Use KiwiCMS as the production-oriented reference implementation for the OS design system.

Demonstrate:

* Content management

* Media management

* Complex forms

* Content editing

* Settings

* Dashboard composition

## POC 3 — Interactive 3D product viewer

3D integration validation

Create an interactive guitar viewer for WINK Guitar.

![Fender Unveils the Mod Shop - Premier Guitar](https://images.openai.com/static-rsc-4/98sbefxs1lYZ_0r4vtE0rXTZVFdZJdN-iFjYMZa_7Gibdll1AFEm8GvUwZWxBnB6NKGrGRxUT9Uo6AaEbFsf0U3K67tqB2D_1nc2CNqI8ehgTcsvqVeT3YmGr61RPaum2UqBqgvRnMmlCW7DtDcrBDTNWwwOiBGx6TLRzTlAaas?purpose=inline)

![Fender's Mod Shop: Build Your Own Guitar - Design Milk](https://images.openai.com/static-rsc-4/HXvjBiUcyue-sQLyxGyHyZCKVMjmtTQyEWSKEoKRw2D6dcnOCgF51aVqKgeX5nJOILjewfabjc5HVfOv8ZFuS_N_mQ1Ax-lpqg6gfmi8p-DPx7EQBHnKOuzfY4q4EHeU-h9Qs5om_Gd_JyP0QGgDzRH448f4-VCJLLtuVuqDTxA?purpose=inline)

![Bound Offset Feed - Page 6 - OffsetGuitars.com](https://images.openai.com/static-rsc-4/XZHowu_Ns8cW_J9ppF8KPOQmQ0rrpnF6etxyQsp6EOHBzDczPs7JqQaA8-aMcU-xGpnb9e2nNMIhXWUPRa-_g2Q_d1jNW0WBEjBDv0F5JGClnU4w_TW65KWg1nGvI7_iB2pg8QzwD0VZ47g3rhLHsoElFygKmI-K2AGPhnjTNRU?purpose=inline)

5

Demonstrate:

* Loading a 3D guitar scene

* Rotating and inspecting the instrument

* Selecting different finishes

* Triggering visual changes from Juice components

* Displaying product information

* Switching to a static product image when necessary

Build the first version using Spline.

This demonstrates practical value for WebEngine and WebStore without needing to implement a full product configuration system in Juice itself.

## POC 4 — Programmable 3D scene

Rendering architecture validation

Build a minimal 3D scene that does not depend on Spline's runtime.

Demonstrate:

* Renderer initialization

* Model loading

* Camera controls

* Lighting

* Interaction

* Resize handling

* WebGL/WebGPU capability selection

* Static fallback

The goal is to validate the abstraction, not to produce a sophisticated 3D showcase.

# 8. Scope Boundaries

To keep version 2 achievable, the following should not be core release requirements.

|
Capability

|

Target

|
| --- | --- |
|

Full 3D modeling editor

|

Future release

|
|

Advanced 3D animation editor

|

Future release

|
|

Custom physics engine

|

Future release

|
|

Native Vulkan renderer

|

Future native-platform initiative

|
|

Complete WebXR environment

|

Future release

|
|

Node-based material editor

|

Future release

|
|

Full visual website builder

|

WebEngine responsibility

|
|

Complete desktop window manager

|

Future citrusOS capability

|
|

Product configurator business logic

|

WebStore/application responsibility

|
|

CMS content persistence

|

KiwiCMS responsibility

|

Juice should provide the building blocks for these capabilities without absorbing the responsibilities of every application in the ecosystem.

# 9. Release Definition

## Juice v2.0 — Minimum release requirements

The following must be completed for the initial v2 release.

### Release readiness

0 / 22

OS Design System

Design tokens

Semantic themes

Light and dark mode

Application shell

Core UI components

Navigation and panels

Responsive layouts

KiwiCMS v2

Application shell integration

Core management interfaces

Editor UI foundations

Theme integration

3D Foundations

Spline adapter

Scene lifecycle

Loading and fallback states

UI/scene communication

Renderer capability detection

WebGL/WebGPU proof of concept

Engineering

Documentation

Accessibility validation

Browser testing

Performance validation

Migration guide

# 10. Post-v2 Opportunities

Once the design system and rendering foundations are stable, Juice can support increasingly sophisticated experiences.

### Juice v2.x

Potential incremental improvements:

* Advanced workspace management

* Additional OS-style components

* Expanded scene interaction controls

* Additional 3D asset utilities

* Scene transitions

* More advanced WebGPU experiments

* Visual configuration tools

* Expanded theme customization

### Juice v3 and beyond

Potential major initiatives:

* Full spatial interface primitives

* Advanced 3D application components

* WebXR integration

* Richer programmable rendering tools

* Visual scene configuration

* Native desktop rendering integration

* Shared graphical foundations for future citrusOS applications

These are future opportunities, not dependencies for shipping v2.

# 11. Recommended Development Priority

The most important sequencing decision is to make KiwiCMS v2 the immediate consumer of the OS design system while developing the 3D foundation as a parallel, independently testable workstream.

I would structure the implementation around two development tracks:

Track A — Release-critical

### citrusOS + KiwiCMS

Establish the visual and architectural foundation for the platform.

Juice Core

↓

citrusOS Design System

↓

OS Components

↓

KiwiCMS v2

This track establishes the reusable foundation that the wider ecosystem can adopt.

Track B — Foundation and research

### Juice 3D

Introduce 3D capabilities without blocking the design system.

3D Architecture

↓

Spline Adapter

↓

WebGL / WebGPU Research

↓

Interactive Demonstrations

This track establishes the capabilities that WebEngine and future creative applications can build upon.

## Final objective

By the completion of Juice v2, the ecosystem should have three tangible results:

1. A recognizable citrusOS identity. Applications share a cohesive design language, components, navigation patterns, and interaction model.

2. A usable KiwiCMS v2 foundation. KiwiCMS demonstrates how the design system powers real administrative and creative workflows.

3. A credible foundation for interactive 3D. Juice supports Spline-based experiences and has an independently validated path toward programmable WebGL/WebGPU rendering.

Juice v2 does not need to deliver every feature the citrusOS ecosystem will eventually require. It needs to establish the architecture and design language that allow those features to be built consistently.

Version 2 establishes the operating environment. Future versions expand what can happen inside it.
