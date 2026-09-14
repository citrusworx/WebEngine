# Getting Started With Stenzil

You can demo the lexer and parser today. You cannot compile a `.stzl` file to PHP, Python, or JS.

This is an **advanced elective** on [Make A Web App](../webengine/make-a-web-app.md). Skip it if you are building a web app with Juice and Sig.js.

## Install

```bash
yarn add @citrusworx/stenzil
```

In this monorepo:

```bash
yarn workspace @citrusworx/stenzil build
```

## Tokenize a string

```ts
import { Stenzil, tokenize } from "@citrusworx/stenzil";

const source = "<h1>{{ post.title }}</h1>";

const tokens = Stenzil.tokenize(source);
// same as tokenize(source)

// [
//   { type: "Text", raw: "<h1>", value: "<h1>", line: 1, col: 1 },
//   { type: "Expression", raw: "{{ post.title }}", value: "post.title", line: 1, col: 5 },
//   { type: "Text", raw: "</h1>", value: "</h1>", line: 1, col: 21 }
// ]
```

`raw` keeps delimiters. `value` is the inner trimmed text. `line` / `col` are 1-based.

## Parse to an AST

```ts
import { Stenzil, parse } from "@citrusworx/stenzil";
import type { TemplateAST } from "@citrusworx/stenzil";

const source = `{{if post.published}}ok{{else}}no{{endif}}`;

const ast: TemplateAST = Stenzil.parse(source);
// {
//   children: [
//     {
//       type: "If",
//       condition: "post.published",
//       consequent: [{ type: "Text", value: "ok" }],
//       elseifs: [],
//       alternate: [{ type: "Text", value: "no" }]
//     }
//   ]
// }
```

`parse` accepts a string or a `Token[]`. Passing tokens skips a second lex.

## Walk a shipped example

`libraries/stenzil/examples/post.stzl` is a full page: `[extends]`, `[fill]`, `{{if}}` / `{{elseif}}` / `{{else}}`, `{{for}}`, a `[Tag]` component, and `[include]`.

`libraries/stenzil/src/example.ts` walks every `.stzl` under `examples/` and prints tokens plus `JSON.stringify(ast)`. From the package directory, after a build, you can run that file with Node if you point it at the compiled output — it is a workspace demo, not `bin` in `package.json`.

A shorter parse of the same ideas:

```ts
import { Stenzil } from "@citrusworx/stenzil";

const ast = Stenzil.parse(`
[extends "layout"]
[fill "content"]
{{for block in post.blocks}}
<section>{{ block.content }}</section>
{{endfor}}
[include "partials/card.stzl" with post as item]
[endfill]
`);
```

`IncludeNode` stores `file: "partials/card.stzl"` and `data: "post as item"` — a **string**, not a parsed binding list. `ForNode` stores `item: "block"` and `collection: "post.blocks"`.

`[slot "scripts" position="bottom"]` in `libraries/stenzil/examples/layout.stzl` becomes `{ type: "Slot", name: "scripts" }`. Extra attributes after the name are **not** stored. `SlotNode` is `{ type: "Slot"; name: string }` only.

## Errors

Unclosed `{{` or `[` throws `LexerError` with `at line:col`.

```ts
Stenzil.tokenize("{{ post.title");
// LexerError: Unclosed curly directive at 1:1
```

A mismatched closer throws `ParseError`:

```ts
Stenzil.parse("{{if x}}{{endfor}}");
// ParseError: Expected IfClose but got ForClose at …
```

## What the lexer will not steal

Bare `[` in HTML stays text unless the next characters look like a directive or a `PascalCase` component:

```ts
Stenzil.tokenize(`<a href="/x">ok</a>`);
// one Text token — no brackets

Stenzil.tokenize(`a[href]`);
// Text — `href` is not a keyword and does not start with A-Z in the component sense
// (the check is /^[A-Z]/ immediately after `[`)
```

`[Card title="{{ post.title }}"]` is a `Component` token; quotes protect `]` inside attribute values via `findBracketClose`.

## What you cannot do

```ts
// There is no such API
// Stenzil.compile(source, { target: "php" })
```

Architecture describes a future `kiwi.config.toml` `[stenzil]` table (`target`, `output`). WebEngine does not load that file. Do not create `kiwi.config.toml` expecting Stenzil to read it.

`[extends]` does not load `layout.stzl`. The AST keeps an `Extends` node and sibling `Fill` nodes. Merge is codegen’s job.

## Pitfalls

- **Expressions are strings.** `post.published && !post.draft` is not validated.
- **`include` data is a string.** `"post as item"` is not `{ post: "item" }`.
- **Slot extras are dropped.** `position="bottom"` is in the example file and not on `SlotNode`.
- **No official CLI.** `src/example.ts` is the demo.

## Where to go next

- [Architecture](./architecture.md) — how `isBracketStart`, `parseIf`, and the `Node` union work
- [Courses](./courses.md) — compiler reading list
- [WebEngine getting started](../webengine/webengine-getting-started.md) if you expected a config-driven compile
