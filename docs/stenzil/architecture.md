# Stenzil Architecture: A Study Guide

Stenzil is a **compiler**, not a runtime library. You write `.stzl` files once and the compiler transforms them into output for a specific target — PHP, Python, or JavaScript — depending on your project config. Understanding the compiler pipeline is the key to understanding everything else.

---

## The Big Picture

```
.stzl source file
       │
       ▼
  ┌─────────┐
  │  Lexer  │  tokenize()    →  Token[]
  └─────────┘
       │
       ▼
  ┌─────────┐
  │ Parser  │  parse()       →  TemplateAST
  └─────────┘
       │
       ▼
  ┌──────────┐
  │ Codegen  │  compile()    →  string (PHP / Python / JS)
  └──────────┘  (planned)
```

Each stage is a pure function that takes the output of the previous stage as input. The Lexer and Parser are fully implemented in `libraries/stenzil/src/`. Codegen is the next phase.

---

## Layer 1 — The Syntax Model

Stenzil's template language has two syntactically distinct layers. This is a deliberate design decision — each layer handles a different kind of concern.

### Curly Layer `{{ }}`  — Runtime Logic

Curly tokens carry things that must execute at render time: expressions, conditionals, loops, and comments.

| Syntax | Token type | Purpose |
|---|---|---|
| `{{ expr }}` | `Expression` | Output a value |
| `{{if cond}}` | `IfOpen` | Start a conditional |
| `{{elseif cond}}` | `ElseIf` | Additional branch |
| `{{else}}` | `Else` | Fallback branch |
| `{{endif}}` | `IfClose` | End conditional |
| `{{for x in xs}}` | `ForOpen` | Start a loop |
| `{{endfor}}` | `ForClose` | End loop |
| `{{# text #}}` | `Comment` | Stripped at compile time |

The condition and expression strings (e.g. `post.published && !post.draft`) are passed through as-is. Stenzil does not parse them — codegen is responsible for emitting them in the target language's syntax.

### Bracket Layer `[ ]` — Structural Composition

Bracket tokens handle template structure: inheritance, partials, components, and layout outlets. These are **compile-time** concerns — they determine how templates are assembled, not what they output.

| Syntax | Token type | Purpose |
|---|---|---|
| `[extends "layout"]` | `Extends` | Inherit from a layout template |
| `[block name]` / `[endblock]` | `BlockOpen` / `BlockClose` | Define a named content region |
| `[slot "name"]` | `Slot` | Declare an outlet in a layout |
| `[fill "name"]` / `[endfill]` | `FillOpen` / `FillClose` | Fill a slot from a child template |
| `[ComponentName prop="val"]` | `Component` | Embed a component |
| `[include "file" with data]` | `Include` | Embed a partial with data |
| `[# text #]` | `Comment` | Stripped at compile time |

The capital-letter rule distinguishes components from keywords: `[ComponentName]` is a component, `[block]` is a keyword. This is enforced in `isBracketStart()` in the lexer — the parser never has to guess.

---

## Phase 1 — The Lexer

**File:** [libraries/stenzil/src/lexer.ts](../../libraries/stenzil/src/lexer.ts)

The lexer (tokenizer) is a single-pass state machine over the raw source string. It produces a flat `Token[]` — no nesting, no tree. The parser handles structure.

### How it works

The main loop in `tokenize()` scans character by character. At each position it decides:

1. Are we at `{{`? → consume a curly token
2. Are we at `[` that looks like a directive? → consume a bracket token
3. Otherwise → this character is part of a Text span

Text spans are accumulated lazily. The lexer tracks a `textStart` position and only emits a `Text` token when it encounters a directive (via `flushText()`). This avoids allocating a token for every character.

### Bracket Disambiguation — `isBracketStart()`

A bare `[` appears constantly in HTML — CSS selectors (`a[href]`), markdown, inline text. The lexer must not treat every `[` as a Stenzil directive.

`isBracketStart()` peeks ahead one character (or one keyword) to decide:

```typescript
function isBracketStart(source: string, pos: number): boolean {
    const rest = source.slice(pos + 1);
    return (
        /^[A-Z]/.test(rest)           ||  // [ComponentName]
        /^include[\s"']/.test(rest)   ||  // [include ...]
        /^extends[\s"']/.test(rest)   ||  // [extends ...]
        /^block[\s]/.test(rest)       ||
        /^endblock[\s\]]/.test(rest)  ||
        /^slot[\s"']/.test(rest)      ||
        /^fill[\s"']/.test(rest)      ||
        /^endfill[\s\]]/.test(rest)   ||
        /^#/.test(rest)                   // [# comment #]
    );
}
```

