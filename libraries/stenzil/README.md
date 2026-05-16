# @citrusworx/stenzil

Lexer, parser, and helper utilities for working with the Stenzil language.

## Install

```bash
npm install @citrusworx/stenzil
```

## Usage

```ts
import { Stenzil } from "@citrusworx/stenzil";

const tokens = Stenzil.tokenize("example");
const ast = Stenzil.parse("example");
```

## Development

```bash
yarn workspace @citrusworx/stenzil build
yarn workspace @citrusworx/stenzil typecheck
```
