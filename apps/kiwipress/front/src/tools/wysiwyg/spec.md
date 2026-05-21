# KiwiPress WYSIWYG Specification

## Summary

KiwiPress WYSIWYG is the first stage of the Sugar process.

It is a browser-based word processor for writing posts, pages, articles, reusable content blocks, and structured authored fragments that can later be composed inside Sugar.

It is not just a WordPress body editor.
It is not just a formatting toolbar.
It is the content-authoring system that feeds Sugar, KiwiPress, and the broader WebEngine pipeline.

## Product Role In The Pipeline

### WYSIWYG

Owns:

- writing
- formatting
- content structure
- reusable content blocks
- authoring modes
- content metadata

### Sugar

Owns:

- visual composition
- drag-and-drop placement
- interactive flows
- logic
- bindings
- page orchestration
- content assembly

### KiwiPress

Owns:

- persistence to WordPress
- post/page CRUD
- status and publishing workflows
- WordPress output shaping
- taxonomy and media associations

### WebEngine

Owns:

- runtime rendering
- application behavior
- deployment/runtime concerns

## Product Goal

Build a browser word processor that is:

- powerful enough for serious longform writing
- structured enough to produce reliable content data
- extensible enough for custom WebEngine and Sugar block types
- compatible enough with KiwiPress to publish into WordPress

The writing experience should feel closer to a professional document editor than a typical CMS textarea.

## Guiding Principles

1. The editor must feel like a real writing tool.
2. Structured content is the source of truth.
3. Visual mode and markdown mode are both first-class.
4. The UI shell and editing engine must remain separate.
5. The editor engine must be extensible through commands, nodes, protocols, and serializers.
6. Sugar should consume structured content, not arbitrary HTML blobs.
7. Deprecated editing APIs must not be relied on as the long-term foundation.

## Architectural Direction

The editor is intentionally split into two primary layers.

### 1. Editor Shell

The shell is the UI layer.

It is responsible for:

- toolbar layout
- button groups
- mode switchers
- panel layout
- theme/presentation choices
- canvas framing
- status bars
- inspectors
- layout variants

The shell can change frequently without requiring the editing engine to be rewritten.

This allows:

- alternate themes
- different toolbar shapes
- feature-specific shells
- Sugar-aware editing workspaces
- minimal or advanced editor surfaces

### 2. Editor Engine

The engine is the logic layer.

It is responsible for:

- selection handling
- range handling
- document mutations
- command execution
- normalization
- clipboard handling
- mode state
- serialization
- parsing
- extension hooks

The engine must not depend on a specific toolbar arrangement or visual shell.

## Shell / Engine Contract

The shell communicates with the engine through commands and state accessors.

Examples:

- `editor.toggleBold()`
- `editor.toggleItalic()`
- `editor.setBlock("heading", { level: 2 })`
- `editor.insertLink(url)`
- `editor.copySelection()`
- `editor.cutSelection()`
- `editor.pasteClipboard()`
- `editor.getMode()`
- `editor.setMode("markdown")`

The shell should not directly own document mutation logic.

The engine should not directly own toolbar rendering concerns.

## User Types

### Writer

- writes posts, pages, articles, and reusable sections
- needs fast keyboard-driven editing

### Builder

- uses Sugar to place and compose authored content
- needs reusable structured blocks

### Publisher

- manages status, metadata, slug, taxonomies, and publish actions

### Developer

- extends the editor with new commands, node types, protocols, and renderers

## Core Use Cases

1. Write and publish a WordPress post.
2. Write and publish a WordPress page.
3. Author a longform article with rich formatting.
4. Author reusable content snippets for Sugar.
5. Switch between visual and markdown editing without losing structure.
6. Hand authored content to Sugar for drag-and-drop composition and logic.

## Authoring Modes

The editor must support multiple authoring modes.

### Visual Mode

- WYSIWYG editing
- page-like writing experience
- toolbar and keyboard controls

### Markdown Mode

- raw markdown editing
- intended for fast writing and power users
- supports structured directives for richer blocks

### Split Mode

- visual and markdown side-by-side
- intended for editing and inspection at once

### Debug / Source Mode

- optional internal mode
- shows structured JSON or raw export views

## Canonical Document Model

The canonical document state must not be raw HTML.

The editor must maintain an internal structured document model and serialize outward from that model.

### Root Nodes

- `document`
- `fragment`
- `template`
- `section`

### Text Block Nodes

- `paragraph`
- `heading`
- `blockquote`
- `code_block`
- `ordered_list`
- `unordered_list`
- `checklist`
- `horizontal_rule`