If none of these match, the `[` passes through as text.

### Quoted String Protection — `findBracketClose()`

Component attributes can contain `{{ }}` expressions:

```
[Card title="{{ post.title }}" class="featured"]
```

A naive scan for `]` would not break here, but it would on a value like `title="items[0]"`. The `findBracketClose()` function scans forward while tracking whether it is inside a quoted string, skipping the closing quote's `]` detection:

```typescript
function findBracketClose(source: string, innerStart: number): number {
    let pos = innerStart;
    while (pos < source.length) {
        const ch = source[pos];
        if (ch === "]") return pos;
        if (ch === '"' || ch === "'") {
            const q = ch;
            pos++; // skip opening quote
            while (pos < source.length && source[pos] !== q) {
                if (source[pos] === "\\") pos++; // skip escaped char
                pos++;
            }
        }
        pos++;
    }
    return -1; // unclosed bracket → LexerError
}
```

### Token Shape

Every token carries its position:

```typescript
export type Token = {
    type: TokenType;
    raw: string;    // the original source including delimiters
    value: string;  // inner content, trimmed (no {{ }} or [ ])
    line: number;
    col: number;
};
```

`raw` is preserved so error messages can show the original text. `value` is what the parser works with.

---

## Phase 2 — The Parser

**File:** [libraries/stenzil/src/parser.ts](../../libraries/stenzil/src/parser.ts)

The parser is a **recursive descent parser**. It consumes the flat `Token[]` from the lexer and builds a typed AST.

### Why Recursive Descent?

Recursive descent is the standard technique for hand-written parsers because:

- It maps cleanly to grammar rules (`parseIf` calls `parseChildren` which calls `parseNode`)
- Error messages are easy to attach to specific tokens
- The call stack mirrors the nesting depth of the template
- No external parser generator is needed

### The Core Loop — `parseChildren()`

`parseChildren()` is the engine of the parser. It loops, calling `parseNode()` on each token, until it hits a stop token or the end of the stream:

```typescript
function parseChildren(stopTypes: TokenType[] = []): Node[] {
    const children: Node[] = [];
    while (pos < tokens.length) {
        const t = peek();
        if (!t) break;
        if (stopTypes.includes(t.type as TokenType)) break;
        children.push(parseNode());
    }
    return children;
}
```

The `stopTypes` array is how the parser knows when to stop collecting children for a given construct. For `parseIf`, it stops at `IfClose`, `ElseIf`, and `Else`. The stop token is **not consumed** — the caller is responsible for consuming it, which means the parser knows exactly what terminated the block.

### Parsing an `if` chain — `parseIf()`

The `{{if}}` / `{{elseif}}` / `{{else}}` / `{{endif}}` structure is the most complex construct in the parser:

```typescript
function parseIf(openToken: Token): IfNode {
    const consequent = parseChildren(["IfClose", "Else", "ElseIf"]);
    const elseifs: ElseIfBranch[] = [];
    let alternate: Node[] = [];

    while (pos < tokens.length) {
        const t = peek();
        if (!t || t.type === "IfClose") break;

        if (t.type === "ElseIf") {
            consume();
            const body = parseChildren(["IfClose", "Else", "ElseIf"]);
            elseifs.push({ condition: t.value, body });
            continue;
        }

        if (t.type === "Else") {
            consume();
            alternate = parseChildren(["IfClose"]);
            break;
        }
        break;
    }

    expect("IfClose"); // must be {{endif}}
    return { type: "If", condition: openToken.value, consequent, elseifs, alternate };
}
```

The `elseifs` array collects zero or more branches. This models a chain of arbitrary length, where each branch is just `{ condition, body }`.

### The AST Node Union

**File:** [libraries/stenzil/src/types.ts](../../libraries/stenzil/src/types.ts)

Every AST node is a tagged union — each type has a literal `type` field that discriminates it. This is the standard pattern for TypeScript ASTs because the compiler can narrow the union in a `switch` statement:

