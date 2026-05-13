# Stenzil Study: Compiler Design Reading & Course List

The core topics you need to understand deeply are:

- **Lexical analysis** (tokenization, state machines, character scanning)
- **Parsing** (recursive descent, grammars, AST construction)
- **AST design** (tagged unions, visitor pattern, tree walking)
- **Codegen / transpilation** (emitting target language output from an AST)
- **Template inheritance** (compile-time tree merging)

---

## Frontend Masters

### [Building Your Own Programming Language](https://frontendmasters.com/courses/programming-language/) — Steve Kinney

**Priority: Start here.**

This course walks through building a complete language from scratch in JavaScript: lexer → parser → AST → transpiler. Steve Kinney's approach maps almost exactly to Stenzil's architecture. The course covers:

- Writing a hand-rolled tokenizer (character scanning, lookahead)
- Recursive descent parsing into an AST
- Tree walking to emit output
- Transpiling to JavaScript

This is the closest direct match to what Stenzil does. The main difference is that Stenzil's "language" is a template — but the pipeline is identical.

### [Write a Compiler That Understands Types / Build a Compiler from Scratch](https://frontendmasters.com/courses/type-compiler/)

Goes further than the first course into type systems, scope resolution, and bytecode generation. Most relevant for when Stenzil's expression evaluation needs to handle type-aware codegen (e.g. knowing that `post.title` is a string to emit `htmlspecialchars()` in PHP vs raw `{{ }}` in Jinja).

---

## O'Reilly

### [Crafting Interpreters](https://craftinginterpreters.com/) — Robert Nystrom

**Priority: The definitive reference.**

Available free online and on O'Reilly. Nystrom builds two complete implementations of the same language — a tree-walking interpreter in Java and a bytecode VM in C. The first half (chapters 1–19) is the most relevant to Stenzil:

| Chapter | Stenzil relevance |
|---|---|
| Ch. 4 — Scanning | How `tokenize()` in `lexer.ts` works at a theory level |
| Ch. 5 — Representing Code | Why AST nodes use tagged unions; visitor pattern |
| Ch. 6–8 — Parsing Expressions | Recursive descent in depth; operator precedence |
| Ch. 9 — Statements | Structuring control flow nodes (maps to `IfNode`, `ForNode`) |
| Ch. 13 — Inheritance | Relevant to `[extends]` / `[slot]` / `[fill]` resolution |

The book's focus is interpreters (evaluate the AST directly), but Stenzil uses a codegen step instead. The difference is superficial — the parser and AST design are the same.

### [Engineering a Compiler, 2nd Edition](https://www.oreilly.com/library/view/engineering-a-compiler/9780120884780/) — Cooper & Torczon

The academic companion to Crafting Interpreters. Heavier on theory — formal grammars, LL/LR parsing, intermediate representations. Most relevant chapters for Stenzil:

- **Chapter 2** — Scanners (finite automata; formal model of `isBracketStart()`)
- **Chapter 3** — Parsers (context-free grammars; why recursive descent works)
- **Chapter 5** — Intermediate Representations (AST vs. IR; relevant when Stenzil adds an IR layer between parse and codegen)

### [Compilers: Principles, Techniques, and Tools](https://www.oreilly.com/library/view/compilers-principles-techniques/9780321547989/) — Aho, Lam, Sethi, Ullman ("The Dragon Book")

The industry-standard reference text. Dense and academic — use as a reference, not a read-through. The chapters on lexical analysis (Ch. 3) and syntax analysis (Ch. 4) are authoritative.

---

## Pluralsight

### [Getting the Most from the TypeScript Compiler](https://www.pluralsight.com/courses/typescript-getting-most-compiler)

Directly relevant because Stenzil is built in TypeScript and the TypeScript compiler itself is a good architectural model. Covers:

- How `tsc`'s own AST is structured (compare to `TemplateAST`)
- Type narrowing with discriminated unions — the pattern `Node` uses
- How the TS compiler uses visitors to walk its AST

### [Introduction to the .NET Compiler Platform (Roslyn)](https://www.pluralsight.com/courses/dotnet-compiler-platform-introduction)

Roslyn is a well-designed compiler API with an immutable AST, a clean visitor pattern, and explicit separation of syntax vs. semantics. Good reference architecture for when Stenzil grows its codegen layer.

---

## Supplementary Reading

### Articles

- [The Super Tiny Compiler](https://github.com/jamiebuilds/the-super-tiny-compiler) — Jamie Kyle  
  ~200 lines of JavaScript that implements tokenizer → parser → codegen. Extremely dense, extremely clear. Read this in one sitting before starting any of the longer materials.

- [How Template Engines Work](https://mrale.ph/blog/2012/12/15/how-template-engines-work.html) — Vyacheslav Egorov  
  Covers Mustache, Handlebars, and compile-time template resolution. Directly relevant to the `[extends]` / `[slot]` / `[fill]` merge strategy in Stenzil's planned codegen.

### Reference

- [TextMate Grammar Language Guide](https://macromates.com/manual/en/language_grammars) — macromates.com  
  The reference spec for the `.tmLanguage.json` grammar that powers Stenzil's VS Code extension. Covers scope names, `begin`/`end` patterns, and how themes map to scopes.

---

## Recommended Study Order

1. **The Super Tiny Compiler** (30 min) — get the end-to-end picture in miniature
2. **FEM: Building Your Own Programming Language** — hands-on, JS-based, directly applicable
3. **Crafting Interpreters Ch. 4–9** — deeper theory behind the patterns you already wrote
4. **FEM: Build a Compiler from Scratch** — extend into type-aware codegen
5. **Engineering a Compiler Ch. 2–3** — formalize what you've learned
6. **Dragon Book Ch. 3–4** — reference when you need formal grammar definitions
