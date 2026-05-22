# Stenzil

`@citrusworx/stenzil` is the workspace parser package for the Stenzil language.

## Current status

Stenzil exists today as a real package with parsing primitives, but it is still early in its public documentation and ecosystem story.

What exists today:

- a published package surface at `@citrusworx/stenzil`
- lexer and parser implementations
- AST and token types
- a small convenience class exposed as `Stenzil`
- examples in `libraries/stenzil/examples`

What is not here yet:

- a broader guide set comparable to Juice, Sig.js, or Nectarine
- a mature authoring toolchain around the language
- a clearly documented stability guarantee for the grammar

## Usage

```ts
import { Stenzil } from "@citrusworx/stenzil";

const tokens = Stenzil.tokenize("example");
const ast = Stenzil.parse("example");
```

## Related docs

- [Architecture](./architecture.md)
- [Courses](./courses.md)

## Source of truth

- Package: `libraries/stenzil/package.json`
- Entry point: `libraries/stenzil/src/index.ts`
- Lexer: `libraries/stenzil/src/lexer.ts`
- Parser: `libraries/stenzil/src/parser.ts`