```typescript
export type Node =
    | TextNode       // { type: "Text"; value: string }
    | ExpressionNode // { type: "Expression"; expression: string }
    | CommentNode    // { type: "Comment"; value: string }
    | IfNode         // { type: "If"; condition; consequent; elseifs; alternate }
    | ForNode        // { type: "For"; item; collection; body }
    | ComponentNode  // { type: "Component"; name; props }
    | IncludeNode    // { type: "Include"; file; data: IncludeBinding[] }
    | ExtendsNode    // { type: "Extends"; layout: string }
    | BlockNode      // { type: "Block"; name; blockType; children }
    | SlotNode       // { type: "Slot"; name; position; slotType }
    | FillNode;      // { type: "Fill"; name; children }
```

The codegen phase will `switch` on `node.type` to emit the right output for each language target. TypeScript will enforce exhaustiveness — if a new node type is added to the union without a case in codegen, the compiler produces an error.

### The Root

`parse()` returns a `TemplateAST`, which is just a thin wrapper:

```typescript
export type TemplateAST = {
    children: Node[];
};
```

Everything is a child. Flat list at the root, recursively nested below.

---

## Phase 3 — Codegen (Planned)

Codegen is a tree walk. For each `Node` in the AST, emit a string in the target language.

The config determines the target:

```toml
# kiwi.config.toml
[stenzil]
target = "php"   # or "python" or "js"
output = "dist/templates"
```

A codegen visitor looks like this conceptually:

```typescript
function generate(node: Node, target: "php" | "python" | "js"): string {
    switch (node.type) {
        case "Text":       return node.value;
        case "Expression": return emitExpression(node.expression, target);
        case "If":         return emitIf(node, target);
        case "For":        return emitFor(node, target);
        // ...
    }
}
```

### Per-Target Expression Emission

The condition strings stored in `IfNode.condition` and `ForNode.collection` are passed through from the template source. Codegen translates them per target:

| Stenzil | PHP | Python | JS |
|---|---|---|---|
| `{{if post.published}}` | `<?php if ($post->published): ?>` | `{% if post.published %}` (Jinja) | `` `${post.published ? ...}` `` |
| `{{for p in posts}}` | `<?php foreach ($posts as $p): ?>` | `{% for p in posts %}` | `posts.map(p => ...)` |
| `{{ post.title }}` | `<?= htmlspecialchars($post->title) ?>` | `{{ post.title }}` | `${post.title}` |

The condition string itself is target-specific in the sense that `post.published` is valid PHP, Python, and JS — but deeper differences (method calls, operators) emerge as templates grow. The codegen layer is where language-specific translation rules live.

### Template Inheritance at Compile Time

`[extends "layout"]` + `[fill "name"]` / `[slot "name"]` is resolved **at compile time**, not at runtime. The compiler:

1. Parses both the child template and the layout template
2. Finds each `FillNode` in the child
3. Finds the corresponding `SlotNode` in the layout by name
4. Substitutes the fill's children into the slot's position in the layout's AST
5. Emits the merged tree

This means the output file is a single flat document — no runtime template inheritance needed.

---

## The Public API

**File:** [libraries/stenzil/src/index.ts](../../libraries/stenzil/src/index.ts)

```typescript
import { Stenzil } from "@citrusworx/stenzil";

// Just tokenize
const tokens = Stenzil.tokenize(source);

// Full parse
const ast = Stenzil.parse(source);
```

`tokenize` and `parse` are also exported as standalone functions for consumers who only need one phase.

---

## Key Design Principles

**1. Separation of concerns by layer.**
The two-layer syntax is not just aesthetic. Curly tokens map to runtime operations; bracket tokens map to compile-time structural decisions. A codegen pass can handle these differently — brackets may produce zero runtime output.

**2. The parser does not evaluate.**
`IfNode.condition` holds the raw string `"post.published && user.isLoggedIn"`. Stenzil does not parse that expression into its own sub-AST. It is the codegen's job to emit it correctly for the target language. This keeps the parser simple and defers language-specific interpretation to where it belongs.

**3. Position tracking throughout.**
Every `Token` carries `line` and `col`. Every `ParseError` can include the token that caused it. This makes error messages useful during template development — you get `ParseError: Expected IfClose but got ForClose at 14:3` rather than a silent mismatch.

**4. Unknown brackets pass through.**
If `isBracketStart()` doesn't recognize a `[...]` sequence, it becomes a `Text` token. This means Stenzil templates can contain plain HTML brackets (CSS attribute selectors, etc.) without breaking the lexer.

**5. Config-driven, not API-driven.**
You do not call `Stenzil.compile({ target: "php" })` at runtime. The compilation target is set in the project config file, and the compiler CLI reads it. This keeps templates source-of-truth and the build process reproducible.
