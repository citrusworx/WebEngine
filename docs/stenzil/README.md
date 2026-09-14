# Stenzil

`@citrusworx/stenzil` is a **compiler front-end** for the Stenzil template language — not a runtime, not a theme engine, and not a replacement for Juice.

You write `.stzl` files that mix HTML with two directive layers. Stenzil turns that source into tokens, then into a typed AST. A later codegen pass is supposed to emit PHP, Python, or JavaScript. That pass is **not written**. What you can do today is tokenize and parse.

The current model is:

- curly `{{ }}` carries **runtime** logic (expressions, `if`, `for`, comments)
- bracket `[ ]` carries **compile-time** structure (extends, slots, fills, includes, components)
- the lexer and parser are real; codegen is planned
- Stenzil does not evaluate `post.published` — it stores the string for a future emitter

Stenzil is strongest when you treat it as a language pipeline, not as “handlebars in the browser.”

## Who this is for

- Someone implementing codegen or a language-tooling feature
- Someone who wants to see a hand-written lexer/parser in this repo
- Readers of [Make A Web App With WebEngine](../webengine/make-a-web-app.md) who are choosing an **advanced elective**

Stenzil is **not on the core web-app path**. You can ship Juice + Sig.js + Nectarine + Seltzer without it. Juice already styles HTML. Stenzil is for compiling templates *to* other languages later.

## Why it exists

WebEngine’s stack is TypeScript-first, but CitrusWorx also talks to PHP and Python surfaces (WordPress, existing backends). A template language that is locked to one runtime forces you to rewrite the same page three times.

Stenzil’s bet is the opposite of a client-side template engine:

- **Compile once**, emit per target — the file you edit is `.stzl`, not a mix of Blade + Jinja + JSX
- **Split syntax by when it runs** — curly stays in the emitted program; brackets can disappear after the compiler merges layouts
- **Do not parse expressions** — `post.title` is valid-enough in PHP, Python, and JS that codegen can translate it later. A third expression AST would be a fourth language.

That is the same kind of honesty Juice uses when it refuses to become a component runtime. Stenzil refuses to become a render loop. If you need interactivity in the browser, use Sig.js on HTML. If you need a compiled page for WordPress or a Python service, Stenzil is the intended front-end — once codegen exists.

What Stenzil is not:

- a Juice alternative (Juice is CSS-first attributes on HTML)
- a WordPress theme runtime (that is closer to KiwiPress + PHP output, later)
- `Stenzil.compile({ target: "php" })` — there is no `compile` on the class

## Mental model

```
.stzl source
    │
    ▼
 tokenize()  →  Token[]     (flat, positioned)
    │
    ▼
 parse()     →  TemplateAST (tagged Node union)
    │
    ▼
 compile()   →  PHP | Python | JS   (planned — not in src/)
```

`Stenzil.tokenize` and `Stenzil.parse` are static methods. `tokenize` and `parse` are also exported as functions.

A template looks like the files in `libraries/stenzil/examples/`:

```stzl
[extends "layout"]

[fill "content"]
<h1>{{ post.title }}</h1>
{{if post.published}}
<p>By {{ post.author.name }}</p>
{{else}}
<p>Unpublished</p>
{{endif}}
[endfill]
```

`[extends]` / `[fill]` / `[slot]` are structural. `{{if}}` / `{{ post.title }}` are runtime. HTML, including `[href]` in CSS selectors, stays text unless the lexer decides a `[` starts a directive (`isBracketStart` in `libraries/stenzil/src/lexer.ts`).

## What it can do today

Tokenize and parse real example files. This snippet is taken from the shape of `libraries/stenzil/examples/post.stzl` and was run against `libraries/stenzil/dist`:

```ts
import { Stenzil } from "@citrusworx/stenzil";

const source = `[extends "layout"]

[fill "content"]
<h1>{{ post.title }}</h1>
{{if post.published}}
<p>By {{ post.author.name }}</p>
{{else}}
<p>Unpublished</p>
{{endif}}
[endfill]
`;

const tokens = Stenzil.tokenize(source);
// Extends, Text, FillOpen, Text, Expression("post.title"), ..., IfOpen,
// Expression("post.author.name"), Else, IfClose, FillClose, ...

const ast = Stenzil.parse(source);
// {
//   children: [
//     { type: "Extends", layout: "layout" },
//     { type: "Text", value: "\n\n" },
//     {
//       type: "Fill",
//       name: "content",
//       children: [
//         { type: "Text", value: "\n<h1>" },
//         { type: "Expression", expression: "post.title" },
//         { type: "If", condition: "post.published", consequent: [...], elseifs: [], alternate: [...] }
//       ]
//     }
//   ]
// }
```

`IfNode.condition` is the raw string `"post.published"`. The parser did not build a boolean AST.

You can walk `libraries/stenzil/examples/` with `libraries/stenzil/src/example.ts` (reads every `.stzl`, prints tokens and JSON AST). That script is a demo harness, not a published CLI.

See [Getting started](./stenzil-getting-started.md) for install and a first parse, and [Architecture](./architecture.md) for the lexer/parser study guide.

## Status

**Early.**

Shipped:

- package `@citrusworx/stenzil`
- lexer, parser, `Token` / `Node` / `TemplateAST` types
- `LexerError` and `ParseError` with line/column
- `Stenzil.tokenize` / `Stenzil.parse` plus standalone function exports
- example templates under `libraries/stenzil/examples/`

Not shipped:

- codegen / `compile`
- CLI
- `kiwi.config.toml` `[stenzil]` target (mentioned as planned in architecture)
- grammar stability guarantee
- layout merge (`[extends]` + `[fill]` + `[slot]` is parsed, not resolved)

## Placement in the ecosystem

| Package | Relationship |
|---|---|
| [Juice](../juice/README.md) | Styles HTML. Stenzil may emit HTML later; it does not own CSS. |
| [KiwiPress](../kiwipress/README.md) | WordPress REST client. A future PHP target could feed WP themes; they are not integrated. |
| [WebEngine](../webengine/README.md) | Does not import Stenzil. Comments about config-driven compile are aspirational. |

Course hub: [Make A Web App With WebEngine](../webengine/make-a-web-app.md) — **advanced elective**, not chapter material. Compiler study list: [Courses](./courses.md).

## Suggested reading order

1. This README — what / why / what works
2. [Getting started](./stenzil-getting-started.md) — tokenize and parse a file
3. [Architecture](./architecture.md) — lexer, parser, planned codegen
4. [Courses](./courses.md) — elective compiler reading list

## Sibling docs

- [WebEngine](../webengine/README.md)
- [KiwiPress](../kiwipress/README.md)
- Legacy folder name: [docs/Stencil](../Stencil/README.md)

## Source of truth

- Package: `libraries/stenzil/package.json`
- Entry: `libraries/stenzil/src/index.ts`
- Lexer: `libraries/stenzil/src/lexer.ts`
- Parser: `libraries/stenzil/src/parser.ts`
- Types: `libraries/stenzil/src/types.ts`
- Examples: `libraries/stenzil/examples/`