### Media Nodes

- `image`
- `gallery`
- `video_embed`
- `audio_embed`
- `iframe_embed`
- `attachment`

### Layout / Content Nodes

- `columns`
- `callout`
- `card`
- `hero`
- `cta`
- `table`
- `divider`
- `spacer`

### Sugar / WebEngine Nodes

- `component`
- `slot`
- `binding`
- `snippet`
- `content_reference`

### Inline Marks

- `bold`
- `italic`
- `underline`
- `strike`
- `inline_code`
- `link`
- `highlight`
- `subscript`
- `superscript`

## Editor Outputs

The editor must be able to produce:

1. Structured document JSON
2. WordPress-safe HTML
3. Markdown
4. Sugar-consumable content assets

Optional future outputs:

- block-style exports
- excerpt/plaintext summaries
- internal runtime render payloads

## Sugar Handoff Requirements

Sugar should consume editor-authored content as structured assets.

The handoff must support:

- complete documents
- reusable fragments
- named snippets
- block references
- placement metadata

Sugar should not be forced to infer structure by parsing arbitrary HTML alone.

## KiwiPress Persistence Requirements

The editor must be able to create and update at least:

- posts
- pages

It should support:

- `title`
- `content`
- `status`
- `slug`
- `excerpt`
- `categories`
- `tags`
- `featured_media`
- author metadata where permitted

## Editing Feature Requirements

### Baseline Word Processor Features

- typing
- selections
- caret movement
- copy
- cut
- paste
- undo
- redo
- keyboard shortcuts
- block transforms
- inline formatting
- list editing
- quote and code editing

### Rich Authoring Features

- link insertion and editing
- image insertion
- media placeholders
- block reordering
- block duplication
- block deletion
- slash command insertion
- command palette

### Publishing Features

- draft save
- update existing content
- publish workflows
- revision support later
- autosave later

## Markdown Requirements

Markdown is a first-class mode, not a bolt-on export.

It must support:

- headings
- emphasis
- links
- ordered and unordered lists
- code fences
- blockquotes
- tables
- task lists

It should also support richer directives, for example:

- `:::callout`
- `:::cta`
- `:::columns`
- `:::card`
- `:::component`

Round-tripping between markdown and the canonical model must preserve structure as safely as possible.

## Clipboard And Paste Requirements

Clipboard handling must support:

- copy
- cut
- paste
- plain text paste
- rich paste cleanup
- normalization of external content

Paste sources to consider:

- browser text
- markdown text
- website content
- Word-like rich content
- Google Docs-like rich content

## Accessibility Requirements

- keyboard-first editing
- labeled and navigable toolbar controls
- semantic output preservation
- editing interactions that do not require a mouse

## Extensibility Requirements

The editor engine must be designed for extension.

It should support extension points for:

- node types
- inline marks
- commands
- parsers
- serializers
- clipboard handlers
- Sugar-specific blocks
- KiwiPress publishing protocols
- custom shell integrations

This is important because the shell can evolve independently while the engine grows support for new behaviors and protocols.

## Technical Constraints

1. Deprecated editing APIs are not the long-term foundation.
2. `contenteditable` may be used as the browser editing surface, but the engine must own the behavior.
3. Raw DOM edits must ultimately map back to structured content.
4. WordPress output must be sanitized and predictable.
5. The system must remain compatible with repo-native tooling and libraries.

## Non-Goals For First Delivery

These are not required to be fully solved first:

- real-time collaboration
- track changes
- comments and annotations
- advanced table editing
- perfect Word import fidelity
- final plugin marketplace architecture

## MVP Scope

The first meaningful milestone should include:

- shell and engine split
- visual mode
- markdown mode
- structured document model
- post create/update
- page create/update
- paragraph/heading/list/quote/code blocks
- bold/italic/underline/link/highlight
- clipboard support
- undo/redo strategy
- structured output for Sugar handoff

## Post-MVP Scope

- media library integration
- embeds
- tables
- reusable snippet management
- autosave
- revisions
- command palette
- advanced templates
- Sugar-aware drag targets
- custom Juice-styled content blocks

## Open Questions

1. What exact JSON schema should be the canonical document format?
2. Should Sugar consume full documents, fragments, or both?
3. What custom markdown directives should be standardized first?
4. What content belongs in the editor versus in Sugar layout composition?
5. How should structured content be stored alongside WordPress HTML for future editing?

## Product Statement

KiwiPress WYSIWYG is a schema-driven browser word processor and the first stage of the Sugar pipeline, with a separable UI shell and extensible editing engine that together produce structured content for composition, logic, and publishing.
